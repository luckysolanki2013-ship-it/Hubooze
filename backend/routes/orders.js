const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware');
const { DB } = require('../db');
const { notifyOrderConfirmed, notifyOrderShipped } = require('../utils/notifications');

const FREE_DELIVERY_MIN = 499;
const DELIVERY_FEE = 49;
const COUPONS = {
  SAVE10:  { type:'percent', value:10,  min:0   },
  FLAT50:  { type:'flat',    value:50,  min:299 },
  ECO20:   { type:'percent', value:20,  min:0   },
  FIRST:   { type:'percent', value:15,  min:0   },
  HUBOOZE: { type:'flat',    value:100, min:499 },
};

// GET /api/orders  — user's orders
router.get('/', protect, (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let orders = DB.orders.filter(o => o.userId === req.user.id);
    if (status && status !== 'all') orders = orders.filter(o => o.status === status);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = orders.length;
    const data  = orders.slice((page - 1) * limit, page * limit);
    res.json({ orders: data, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, (req, res) => {
  const order = DB.orders.find(o => o.orderId === req.params.id || o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.userId !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Not authorized.' });
  res.json({ order });
});

// POST /api/orders  — place order
router.post('/', protect, (req, res) => {
  try {
    const { items, addressId, paymentMethod, couponCode, note, giftWrap } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Cart is empty.' });
    if (!addressId) return res.status(400).json({ error: 'Delivery address required.' });

    const user = DB.users.find(u => u.id === req.user.id);
    const addr = user?.addresses.find(a => a.id === addressId);
    if (!addr) return res.status(400).json({ error: 'Address not found.' });

    // Validate items & calculate totals
    let subtotal = 0, discount = 0;
    const orderItems = items.map(ci => {
      const p = DB.products.find(x => x.id === ci.productId);
      if (!p) throw new Error(`Product ${ci.productId} not found.`);
      if (p.stock < ci.qty) throw new Error(`"${p.name}" only has ${p.stock} in stock.`);
      const itemTotal = p.price * ci.qty;
      const origTotal = p.originalPrice * ci.qty;
      subtotal += itemTotal;
      discount += origTotal - itemTotal;
      p.stock -= ci.qty; // decrement stock
      return { productId: p.id, name: p.name, icon: p.images?.[0] || p.icon || '📦', price: p.price, qty: ci.qty, quantity: ci.qty, size: ci.size || null };
    });

    // Coupon
    let couponDiscount = 0;
    const coupon = couponCode ? COUPONS[couponCode.toUpperCase()] : null;
    if (coupon) {
      if (subtotal >= coupon.min) {
        couponDiscount = coupon.type === 'flat' ? coupon.value : Math.round(subtotal * coupon.value / 100);
      }
    }

    const deliveryFee  = subtotal - couponDiscount >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
    const giftWrapFee  = giftWrap ? 49 : 0;
    const total        = subtotal - couponDiscount + deliveryFee + giftWrapFee;

    const d = new Date(); d.setDate(d.getDate() + 4);
    const estimatedDelivery = d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

    const order = {
      id:              'ORD' + Date.now(),
      orderId:         'ORD' + Date.now(),
      userId:          req.user.id,
      items:           orderItems,
      address:         addr,
      subtotal, discount, couponCode: couponCode || null, couponDiscount,
      deliveryFee, giftWrap: giftWrapFee, total,
      status:          'processing',
      paymentMethod:   paymentMethod || 'COD',
      paymentStatus:   paymentMethod === 'COD' ? 'pending' : 'paid',
      note:            note || '',
      estimatedDelivery,
      createdAt:       new Date().toISOString(),
    };

    DB.orders.unshift(order);

    // Fire notification (non-blocking)
    notifyOrderConfirmed(order, { ...user, name: req.user.name, email: req.user.email, phone: user?.phone })
      .catch(e => console.error('Notif error:', e.message));

    res.status(201).json({ order, message: '🎉 Order placed successfully!' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', protect, (req, res) => {
  const order = DB.orders.find(o => o.orderId === req.params.id || o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  if (order.userId !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized.' });
  if (!['processing','confirmed'].includes(order.status)) return res.status(400).json({ error: 'Order cannot be cancelled at this stage.' });
  order.status = 'cancelled';
  order.cancelledAt = new Date().toISOString();
  order.cancelReason = req.body.reason || 'Customer request';
  // Restore stock
  order.items.forEach(it => {
    const p = DB.products.find(x => x.id === it.productId);
    if (p) p.stock += it.qty || it.quantity || 1;
  });
  res.json({ order, message: 'Order cancelled. Refund will be processed in 3–5 days.' });
});

// PATCH /api/orders/:id/status  — seller/admin only
router.patch('/:id/status', protect, (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized.' });
  const order = DB.orders.find(o => o.orderId === req.params.id || o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  const { status, trackingId } = req.body;
  const allowed = ['processing','confirmed','shipped','out_for_delivery','delivered','cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  order.status = status;
  if (trackingId) order.trackingId = trackingId;
  if (status === 'shipped') {
    order.shippedAt = new Date().toISOString();
    const user = DB.users.find(u => u.id === order.userId);
    if (user) notifyOrderShipped(order, user).catch(() => {});
  }
  if (status === 'delivered') order.deliveredAt = new Date().toISOString();
  res.json({ order, message: `Order status updated to ${status}.` });
});

// GET /api/orders/admin/all  — admin only
router.get('/admin/all', protect, requireAdmin, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let orders = [...DB.orders];
  if (status && status !== 'all') orders = orders.filter(o => o.status === status);
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = orders.length;
  const data  = orders.slice((page - 1) * limit, page * limit);
  res.json({ orders: data, total, pages: Math.ceil(total / limit) });
});

// POST /api/orders/validate-coupon
router.post('/validate-coupon', protect, (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = COUPONS[code?.toUpperCase()];
  if (!coupon) return res.status(400).json({ error: 'Invalid coupon code.' });
  if (subtotal < coupon.min) return res.status(400).json({ error: `Minimum order ₹${coupon.min} required.` });
  const discount = coupon.type === 'flat' ? coupon.value : Math.round(subtotal * coupon.value / 100);
  res.json({ valid: true, discount, coupon: { code: code.toUpperCase(), ...coupon } });
});

module.exports = router;
