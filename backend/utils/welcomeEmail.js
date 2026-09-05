const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeEmail(user) {
  if (!user || !user.email) return;
  const isSeller = user.role === 'seller';
  try {
    await resend.emails.send({
      from: 'Hubooze <welcome@hubooze.in>',
      to: user.email,
      subject: isSeller ? '🎉 Welcome to Hubooze — Start Selling Today!' : '🎉 Welcome to Hubooze!',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#f5f5f5">
          <div style="text-align:center;margin-bottom:24px">
            <h1 style="color:#00ff8f;margin:0;font-size:28px">Hubooze</h1>
            <p style="color:#999;font-size:13px;margin-top:4px">Shop. Return. Recycle.</p>
          </div>
          <h2 style="font-size:20px;margin-bottom:12px">Hi ${user.name || 'there'}, welcome aboard! 🎉</h2>
          ${isSeller ? `
            <p style="color:#ccc;line-height:1.6">Thanks for joining Hubooze as a seller. Here's how to get started:</p>
            <ul style="color:#ccc;line-height:1.8">
              <li>Upload your business documents for verification from your Seller Dashboard</li>
              <li>List your first product (or use Bulk Upload for many at once)</li>
              <li>Track orders and payouts right from your dashboard</li>
            </ul>
            <p style="color:#ccc;line-height:1.6">Need help? Check out our Seller Guide & FAQ from the footer, or reach out to Team.Support@hubooze.in anytime.</p>
          ` : `
            <p style="color:#ccc;line-height:1.6">Thanks for joining India's return-to-recycle marketplace. Here's what makes Hubooze different:</p>
            <ul style="color:#ccc;line-height:1.8">
              <li>90-day free returns on every order</li>
              <li>Free delivery on orders above ₹499</li>
              <li>Fashion, Electronics, Home, Beauty, and Handmade — all in one place</li>
            </ul>
            <p style="color:#ccc;line-height:1.6">Start exploring and happy shopping!</p>
          `}
          <div style="text-align:center;margin-top:28px">
            <a href="https://hubooze.in" style="display:inline-block;padding:12px 28px;background:#00ff8f;color:#000;text-decoration:none;border-radius:8px;font-weight:700">Visit Hubooze</a>
          </div>
          <p style="color:#555;font-size:11px;text-align:center;margin-top:32px">Hubooze &bull; Indore, Madhya Pradesh, India</p>
        </div>
      `
    });
  } catch (e) {
    console.error('Failed to send welcome email:', e.message);
  }
}

module.exports = { sendWelcomeEmail };
