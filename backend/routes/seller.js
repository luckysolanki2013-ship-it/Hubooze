const router  = require('express').Router();
const multer  = require('multer');
const { protect, requireSeller } = require('../middleware');
const dba = require('../dbAdapter');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10*1024*1024 } });

// ── DASHBOARD ─────────────────────────────────────────────────────
router.get('/dashboard', protect, requireSeller, async (req, res) => {
  try {
    const allProducts = await dba.findProducts({ sellerId: req.user.id });
    const myIds       = allProducts.map(p => p.id);
    const allOrders   = await dba.findOrders({});
    const myOrders    = allOrders.filter(o => o.items && o.items.some(it => myIds.includes(it.productId)));
    const allReturns  = await dba.findReturns({});
    const myReturns   = allReturns.filter(r => myOrders.find(o => o.orderId === r.orderId || o.id === r.orderId));
    const totalRevenue = myOrders.filter(o => o.status !== 'cancelled').reduce((s,o) => s + o.total, 0);
    res.json({
      stats: {
        totalProducts: allProducts.length, totalOrders: myOrders.length,
        pendingOrders: myOrders.filter(o => o.status === 'processing').length,
        totalRevenue, netPayout: Math.round(totalRevenue * 0.9), totalReturns: myReturns.length,
      },
      recentOrders: myOrders.slice(0, 5), recentReturns: myReturns.slice(0, 5), products: allProducts,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── PRODUCTS ──────────────────────────────────────────────────────
router.get('/products', protect, requireSeller, async (req, res) => {
  try {
    const products = await dba.findProducts({ sellerId: req.user.id });
    res.json({ products });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── ORDERS ────────────────────────────────────────────────────────
router.get('/orders', protect, requireSeller, async (req, res) => {
  try {
    const myProds   = await dba.findProducts({ sellerId: req.user.id });
    const myIds     = myProds.map(p => p.id);
    const allOrders = await dba.findOrders({});
    let orders = allOrders.filter(o => o.items && o.items.some(it => myIds.includes(it.productId)));
    const { status } = req.query;
    if (status && status !== 'all') orders = orders.filter(o => o.status === status);
    orders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ orders });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── ORDER STATUS UPDATE (with timeline) ───────────────────────────
router.patch('/orders/:id/status', protect, requireSeller, async (req, res) => {
  try {
    const { status, trackingNumber, courierName, pickupAddress, note } = req.body;
    const validStatuses = ['accepted', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Invalid status. Valid: ' + validStatuses.join(', ') });

    const order = await dba.findOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Build timeline event
    const timelineEvent = {
      status,
      timestamp: new Date().toISOString(),
      note: note || getDefaultNote(status),
      updatedBy: req.user.id,
      trackingNumber: trackingNumber || order.trackingNumber,
      courierName: courierName || order.courierName,
    };

    // Build update object
    const update = { status };
    if (trackingNumber) update.trackingNumber = trackingNumber;
    if (courierName) update.courierName = courierName;
    if (pickupAddress) update.pickupAddress = pickupAddress;
    if (status === 'delivered') update.deliveredAt = new Date();

    // Add to timeline array
    const timeline = order.timeline || [];
    timeline.push(timelineEvent);
    update.timeline = timeline;

    const updated = await dba.updateOrder(req.params.id, update);
    res.json({ order: updated, message: `Order status updated to "${status}"` });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

function getDefaultNote(status) {
  const notes = {
    accepted:         'Order accepted by seller',
    packed:           'Order packed and ready for pickup',
    shipped:          'Order shipped and on the way',
    out_for_delivery: 'Order out for delivery',
    delivered:        'Order delivered successfully',
    cancelled:        'Order cancelled by seller',
  };
  return notes[status] || status;
}

// ── UPDATE PICKUP ADDRESS ─────────────────────────────────────────
router.patch('/orders/:id/pickup-address', protect, requireSeller, async (req, res) => {
  try {
    const { pickupAddress } = req.body;
    if (!pickupAddress) return res.status(400).json({ error: 'Pickup address required.' });
    const order = await dba.findOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const updated = await dba.updateOrder(req.params.id, { pickupAddress });
    res.json({ order: updated, message: 'Pickup address updated.' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── PAYOUTS ───────────────────────────────────────────────────────
router.get('/payouts', protect, requireSeller, async (req, res) => {
  try {
    const myProds   = await dba.findProducts({ sellerId: req.user.id });
    const myIds     = myProds.map(p => p.id);
    const allOrders = await dba.findOrders({});
    const orders    = allOrders.filter(o => o.items && o.items.some(it => myIds.includes(it.productId)) && o.status !== 'cancelled');
    const total     = orders.reduce((s,o) => s + o.total, 0);
    const net       = Math.round(total * 0.9);
    const nextDate  = new Date(); nextDate.setDate(nextDate.getDate() + (7 - nextDate.getDay()));
    res.json({
      totalRevenue: total, platformFee: Math.round(total * 0.1),
      netPayout: net, paidOut: Math.round(net * 0.6), pending: Math.round(net * 0.4),
      nextPayoutDate: nextDate.toLocaleDateString('en-IN'),
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── BRAND APPROVAL — DOCUMENT UPLOAD ──────────────────────────────
router.post('/brand/documents', protect, requireSeller, upload.fields([
  { name: 'trademark', maxCount: 1 },
  { name: 'authorization', maxCount: 1 },
  { name: 'invoice', maxCount: 1 },
]), async (req, res) => {
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const client  = new S3Client({ region: process.env.AWS_REGION || 'eu-north-1' });
    const bucket  = process.env.AWS_S3_BUCKET || 'hubooze-images';
    const uploads = {};

    for (const [field, files] of Object.entries(req.files || {})) {
      const file = files[0];
      const ext  = file.originalname.split('.').pop().toLowerCase();
      const key  = `brand-docs/${req.user.id}/${field}-${Date.now()}.${ext}`;
      await client.send(new PutObjectCommand({
        Bucket: bucket, Key: key,
        Body: file.buffer, ContentType: file.mimetype,
        ACL: 'private', // documents are private
      }));
      uploads[field] = `https://${bucket}.s3.${process.env.AWS_REGION||'eu-north-1'}.amazonaws.com/${key}`;
    }

    // Save to user record
    await dba.updateUser(req.user.id || req.user._id, {
      brandDocuments: {
        trademark:     uploads.trademark     || null,
        authorization: uploads.authorization || null,
        invoice:       uploads.invoice       || null,
        submittedAt:   new Date().toISOString(),
        status:        'pending_review',
      }
    });

    console.log('Brand docs save result:', JSON.stringify(await dba.findUser({id: req.user.id})));
    console.log('Brand docs save result:', JSON.stringify(await dba.findUser({id: req.user.id})));
    res.json({
      message: 'Brand documents submitted for review! We will verify within 2-3 business days.',
      documents: uploads,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── GET BRAND STATUS ──────────────────────────────────────────────
router.get('/brand/status', protect, requireSeller, async (req, res) => {
  try {
    const user = await dba.findUser({ id: req.user.id }) || await dba.findUser({ id: req.user._id?.toString() });
    res.json({
      brandDocuments: user?.brandDocuments || null,
      approved: user?.brandApproved || false,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
