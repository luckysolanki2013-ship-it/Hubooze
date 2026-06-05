const router = require('express').Router();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const dba = require('../dbAdapter');

// Store OTPs temporarily (in memory - good enough for now)
const otpStore = new Map();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) 
      return res.status(400).json({ error: 'Valid email required' });

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(email.toLowerCase(), { otp, expiresAt, attempts: 0 });

    await resend.emails.send({
      from: 'Hubooze <onboarding@resend.dev>',
      to: email,
      subject: 'Your Hubooze Login OTP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#00c853;margin-bottom:8px">Hubooze</h2>
          <p style="color:#555;margin-bottom:24px">India ki Eco Commerce</p>
          <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center">
            <p style="font-size:14px;color:#555;margin-bottom:12px">Your login OTP is:</p>
            <div style="font-size:42px;font-weight:900;letter-spacing:8px;color:#111">${otp}</div>
            <p style="font-size:12px;color:#999;margin-top:12px">Valid for 10 minutes</p>
          </div>
          <p style="font-size:12px;color:#999;margin-top:24px">If you didn't request this, ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to ' + email, success: true });
  } catch(e) {
    console.error('OTP send error:', e);
    res.status(500).json({ error: 'Failed to send OTP: ' + e.message });
  }
});

// Verify OTP and login/register
router.post('/verify', async (req, res) => {
  try {
    const { email, otp, name, role } = req.body;
    if (!email || !otp) 
      return res.status(400).json({ error: 'Email and OTP required' });

    const stored = otpStore.get(email.toLowerCase());
    if (!stored) 
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }

    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts > 5) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    if (stored.otp !== otp.toString()) 
      return res.status(400).json({ error: 'Invalid OTP. ' + (5 - stored.attempts) + ' attempts remaining.' });

    // OTP valid - clear it
    otpStore.delete(email.toLowerCase());

    // Find or create user
    let user = await dba.findUser({ email: email.toLowerCase() });
    
    if (!user) {
      // New user - register
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');
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

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id || user.id, role: user.role },
      process.env.JWT_SECRET || 'hubooze-secret-2024',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      isNew: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime() < 5000),
    });
  } catch(e) {
    console.error('OTP verify error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
