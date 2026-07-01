const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware');
const dba = require('../dbAdapter');

async function getCustomUserId(req) {
  if (req.user.id && req.user.id.startsWith('u')) return req.user.id;
  const u = await dba.findUser({ _id: req.user._id || req.user.id });
  return (u && u.id) ? u.id : req.user.id;
}
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

// GET /api/orders — user's orders
router.get('/', protect, async (req, res) => {
  try {
    const orders = await dba.findOrders({ userId: req.user.id || req.user._id?.toString() });
    res.json({ orders });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await dba.findOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/orders — create order (status pending_payment for online, processing for COD)
router.post('/', protect, async (req, res) => {
  try {
    const { items, addressId, address, paymentMethod, couponCode, note, giftWrap } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Cart is empty.' });

    const userId = await getCustomUserId(req);
    const user = await dba.findUser({ id: userId }) || await dba.findUser({ _id: userId });
    let addr = address || (user?.addresses || []).find(a => a.id === addressId);
    if (!addr) return res.status(400).json({ error: 'Delivery address required.' });

    let subtotal = 0, discount = 0;
    const orderItems = [];
    for (const ci of items) {
      const p = await dba.findProduct(ci.productId);
      if (!p) throw new Error(`Product ${ci.productId} not found.`);
      if (p.stock < ci.qty) throw new Error(`"${p.name}" only has ${p.stock} in stock.`);
      const itemTotal = p.price * ci.qty;
      const origTotal = (p.originalPrice || p.price) * ci.qty;
      subtotal += itemTotal;
      discount += origTotal - itemTotal;
      await dba.updateProduct(p.id, { stock: p.stock - ci.qty });
      orderItems.push({ productId: p.id, name: p.name, icon: p.image || p.icon || '📦', price: p.price, qty: ci.qty, quantity: ci.qty, size: ci.size || null, sellerId: p.sellerId || null });
    }

    let couponDiscount = 0;
    const coupon = couponCode ? COUPONS[couponCode.toUpperCase()] : null;
    if (coupon && subtotal >= coupon.min) {
      couponDiscount = coupon.type === 'flat' ? coupon.value : Math.round(subtotal * coupon.value / 100);
    }

    const deliveryFee = subtotal - couponDiscount >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
    const giftWrapFee = giftWrap ? 49 : 0;
    const total = subtotal - couponDiscount + deliveryFee + giftWrapFee;

    const d = new Date(); d.setDate(d.getDate() + 4);
    const estimatedDelivery = d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

    const isCOD = (paymentMethod || 'COD').toUpperCase() === 'COD';
    const orderId = 'ORD' + Date.now();

    const order = await dba.createOrder({
      id: orderId,
      orderId: orderId,
      userId: userId,
      items: orderItems,
      address: addr,
      subtotal, discount,
      couponCode: couponCode || null,
      couponDiscount,
      deliveryFee, giftWrap: giftWrapFee, total,
      status: isCOD ? 'processing' : 'pending_payment',
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: isCOD ? 'pending' : 'pending',
      note: note || '',
      estimatedDelivery,
      createdAt: new Date().toISOString(),
    });

    if (isCOD) {
      notifyOrderConfirmed(order, { ...user, name: req.user.name, email: req.user.email, phone: user?.phone }).catch(e => console.error('Notif error:', e.message));
    }

    res.status(201).json({ order, message: isCOD ? '🎉 Order placed successfully!' : 'Order created, proceed to payment.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await dba.findOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.userId !== (req.user.id || req.user._id?.toString()) && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized.' });
    if (!['processing','confirmed','pending_payment'].includes(order.status)) return res.status(400).json({ error: 'Order cannot be cancelled at this stage.' });

    for (const it of order.items) {
      const p = await dba.findProduct(it.productId);
      if (p) await dba.updateProduct(p.id, { stock: p.stock + (it.qty || it.quantity || 1) });
    }

    const updated = await dba.updateOrder(req.params.id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: req.body.reason || 'Customer request',
    });
    res.json({ order: updated, message: 'Order cancelled. Refund will be processed in 3–5 days.' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/orders/:id/status — seller/admin only
router.patch('/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized.' });
    const order = await dba.findOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const { status, trackingId } = req.body;
    const allowed = ['processing','confirmed','shipped','out_for_delivery','delivered','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const update = { status };
    if (trackingId) update.trackingNumber = trackingId;
    if (status === 'shipped')   update.shippedAt   = new Date().toISOString();
    if (status === 'delivered') update.deliveredAt = new Date().toISOString();

    const updated = await dba.updateOrder(req.params.id, update);

    if (status === 'shipped') {
      const user = await dba.findUser({ id: order.userId });
      if (user) notifyOrderShipped(updated, user).catch(() => {});
    }

    res.json({ order: updated, message: `Order status updated to ${status}.` });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders/admin/all — admin only
router.get('/admin/all', protect, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let orders = await dba.findOrders({});
    if (status && status !== 'all') orders = orders.filter(o => o.status === status);
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = orders.length;
    const data = orders.slice((page - 1) * limit, page * limit);
    res.json({ orders: data, total, pages: Math.ceil(total / limit) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/orders/validate-coupon
router.post('/validate-coupon', protect, (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = COUPONS[code?.toUpperCase()];
  if (!coupon) return res.status(400).json({ error: 'Invalid coupon code.' });
  if (subtotal < coupon.min) return res.status(400).json({ error: `Minimum order ₹${coupon.min} required for this coupon.` });
  const discount = coupon.type === 'flat' ? coupon.value : Math.round(subtotal * coupon.value / 100);
  res.json({ valid: true, discount, code: code.toUpperCase() });
});

module.exports = router;
