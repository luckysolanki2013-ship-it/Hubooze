const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware');
const { DB } = require('../db');

// GET /api/admin/stats
router.get('/stats', protect, requireAdmin, (req, res) => {
  const totalRev = DB.orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  res.json({
    totalOrders:     DB.orders.length,
    totalRevenue:    totalRev,
    platformFee:     Math.round(totalRev * 0.1),
    totalUsers:      DB.users.length,
    totalSellers:    DB.users.filter(u => u.role === 'seller').length,
    totalProducts:   DB.products.length,
    ecoProducts:     DB.products.filter(p => p.eco).length,
    totalReturns:    DB.returns.length,
    pendingReturns:  DB.returns.filter(r => r.status === 'initiated').length,
    deliveredOrders: DB.orders.filter(o => o.status === 'delivered').length,
    cancelledOrders: DB.orders.filter(o => o.status === 'cancelled').length,
  });
});

// GET /api/admin/users
router.get('/users', protect, requireAdmin, (req, res) => {
  const { role } = req.query;
  let users = DB.users.map(u => { const { password, otp, ...safe } = u; return safe; });
  if (role && role !== 'all') users = users.filter(u => u.role === role);
  res.json({ users });
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', protect, requireAdmin, (req, res) => {
  const user = DB.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (!['customer','seller','admin'].includes(req.body.role)) return res.status(400).json({ error: 'Invalid role.' });
  user.role = req.body.role;
  res.json({ message: `${user.name} is now ${user.role}.` });
});

// PATCH /api/admin/products/:id/toggle
router.patch('/products/:id/toggle', protect, requireAdmin, (req, res) => {
  const product = DB.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  product.active = !product.active;
  res.json({ product, message: `"${product.name}" ${product.active ? 'activated' : 'deactivated'}.` });
});

// GET /api/admin/analytics
router.get('/analytics', protect, requireAdmin, (req, res) => {
  const catRevenue = {};
  DB.orders.filter(o => o.status !== 'cancelled').forEach(o => {
    o.items.forEach(it => {
      const p = DB.products.find(x => x.id === it.productId);
      if (p) {
        if (!catRevenue[p.category]) catRevenue[p.category] = { revenue: 0, count: 0 };
        catRevenue[p.category].revenue += it.price * (it.qty || it.quantity || 1);
        catRevenue[p.category].count++;
      }
    });
  });
  const topProducts = [...DB.products].sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 10);
  res.json({ categoryRevenue: catRevenue, topProducts });
});

module.exports = router;
