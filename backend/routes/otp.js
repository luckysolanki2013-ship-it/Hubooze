const router = require('express').Router();
const { Resend } = require('resend');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dba = require('../dbAdapter');

// Initialize Resend ONLY if API key exists, otherwise null
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) 
      return res.status(400).json({ error: 'Valid email required' });

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    otpStore.set(email.toLowerCase(), { otp, expiresAt, attempts: 0 });

    if (resend) {
      await resend.emails.send({
        from: 'Hubooze <noreply@hubooze.in>',
        to: email,
        subject: 'Your Hubooze Login OTP',
        html: `<div style="font-family:sans-serif;text-align:center"><h2>Hubooze</h2><p>Your OTP is: <strong>${otp}</strong></p></div>`
      });
      res.json({ message: 'OTP sent', success: true });
    } else {
      // MOCK MODE: Log to console instead of crashing
      console.log(`\n🔐 [MOCK OTP] Email: ${email} | OTP: ${otp}\n`);
      res.json({ 
        message: 'OTP sent (Check server console)', 
        success: true, 
        mockOtp: otp 
      });
    }
  } catch(e) {
    console.error('OTP send error:', e);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { email, otp, name, role } = req.body;
    if (!email || !otp) 
      return res.status(400).json({ error: 'Email and OTP required' });

    const stored = otpStore.get(email.toLowerCase());
    if (!stored) 
      return res.status(400).json({ error: 'OTP expired or not found' });

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'OTP expired' });
    }

    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts > 5) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Too many attempts' });
    }

    if (stored.otp !== otp.toString()) 
      return res.status(400).json({ error: 'Invalid OTP' });

    otpStore.delete(email.toLowerCase());

    let user = await dba.findUser({ email: email.toLowerCase() });
    
    if (!user) {
      const newId = 'u' + Date.now();
      user = await dba.createUser({
        id: newId,
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: await bcrypt.hash(Math.random().toString(36), 8),
        role: role || 'customer',
        createdAt: new Date(),
        addresses: [],
        wishlist: [],
      });
    }

    const token = jwt.sign(
      { id: user._id || user.id, role: user.role },
      process.env.JWT_SECRET || 'hubooze-secret-2024',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id || user._id, name: user.name, email: user.email, role: user.role },
      isNew: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime() < 5000),
    });
  } catch(e) {
    console.error('OTP verify error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
