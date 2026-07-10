const authController = require("../controllers/authController");
const router = require("express").Router();

const { protect, authLimiter, otpLimiter } = require("../middleware");
const { DB } = require("../db");



// POST /api/auth/register
router.post("/register", authLimiter, authController.register);

// POST /api/auth/login
router.post("/login", authLimiter, authController.login);

// POST /api/auth/send-otp
router.post("/send-otp", otpLimiter, authController.sendOTP);

// POST /api/auth/verify-otp
router.post("/verify-otp", authController.verifyOTP);

// GET /api/auth/me
router.get("/me", protect, authController.me);

// PUT /api/auth/profile
router.put("/profile", protect, authController.updateProfile);

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
