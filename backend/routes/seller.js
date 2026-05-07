const router = require('express').Router();
const { protect, requireSeller } = require('../middleware');
const { DB } = require('../db');

// GET /api/seller/dashboard
router.get('/dashboard', protect, requireSeller, (req, res) => {
  const myProducts = DB.products.filter(p => p.sellerId === req.user.id);
  const myIds      = myProducts.map(p => p.id);
  const myOrders   = DB.orders.filter(o => o.items.some(it => myIds.includes(it.productId)));
  const myReturns  = DB.returns.filter(r => {
    const order = DB.orders.find(o => o.orderId === r.orderId || o.id === r.orderId);
    return order && order.items.some(it => myIds.includes(it.productId));
  });
  const totalRevenue = myOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0);

  res.json({
    stats: {
      totalProducts:  myProducts.length,
      totalOrders:    myOrders.length,
      pendingOrders:  myOrders.filter(o => o.status === 'processing').length,
      totalRevenue,
      netPayout:      Math.round(totalRevenue * 0.9),
      totalReturns:   myReturns.length,
    },
    recentOrders:   myOrders.slice(0, 5),
    recentReturns:  myReturns.slice(0, 5),
    topProducts:    myProducts.sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 5),
  });
});

// GET /api/seller/products
router.get('/products', protect, requireSeller, (req, res) => {
  const products = DB.products.filter(p => p.sellerId === req.user.id);
  res.json({ products });
});

// GET /api/seller/orders
router.get('/orders', protect, requireSeller, (req, res) => {
  const { status } = req.query;
  const myIds = DB.products.filter(p => p.sellerId === req.user.id).map(p => p.id);
  let orders  = DB.orders.filter(o => o.items.some(it => myIds.includes(it.productId)));
  if (status && status !== 'all') orders = orders.filter(o => o.status === status);
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

// GET /api/seller/payouts
router.get('/payouts', protect, requireSeller, (req, res) => {
  const myIds = DB.products.filter(p => p.sellerId === req.user.id).map(p => p.id);
  const orders = DB.orders.filter(o => o.items.some(it => myIds.includes(it.productId)) && o.status !== 'cancelled');
  const total  = orders.reduce((s, o) => s + o.total, 0);
  const net    = Math.round(total * 0.9);
  res.json({
    totalRevenue: total,
    platformFee:  Math.round(total * 0.1),
    netPayout:    net,
    paidOut:      Math.round(net * 0.6),
    pending:      Math.round(net * 0.4),
    nextPayoutDate: (() => { const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay())); return d.toLocaleDateString('en-IN'); })(),
  });
});

module.exports = router;
