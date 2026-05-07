/**
 * HUBOOZE PAYMENT CLIENT — Razorpay Integration
 * Replaces the mock payment step in checkout with real Razorpay SDK
 */

// Load Razorpay SDK dynamically
function loadRazorpaySDK() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = resolve;
    script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
    document.head.appendChild(script);
  });
}

// Main payment initiator — called instead of mock placeOrderFinal
async function initiateRazorpayPayment(orderData, huboozeOrderId) {
  try {
    await loadRazorpaySDK();

    // 1. Get Razorpay config from backend
    const config = await api.get('/payments/config');

    // 2. Create Razorpay order on backend
    const { order: rzpOrder } = await api.post('/payments/create-order', {
      amount:  orderData.total * 100, // paise
      receipt: huboozeOrderId,
      notes:   { userId: currentUser?.id, orderId: huboozeOrderId },
    });

    // 3. Open Razorpay checkout modal
    return new Promise((resolve, reject) => {
      const options = {
        key:          config.keyId,
        amount:       rzpOrder.amount,
        currency:     'INR',
        name:         'Hubooze',
        description:  'Order #' + huboozeOrderId,
        order_id:     rzpOrder.id,
        prefill: {
          name:    currentUser?.name  || '',
          email:   currentUser?.email || '',
          contact: currentUser?.phone || '',
        },
        theme:        { color: '#00ff8f' },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user.')),
        },
        handler: async (response) => {
          try {
            // 4. Verify payment on backend
            const verification = await api.post('/payments/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId:             huboozeOrderId,
            });
            resolve({ ...response, verified: verification.verified });
          } catch (err) {
            reject(err);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', (resp) => {
        reject(new Error(resp.error?.description || 'Payment failed.'));
      });
      rzpInstance.open();
    });

  } catch (err) {
    throw err;
  }
}

// Override placeOrderFinal to use Razorpay for non-COD
async function placeOrderFinal() {
  if (!currentUser) return;
  if (!checkoutAddrId) { showToast('Please select a delivery address', 'error'); goToStep(1); return; }

  const tc = document.getElementById('tcCheck');
  if (tc && !tc.checked) { showToast('Please accept the Terms & Conditions', 'error'); return; }

  const btn = document.getElementById('placeOrderBtn');
  const total = cartTotal() + (checkoutGiftWrap ? 49 : 0);

  // COD — skip payment gateway
  if (checkoutPayment === 'COD') {
    return placeOrderAPI(btn, total);
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Opening Payment...'; btn.style.opacity = '.7'; }

  try {
    // First create the order record (unpaid)
    const orderPayload = buildOrderPayload();
    const result = await api.placeOrder({ ...orderPayload, paymentStatus: 'pending' });
    const order  = result.order;

    // Then open Razorpay
    const payment = await initiateRazorpayPayment(order, order.orderId || order.id);
    console.log('✅ Payment verified:', payment.razorpay_payment_id);

    // Clear cart and show confirmation
    cartItems = []; appliedCoupon = null; saveCartState(); updateCartBadge(false);
    checkoutGiftWrap = false; checkoutNote = '';
    lastPlacedOrder  = order;

    showToast('🎉 Payment successful! Order placed.', 'success');
    renderOrderConfirmation(order);
    startConfetti();

  } catch (err) {
    if (btn) { btn.disabled = false; btn.innerHTML = '🛒 Place Order — ₹' + total.toLocaleString('en-IN'); btn.style.opacity = '1'; }
    showToast(err.message || 'Payment failed. Please try again.', 'error');
  }
}

async function placeOrderAPI(btn, total) {
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Placing Order...'; btn.style.opacity = '.7'; }
  try {
    const result = await api.placeOrder(buildOrderPayload());
    const order  = result.order;
    cartItems = []; appliedCoupon = null; saveCartState(); updateCartBadge(false);
    checkoutGiftWrap = false; checkoutNote = '';
    lastPlacedOrder  = order;
    renderOrderConfirmation(order);
    startConfetti();
  } catch (err) {
    if (btn) { btn.disabled = false; btn.innerHTML = '🛒 Place Order — ₹' + total.toLocaleString('en-IN'); btn.style.opacity = '1'; }
    showToast(err.message || 'Order failed. Please try again.', 'error');
  }
}

function buildOrderPayload() {
  return {
    items:         cartItems.map(ci => ({ productId: ci.productId, qty: ci.qty, size: ci.size })),
    addressId:     checkoutAddrId,
    paymentMethod: checkoutPayment || 'COD',
    couponCode:    appliedCoupon?.code || null,
    note:          checkoutNote || '',
    giftWrap:      checkoutGiftWrap || false,
  };
}

window.initiateRazorpayPayment = initiateRazorpayPayment;
console.log('💳 payments.js loaded');
