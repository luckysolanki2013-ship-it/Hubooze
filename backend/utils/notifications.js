/**
 * HUBOOZE NOTIFICATION SERVICE
 * Handles: Email (Nodemailer) · WhatsApp (Twilio/WATI) · SMS (Fast2SMS)
 */

const { sendEmail } = require('../config/email');
const Notification  = require('../models/Notification');

// ── EMAIL TEMPLATES ──────────────────────────────────────────────
const emailTemplates = {
  orderConfirmed: (order, user) => ({
    subject: `Order Confirmed! #${order.orderId} — Hubooze`,
    html: `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px}
.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.1)}
.hdr{background:linear-gradient(135deg,#080808,#161616);padding:24px;text-align:center;border-bottom:3px solid;border-image:linear-gradient(90deg,#00ff8f,#00a1ff) 1}
.hdr h1{color:#fff;font-size:22px;margin:0}
.hdr p{color:#aaa;font-size:13px;margin:6px 0 0}
.body{padding:28px}
.success-icon{text-align:center;font-size:60px;margin-bottom:16px}
h2{color:#111;font-size:20px;margin:0 0 16px}
.order-id{background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:14px;margin-bottom:20px;text-align:center}
.order-id .label{font-size:12px;color:#666;margin-bottom:4px}
.order-id .value{font-size:18px;font-weight:800;color:#111;font-family:monospace}
.items{margin-bottom:20px}
.item{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #eee}
.item-icon{font-size:28px}
.item-name{font-size:14px;font-weight:600;color:#111}
.item-meta{font-size:12px;color:#666}
.item-price{margin-left:auto;font-weight:700;color:#111}
.summary{background:#f8f9fa;border-radius:8px;padding:16px;margin-bottom:20px}
.sum-row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;color:#666}
.sum-row.total{font-weight:800;font-size:15px;color:#111;border-top:1px solid #dee2e6;padding-top:8px;margin-top:8px}
.cta{text-align:center;margin:24px 0}
.btn{display:inline-block;padding:13px 32px;background:linear-gradient(90deg,#00ff8f,#00a1ff);color:#000;font-weight:700;border-radius:8px;text-decoration:none;font-size:14px}
.return-box{background:#e8f5e9;border:1px solid #a5d6a7;border-radius:8px;padding:14px;text-align:center;margin-bottom:20px}
.return-box h4{color:#2e7d32;margin:0 0 6px;font-size:14px}
.return-box p{color:#388e3c;font-size:12px;margin:0}
.footer{background:#f8f9fa;padding:16px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee}
</style></head><body>
<div class="wrap">
  <div class="hdr"><h1>Hubooze</h1><p>Shop. Return. Recycle.</p></div>
  <div class="body">
    <div class="success-icon">🎉</div>
    <h2>Order Confirmed, ${user.name.split(' ')[0]}!</h2>
    <p style="color:#555;margin-bottom:20px">Your order has been placed successfully and is being processed.</p>
    <div class="order-id">
      <div class="label">Order ID</div>
      <div class="value">#${order.orderId}</div>
    </div>
    <div class="items">
      ${order.items.map(item => `
        <div class="item">
          <span class="item-icon">${item.icon || '📦'}</span>
          <div>
            <div class="item-name">${item.name}</div>
            <div class="item-meta">Qty: ${item.quantity}${item.size ? ' · ' + item.size : ''}</div>
          </div>
          <div class="item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
        </div>`).join('')}
    </div>
    <div class="summary">
      <div class="sum-row"><span>Subtotal</span><span>₹${order.subtotal?.toLocaleString('en-IN')}</span></div>
      ${order.discount > 0 ? `<div class="sum-row"><span>Discount</span><span style="color:#2e7d32">-₹${order.discount?.toLocaleString('en-IN')}</span></div>` : ''}
      <div class="sum-row"><span>Delivery</span><span style="color:${order.deliveryFee === 0 ? '#2e7d32' : '#111'}">${order.deliveryFee === 0 ? 'FREE' : '₹' + order.deliveryFee}</span></div>
      <div class="sum-row total"><span>Total</span><span>₹${order.total?.toLocaleString('en-IN')}</span></div>
    </div>
    <p style="color:#555;font-size:14px;margin-bottom:6px">📍 Delivering to: <strong>${order.address?.city}, ${order.address?.pincode}</strong></p>
    <p style="color:#555;font-size:14px;margin-bottom:20px">📅 Estimated delivery: <strong>${order.estimatedDelivery || '3-5 business days'}</strong></p>
    <div class="cta"><a class="btn" href="${process.env.FRONTEND_URL || '#'}/orders">Track My Order →</a></div>
    <div class="return-box">
      <h4>♻️ 90-Day Free Returns</h4>
      <p>Not satisfied? Return in any condition — free doorstep pickup, instant refund.</p>
    </div>
  </div>
  <div class="footer">Hubooze · Team.Support@hubooze.in · © 2025<br>
  <a href="#" style="color:#999">Unsubscribe</a> from order emails</div>
</div></body></html>`,
  }),

  returnInitiated: (ret, user) => ({
    subject: `Return Initiated — ₹${ret.refundAmount?.toLocaleString('en-IN')} refund coming your way`,
    html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px}
.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.1)}
.hdr{background:linear-gradient(135deg,#080808,#161616);padding:24px;text-align:center;border-bottom:3px solid;border-image:linear-gradient(90deg,#00ff8f,#00a1ff) 1}
.hdr h1{color:#fff;font-size:22px;margin:0}.body{padding:28px}
.steps{display:flex;justify-content:space-between;margin:24px 0;position:relative}
.steps::before{content:'';position:absolute;top:20px;left:10%;right:10%;height:2px;background:#e9ecef;z-index:0}
.step{text-align:center;flex:1;position:relative;z-index:1}
.step-icon{width:40px;height:40px;border-radius:50%;background:#00a651;color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px}
.step-icon.pending{background:#e9ecef;color:#aaa}
.step-label{font-size:11px;color:#666;font-weight:600}
.btn{display:inline-block;padding:13px 32px;background:linear-gradient(90deg,#00ff8f,#00a1ff);color:#000;font-weight:700;border-radius:8px;text-decoration:none;font-size:14px}
.footer{background:#f8f9fa;padding:16px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee}
</style></head><body>
<div class="wrap">
  <div class="hdr"><h1>Hubooze</h1></div>
  <div class="body">
    <h2 style="color:#111">Return Initiated ♻️</h2>
    <p style="color:#555">Hi ${user.name.split(' ')[0]}, your return request has been received.</p>
    <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0">
      <div style="font-size:13px;color:#666;margin-bottom:4px">Return ID</div>
      <div style="font-size:18px;font-weight:800;font-family:monospace">#${ret.returnId}</div>
      <div style="margin-top:10px;font-size:13px;color:#555">Product: <strong>${ret.productName}</strong><br>
      Reason: ${ret.reason}<br>Refund Amount: <strong style="color:#2e7d32">₹${ret.refundAmount?.toLocaleString('en-IN')}</strong></div>
    </div>
    <div class="steps">
      <div class="step"><div class="step-icon">✓</div><div class="step-label">Initiated</div></div>
      <div class="step"><div class="step-icon pending">🚚</div><div class="step-label">Pickup</div></div>
      <div class="step"><div class="step-icon pending">🔍</div><div class="step-label">Checking</div></div>
      <div class="step"><div class="step-icon pending">💰</div><div class="step-label">Refund</div></div>
    </div>
    <div style="background:#e8f5e9;border-radius:8px;padding:16px;margin:20px 0">
      <h4 style="color:#2e7d32;margin:0 0 8px">What happens next?</h4>
      <p style="font-size:13px;color:#388e3c;margin:0">1. Our pickup partner will contact you within 24 hours<br>
      2. Free pickup from your doorstep<br>3. Refund processed instantly after quality check</p>
    </div>
    <div style="text-align:center"><a class="btn" href="${process.env.FRONTEND_URL || '#'}/orders">Track Return →</a></div>
  </div>
  <div class="footer">Hubooze · Team.Support@hubooze.in · © 2025</div>
</div></body></html>`,
  }),

  otpEmail: (otp, user) => ({
    subject: `${otp} is your Hubooze OTP — valid for 5 minutes`,
    html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px}
.wrap{max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.1)}
.hdr{background:#080808;padding:20px;text-align:center;border-bottom:3px solid;border-image:linear-gradient(90deg,#00ff8f,#00a1ff) 1}
.hdr h1{color:#fff;font-size:20px;margin:0}.body{padding:28px;text-align:center}
.otp-box{background:linear-gradient(135deg,#e8f5e9,#e3f2fd);border:2px solid #00a651;border-radius:12px;padding:24px;margin:24px 0;display:inline-block;width:80%}
.otp-code{font-size:40px;font-weight:900;letter-spacing:8px;font-family:monospace;color:#111}
.footer{background:#f8f9fa;padding:16px;text-align:center;font-size:11px;color:#999}
</style></head><body>
<div class="wrap">
  <div class="hdr"><h1>Hubooze</h1></div>
  <div class="body">
    <div style="font-size:48px;margin-bottom:16px">🔐</div>
    <h2 style="color:#111;margin-bottom:8px">Your OTP</h2>
    <p style="color:#555;font-size:14px">Hi ${user?.name?.split(' ')[0] || 'there'}, use this OTP to verify your identity.</p>
    <div class="otp-box"><div class="otp-code">${otp}</div></div>
    <p style="color:#e53935;font-weight:600;font-size:14px">⏰ Valid for 5 minutes only</p>
    <p style="color:#555;font-size:13px;margin-top:20px">Never share this OTP with anyone.<br>Hubooze will never ask for your OTP.</p>
  </div>
  <div class="footer">Hubooze · Team.Support@hubooze.in · © 2025</div>
</div></body></html>`,
  }),
};

// ── WHATSAPP (Twilio) ─────────────────────────────────────────────
const sendWhatsApp = async (to, message) => {
  if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.startsWith('AC') === false) {
    console.log(`📱 WhatsApp (simulated) → ${to}: ${message.substring(0, 60)}...`);
    return { success: true, simulated: true };
  }
  try {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg = await twilio.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to:   `whatsapp:${to}`,
      body: message,
    });
    console.log(`📱 WhatsApp sent to ${to} — SID: ${msg.sid}`);
    return { success: true, sid: msg.sid };
  } catch (err) {
    console.error('❌ WhatsApp error:', err.message);
    return { success: false, error: err.message };
  }
};

// ── SMS (Fast2SMS) ─────────────────────────────────────────────────
const sendSMS = async (to, message) => {
  if (!process.env.FAST2SMS_API_KEY) {
    console.log(`📟 SMS (simulated) → ${to}: ${message}`);
    return { success: true, simulated: true };
  }
  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: process.env.FAST2SMS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'q', message, numbers: to.replace('+91','') }),
    });
    const data = await res.json();
    return { success: data.return, data };
  } catch (err) {
    console.error('❌ SMS error:', err.message);
    return { success: false, error: err.message };
  }
};

// ── MAIN NOTIFICATION SENDER ──────────────────────────────────────
const notify = async (user, type, title, body, channels = ['push'], data = {}) => {
  // Save to DB
  const notif = await Notification.create({ user: user._id, type, title, body, channels, data });

  const results = {};
  // Email
  if (channels.includes('email') && user.email) {
    const tpl = data.emailTemplate;
    if (tpl && emailTemplates[tpl]) {
      const { subject, html } = emailTemplates[tpl](data.templateData, user);
      results.email = await sendEmail({ to: user.email, subject, html });
    } else {
      results.email = await sendEmail({
        to: user.email,
        subject: title,
        html: `<div style="font-family:Arial;padding:20px"><h2>${title}</h2><p>${body}</p><hr><p style="font-size:12px;color:#666">Hubooze · Team.Support@hubooze.in</p></div>`,
      });
    }
  }
  // WhatsApp
  if (channels.includes('wa') && user.phone) {
    const waMsg = data.waMsg || `*Hubooze* 🛒\n\n*${title}*\n${body}`;
    results.wa = await sendWhatsApp(user.phone, waMsg);
  }
  // SMS
  if (channels.includes('sms') && user.phone) {
    results.sms = await sendSMS(user.phone, `Hubooze: ${title}. ${body.substring(0, 100)}`);
  }

  return { notif, results };
};

// ── CONVENIENCE WRAPPERS ──────────────────────────────────────────
const notifyOrderConfirmed = (order, user) => notify(
  user, 'order', `Order Confirmed! 🎉 #${order.orderId}`,
  `Your order for ₹${order.total?.toLocaleString('en-IN')} is confirmed. Delivery by ${order.estimatedDelivery || '3-5 days'}.`,
  ['email', 'wa', 'push'],
  {
    orderId: order._id, emailTemplate: 'orderConfirmed', templateData: order,
    waMsg: `*Hubooze* 🛒\n\n*Order Confirmed!* 🎉\n\nOrder: *#${order.orderId}*\nAmount: ₹${order.total?.toLocaleString('en-IN')}\nDelivery: ${order.estimatedDelivery || '3-5 days'}\n\n_Reply TRACK to track your order_`,
  }
);

const notifyOrderShipped = (order, user) => notify(
  user, 'order', `Order Shipped! 🚚 #${order.orderId}`,
  `Your order is on its way! Tracking ID: ${order.trackingId || 'will be updated'}`,
  ['wa', 'push'],
  {
    orderId: order._id,
    waMsg: `*Hubooze* 🚚\n\n*Your order is shipped!*\n\nOrder: *#${order.orderId}*\nTracking ID: ${order.trackingId || 'TBD'}\n\nExpected delivery: ${order.estimatedDelivery || '2-3 days'}`,
  }
);

const notifyReturnInitiated = (ret, user) => notify(
  user, 'return', `Return Initiated ♻️ #${ret.returnId}`,
  `Return for "${ret.productName}" initiated. Free pickup within 24 hours. Refund ₹${ret.refundAmount?.toLocaleString('en-IN')} after pickup.`,
  ['email', 'wa', 'push'],
  {
    retId: ret._id, emailTemplate: 'returnInitiated', templateData: ret,
    waMsg: `*Hubooze* ♻️\n\n*Return Initiated*\n\nProduct: ${ret.productName}\nReturn ID: *#${ret.returnId}*\nRefund: ₹${ret.refundAmount?.toLocaleString('en-IN')}\nPickup: Within 24 hours\n\n_Reply RETURN for status_`,
  }
);

const notifyRefundProcessed = (ret, user) => notify(
  user, 'return', `Refund Processed! 💰 ₹${ret.refundAmount?.toLocaleString('en-IN')}`,
  `Your refund of ₹${ret.refundAmount?.toLocaleString('en-IN')} for "${ret.productName}" has been initiated to your account.`,
  ['email', 'wa', 'push'],
  {
    waMsg: `*Hubooze* 💰\n\n*Refund Processed!*\n\nReturn: *#${ret.returnId}*\nRefund: ₹${ret.refundAmount?.toLocaleString('en-IN')}\nCredited to: original payment\nTimeline: Within 24 hours\n\n🎉 Thank you for shopping with Hubooze!`,
  }
);

const sendOTPNotification = async (user, otp) => {
  // Email OTP
  const emailRes = await sendEmail({
    to:      user.email,
    subject: `${otp} is your Hubooze OTP`,
    html:    emailTemplates.otpEmail(otp, user).html,
  });
  // WhatsApp OTP
  const waRes = await sendWhatsApp(
    user.phone || '',
    `*Hubooze OTP*\n\nYour one-time password is: *${otp}*\n\n⏰ Valid for 5 minutes.\n_Do not share this OTP with anyone._`
  );
  // SMS OTP
  await sendSMS(user.phone || '', `${otp} is your Hubooze OTP. Valid 5 mins. Do not share.`);

  return { emailRes, waRes };
};

module.exports = {
  notify, sendEmail, sendWhatsApp, sendSMS,
  notifyOrderConfirmed, notifyOrderShipped,
  notifyReturnInitiated, notifyRefundProcessed,
  sendOTPNotification,
};
