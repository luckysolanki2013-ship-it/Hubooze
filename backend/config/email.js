const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Hubooze <orders@hubooze.in>',
      to, subject, html,
    });
    if (result.error) {
      console.error('❌ Email error:', result.error.message);
      return { success: false, error: result.error.message };
    }
    console.log(`📧 Email sent to ${to} — ID: ${result.data?.id}`);
    return { success: true, messageId: result.data?.id };
  } catch (err) {
    console.error('❌ Email error:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendEmail };
