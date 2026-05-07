const router  = require('express').Router();
const Product = require('../models/Product');
const { Order, Return } = require('../models/Order');
const { protect, requireSeller, requireAdmin } = require('../middleware');
const notif   = require('../config/notifications');
const User    = require('../models/User');

// ══════════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════════

// GET /api/products
router.get('/products', async (req, res, next) => {
  try {
    const { category, search, sort, eco, badge, page = 1, limit = 12 } = req.query;
    const query = { listed: true };

    if (category && category !== 'all') query.category = category;
    if (eco === 'true') query.eco = true;
    if (badge) query.badge = badge.toUpperCase();
    if (search) query.$text = { $search: search };

    const sortMap = {
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      rating:     { rating: -1 },
      newest:     { createdAt: -1 },
      default:    { reviewCount: -1 },
    };
    const sortObj = sortMap[sort] || sortMap.default;

    const total    = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortObj)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('seller', 'name businessName')
      .lean();

    res.json({
      products: products.map(p => ({ ...p, discount: Math.round((1 - p.price / p.originalPrice) * 100) })),
      total, page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) { next(err); }
});

// GET /api/products/:id
router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller','name businessName').lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ ...product, discount: Math.round((1 - product.price / product.originalPrice) * 100) });
  } catch (err) { next(err); }
});

// POST /api/products  (seller)
router.post('/products', protect, requireSeller, async (req, res, next) => {
  try {
    const { name, brand, category, price, originalPrice, stock, description, sizes, colors, images, badge, eco } = req.body;
    if (!name || !price || !stock || !originalPrice) return res.status(400).json({ error: 'Name, price, originalPrice, stock required' });
    if (parseFloat(price) >= parseFloat(originalPrice)) return res.status(400).json({ error: 'Selling price must be less than MRP' });

    const product = await Product.create({
      name, brand: brand || 'My Brand', category: category || 'fashion',
      price: parseFloat(price), originalPrice: parseFloat(originalPrice),
      stock: parseInt(stock), description: description || '',
      sizes: sizes || [], colors: colors || [],
      images: images || ['📦'], badge: badge || null, eco: !!eco,
      seller: req.user._id,
    });
    res.status(201).json({ product, message: 'Product listed successfully' });
  } catch (err) { next(err); }
});

// PUT /api/products/:id  (seller)
router.put('/products/:id', protect, requireSeller, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not your product' });
    const allowed = ['name','brand','price','originalPrice','stock','description','sizes','colors','images','badge','eco','listed'];
    allowed.forEach(k => { if (req.body[k] !== undefined) product[k] = req.body[k]; });
    await product.save();
    res.json({ product, message: 'Product updated' });
  } catch (err) { next(err); }
});

// POST /api/products/:id/review
router.post('/products/:id/review', protect, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating) return res.status(400).json({ error: 'Rating required' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(409).json({ error: 'You have already reviewed this product' });

    const verified = await Order.exists({ user: req.user._id, 'items.product': product._id, status: 'delivered' });
    product.reviews.push({ user: req.user._id, userName: req.user.name, rating: parseInt(rating), comment: comment||'', verified: !!verified });
    product.updateRating();
    await product.save();
    res.status(201).json({ message: 'Review submitted', rating: product.rating, reviewCount: product.reviewCount });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════
//  CART (server-side session store)
// ══════════════════════════════════════════════════════════════════
const carts = new Map();  // userId → [{productId, qty, size, color}]

router.get('/cart', protect, async (req, res, next) => {
  try {
    const items = carts.get(req.user._id.toString()) || [];
    const enriched = await Promise.all(items.map(async item => {
      const p = await Product.findById(item.productId).select('name price originalPrice images eco brand stock').lean();
      return { ...item, product: p, available: p ? p.stock >= item.qty : false };
    }));
    const total = enriched.reduce((s, i) => s + (i.product?.price || 0) * i.qty, 0);
    res.json({ items: enriched, total, count: items.reduce((s, i) => s + i.qty, 0) });
  } catch (err) { next(err); }
});

router.post('/cart/add', protect, async (req, res, next) => {
  try {
    const { productId, qty = 1, size, color } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.listed) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < qty) return res.status(400).json({ error: 'Insufficient stock' });

    const uid  = req.user._id.toString();
    const cart = carts.get(uid) || [];
    const ex   = cart.find(i => i.productId === productId && i.size === (size||null));
    if (ex) ex.qty += parseInt(qty);
    else cart.push({ productId, qty: parseInt(qty), size: size||null, color: color||null });
    carts.set(uid, cart);

    res.json({ message: 'Added to cart', count: cart.reduce((s,i) => s+i.qty, 0) });
  } catch (err) { next(err); }
});

router.put('/cart/:productId', protect, (req, res) => {
  const uid  = req.user._id.toString();
  const cart = carts.get(uid) || [];
  const item = cart.find(i => i.productId === req.params.productId);
  if (!item) return res.status(404).json({ error: 'Not in cart' });
  if (parseInt(req.body.qty) <= 0) carts.set(uid, cart.filter(i => i.productId !== req.params.productId));
  else { item.qty = parseInt(req.body.qty); carts.set(uid, cart); }
  res.json({ message: 'Cart updated' });
});

router.delete('/cart/:productId', protect, (req, res) => {
  const uid = req.user._id.toString();
  carts.set(uid, (carts.get(uid)||[]).filter(i => i.productId !== req.params.productId));
  res.json({ message: 'Removed from cart' });
});

router.delete('/cart', protect, (req, res) => {
  carts.delete(req.user._id.toString());
  res.json({ message: 'Cart cleared' });
});

// ══════════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════════

// POST /api/orders
router.post('/orders', protect, async (req, res, next) => {
  try {
    const { address, paymentMethod, paymentRef, deliveryOption, note, giftWrap, couponCode } = req.body;
    if (!address || !paymentMethod) return res.status(400).json({ error: 'Address and payment method required' });

    const cartItems = carts.get(req.user._id.toString()) || [];
    if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

    // Validate and build items
    const orderItems = [];
    let subtotal = 0;
    for (const ci of cartItems) {
      const p = await Product.findById(ci.productId);
      if (!p || !p.listed) return res.status(400).json({ error: `Product unavailable: ${ci.productId}` });
      if (p.stock < ci.qty) return res.status(400).json({ error: `Insufficient stock: ${p.name}` });
      orderItems.push({ product: p._id, name: p.name, icon: p.images[0], price: p.price, qty: ci.qty, size: ci.size, color: ci.color });
      subtotal += p.price * ci.qty;
      p.stock  -= ci.qty;
      p.sold   += ci.qty;
      await p.save();
    }

    // Coupon logic
    const COUPONS = { SAVE10:{type:'percent',value:10}, FLAT50:{type:'flat',value:50,min:299}, ECO20:{type:'percent',value:20}, FIRST:{type:'percent',value:15}, HUBOOZE:{type:'flat',value:100,min:499} };
    let couponDiscount = 0;
    if (couponCode && COUPONS[couponCode]) {
      const c = COUPONS[couponCode];
      if (!c.min || subtotal >= c.min)
        couponDiscount = c.type === 'flat' ? c.value : Math.round(subtotal * c.value / 100);
    }

    const delivery     = subtotal - couponDiscount >= 499 ? 0 : 49;
    const giftWrapFee  = giftWrap ? 49 : 0;
    const total        = subtotal - couponDiscount + delivery + giftWrapFee;

    const delivDate    = new Date(); delivDate.setDate(delivDate.getDate() + 4);
    const estimatedDelivery = delivDate.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

    const order = await Order.create({
      user: req.user._id, items: orderItems,
      subtotal, discount: 0, couponCode: couponCode||null, couponDiscount,
      giftWrap: giftWrapFee, delivery, total,
      address, deliveryOption: deliveryOption||'standard', estimatedDelivery, note: note||'',
      paymentMethod, paymentRef: paymentRef||'', paymentStatus: paymentMethod === 'COD' ? 'pending' : 'paid',
      statusHistory: [{ status:'processing', note:'Order placed' }],
    });

    // Clear cart
    carts.delete(req.user._id.toString());

    // Notify (async)
    const user = await User.findById(req.user._id);
    notif.notifyOrderPlaced(order, user).catch(console.error);

    res.status(201).json({ order, message: 'Order placed successfully!' });
  } catch (err) { next(err); }
});

// GET /api/orders
router.get('/orders', protect, async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ orders, total: orders.length });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/orders/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
});

// PUT /api/orders/:id/cancel
router.put('/orders/:id/cancel', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['processing','confirmed'].includes(order.status))
      return res.status(400).json({ error: 'Cannot cancel — order already shipped' });
    order.status      = 'cancelled';
    order.cancelledAt = new Date();
    order.statusHistory.push({ status:'cancelled', note:'Cancelled by customer' });
    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.qty, sold: -item.qty } });
    }
    await order.save();
    res.json({ order, message: 'Order cancelled. Refund in 3-5 days if paid.' });
  } catch (err) { next(err); }
});

// ══════════════════════════════════════════════════════════════════
//  RETURNS
// ══════════════════════════════════════════════════════════════════

// POST /api/returns
router.post('/returns', protect, async (req, res, next) => {
  try {
    const { orderId, productId, reason, condition } = req.body;
    if (!orderId || !reason) return res.status(400).json({ error: 'Order ID and reason required' });

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['delivered','shipped'].includes(order.status))
      return res.status(400).json({ error: 'Only delivered orders can be returned' });

    // 90-day window check
    const days = Math.floor((Date.now() - order.createdAt) / 86400000);
    if (days > 90) return res.status(400).json({ error: 'Return window expired (90 days)' });

    const item = order.items.find(i => i.product.toString() === productId) || order.items[0];
    if (!item) return res.status(404).json({ error: 'Product not found in order' });

    const existing = await Return.findOne({ order: orderId, product: item.product });
    if (existing) return res.status(409).json({ error: 'Return already initiated' });

    const pickupDate = new Date(); pickupDate.setDate(pickupDate.getDate() + 1);

    const ret = await Return.create({
      order: orderId, user: req.user._id, product: item.product,
      productName: item.name, reason, condition: condition||'Used',
      refundAmt: item.price * item.qty,
      refundMethod: order.paymentMethod === 'COD' ? 'Bank Transfer' : order.paymentMethod,
      pickupDate: pickupDate.toLocaleDateString('en-IN'),
      status: 'initiated',
    });

    order.status = 'returned';
    order.statusHistory.push({ status:'returned', note:'Return initiated by customer' });
    await order.save();

    // Notify
    const user = await User.findById(req.user._id);
    notif.notifyReturnInitiated(ret, user).catch(console.error);

    res.status(201).json({ return: ret, message: 'Return initiated. Pickup within 24 hours.' });
  } catch (err) { next(err); }
});

// GET /api/returns
router.get('/returns', protect, async (req, res, next) => {
  try {
    const returns = await Return.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ returns });
  } catch (err) { next(err); }
});

// ── SELLER ROUTES ─────────────────────────────────────────────────

// GET /api/seller/dashboard
router.get('/seller/dashboard', protect, requireSeller, async (req, res, next) => {
  try {
    const myProducts  = await Product.find({ seller: req.user._id });
    const pIds        = myProducts.map(p => p._id);
    const myOrders    = await Order.find({ 'items.product': { $in: pIds } }).sort({ createdAt: -1 });
    const myReturns   = await Return.find({ product: { $in: pIds } });
    const totalRevenue= myOrders.filter(o => o.status !== 'cancelled').reduce((s,o) => s+o.total, 0);

    res.json({
      stats: {
        totalProducts: myProducts.length,
        totalOrders:   myOrders.length,
        pendingOrders: myOrders.filter(o => o.status === 'processing').length,
        totalRevenue,
        pendingPayout: Math.round(totalRevenue * 0.9),
        totalReturns:  myReturns.length,
      },
      recentOrders:  myOrders.slice(0, 10),
      products:      myProducts,
      returns:       myReturns,
    });
  } catch (err) { next(err); }
});

// PUT /api/seller/orders/:id/status
router.put('/seller/orders/:id/status', protect, requireSeller, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['processing','confirmed','shipped','delivered','cancelled'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = status;
    order.statusHistory.push({ status, note: `Updated by seller` });
    if (status === 'shipped')   order.shippedAt   = new Date();
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();
    res.json({ order, message: `Order updated to ${status}` });
  } catch (err) { next(err); }
});

// PUT /api/seller/returns/:id/approve
router.put('/seller/returns/:id/approve', protect, requireSeller, async (req, res, next) => {
  try {
    const ret = await Return.findById(req.params.id).populate('user');
    if (!ret) return res.status(404).json({ error: 'Return not found' });
    ret.status     = 'approved';
    ret.resolvedAt = new Date();
    ret.recycled   = true;
    await ret.save();
    // Restore stock
    await Product.findByIdAndUpdate(ret.product, { $inc: { stock: 1 } });
    // Notify customer
    notif.notifyRefundProcessed(ret, ret.user).catch(console.error);
    res.json({ return: ret, message: 'Return approved and refund initiated' });
  } catch (err) { next(err); }
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────
router.get('/admin/dashboard', protect, requireAdmin, async (req, res, next) => {
  try {
    const [users, products, orders, returns] = await Promise.all([
      User.countDocuments(), Product.countDocuments({ listed: true }),
      Order.countDocuments(), Return.countDocuments(),
    ]);
    const revenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    res.json({
      stats: {
        totalUsers: users, totalProducts: products,
        totalOrders: orders, totalReturns: returns,
        totalRevenue: revenue[0]?.total || 0,
        platformFee:  Math.round((revenue[0]?.total || 0) * 0.1),
      }
    });
  } catch (err) { next(err); }
});

router.get('/admin/users', protect, requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find().select('-password -otp').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { next(err); }
});

router.put('/admin/users/:id/role', protect, requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer','seller','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user, message: `Role updated to ${role}` });
  } catch (err) { next(err); }
});

router.get('/admin/orders', protect, requireAdmin, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const orders = await Order.find(filter).populate('user','name email').sort({ createdAt: -1 }).limit(100);
    res.json({ orders, total: orders.length });
  } catch (err) { next(err); }
});

router.put('/admin/orders/:id/status', protect, requireAdmin, async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id,
      { status: req.body.status, $push: { statusHistory: { status: req.body.status, note: 'Updated by admin' } } },
      { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (err) { next(err); }
});

router.get('/admin/returns', protect, requireAdmin, async (req, res, next) => {
  try {
    const returns = await Return.find().populate('user','name email').sort({ createdAt: -1 });
    res.json({ returns });
  } catch (err) { next(err); }
});

router.put('/admin/returns/:id', protect, requireAdmin, async (req, res, next) => {
  try {
    const ret = await Return.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('user');
    if (!ret) return res.status(404).json({ error: 'Return not found' });
    if (req.body.status === 'approved') {
      await Product.findByIdAndUpdate(ret.product, { $inc: { stock: 1 } });
      notif.notifyRefundProcessed(ret, ret.user).catch(console.error);
    }
    res.json({ return: ret });
  } catch (err) { next(err); }
});

module.exports = router;
