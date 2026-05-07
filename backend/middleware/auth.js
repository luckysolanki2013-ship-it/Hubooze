const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.cookies?.token;

    if (!token) return res.status(401).json({ error: 'Not authenticated. Please login.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password -otp');
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found or deactivated.' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
  }
};

// Require seller or admin
exports.sellerOnly = (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Seller access required.' });
  next();
};

// Require admin
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required.' });
  next();
};

// Optional auth (don't fail if no token)
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -otp');
    }
  } catch (_) {}
  next();
};
