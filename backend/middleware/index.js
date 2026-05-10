const jwt       = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// ── JWT Auth ──────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated. Please login.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hubooze_secret');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const requireSeller = (req, res, next) => {
  if (req.user?.role !== 'seller' && req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Seller access required.' });
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required.' });
  next();
};

const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) req.user = jwt.verify(token, process.env.JWT_SECRET || 'hubooze_secret');
  } catch {}
  next();
};

// ── Rate Limiters (express-rate-limit v6 — no proxy issues) ──────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Try again in 15 minutes.' },
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests. Wait 5 minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests. Please slow down.' },
});

module.exports = { protect, requireSeller, requireAdmin, optionalAuth, authLimiter, otpLimiter, apiLimiter };
