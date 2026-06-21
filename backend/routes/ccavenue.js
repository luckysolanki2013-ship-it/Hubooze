const router = require('express').Router();
const crypto = require('crypto');

const MERCHANT_ID  = process.env.CCAVENUE_MERCHANT_ID;
const ACCESS_CODE  = process.env.CCAVENUE_ACCESS_CODE;
const WORKING_KEY  = process.env.CCAVENUE_WORKING_KEY;
const CCAVENUE_URL = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction';

function encrypt(plainText) {
  const key = crypto.createHash('md5').update(WORKING_KEY).digest();
  const iv  = Buffer.alloc(16, 0);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encText) {
  const key = crypto.createHash('md5').update(WORKING_KEY).digest();
  const iv  = Buffer.alloc(16, 0);
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  let decrypted = decipher.update(encText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

router.post('/initiate', async (req, res) => {
  try {
    const { orderId, amount, name, email, phone, address, city, pincode } = req.body;
    if (!orderId || !amount) 
      return res.status(400).json({ error: 'Order ID and amount required' });

    const redirectUrl = `https://hubooze.in/api/ccavenue/response`;
    const cancelUrl   = `https://hubooze.in/api/ccavenue/response`;

    const params = [
      `merchant_id=${MERCHANT_ID}`,
      `order_id=${orderId}`,
      `amount=${parseFloat(amount).toFixed(2)}`,
      `currency=INR`,
      `redirect_url=${redirectUrl}`,
      `cancel_url=${cancelUrl}`,
      `language=EN`,
      `billing_name=${name||'Customer'}`,
      `billing_email=${email||''}`,
      `billing_tel=${phone||''}`,
      `billing_address=${address||''}`,
      `billing_city=${city||''}`,
      `billing_country=India`,
      `billing_zip=${pincode||''}`,
      `delivery_name=${name||'Customer'}`,
      `delivery_address=${address||''}`,
      `delivery_city=${city||''}`,
      `delivery_country=India`,
      `delivery_zip=${pincode||''}`,
      `delivery_tel=${phone||''}`,
    ].join('&');

    const encRequest = encrypt(params);

    res.json({
      encRequest,
      accessCode: ACCESS_CODE,
      ccavenueUrl: CCAVENUE_URL,
    });
  } catch(e) {
    console.error('CCAvenue initiate error:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/response', async (req, res) => {
  try {
    const encResponse = req.body.encResp;
    if (!encResponse) 
      return res.redirect('https://hubooze.in/?payment=failed');

    const decrypted = decrypt(encResponse);
    const params = {};
    decrypted.split('&').forEach(p => {
      const [k, v] = p.split('=');
      params[k] = v;
    });

    console.log('CCAvenue response:', JSON.stringify(params));

    const status      = params.order_status;
    const orderId     = params.order_id;
    const amount      = params.amount;
    const trackingId  = params.tracking_id;

    if (status === 'Success') {
      const dba = require('../dbAdapter');
      await dba.updateOrder(orderId, {
        paymentStatus: 'paid',
        paymentId: trackingId,
        paidAmount: amount,
        paidAt: new Date(),
        status: 'confirmed',
      });
      res.redirect(`https://hubooze.in/?payment=success&order=${orderId}`);
    } else if (status === 'Aborted') {
      res.redirect(`https://hubooze.in/?payment=cancelled&order=${orderId}`);
    } else {
      res.redirect(`https://hubooze.in/?payment=failed&order=${orderId}`);
    }
  } catch(e) {
    console.error('CCAvenue response error:', e);
    res.redirect('https://hubooze.in/?payment=error');
  }
});

module.exports = router;
