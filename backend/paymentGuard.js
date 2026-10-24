'use strict';
/* HUBOOZE PAYGUARD: records failed online payments, releases stock of unpaid online orders and alerts the owner */
const dba = require('./dbAdapter');

const HOLD_MINUTES = parseInt(process.env.PAYGUARD_MINUTES || '30', 10);
const SWEEP_EVERY_MS = 10 * 60 * 1000;
const alerted = {};

function qtyOf(it) { return parseInt(it.qty || it.quantity || 1, 10) || 1; }
function createdMs(o) {
  const t = new Date(o.createdAt).getTime();
  if (isFinite(t) && t > 0) return t;
  const m = /^ORD(\d{10,})/.exec(String(o.id || o.orderId || ''));
  return m ? parseInt(m[1], 10) : Date.now();
}

async function sendOwnerAlert(subject, text) {
  try {
    if (!process.env.RESEND_API_KEY) { console.warn('[payguard] alert not sent (RESEND_API_KEY missing):', subject); return; }
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.ALERT_EMAIL || process.env.ADMIN_ALERT_EMAIL || 'Team.Support@hubooze.in';
    const result = await resend.emails.send({ from: 'Hubooze Alerts <noreply@hubooze.in>', to, subject: '[Hubooze] ' + subject, text });
    if (result && result.error) console.error('[payguard] alert failed:', result.error.message);
    else console.log('[payguard] alert sent to ' + to + ': ' + subject);
  } catch (e) { console.error('[payguard] alert failed:', e.message); }
}

async function restock(order, sign) {
  for (const it of (order.items || [])) {
    try {
      const p = await dba.findProduct(it.productId);
      if (!p) continue;
      const next = Math.max(0, (p.stock || 0) + sign * qtyOf(it));
      await dba.updateProduct(p.id, { stock: next });
    } catch (e) { console.error('[payguard] restock error:', e.message); }
  }
}

/* cancel an unpaid online order and give its stock back (only if it is still waiting for payment) */
async function releaseUnpaid(orderId, reason) {
  const o = await dba.findOrder(orderId);
  if (!o || o.status !== 'pending_payment') return false;
  if (/^(paid|success|successful|captured|completed|charged)$/i.test(String(o.paymentStatus || ''))) return false;
  const upd = { status: 'cancelled', cancelReason: reason, cancelledAt: new Date() };
  try { await dba.updateOrder(orderId, Object.assign({ paymentStatus: 'failed' }, upd)); }
  catch (e) { await dba.updateOrder(orderId, upd); }
  await restock(o, +1);
  return true;
}

async function sweep() {
  try {
    const all = await dba.findOrders({});
    const cutoff = Date.now() - HOLD_MINUTES * 60 * 1000;
    const released = [];
    for (const o of (all || [])) {
      if (o.status !== 'pending_payment') continue;
      if (String(o.paymentMethod || '').toUpperCase() === 'COD') continue;
      if (createdMs(o) > cutoff) continue;
      const id = o.id || o.orderId;
      try { if (await releaseUnpaid(id, 'Payment not completed within ' + HOLD_MINUTES + ' minutes')) released.push(id + ' (Rs. ' + o.total + ')'); }
      catch (e) { console.error('[payguard] release error', id, e.message); }
    }
    if (released.length) await sendOwnerAlert('Released ' + released.length + ' unpaid online order(s)', 'These online orders were not paid within ' + HOLD_MINUTES + ' minutes. They were cancelled and the stock was returned:\n\n' + released.join('\n'));
    return released;
  } catch (e) { console.error('[payguard] sweep error:', e.message); return []; }
}

/* CCAvenue said the payment failed or was cancelled */
async function onNotPaid(orderId, status, params) {
  try {
    let reason = '';
    try { reason = decodeURIComponent(String((params && (params.failure_message || params.status_message)) || '').replace(/\+/g, ' ')); } catch (e) { reason = String((params && params.status_message) || ''); }
    try { await dba.updateOrder(orderId, { payFailStatus: String(status || ''), payFailReason: reason }); } catch (e) {}
    if (status !== 'Aborted' && !alerted[orderId]) {
      alerted[orderId] = 1;
      await sendOwnerAlert('Online payment failed: ' + orderId, 'Order: ' + orderId + '\nGateway status: ' + status + '\nReason: ' + (reason || 'not given') + '\nAmount: ' + ((params && params.amount) || '') + '\nBank: ' + ((params && params.card_name) || '') + '\n\nThe order stays open for ' + HOLD_MINUTES + ' minutes, then it is cancelled and the stock is returned.');
    }
  } catch (e) { console.error('[payguard] onNotPaid error:', e.message); }
}

/* payment arrived: if the order had already been cancelled by the sweeper, take the stock again */
async function onPaid(before) {
  try {
    if (!before || before.status !== 'cancelled') return;
    await restock(before, -1);
    await sendOwnerAlert('Late payment for a cancelled order: ' + (before.id || before.orderId), 'The customer paid after the order was cancelled. The order is confirmed again and the stock was deducted again. Please check that the product is still available.');
  } catch (e) { console.error('[payguard] onPaid error:', e.message); }
}

function start() {
  const t1 = setTimeout(sweep, 2 * 60 * 1000); if (t1.unref) t1.unref();
  const t2 = setInterval(sweep, SWEEP_EVERY_MS); if (t2.unref) t2.unref();
  console.log('[payguard] started: unpaid online orders are released after ' + HOLD_MINUTES + ' minutes');
}

module.exports = { start, sweep, releaseUnpaid, onNotPaid, onPaid, sendOwnerAlert };
