const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware');
const dba = require('../dbAdapter');

// ── STATS ─────────────────────────────────────────────────────────
router.get('/stats', protect, requireAdmin, async (req, res) => {
  try {
    const [users, products, orders, returns] = await Promise.all([
      dba.getAllUsers(), dba.findProducts({}), dba.findOrders({}), dba.findReturns({})
    ]);
    const revenue = orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
    res.json({
      totalOrders: orders.length, totalRevenue: revenue,
      platformFee: Math.round(revenue*0.1),
      totalUsers: users.length,
      totalSellers: users.filter(u=>u.role==='seller').length,
      totalProducts: products.length,
      ecoProducts: products.filter(p=>p.eco).length,
      totalReturns: returns.length,
      pendingReturns: returns.filter(r=>r.status==='initiated'||r.status==='pending').length,
      deliveredOrders: orders.filter(o=>o.status==='delivered').length,
      cancelledOrders: orders.filter(o=>o.status==='cancelled').length,
    });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── USERS ─────────────────────────────────────────────────────────
router.get('/users', protect, requireAdmin, async (req, res) => {
  try {
    const { role, search } = req.query;
    let users = await dba.getAllUsers();
    users = users.map(u => { const {password,...safe}=u; return safe; });
    if (role && role!=='all') users = users.filter(u=>u.role===role);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u=>(u.name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q));
    }
    res.json({ users });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.patch('/users/:id/role', protect, requireAdmin, async (req, res) => {
  try {
    const {role, approved, suspended} = req.body;
    const update = {};
    if (role) update.role = role;
    if (approved !== undefined) update.approved = approved;
    if (suspended !== undefined) update.suspended = suspended;
    const user = await dba.updateUser(req.params.id, update);
    if (!user) return res.status(404).json({error:'User not found.'});
    res.json({ message: `${user.name} updated successfully.`, user });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.delete('/users/:id', protect, requireAdmin, async (req, res) => {
  try {
    await dba.deleteUser(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── PRODUCTS ──────────────────────────────────────────────────────
router.get('/products', protect, requireAdmin, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};
    if (category && category!=='all') query.category = category;
    let products = await dba.findProducts(query);
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p=>(p.name||'').toLowerCase().includes(q)||(p.brand||'').toLowerCase().includes(q));
    }
    res.json({ products });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.put('/products/:id', protect, requireAdmin, async (req, res) => {
  try {
    const updated = await dba.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({error:'Product not found.'});
    res.json({ product: updated, message: 'Product updated.' });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.delete('/products/:id', protect, requireAdmin, async (req, res) => {
  try {
    await dba.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted.' });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.patch('/products/:id/toggle', protect, requireAdmin, async (req, res) => {
  try {
    const p = await dba.findProduct(req.params.id);
    if (!p) return res.status(404).json({error:'Product not found.'});
    const updated = await dba.updateProduct(req.params.id, {active:!p.active, listed:!p.active});
    res.json({ product: updated, message: `"${p.name}" ${!p.active?'activated':'deactivated'}.` });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── ORDERS ────────────────────────────────────────────────────────
router.get('/orders', protect, requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let orders = await dba.findOrders({});
    if (status && status!=='all') orders = orders.filter(o=>o.status===status);
    if (search) orders = orders.filter(o=>(o.orderId||o.id||'').includes(search));
    orders.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    res.json({ orders });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.patch('/orders/:id/status', protect, requireAdmin, async (req, res) => {
  try {
    const {status} = req.body;
    const valid = ['processing','confirmed','shipped','out_for_delivery','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({error:'Invalid status.'});
    const update = {status};
    if (status==='delivered') update.deliveredAt = new Date();
    const order = await dba.updateOrder(req.params.id, update);
    if (!order) return res.status(404).json({error:'Order not found.'});
    res.json({ order, message: `Order status updated to ${status}.` });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── RETURNS ───────────────────────────────────────────────────────
router.get('/returns', protect, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let returns = await dba.findReturns({});
    if (status && status!=='all') returns = returns.filter(r=>r.status===status);
    returns.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    res.json({ returns });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.patch('/returns/:id/status', protect, requireAdmin, async (req, res) => {
  try {
    const {status, note} = req.body;
    const valid = ['pending','approved','rejected','picked_up','refunded'];
    if (!valid.includes(status)) return res.status(400).json({error:'Invalid status.'});
    const ret = await dba.updateReturn(req.params.id, {status, adminNote:note, updatedAt:new Date()});
    if (!ret) return res.status(404).json({error:'Return not found.'});
    res.json({ return: ret, message: `Return ${status}.` });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── ANALYTICS ─────────────────────────────────────────────────────
router.get('/analytics', protect, requireAdmin, async (req, res) => {
  try {
    const [products, orders] = await Promise.all([dba.findProducts({}), dba.findOrders({})]);
    const catRevenue = {};
    orders.filter(o=>o.status!=='cancelled').forEach(o => {
      (o.items||[]).forEach(it => {
        const p = products.find(x=>x.id===it.productId);
        if (p) {
          const cat = p.category||p.cat||'other';
          if (!catRevenue[cat]) catRevenue[cat] = {revenue:0, count:0};
          catRevenue[cat].revenue += (it.price||0) * (it.qty||it.quantity||1);
          catRevenue[cat].count++;
        }
      });
    });
    const topProducts = [...products].sort((a,b)=>(b.reviews||0)-(a.reviews||0)).slice(0,10);
    res.json({ categoryRevenue: catRevenue, topProducts });
  } catch(e){ res.status(500).json({error:e.message}); }
});

// ── PROMOTIONS ────────────────────────────────────────────────────
// In-memory promotions store (upgrade to MongoDB later)
let promotions = {
  flashSale: { active: false, discount: 0, label: '', endTime: null },
  announcement: '90 Din Easy Return — Kisi bhi condition mein FREE!',
  heroTitle: 'Khareedein Aaram Se.',
  heroSubtitle: 'Return Karen Free Mein.',
  freeDeliveryMin: 499,
  banners: [],
};

router.get('/promotions', (req, res) => {
  res.json({ promotions });
});

router.put('/promotions', protect, requireAdmin, (req, res) => {
  try {
    Object.assign(promotions, req.body);
    res.json({ promotions, message: 'Promotions updated successfully!' });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.post('/promotions/flash-sale', protect, requireAdmin, (req, res) => {
  try {
    const {discount, label, durationHours} = req.body;
    if (!discount || discount < 1 || discount > 90) 
      return res.status(400).json({error:'Discount must be between 1-90%'});
    promotions.flashSale = {
      active: true, discount: Number(discount),
      label: label || `Flash Sale — ${discount}% OFF!`,
      endTime: new Date(Date.now() + (durationHours||24)*3600000).toISOString(),
    };
    res.json({ promotions, message: `Flash sale of ${discount}% activated!` });
  } catch(e){ res.status(500).json({error:e.message}); }
});

router.delete('/promotions/flash-sale', protect, requireAdmin, (req, res) => {
  promotions.flashSale = { active: false, discount: 0, label: '', endTime: null };
  res.json({ message: 'Flash sale deactivated.' });
});

// ── SELLER MANAGEMENT ─────────────────────────────────────────────
router.get('/sellers', protect, requireAdmin, async (req, res) => {
  try {
    const users = await dba.getAllUsers();
    const sellers = users.filter(u=>u.role==='seller'||u.role==='admin')
      .map(u=>{ const {password,...safe}=u; return safe; });
    // Add product count for each seller
    const products = await dba.findProducts({});
    const enriched = await Promise.all(sellers.map(async s => {
      const sellerProds = products.filter(p=>p.sellerId===s.id);
      const orders = await dba.findOrders({});
      const sellerIds = sellerProds.map(p=>p.id);
      const sellerOrders = orders.filter(o=>o.items&&o.items.some(it=>sellerIds.includes(it.productId)));
      const revenue = sellerOrders.filter(o=>o.status!=='cancelled').reduce((sum,o)=>sum+o.total,0);
      return { ...s, productCount: sellerProds.length, orderCount: sellerOrders.length, revenue };
    }));
    res.json({ sellers: enriched });
  } catch(e){ res.status(500).json({error:e.message}); }
});

module.exports = router;

// ── HERO BANNER IMAGE UPLOAD ──────────────────────────────────────
const multer = require('multer');
const upload2 = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5*1024*1024 } });

router.post('/hero-image', protect, requireAdmin, upload2.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided.' });
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const client = new S3Client({ region: process.env.AWS_REGION || 'eu-north-1' });
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const key = `banners/hero-${Date.now()}.${ext}`;
    await client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'hubooze-images',
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read',
    }));
    const url = `https://${process.env.AWS_S3_BUCKET||'hubooze-images'}.s3.${process.env.AWS_REGION||'eu-north-1'}.amazonaws.com/${key}`;
    promotions.heroBgImage = url;
    res.json({ url, message: 'Hero banner uploaded!' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── SELLER APPROVAL & COMMISSION ──────────────────────────────────
router.patch('/sellers/:id/approve', protect, requireAdmin, async (req, res) => {
  try {
    const { approved } = req.body;
    const user = await dba.updateUser(req.params.id, {
      brandApproved: approved,
      'brandDocuments.status': approved ? 'approved' : 'rejected',
      'brandDocuments.reviewedAt': new Date().toISOString(),
    });
    if (!user) return res.status(404).json({ error: 'Seller not found.' });
    res.json({
      message: approved
        ? `${user.name} brand approved! ✅`
        : `${user.name} brand disapproved.`,
      user
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/sellers/:id/commission', protect, requireAdmin, async (req, res) => {
  try {
    const { commission } = req.body;
    if (!commission || commission < 1 || commission > 50)
      return res.status(400).json({ error: 'Commission must be 1-50%' });
    const user = await dba.updateUser(req.params.id, { commission: Number(commission) });
    if (!user) return res.status(404).json({ error: 'Seller not found.' });
    res.json({ message: `Commission set to ${commission}% for ${user.name}`, user });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Update sellers GET to include brand documents
