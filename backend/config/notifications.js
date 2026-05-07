const nodemailer = require('nodemailer');

// ── EMAIL TRANSPORT ───────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  });
  return transporter;
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────
const emailTemplates = {
  orderConfirmed: (order, user) => ({
    subject: `Order Confirmed #${order._id} — Hubooze`,
    html: `
      <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto;background:#fff">
        <div style="background:linear-gradient(135deg,#080808,#161616);padding:28px;text-align:center;border-bottom:3px solid #00ff8f">
          <h1 style="color:#00ff8f;font-size:1.8rem;margin:0">Hubooze</h1>
          <p style="color:#aaa;font-size:12px;margin:6px 0 0">Shop. Return. Recycle.</p>
        </div>
        <div style="padding:32px">
          <h2 style="color:#111;font-size:1.4rem;margin-bottom:8px">🎉 Order Confirmed!</h2>
          <p style="color:#333">Hi <strong>${user.name.split(' ')[0]}</strong>, your order has been placed successfully.</p>
          <div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:10px;padding:16px;margin:20px 0">
            <div style="font-size:12px;color:#666;margin-bottom:4px">ORDER ID</div>
            <div style="font-size:1.1rem;font-weight:800;font-family:monospace">#${order._id}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            ${order.items.map(it => `
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;font-size:1.5rem;width:40px">${it.icon}</td>
              <td style="padding:10px 8px"><div style="font-weight:600">${it.name}</div><div style="font-size:12px;color:#666">Qty: ${it.qty}${it.size ? ' · ' + it.size : ''}</div></td>
              <td style="padding:10px 0;text-align:right;font-weight:700">₹${(it.price * it.qty).toLocaleString('en-IN')}</td>
            </tr>`).join('')}
          </table>
          <div style="background:#f0fff4;border:1px solid #a5d6a7;border-radius:8px;padding:14px;text-align:center;margin:20px 0">
            <div style="color:#2e7d32;font-weight:700;margin-bottom:4px">🔄 90-Day Free Returns</div>
            <div style="font-size:12px;color:#388e3c">Not satisfied? Return in any condition — free pickup, instant refund.</div>
          </div>
          <div style="background:#e3f2fd;border-radius:8px;padding:14px;font-size:13px;color:#333">
            <strong>📦 Estimated Delivery:</strong> ${order.estimatedDelivery || '3-5 business days'}<br>
            <strong>📍 Delivering to:</strong> ${order.address?.city}, ${order.address?.pincode}
          </div>
        </div>
        <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#666;border-top:1px solid #eee">
          Hubooze · Team.Support@hubooze.in · © 2025<br>
          <a href="#" style="color:#666">Unsubscribe</a> from order emails
        </div>
      </div>`,
  }),

  returnInitiated: (ret, user) => ({
    subject: `Return Initiated — Hubooze`,
    html: `
      <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#080808,#161616);padding:28px;text-align:center;border-bottom:3px solid #00ff8f">
          <h1 style="color:#00ff8f;font-size:1.8rem;margin:0">Hubooze</h1>
        </div>
        <div style="padding:32px">
          <h2 style="color:#111">🔄 Return Initiated</h2>
          <p style="color:#333">Hi <strong>${user.name.split(' ')[0]}</strong>, your return has been initiated successfully.</p>
          <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin:16px 0">
            <div><strong>Product:</strong> ${ret.productName}</div>
            <div><strong>Reason:</strong> ${ret.reason}</div>
            <div><strong>Refund Amount:</strong> ₹${ret.refundAmt?.toLocaleString('en-IN')}</div>
          </div>
          <div style="background:#e8f5e9;border-radius:8px;padding:16px">
            <div style="font-weight:700;color:#2e7d32;margin-bottom:8px">What happens next?</div>
            <div style="font-size:13px;color:#388e3c;line-height:1.8">
              ✅ Pickup partner will contact you within 24 hours<br>
              📦 Free pickup from your doorstep<br>
              💰 Refund processed instantly after pickup
            </div>
          </div>
        </div>
        <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#666;border-top:1px solid #eee">
          Hubooze · Team.Support@hubooze.in · © 2025
        </div>
      </div>`,
  }),

  otp: (otp, user) => ({
    subject: `Your Hubooze OTP: ${otp}`,
    html: `
      <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#080808,#161616);padding:28px;text-align:center;border-bottom:3px solid #00ff8f">
          <h1 style="color:#00ff8f;font-size:1.8rem;margin:0">Hubooze</h1>
        </div>
        <div style="padding:32px;text-align:center">
          <div style="font-size:2rem;margin-bottom:12px">🔐</div>
          <h2 style="color:#111">Your One-Time Password</h2>
          <p style="color:#333">Hi ${user?.name?.split(' ')[0] || 'there'}, use the OTP below to login.</p>
          <div style="background:linear-gradient(135deg,#e8f5e9,#e3f2fd);border:2px dashed #4caf50;border-radius:12px;padding:24px;margin:24px 0">
            <div style="font-size:2.5rem;font-weight:900;font-family:monospace;letter-spacing:10px;color:#2e7d32">${otp}</div>
          </div>
          <p style="color:#666;font-size:13px">Valid for <strong>5 minutes</strong>. Do not share with anyone.</p>
        </div>
        <div style="background:#fff8e1;border-radius:8px;margin:0 32px 24px;padding:14px;font-size:13px;color:#e65100;text-align:center">
          ⚠️ Hubooze will NEVER ask for your OTP over call. If someone asks, it's a scam.
        </div>
        <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#666;border-top:1px solid #eee">
          Hubooze · Team.Support@hubooze.in · © 2025
        </div>
      </div>`,
  }),

  welcomeEmail: (user) => ({
    subject: `Welcome to Hubooze, ${user.name.split(' ')[0]}! 🎉`,
    html: `
      <div style="font-family:DM Sans,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#080808,#161616);padding:40px;text-align:center;border-bottom:3px solid #00ff8f">
          <h1 style="color:#00ff8f;font-size:2rem;margin:0">Hubooze</h1>
          <p style="color:#aaa;font-size:13px;margin:8px 0 0">India's First Return-to-Recycle Marketplace</p>
        </div>
        <div style="padding:36px;text-align:center">
          <div style="font-size:3rem;margin-bottom:16px">🎉</div>
          <h2 style="color:#111;font-size:1.5rem">Welcome, ${user.name.split(' ')[0]}!</h2>
          <p style="color:#333;line-height:1.7">You're now part of India's most conscious shopping community. Shop 50,000+ products with our legendary <strong>90-day free return policy</strong>.</p>
          <div style="background:linear-gradient(135deg,#e8f5e9,#e3f2fd);border-radius:12px;padding:20px;margin:24px 0">
            <div style="font-size:14px;color:#666;margin-bottom:4px">Welcome gift — use code</div>
            <div style="font-size:1.8rem;font-weight:900;font-family:monospace;letter-spacing:3px;color:#2e7d32">FIRST</div>
            <div style="font-size:12px;color:#388e3c;margin-top:4px">15% off your first order</div>
          </div>
          <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-top:20px">
            <div style="text-align:center;padding:16px;background:#f8f9fa;border-radius:10px;min-width:120px">
              <div style="font-size:1.8rem">🔄</div>
              <div style="font-size:12px;color:#333;margin-top:6px;font-weight:600">90-Day Returns</div>
            </div>
            <div style="text-align:center;padding:16px;background:#f8f9fa;border-radius:10px;min-width:120px">
              <div style="font-size:1.8rem">⚡</div>
              <div style="font-size:12px;color:#333;margin-top:6px;font-weight:600">Instant Refund</div>
            </div>
            <div style="text-align:center;padding:16px;background:#f8f9fa;border-radius:10px;min-width:120px">
              <div style="font-size:1.8rem">♻️</div>
              <div style="font-size:12px;color:#333;margin-top:6px;font-weight:600">Eco Recycling</div>
            </div>
          </div>
        </div>
        <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#666;border-top:1px solid #eee">
          Hubooze · Team.Support@hubooze.in · © 2025 · <a href="#" style="color:#666">Unsubscribe</a>
        </div>
      </div>`,
  }),
};

// ── SEND EMAIL ────────────────────────────────────────────────────
async function sendEmail(to, templateName, data) {
  try {
    if (!process.env.EMAIL_USER) {
      console.log(`[EMAIL SKIP] No EMAIL_USER configured. Would send "${templateName}" to ${to}`);
      return { success: true, simulated: true };
    }
    const template = emailTemplates[templateName]?.(...data);
    if (!template) throw new Error(`Unknown email template: ${templateName}`);

    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || 'Hubooze <noreply@hubooze.in>',
      to,
      subject: template.subject,
      html:    template.html,
    });
    console.log(`[EMAIL OK] ${templateName} → ${to} (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL FAIL] ${templateName} → ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── WHATSAPP (Twilio / WATI / Mock) ──────────────────────────────
async function sendWhatsApp(to, message) {
  try {
    // Option 1: Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const msg = await twilio.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to:   `whatsapp:${to}`,
        body: message,
      });
      console.log(`[WHATSAPP OK] Twilio → ${to} (${msg.sid})`);
      return { success: true, sid: msg.sid };
    }

    // Option 2: WATI
    if (process.env.WATI_API_TOKEN) {
      const fetch = require('node-fetch');
      const res = await fetch(`${process.env.WATI_API_URL}/sendSessionMessage/${to}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.WATI_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: message }),
      });
      const data = await res.json();
      console.log(`[WHATSAPP OK] WATI → ${to}`);
      return { success: true, data };
    }

    // Fallback: Log only
    console.log(`[WHATSAPP MOCK] → ${to}:\n${message}`);
    return { success: true, simulated: true };
  } catch (err) {
    console.error(`[WHATSAPP FAIL] → ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── OTP GENERATE + SEND ───────────────────────────────────────────
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOTP(user) {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  // Save OTP to user
  user.otp = { code: otp, expiresAt };
  await user.save();

  const results = await Promise.allSettled([
    // Email OTP
    sendEmail(user.email, 'otp', [otp, user]),
    // WhatsApp OTP
    user.phone ? sendWhatsApp(user.phone,
      `*Hubooze OTP*\n\nYour one-time password is: *${otp}*\n\nValid for 5 minutes. Do not share.`) : null,
  ]);

  console.log(`[OTP] Generated for ${user.email}: ${process.env.NODE_ENV === 'development' ? otp : '******'}`);
  return { otp: process.env.NODE_ENV === 'development' ? otp : undefined, expiresAt };
}

async function verifyOTP(user, code) {
  if (!user.otp?.code) return { valid: false, error: 'No OTP found' };
  if (new Date() > user.otp.expiresAt) return { valid: false, error: 'OTP expired' };
  if (user.otp.code !== code) return { valid: false, error: 'Invalid OTP' };
  // Clear OTP after use
  user.otp = undefined;
  await user.save();
  return { valid: true };
}

// ── ORDER NOTIFICATIONS ───────────────────────────────────────────
async function notifyOrderPlaced(order, user) {
  const prefs = user.notifPrefs || {};
  const msgs  = [];
  if (prefs.order_placed_email !== false) msgs.push(sendEmail(user.email, 'orderConfirmed', [order, user]));
  if (prefs.order_placed_wa !== false && user.phone)
    msgs.push(sendWhatsApp(user.phone,
      `*Hubooze* 🛒\n\n*Order Confirmed!* 🎉\n\nOrder: *#${order._id}*\nAmount: ₹${order.total?.toLocaleString('en-IN')}\nDelivery by: ${order.estimatedDelivery || '3-5 days'}\n\n_Reply ORDER to track_`));
  await Promise.allSettled(msgs);
}

async function notifyReturnInitiated(ret, user) {
  const prefs = user.notifPrefs || {};
  const msgs  = [];
  if (prefs.return_initiated_email !== false) msgs.push(sendEmail(user.email, 'returnInitiated', [ret, user]));
  if (prefs.return_initiated_wa !== false && user.phone)
    msgs.push(sendWhatsApp(user.phone,
      `*Hubooze* 🔄\n\n*Return Initiated*\n\nProduct: ${ret.productName}\nRefund: ₹${ret.refundAmt?.toLocaleString('en-IN')}\nPickup: Within 24 hours\n\n_Reply RETURN to track_`));
  await Promise.allSettled(msgs);
}

async function notifyRefundProcessed(ret, user) {
  const prefs = user.notifPrefs || {};
  const msgs  = [];
  if (prefs.return_approved_wa !== false && user.phone)
    msgs.push(sendWhatsApp(user.phone,
      `*Hubooze* 💰\n\n*Refund Processed!*\n\n✅ ₹${ret.refundAmt?.toLocaleString('en-IN')} refund initiated\nProduct: ${ret.productName}\nCredits to: original payment method\nTimeline: Within 24 hours\n\n🎉 Thank you for shopping with Hubooze!`));
  await Promise.allSettled(msgs);
}

async function notifyWelcome(user) {
  await sendEmail(user.email, 'welcomeEmail', [user]);
  if (user.phone)
    await sendWhatsApp(user.phone,
      `*Welcome to Hubooze!* 🎉\n\nHi ${user.name.split(' ')[0]}! Thanks for joining India's first return-to-recycle marketplace.\n\nUse code *FIRST* for 15% off your first order!\n\n_Reply HELP for support_`);
}

module.exports = {
  sendEmail, sendWhatsApp, sendOTP, verifyOTP, generateOTP,
  notifyOrderPlaced, notifyReturnInitiated, notifyRefundProcessed, notifyWelcome,
};
