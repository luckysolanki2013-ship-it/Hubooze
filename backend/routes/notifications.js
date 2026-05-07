const router = require('express').Router();
const { protect } = require('../middleware');
const { DB } = require('../db');

router.get('/', protect, (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  let notifs = (DB.notifications || []).filter(n => n.userId === req.user.id);
  if (type && type !== 'all') notifs = notifs.filter(n => n.type === type);
  notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unread = notifs.filter(n => !n.read).length;
  const data   = notifs.slice((page - 1) * limit, page * limit);
  res.json({ notifications: data, unread, total: notifs.length });
});

router.patch('/read-all', protect, (req, res) => {
  if (!DB.notifications) return res.json({ message: 'Done.' });
  DB.notifications.filter(n => n.userId === req.user.id).forEach(n => { n.read = true; });
  res.json({ message: 'All marked as read.' });
});

router.patch('/:id/read', protect, (req, res) => {
  const n = (DB.notifications || []).find(x => x.id === req.params.id && x.userId === req.user.id);
  if (!n) return res.status(404).json({ error: 'Notification not found.' });
  n.read = true;
  res.json({ notification: n });
});

router.put('/prefs', protect, (req, res) => {
  const user = DB.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  user.notifPrefs = { ...(user.notifPrefs || {}), ...req.body };
  res.json({ notifPrefs: user.notifPrefs });
});

module.exports = router;
