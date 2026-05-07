/**
 * HUBOOZE PAYMENT ROUTES — Razorpay Integration
 * POST /api/payments/create-order  → creates Razorpay order
 * POST /api/payments/verify        → verifies payment signature
 * POST /api/payments/refund        → initiates refund
 * GET  /api/payments/history       → user payment history
 */
const router  = require('express').Router();
const crypto  = require('crypto');
const { protect } = require('../middleware');
const { DB }  = require('../db');

// Razorpay is optional — graceful fallback when keys not set
let Razorpay = null;
let rzp      = null;
try {
  Razorpay = require('razorpay');
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== 'rzp_test_xxx') {
    rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('💳 Razorpay: connected');
  } else {
    console.log('💳 Razorpay: running in simulation mode (set RAZORPAY_KEY_ID to enable)');
  }
} catch {
  console.log('💳 Razorpay: package not installed — npm install razorpay');
}

// ── POST /api/payments/create-order ──────────────────────────────
// Creates a Razorpay order before showing the payment modal
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: 'Valid amount required (in paise).' });

    // Simulation mode — return a fake order
    if (!rzp) {
      const simOrder = {
        id:       'order_sim_' + Date.now(),
        amount:   amount,
        currency: currency,
        receipt:  receipt || 'rcpt_' + Date.now(),
        status:   'created',
        simulated: true,
      };
      return res.json({ order: simOrder, key: process.env.RAZORPAY_KEY_ID || 'rzp_test_simulation' });
    }

    const order = await rzp.orders.create({
      amount:   Math.round(amount), // in paise (₹ × 100)
      currency,
      receipt:  receipt || 'rcpt_' + Date.now(),
      notes,
    });

    res.json({ order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ error: err.error?.description || err.message });
  }
});

// ── POST /api/payments/verify ─────────────────────────────────────
// Called after Razorpay payment completes — verifies HMAC signature
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Simulation mode — auto-approve
    if (!rzp || razorpay_order_id?.startsWith('order_sim_')) {
      const order = DB.orders.find(o => o.orderId === orderId || o.id === orderId);
      if (order) {
        order.paymentId     = razorpay_payment_id || 'pay_sim_' + Date.now();
        order.paymentStatus = 'paid';
        order.razorpayOrderId = razorpay_order_id;
      }
      return res.json({ verified: true, simulated: true, message: 'Payment verified (simulation).' });
    }

    // Real verification
    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed — invalid signature.' });
    }

    // Mark order as paid
    const order = DB.orders.find(o => o.orderId === orderId || o.id === orderId);
    if (order) {
      order.paymentId       = razorpay_payment_id;
      order.paymentStatus   = 'paid';
      order.razorpayOrderId = razorpay_order_id;
      order.razorpaySignature = razorpay_signature;
    }

    res.json({ verified: true, paymentId: razorpay_payment_id, message: '✅ Payment verified successfully.' });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/refund ─────────────────────────────────────
// Initiate a refund for a return
router.post('/refund', protect, async (req, res) => {
  try {
    const { paymentId, amount, returnId, reason = 'Return refund' } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'Payment ID required.' });

    // Simulation mode
    if (!rzp || paymentId.startsWith('pay_sim_')) {
      const ret = DB.returns.find(r => r.returnId === returnId || r.id === returnId);
      if (ret) { ret.status = 'refunded'; ret.refundId = 'rfnd_sim_' + Date.now(); }
      return res.json({
        refund: { id: 'rfnd_sim_' + Date.now(), amount, status: 'processed', simulated: true },
        message: `Refund of ₹${(amount/100).toLocaleString('en-IN')} initiated (simulation).`,
      });
    }

    const refund = await rzp.payments.refund(paymentId, {
      amount: Math.round(amount), // in paise
      speed:  'optimum',
      notes:  { reason, returnId },
    });

    const ret = DB.returns.find(r => r.returnId === returnId || r.id === returnId);
    if (ret) { ret.status = 'refunded'; ret.refundId = refund.id; }

    res.json({ refund, message: `✅ Refund of ₹${(amount/100).toLocaleString('en-IN')} initiated.` });
  } catch (err) {
    console.error('Razorpay refund error:', err);
    res.status(500).json({ error: err.error?.description || err.message });
  }
});

// ── GET /api/payments/history ─────────────────────────────────────
router.get('/history', protect, (req, res) => {
  const orders = DB.orders
    .filter(o => o.userId === req.user.id && o.paymentStatus === 'paid')
    .map(o => ({
      orderId:      o.orderId,
      paymentId:    o.paymentId,
      amount:       o.total,
      method:       o.paymentMethod,
      status:       o.paymentStatus,
      date:         o.createdAt,
    }));
  res.json({ payments: orders });
});

// ── GET /api/payments/config ──────────────────────────────────────
// Frontend fetches this to get the Razorpay key safely
router.get('/config', (req, res) => {
  res.json({
    keyId:     process.env.RAZORPAY_KEY_ID || 'rzp_test_simulation',
    currency:  'INR',
    simulated: !rzp,
  });
});

module.exports = router;
