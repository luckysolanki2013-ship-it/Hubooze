const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { protect, authLimiter, otpLimiter } = require('../middleware');
const { DB }  = require('../db');

const SECRET = process.env.JWT_SECRET || 'hubooze_secret';
const signToken = (user) => jwt.sign(
  { id: user.id || user._id, email: user.email, role: user.role, name: user.name },
  SECRET, { expiresIn: '7d' }
);

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, phone, password, city, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    if (DB.users.find(u => u.email === email.toLowerCase()))
      return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: 'u_' + Date.now(),
      name: name.trim(), email: email.toLowerCase().trim(),
      phone: phone || '', password: hashed,
      city: city || '', role: role === 'seller' ? 'seller' : 'customer',
      addresses: [], wishlist: [], notifPrefs: {},
      createdAt: new Date().toISOString(),
    };
    DB.users.push(user);
    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser, message: 'Account created successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const user = DB.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    user.lastLoginAt = new Date().toISOString();
    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser, message: `Welcome back, ${user.name.split(' ')[0]}!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/send-otp
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required.' });
    const user = DB.users.find(u => u.email === email.toLowerCase());
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min
    user.otp = { code: otp, expiresAt };

    // In production: send via email/WhatsApp using notifications util
    console.log(`🔐 OTP for ${email}: ${otp}`);
    res.json({ message: 'OTP sent to your email and WhatsApp.', otp_dev: otp }); // remove otp_dev in prod
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required.' });
    const user = DB.users.find(u => u.email === email.toLowerCase());
    if (!user || !user.otp) return res.status(400).json({ error: 'No OTP requested.' });
    if (Date.now() > user.otp.expiresAt) return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    if (user.otp.code !== String(otp)) return res.status(400).json({ error: 'Incorrect OTP.' });

    user.otp = null;
    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser, message: 'OTP verified successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  const user = DB.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const { password: _, otp: __, ...safeUser } = user;
  res.json({ user: safeUser });
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = DB.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { name, phone, city, businessName } = req.body;
    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    if (city !== undefined) user.city = city;
    if (businessName !== undefined) user.businessName = businessName;
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/addresses
router.post('/addresses', protect, (req, res) => {
  try {
    const user = DB.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { name, phone, line1, line2, city, state, pincode, isDefault } = req.body;
    if (!name || !line1 || !city || !pincode) return res.status(400).json({ error: 'Name, line1, city and pincode required.' });
    if (isDefault) user.addresses.forEach(a => a.isDefault = false);
    const addr = { id: 'addr_' + Date.now(), name, phone, line1, line2, city, state, pincode, isDefault: !!isDefault };
    user.addresses.push(addr);
    res.status(201).json({ address: addr, message: 'Address saved.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/notif-prefs
router.put('/notif-prefs', protect, (req, res) => {
  const user = DB.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  user.notifPrefs = { ...user.notifPrefs, ...req.body };
  res.json({ notifPrefs: user.notifPrefs, message: 'Preferences saved.' });
});

module.exports = router;
