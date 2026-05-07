const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your@gmail.com') {
    // Use Ethereal (fake SMTP) for development
    console.log('📧 Email: using Ethereal test account (no real emails sent)');
    return null; // Will create async in sendEmail
  }
  transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    let t = getTransporter();
    if (!t) {
      // Create test account on the fly
      const testAcc = await nodemailer.createTestAccount();
      t = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: testAcc.user, pass: testAcc.pass },
      });
    }
    const info = await t.sendMail({
      from:    process.env.EMAIL_FROM || 'Hubooze <noreply@hubooze.in>',
      to, subject, html,
      text: text || html.replace(/<[^>]+>/g, ''),
    });
    console.log(`📧 Email sent to ${to} — MessageID: ${info.messageId}`);
    // Log preview URL if Ethereal
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`   Preview: ${preview}`);
    return { success: true, messageId: info.messageId, preview };
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail };
