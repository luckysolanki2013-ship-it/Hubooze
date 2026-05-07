const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware');
const { DB } = require('../db');
const { notifyReturnInitiated, notifyRefundProcessed } = require('../utils/notifications');

// GET /api/returns  — user's returns
router.get('/', protect, (req, res) => {
  const returns = DB.returns
    .filter(r => r.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ returns });
});

// POST /api/returns  — initiate return
router.post('/', protect, (req, res) => {
  try {
    const { orderId, items, reason, condition } = req.body;
    if (!orderId || !reason) return res.status(400).json({ error: 'Order ID and reason required.' });

    const order = DB.orders.find(o => (o.orderId === orderId || o.id === orderId) && o.userId === req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'delivered') return res.status(400).json({ error: 'Only delivered orders can be returned.' });

    // 90-day window check
    const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.createdAt);
    const daysSince = (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 90) return res.status(400).json({ error: '90-day return window has expired.' });

    const returnItems = items?.length ? order.items.filter((_, i) => items.includes(i)) : order.items;
    const refundAmount = returnItems.reduce((s, it) => s + (it.price * (it.qty || it.quantity || 1)), 0);

    const d = new Date(); d.setDate(d.getDate() + 1);
    const pickupDate = d.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' });

    const ret = {
      id:           'RET' + Date.now(),
      returnId:     'RET' + Date.now(),
      userId:       req.user.id,
      orderId:      order.orderId || order.id,
      productName:  returnItems.map(i => i.name).join(', '),
      reason, condition: condition || 'Used',
      refundAmount, pickupDate,
      status:       'initiated',
      createdAt:    new Date().toISOString(),
    };
    DB.returns.push(ret);
    order.status = 'returned';

    const user = DB.users.find(u => u.id === req.user.id);
    if (user) notifyReturnInitiated(ret, user).catch(() => {});

    res.status(201).json({ return: ret, message: `Return initiated! Pickup on ${pickupDate}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/returns/:id/approve  — seller/admin
router.patch('/:id/approve', protect, (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized.' });
  const ret = DB.returns.find(r => r.returnId === req.params.id || r.id === req.params.id);
  if (!ret) return res.status(404).json({ error: 'Return not found.' });
  ret.status = 'approved';
  ret.resolvedAt = new Date().toISOString();
  const user = DB.users.find(u => u.id === ret.userId);
  if (user) notifyRefundProcessed(ret, user).catch(() => {});
  res.json({ return: ret, message: `Return approved. ₹${ret.refundAmount?.toLocaleString('en-IN')} refund initiated.` });
});

// PATCH /api/returns/:id/reject
router.patch('/:id/reject', protect, (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized.' });
  const ret = DB.returns.find(r => r.returnId === req.params.id || r.id === req.params.id);
  if (!ret) return res.status(404).json({ error: 'Return not found.' });
  ret.status = 'rejected';
  ret.resolvedAt = new Date().toISOString();
  ret.adminNote  = req.body.reason || '';
  res.json({ return: ret, message: 'Return rejected.' });
});

// GET /api/returns/admin/all
router.get('/admin/all', protect, requireAdmin, (req, res) => {
  const { status } = req.query;
  let returns = [...DB.returns].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (status && status !== 'all') returns = returns.filter(r => r.status === status);
  res.json({ returns });
});

module.exports = router;
