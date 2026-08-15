/**
 * Error Alert System - emails admin when server errors occur
 * Rate-limited to prevent spam (max 1 email per error type per 15 min)
 */
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'Team.Support@hubooze.in';
const recentAlerts = new Map(); // errorKey -> timestamp
const RATE_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

async function sendErrorAlert(errorType, errorMessage, context) {
  try {
    const errorKey = errorType + ':' + errorMessage.substring(0, 100);
    const lastSent = recentAlerts.get(errorKey);
    const now = Date.now();

    if (lastSent && (now - lastSent) < RATE_LIMIT_MS) {
      return; // Skip - already alerted recently for this exact error
    }
    recentAlerts.set(errorKey, now);

    if (recentAlerts.size > 100) {
      const cutoff = now - RATE_LIMIT_MS;
      for (const [key, time] of recentAlerts.entries()) {
        if (time < cutoff) recentAlerts.delete(key);
      }
    }

    await resend.emails.send({
      from: 'Hubooze Alerts <onboarding@resend.dev>',
      to: ADMIN_EMAIL,
      subject: `🚨 Hubooze Error: ${errorType}`,
      html: `
        <div style="font-family:monospace;max-width:600px;margin:0 auto;padding:24px;background:#1a1a1a;color:#fff">
          <h2 style="color:#ff4d4d;margin-bottom:16px">🚨 Server Error Detected</h2>
          <div style="background:#2a2a2a;border-radius:8px;padding:16px;margin-bottom:16px">
            <p style="margin:0 0 8px"><strong>Type:</strong> ${errorType}</p>
            <p style="margin:0 0 8px"><strong>Time:</strong> ${new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})}</p>
            <p style="margin:0"><strong>Message:</strong></p>
            <pre style="white-space:pre-wrap;word-break:break-all;background:#111;padding:12px;border-radius:6px;color:#ff8080;font-size:13px">${errorMessage}</pre>
          </div>
          ${context ? `<div style="background:#2a2a2a;border-radius:8px;padding:16px">
            <p style="margin:0 0 8px"><strong>Context:</strong></p>
            <pre style="white-space:pre-wrap;word-break:break-all;background:#111;padding:12px;border-radius:6px;color:#8ab4f8;font-size:12px">${JSON.stringify(context, null, 2)}</pre>
          </div>` : ''}
          <p style="color:#888;font-size:12px;margin-top:16px">This alert is rate-limited to once per 15 min per error type.</p>
        </div>
      `
    });
    console.log('✅ Error alert email sent for:', errorType);
  } catch (e) {
    console.error('Failed to send error alert:', e.message);
  }
}

module.exports = { sendErrorAlert };
