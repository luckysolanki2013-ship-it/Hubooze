/**
 * HUBOOZE — Full API-Connected app.js
 * Overrides mock functions in hubooze.html with real backend calls.
 * Loaded AFTER hubooze.html's <script> block so these definitions win.
 *
 * Strategy: graceful fallback — every function tries the API first,
 * falls back to the existing local logic if API unreachable.
 */

/* ─── HELPERS ─────────────────────────────────────────────────── */
async function tryAPI(apiFn, fallbackFn) {
  try {
    return await apiFn();
  } catch (err) {
    if (err.status === 401) {
      // token expired
      api.logout(); currentUser = null; updateHeaderAuth(); showPage('account');
      return null;
    }
    console.warn('[API fallback]', err.message);
    return typeof fallbackFn === 'function' ? fallbackFn() : null;
  }
}

/* ─── AUTH ────────────────────────────────────────────────────── */
async function doLogin() {
  const email = (document.getElementById('loginEmail') || {}).value?.trim();
  const pass  = (document.getElementById('loginPass')  || {}).value;
  if (!email || !pass) { showToast('Please enter email and password', 'error'); return; }

  const btn = document.querySelector('#loginFormWrap .btn-grad');
  if (btn) { btn.textContent = 'Logging in…'; btn.disabled = true; }

  const result = await tryAPI(() => api.login(email, pass));

  if (btn) { btn.innerHTML = 'Login &#8594;'; btn.disabled = false; }
  if (result?.token) {
    loginSuccess(result.user);
    showToast('Welcome back, ' + result.user.name.split(' ')[0] + '! &#127881;', 'success');
  } else if (!result) {
    // tryAPI already showed toast; no double toast needed
  }
}

async function doRegister() {
  const name     = (document.getElementById('regName')     || {}).value?.trim();
  const email    = (document.getElementById('regEmail')    || {}).value?.trim();
  const pass     = (document.getElementById('regPass')     || {}).value;
  const phone    = (document.getElementById('regPhone')    || {}).value?.trim();
  const city     = (document.getElementById('regCity')     || {}).value?.trim();
  const isSeller = (document.getElementById('regIsSeller') || {}).checked;

  if (!name || !email || !pass) { showToast('Name, email and password required', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

  const btn = document.querySelector('#registerFormWrap .btn-grad');
  if (btn) { btn.textContent = 'Creating…'; btn.disabled = true; }

  const result = await tryAPI(() => api.register({ name, email, password: pass, phone, city, role: isSeller ? 'seller' : 'customer' }));

  if (btn) { btn.innerHTML = 'Create Account &#8594;'; btn.disabled = false; }
  if (result?.token) loginSuccess(result.user);
}

async function doLogout() {
  api.logout();
  currentUser = null;
  localStorage.removeItem('hb_session');
  updateHeaderAuth();
  showToast('Logged out successfully', 'info');
  renderAccountPage();
}

async function saveProfile() {
  if (!currentUser) return;
  const name  = (document.getElementById('profName')  || {}).value?.trim();
  const phone = (document.getElementById('profPhone') || {}).value?.trim();
  const city  = (document.getElementById('profCity')  || {}).value?.trim();

  const result = await tryAPI(
    () => api.updateProfile({ name, phone, city }),
    () => { /* local fallback */ if (name) currentUser.name = name; currentUser.phone = phone; currentUser.city = city; return { user: currentUser }; }
  );
  if (result) {
    currentUser = { ...currentUser, ...(result.user || {}) };
    localStorage.setItem('hb_session', JSON.stringify(currentUser));
    updateHeaderAuth();
    ss('accNameEl', currentUser.name, false);
    showToast('Profile updated!', 'success');
  }
}

/* ─── ADDRESS ─────────────────────────────────────────────────── */
async function addAddress() {
  if (!currentUser) return;
  const name    = (document.getElementById('addrName') || {}).value?.trim();
  const phone   = (document.getElementById('addrPhone')|| {}).value?.trim();
  const line1   = (document.getElementById('addrLine1')|| {}).value?.trim();
  const city    = (document.getElementById('addrCity') || {}).value?.trim();
  const state   = (document.getElementById('addrState')|| {}).value?.trim();
  const pin     = (document.getElementById('addrPin')  || {}).value?.trim();
  const isDef   = (document.getElementById('ckAddrDefault') || {}).checked;

  if (!name || !line1 || !city || !pin) { showToast('Please fill all required fields', 'error'); return; }
  if (!/^\d{6}$/.test(pin)) { showToast('Enter a valid 6-digit pincode', 'error'); return; }

  const result = await tryAPI(
    () => api.addAddress({ name, phone, line1, city, state, pincode: pin, isDefault: isDef }),
    () => {
      if (isDef) ADDRESSES_DB.forEach(a => { if (a.userId === currentUser.id) a.isDefault = false; });
      const addr = { id:'addr_'+Date.now(), userId: currentUser.id, name, phone, line1, city, state, pincode: pin, isDefault: isDef };
      ADDRESSES_DB.push(addr);
      saveReturnsDB();
      return { address: addr };
    }
  );
  if (result) {
    const addr = result.address;
    // Ensure local ADDRESSES_DB is in sync
    if (!ADDRESSES_DB.find(a => a.id === addr.id)) {
      ADDRESSES_DB.push({ ...addr, userId: currentUser.id });
    }
    showToast('Address saved!', 'success');
    setAccSection('addresses');
  }
}

async function saveNewAddrAndContinue() {
  if (!currentUser) return;
  const name  = (document.getElementById('ckAddrName')  || {}).value?.trim();
  const phone = (document.getElementById('ckAddrPhone') || {}).value?.trim();
  const line1 = (document.getElementById('ckAddrLine1') || {}).value?.trim();
  const line2 = (document.getElementById('ckAddrLine2') || {}).value?.trim();
  const city  = (document.getElementById('ckAddrCity')  || {}).value?.trim();
  const state = (document.getElementById('ckAddrState') || {}).value?.trim();
  const pin   = (document.getElementById('ckAddrPin')   || {}).value?.trim();
  const isDef = (document.getElementById('ckAddrDefault')|| {}).checked;

  if (!name || !phone || !line1 || !city || !pin) { showToast('Please fill all required fields', 'error'); return; }
  if (!/^\d{6}$/.test(pin)) { showToast('Enter a valid 6-digit pincode', 'error'); return; }

  const result = await tryAPI(
    () => api.addAddress({ name, phone, line1, line2, city, state, pincode: pin, isDefault: isDef }),
    () => {
      if (isDef) ADDRESSES_DB.forEach(a => { if (a.userId === currentUser.id) a.isDefault = false; });
      const addr = { id:'addr_'+Date.now(), userId: currentUser.id, name, phone, line1, line2, city, state, pincode: pin, isDefault: isDef };
      ADDRESSES_DB.push(addr);
      saveReturnsDB();
      return { address: addr };
    }
  );
  if (result) {
    const addr = result.address;
    if (!ADDRESSES_DB.find(a => a.id === addr.id)) ADDRESSES_DB.push({ ...addr, userId: currentUser.id });
    checkoutAddrId = addr.id;
    showAddNewAddr = false;
    goToPayment();
  }
}

/* ─── SEARCH ──────────────────────────────────────────────────── */
async function doSearch() {
  const q = (document.getElementById('searchInpEl') || {}).value?.trim();
  if (!q) return;
  showPage('categories');
  catTabActive = 'all';

  const result = await tryAPI(
    async () => { const d = await api.getProducts({ search: q }); return d.products || []; },
    () => Object.values(PRODUCTS).filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.brand||'').toLowerCase().includes(q.toLowerCase()) ||
      (p.category||p.cat||'').toLowerCase().includes(q.toLowerCase())
    )
  );

  if (result !== null) {
    renderGrid('catProductsEl', result);
    ss('prodCountEl', result.length + ' results for "' + q + '"', false);
    ss('showingEl', 'Search results', false);
  }
}

/* ─── CATEGORIES PAGE ─────────────────────────────────────────── */
async function renderCatProducts() {
  const priceFilter = (document.querySelector('input[name="price"]:checked') || {}).value || '';
  const sortVal     = (document.getElementById('sortSelectEl') || {}).value || '';
  const ecoOnly     = (document.getElementById('ecoCheckEl')   || {}).checked;

  const params = { limit: 60 };
  if (catTabActive && catTabActive !== 'all') params.category = catTabActive;
  if (ecoOnly) params.eco = 'true';
  if (sortVal) params.sort = sortVal;

  const result = await tryAPI(
    async () => {
      const d = await api.getProducts(params);
      let products = d.products || [];
      if (priceFilter) {
        const [min, max] = priceFilter.split('-');
        products = products.filter(p =>
          p.price >= parseInt(min) && (max === '+' ? true : p.price <= parseInt(max))
        );
      }
      return products;
    },
    () => {
      let filtered = Object.values(PRODUCTS).filter(p => {
        if (catTabActive && catTabActive !== 'all' && (p.cat || p.category) !== catTabActive) return false;
        if (ecoOnly && !p.eco) return false;
        if (priceFilter) {
          const [mn, mx] = priceFilter.split('-');
          if (p.price < parseInt(mn) || (mx !== '+' && p.price > parseInt(mx))) return false;
        }
        return true;
      });
      if (sortVal === 'price_asc')  filtered.sort((a,b) => a.price - b.price);
      else if (sortVal === 'price_desc') filtered.sort((a,b) => b.price - a.price);
      else if (sortVal === 'rating')     filtered.sort((a,b) => (b.rating||0) - (a.rating||0));
      else filtered.sort((a,b) => (b.reviews||b.reviewCount||0) - (a.reviews||a.reviewCount||0));
      return filtered;
    }
  );

  if (result !== null) {
    ss('showingEl', T.showingL || 'Showing products:', false);
    ss('prodCountEl', result.length + ' products', false);
    renderGrid('catProductsEl', result);
  }
}

/* ─── ORDERS ──────────────────────────────────────────────────── */
async function renderOrdersPage() {
  const el = document.getElementById('ordListEl');
  const te = document.getElementById('ordTabsEl');
  if (!el) return;
  if (!currentUser) { showPage('account'); return; }

  ss('ordTitleEl', 'My Orders', false);
  ss('ordBcEl', 'My Orders', false);

  const TABS = ['all','processing','confirmed','shipped','delivered','cancelled','returned'];
  if (te) {
    te.innerHTML = TABS.map(t =>
      '<button class="tab-btn' + (ordTabActive===t?' active':'') + '" onclick="switchOrdTab(\'' + t + '\')">' +
      t.charAt(0).toUpperCase() + t.slice(1) + '</button>'
    ).join('');
  }

  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3)">Loading orders…</div>';

  const orders = await tryAPI(
    async () => {
      const d = await api.getOrders(ordTabActive !== 'all' ? { status: ordTabActive } : {});
      return d.orders || [];
    },
    () => (ORDERS_DB||[]).filter(o =>
      o.userId === currentUser.id &&
      (ordTabActive === 'all' || o.status === ordTabActive)
    )
  );

  if (!orders || !orders.length) {
    el.innerHTML = '<div style="text-align:center;padding:48px;background:var(--bg3);border:1px solid var(--border);border-radius:14px">'
      + '<div style="font-size:3.5rem;margin-bottom:14px">&#128230;</div>'
      + '<h3 style="margin-bottom:8px">No orders found</h3>'
      + '<p style="color:var(--text2);margin-bottom:20px">Start shopping to see your orders here!</p>'
      + '<button class="btn-grad" style="padding:12px 24px;font-size:14px" onclick="showPage(\'categories\')">Shop Now &#8594;</button>'
      + '</div>';
    return;
  }

  el.innerHTML = orders.map(o => buildOrderCard(o)).join('');
}

function buildOrderCard(o) {
  const disc = (o.discount||0) + (o.couponDiscount||o.couponD||0);
  const addr = o.address ? (typeof o.address === 'object'
    ? (o.address.city + ' — ' + o.address.pincode)
    : String(o.address).substring(0,40)) : '';

  return '<div class="ord-card">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:14px">'
    + '<div><div style="font-weight:700;font-size:15px">Order #' + (o.orderId||o.id) + '</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:2px">'
    + (o.createdAt||o.date||'').toString().substring(0,10)
    + (o.paymentMethod ? ' &bull; ' + o.paymentMethod : '') + '</div></div>'
    + '<span class="chip chip-' + o.status + '">' + (o.status||'').toUpperCase() + '</span>'
    + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px">'
    + (o.items||[]).map(function(it) {
        return '<div class="ord-item-row">'
          + '<span class="ord-item-icon">' + (it.icon||'&#128230;') + '</span>'
          + '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + (it.name||'') + '</div>'
          + '<div style="font-size:11px;color:var(--text3)">Qty: ' + (it.qty||it.quantity||1) + (it.size?' &bull; '+it.size:'') + '</div></div>'
          + '<div style="font-weight:700">&#8377;' + ((it.price||0)*(it.qty||it.quantity||1)).toLocaleString('en-IN') + '</div>'
          + '</div>';
      }).join('')
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border);flex-wrap:wrap;gap:8px">'
    + '<div style="font-size:13px;color:var(--text2)">&#128205; ' + addr
    + (disc>0 ? ' &nbsp;&bull;&nbsp; <span style="color:var(--green);font-weight:600">Saved &#8377;' + disc.toLocaleString('en-IN') + '</span>' : '')
    + '</div>'
    + '<div style="font-weight:900;font-size:1.1rem">&#8377;' + (o.total||0).toLocaleString('en-IN') + '</div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'
    + (o.status==='delivered' ? '<button class="btn-ghost" style="padding:8px 14px;font-size:12px;border-radius:7px" onclick="openReturnModal(\'' + (o.orderId||o.id) + '\')">&#128260; Return / Refund</button>' : '')
    + (o.status==='processing'? '<button class="btn-danger" style="padding:8px 14px;font-size:12px;border-radius:7px" onclick="cancelOrder(\'' + (o.orderId||o.id) + '\')">Cancel Order</button>' : '')
    + '<button class="btn-ghost" style="padding:8px 14px;font-size:12px;border-radius:7px" onclick="showToast(\'Tracking: ' + (o.trackingId||'Updated when shipped') + '\',\'info\')">&#128666; Track</button>'
    + '<button class="btn-ghost" style="padding:8px 14px;font-size:12px;border-radius:7px" onclick="reorderItems(\'' + (o.orderId||o.id) + '\')">&#128257; Reorder</button>'
    + '</div>'
    + '</div>';
}

function switchOrdTab(t) { ordTabActive = t; renderOrdersPage(); }

async function cancelOrder(ordId) {
  const ord = (ORDERS_DB||[]).find(o => o.orderId===ordId||o.id===ordId);
  if (!confirm('Cancel order #' + ordId + '?')) return;

  await tryAPI(
    () => api.cancelOrder(ordId, 'Customer request'),
    () => { if (ord) { ord.status='cancelled'; } return ord; }
  );
  showToast('Order cancelled. Refund in 3–5 days.', 'info');
  renderOrdersPage();
}

async function reorderItems(ordId) {
  const ord = (ORDERS_DB||[]).find(o => o.orderId===ordId||o.id===ordId);
  if (!ord) { showToast('Order not found', 'error'); return; }
  (ord.items||[]).forEach(it => addToCart(it.productId, it.size));
  openCart();
}

/* ─── RETURNS ─────────────────────────────────────────────────── */
async function submitReturn() {
  if (!currentUser || !returnModal_orderId) return;
  const ord = (ORDERS_DB||[]).find(o => o.orderId===returnModal_orderId||o.id===returnModal_orderId);
  if (!ord) return;

  const reason  = (document.getElementById('retReason')    || {}).value || 'other';
  const cond    = (document.getElementById('retCondition')  || {}).value || 'Used';
  const checked = Array.from(document.querySelectorAll('input[name="retItem"]:checked'));
  const selItems= checked.length ? checked.map(el => ord.items[parseInt(el.value)]).filter(Boolean) : ord.items;
  if (!selItems.length) { showToast('Select at least one item to return', 'error'); return; }

  const reasonMap = {size:'Wrong size',quality:'Quality issue',wrong:'Wrong product',damaged:'Arrived damaged',mind:'Changed mind',other:'Other'};

  const result = await tryAPI(
    () => api.initiateReturn({
      orderId:   returnModal_orderId,
      items:     checked.map(el => parseInt(el.value)),
      reason:    reasonMap[reason] || reason,
      condition: cond
    }),
    () => {
      const refundAmt = selItems.reduce((s,it) => s + (it.price||0)*(it.qty||it.quantity||1), 0);
      const d = new Date(); d.setDate(d.getDate()+1);
      const pickupDate = d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
      const ret = {
        id:'RET'+Date.now(), returnId:'RET'+Date.now(),
        userId: currentUser.id, orderId: returnModal_orderId,
        productName: selItems.map(i=>i.name).join(', '),
        reason: reasonMap[reason]||reason, condition: cond,
        refundAmount: refundAmt, refundAmt,
        pickupDate, status:'initiated',
        createdAt: new Date().toLocaleDateString('en-IN'),
        ts: Date.now()
      };
      if (RETURNS_DB) RETURNS_DB.push(ret);
      if (ord) ord.status = 'returned';
      if (typeof saveReturnsDB==='function') saveReturnsDB();
      return { return: ret };
    }
  );

  if (result) {
    const ret = result.return || result;
    closeReturnModal();
    showToast('Return initiated! Pickup on ' + (ret.pickupDate||'within 24 hours') + '. Refund &#8377;' + (ret.refundAmount||ret.refundAmt||0).toLocaleString('en-IN'), 'success');
    if (typeof addNotification==='function') {
      addNotification('return','Return Initiated &#128260;',
        'Return for "' + (ret.productName||'') + '" initiated. Refund &#8377;' + (ret.refundAmount||0).toLocaleString('en-IN') + ' after pickup.',
        ['wa','push'], { retId: ret.returnId||ret.id, emailHtml:true });
    }
    renderOrdersPage();
  }
}

/* ─── CHECKOUT / PLACE ORDER ──────────────────────────────────── */
async function placeOrderFinal() {
  if (!currentUser) return;
  if (!checkoutAddrId) { showToast('Please select a delivery address', 'error'); goToStep(1); return; }
  const tc = document.getElementById('tcCheck');
  if (tc && !tc.checked) { showToast('Please accept the Terms & Conditions', 'error'); return; }

  const btn   = document.getElementById('placeOrderBtn');
  const total = cartTotal() + (checkoutGiftWrap ? 49 : 0);
  if (btn) { btn.disabled=true; btn.innerHTML='&#9203; Placing Order…'; btn.style.opacity='.7'; }

  const payload = {
    items:         cartItems.map(ci => ({ productId: ci.productId, qty: ci.qty, size: ci.size })),
    addressId:     checkoutAddrId,
    paymentMethod: checkoutPayment || 'COD',
    couponCode:    appliedCoupon ? appliedCoupon.code : null,
    note:          checkoutNote || '',
    giftWrap:      checkoutGiftWrap || false,
  };

  const result = await tryAPI(
    () => api.placeOrder(payload),
    () => {
      // Full local fallback (existing logic)
      const addr = (ADDRESSES_DB||[]).find(a=>a.id===checkoutAddrId);
      const newOrder = {
        id:'ORD'+Date.now(), orderId:'ORD'+Date.now(),
        userId: currentUser.id,
        items: cartItems.map(ci => { const p=PRODUCTS[ci.productId]; return {productId:ci.productId,name:p?p.name:'',icon:p?p.icon:'&#128230;',price:p?p.price:0,qty:ci.qty,quantity:ci.qty,size:ci.size||null}; }),
        address: addr || {},
        subtotal:cartSubtotal(), discount:cartDiscount(),
        couponDiscount:couponDiscount(), deliveryFee:deliveryFee(),
        giftWrap:checkoutGiftWrap?49:0, total,
        status:'processing', paymentMethod:checkoutPayment||'COD', paymentStatus:'pending',
        note:checkoutNote||'', estimatedDelivery:getEstimatedDelivery(),
        createdAt:new Date().toISOString()
      };
      if (ORDERS_DB) ORDERS_DB.unshift(newOrder);
      return { order: newOrder };
    }
  );

  if (result) {
    const order = result.order || result;
    cartItems=[]; appliedCoupon=null; saveCartState(); updateCartBadge(false);
    checkoutGiftWrap=false; checkoutNote='';
    lastPlacedOrder = order;
    if (typeof addNotification==='function') {
      setTimeout(function() {
        addNotification('order','Order Confirmed! &#127881;',
          'Order #'+(order.orderId||order.id)+' for &#8377;'+total.toLocaleString('en-IN')+' confirmed. Delivery by '+(order.estimatedDelivery||'3-5 days')+'.',
          ['wa','email','push'], {orderId:order.orderId||order.id, order, emailHtml:true,
          waMsg:'*Hubooze* &#128722;\n\n*Order Confirmed!* &#127881;\n\nOrder: *#'+(order.orderId||order.id)+'*\nAmount: &#8377;'+total.toLocaleString('en-IN')+'\n\n_Reply ORDER for tracking_'});
      }, 1500);
    }
    renderOrderConfirmation(order);
    window.scrollTo(0,0);
  } else {
    if (btn) { btn.disabled=false; btn.innerHTML='&#128722; Place Order &#8212; &#8377;'+total.toLocaleString('en-IN'); btn.style.opacity='1'; }
  }
}

/* ─── COUPON VALIDATION ───────────────────────────────────────── */
async function applyCoupon() {
  const inp = document.getElementById('couponInput');
  if (!inp) return;
  const code = inp.value.trim().toUpperCase();
  if (!code) { showToast('Please enter a coupon code', 'error'); return; }

  const result = await tryAPI(
    () => api.validateCoupon(code, cartSubtotal()),
    () => {
      const COUPONS_LOCAL = { SAVE10:{type:'percent',value:10,min:0}, FLAT50:{type:'flat',value:50,min:299}, ECO20:{type:'percent',value:20,min:0}, FIRST:{type:'percent',value:15,min:0}, HUBOOZE:{type:'flat',value:100,min:499} };
      const c = COUPONS_LOCAL[code];
      if (!c) return null;
      if (c.min && cartSubtotal() < c.min) { showToast('Minimum order &#8377;'+c.min+' required', 'error'); return null; }
      const discount = c.type==='flat' ? c.value : Math.round(cartSubtotal()*c.value/100);
      return { valid:true, discount, coupon:{code,...c} };
    }
  );

  if (!result) { showToast('Invalid coupon code', 'error'); inp.style.borderColor='var(--red)'; setTimeout(()=>inp.style.borderColor='',2000); return; }
  if (!result.valid) { showToast(result.error||'Invalid coupon', 'error'); return; }

  appliedCoupon = { code, ...result.coupon };
  saveCartState();
  inp.value = '';
  const appliedEl   = document.getElementById('couponApplied');
  const appliedText = document.getElementById('couponAppliedText');
  if (appliedEl)   appliedEl.style.display   = 'flex';
  if (appliedText) appliedText.innerHTML = code + ' applied — saving &#8377;' + result.discount.toLocaleString('en-IN') + ' &#10003;';
  renderCartSummary();
  showToast('Coupon "' + code + '" applied! Saving &#8377;' + result.discount.toLocaleString('en-IN'), 'success');
}

/* ─── SELLER PANEL ────────────────────────────────────────────── */
async function renderSellerPage() {
  const el = document.getElementById('sellerContentEl');
  if (!el) return;
  if (!currentUser) { el.innerHTML = sellerGate('&#129489;','Login Required','Login as a seller to access your dashboard.','Login / Register',"showPage('account')"); return; }
  if (currentUser.role!=='seller' && currentUser.role!=='admin') {
    el.innerHTML = sellerGate('&#129489;','Seller Account Required','Your account role is <strong>'+currentUser.role+'</strong>.<br>Use: <code style="background:var(--bg4);padding:3px 8px;border-radius:4px">amit@demo.com / demo123</code>','Switch Account',"showPage('account')");
    return;
  }

  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3)">Loading dashboard…</div>';

  const data = await tryAPI(
    () => api.getSellerDashboard(),
    () => {
      const myProds  = Object.values(PRODUCTS||{}).filter(p=>p.sellerId===currentUser.id);
      const myIds    = myProds.map(p=>p.id);
      const myOrders = (ORDERS_DB||[]).filter(o=>o.items&&o.items.some(it=>myIds.includes(it.productId)));
      const totalRev = myOrders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
      return { stats:{totalProducts:myProds.length,totalOrders:myOrders.length,pendingOrders:myOrders.filter(o=>o.status==='processing').length,totalRevenue:totalRev,netPayout:Math.round(totalRev*.9),totalReturns:0}, recentOrders:myOrders.slice(0,5), topProducts:myProds.slice(0,5) };
    }
  );

  if (!data) return;
  const s = data.stats || {};

  const statsHtml = '<div class="sel-stat-grid">'
    + selStat(s.totalProducts||0,'Products','var(--green)','&#128230;')
    + selStat(s.totalOrders||0,'Total Orders','var(--blue)','&#128233;')
    + selStat(s.pendingOrders||0,'Pending','var(--yellow)','&#9203;')
    + selStat('&#8377;'+(s.totalRevenue||0).toLocaleString('en-IN'),'Revenue','var(--green)','&#128176;')
    + selStat('&#8377;'+(s.netPayout||0).toLocaleString('en-IN'),'Net Payout','var(--blue)','&#128184;')
    + selStat(s.totalReturns||0,'Returns','var(--red)','&#128260;')
    + '</div>';

  const tabs = [{id:'overview',label:'&#128200; Overview'},{id:'products',label:'&#128230; Products'},{id:'orders',label:'&#128233; Orders'},{id:'returns',label:'&#128260; Returns'},{id:'add_product',label:'&#10133; Add Product'},{id:'payouts',label:'&#128184; Payouts'}];
  const tabsHtml = '<div class="sel-tabs">' + tabs.map(t=>'<button class="sel-tab'+(sellerTabActive===t.id?' active':'')+'" onclick="switchSelTab(\''+t.id+'\')">'+t.label+'</button>').join('') + '</div>';

  el.innerHTML = statsHtml + tabsHtml + '<div id="selTabContent"></div>';
  renderSellerTabFromData(data);
}

async function renderSellerTabFromData(cachedData) {
  const el = document.getElementById('selTabContent');
  if (!el) return;

  if (sellerTabActive === 'overview') {
    const recentOrders = cachedData?.recentOrders || [];
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
      + '<h4 style="font-weight:700;font-size:14px;margin-bottom:16px;color:var(--text2)">&#128233; Recent Orders</h4>'
      + (recentOrders.length ? recentOrders.map(o =>
          '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">'
          + '<div style="flex:1"><div style="font-weight:600;font-size:13px">#'+(o.orderId||o.id)+'</div>'
          + '<div style="font-size:11px;color:var(--text3)">'+(o.createdAt||o.date||'').toString().substring(0,10)+' &bull; '+(o.items||[]).length+' item(s)</div></div>'
          + '<span class="chip chip-'+o.status+'">'+o.status+'</span>'
          + '<span style="font-weight:800">&#8377;'+(o.total||0).toLocaleString('en-IN')+'</span>'
          + '<select onchange="updateOrderStatus(\''+( o.orderId||o.id)+'\',this.value)" style="font-size:11px;background:var(--bg4);border:1px solid var(--border2);color:var(--text);border-radius:6px;padding:4px 6px;font-family:inherit;cursor:pointer">'
          + ['processing','confirmed','shipped','delivered'].map(s=>'<option value="'+s+'"'+(o.status===s?' selected':'')+'>'+s+'</option>').join('')
          + '</select></div>'
        ).join('') : '<p style="color:var(--text3);font-size:13px">No orders yet.</p>')
      + '</div>';

  } else if (sellerTabActive === 'products') {
    const prods = await tryAPI(
      async () => { const d = await api.getSellerProducts(); return d.products||[]; },
      () => Object.values(PRODUCTS||{}).filter(p=>p.sellerId===currentUser.id)
    ) || [];
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">'
      + '<h4 style="font-weight:700;font-size:15px">My Products ('+prods.length+')</h4>'
      + '<button class="btn-grad" style="padding:9px 18px;font-size:13px;border-radius:8px" onclick="switchSelTab(\'add_product\')">&#10133; Add Product</button>'
      + '</div>'
      + (prods.length ? prods.map(p => sellerProductRow(p)).join('') : '<p style="color:var(--text3)">No products yet. Add your first product!</p>')
      + '</div>';

  } else if (sellerTabActive === 'orders') {
    const orders = await tryAPI(
      async () => { const d = await api.getSellerOrders(); return d.orders||[]; },
      () => {
        const myIds = Object.values(PRODUCTS||{}).filter(p=>p.sellerId===currentUser.id).map(p=>p.id);
        return (ORDERS_DB||[]).filter(o=>o.items&&o.items.some(it=>myIds.includes(it.productId)));
      }
    ) || [];
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
      + '<h4 style="font-weight:700;font-size:15px;margin-bottom:18px">All Orders ('+orders.length+')</h4>'
      + (orders.length ? orders.map(o => sellerOrderCard(o)).join('') : '<p style="color:var(--text3)">No orders yet.</p>')
      + '</div>';

  } else if (sellerTabActive === 'returns') {
    const returns = await tryAPI(
      async () => { const d = await api.getAllReturns(); return d.returns||[]; },
      () => (RETURNS_DB||[])
    ) || [];
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
      + '<h4 style="font-weight:700;font-size:15px;margin-bottom:18px">Return Requests ('+returns.length+')</h4>'
      + (returns.length ? returns.map(r => sellerReturnCard(r)).join('') : '<p style="color:var(--text3)">No returns yet. Great job!</p>')
      + '</div>';

  } else if (sellerTabActive === 'payouts') {
    const payouts = await tryAPI(
      () => api.getSellerPayouts(),
      () => { const rev=(cachedData?.stats?.totalRevenue||0); return {totalRevenue:rev,platformFee:Math.round(rev*.1),netPayout:Math.round(rev*.9),paidOut:Math.round(rev*.54),pending:Math.round(rev*.36)}; }
    ) || {};
    el.innerHTML = renderPayoutsTab(payouts);

  } else if (sellerTabActive === 'add_product') {
    renderSelAddProduct(el);
  }
}

function switchSelTab(t) { sellerTabActive = t; renderSellerPage(); }

async function saveSellerProduct() {
  if (!currentUser) return;
  const name   = (document.getElementById('np_name')  ||{}).value?.trim();
  const brand  = (document.getElementById('np_brand') ||{}).value?.trim();
  const price  = parseInt((document.getElementById('np_price') ||{}).value||0);
  const orig   = parseInt((document.getElementById('np_orig')  ||{}).value||0);
  const stock  = parseInt((document.getElementById('np_stock') ||{}).value||0);
  const cat    = (document.getElementById('np_cat')   ||{}).value||'fashion';
  const icon   = (document.getElementById('np_icon')  ||{}).value||'&#128230;';
  const desc   = (document.getElementById('np_desc')  ||{}).value?.trim()||'';
  const sizes  = ((document.getElementById('np_sizes')||{}).value||'').split(',').map(s=>s.trim()).filter(Boolean);
  const badge  = (document.getElementById('np_badge') ||{}).value||null;
  const eco    = (document.getElementById('np_eco')   ||{}).checked;
  const listed = (document.getElementById('np_listed')||{checked:true}).checked;

  if (!name || !brand) { showToast('Product name and brand are required','error'); return; }
  if (!price||price<=0) { showToast('Please enter a valid selling price','error'); return; }
  if (!orig||orig<=0)   { showToast('Please enter a valid MRP','error'); return; }
  if (price>=orig)      { showToast('Selling price must be less than MRP','error'); return; }

  const productData = { name, brand, category:cat, price, originalPrice:orig, stock, icon, description:desc, sizes, badge:badge||null, eco, listed };

  const result = await tryAPI(
    () => sellerEditProductId ? api.updateProduct(sellerEditProductId, productData) : api.createProduct(productData),
    () => {
      const newProd = { id:'sp_'+Date.now(), ...productData, cat, orig:orig, sellerId:currentUser.id, active:true, rating:0, reviews:0 };
      PRODUCTS[newProd.id] = newProd;
      sellerEditProductId = null;
      return { product: newProd };
    }
  );

  if (result) {
    showToast((sellerEditProductId ? 'Product updated' : '"'+name+'" listed') + ' successfully! &#127881;','success');
    sellerEditProductId = null;
    switchSelTab('products');
  }
}

async function updateOrderStatus(ordId, status) {
  await tryAPI(
    () => api.updateOrderStatus(ordId, { status }),
    () => { const o=(ORDERS_DB||[]).find(o=>o.orderId===ordId||o.id===ordId); if(o) o.status=status; }
  );
  showToast('Order #'+ordId+' updated to '+status,'success');
}

async function approveReturn(retId) {
  const result = await tryAPI(
    () => api.approveReturn(retId),
    () => { const r=(RETURNS_DB||[]).find(r=>r.returnId===retId||r.id===retId); if(r){r.status='approved';r.resolvedAt=new Date().toLocaleDateString('en-IN');} if(typeof saveReturnsDB==='function')saveReturnsDB(); return r; }
  );
  showToast('Return approved. Refund processed!','success');
  renderSellerPage();
}

async function rejectReturn(retId) {
  if (!confirm('Reject this return request?')) return;
  await tryAPI(
    () => api.rejectReturn(retId,'Quality check failed'),
    () => { const r=(RETURNS_DB||[]).find(r=>r.returnId===retId||r.id===retId); if(r){r.status='rejected';r.resolvedAt=new Date().toLocaleDateString('en-IN');} if(typeof saveReturnsDB==='function')saveReturnsDB(); }
  );
  showToast('Return rejected','info');
  renderSellerPage();
}

function renderPayoutsTab(p) {
  return '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">'
    + '<div class="sel-stat"><div class="sv" style="color:var(--green)">&#8377;'+(p.netPayout||0).toLocaleString('en-IN')+'</div><div class="sl">Net Earnings</div></div>'
    + '<div class="sel-stat"><div class="sv" style="color:var(--blue)">&#8377;'+(p.paidOut||0).toLocaleString('en-IN')+'</div><div class="sl">Paid Out</div></div>'
    + '<div class="sel-stat"><div class="sv" style="color:var(--yellow)">&#8377;'+(p.pending||0).toLocaleString('en-IN')+'</div><div class="sl">Pending</div></div>'
    + '</div>'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
    + '<h4 style="font-weight:700;margin-bottom:8px">Payment Schedule</h4>'
    + '<p style="font-size:13px;color:var(--text2)">Payouts every <strong style="color:var(--green)">7 days</strong> on Monday. Platform fee: <strong style="color:var(--red)">10%</strong></p>'
    + '<div style="background:var(--bg4);border:1px solid rgba(0,255,143,.2);border-radius:10px;padding:16px;margin-top:14px">'
    + '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">Next payout date</div>'
    + '<div style="font-weight:800;font-size:1.1rem;color:var(--green)">'+(p.nextPayoutDate||'Next Monday')+'</div>'
    + '<div style="font-size:13px;color:var(--text2);margin-top:4px">Estimated: <strong>&#8377;'+(p.pending||0).toLocaleString('en-IN')+'</strong></div>'
    + '</div></div>';
}

/* ─── ADMIN PANEL ─────────────────────────────────────────────── */
async function renderAdminPanel() {
  const el = document.getElementById('adminContentEl');
  if (!el) return;
  if (!currentUser) { el.innerHTML = adminGate('&#9878;','Admin Access Required','Please login with admin credentials.','Login',"showPage('account')"); return; }
  if (currentUser.role !== 'admin') { el.innerHTML = adminGate('&#128683;','Access Denied','Admin only. Use: <code>admin@hubooze.in / admin123</code>','Switch Account',"showPage('account')"); return; }

  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3)">Loading admin data…</div>';

  const stats = await tryAPI(
    () => api.getAdminStats(),
    () => computeAdminStats()
  ) || {};

  const statsHtml = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">'
    + adminStat('&#128233;', stats.totalOrders||0,     'Total Orders',   'var(--blue)')
    + adminStat('&#8377;',   (stats.totalRevenue||0).toLocaleString('en-IN'), 'Revenue', 'var(--green)')
    + adminStat('&#128100;', stats.totalUsers||0,      'Users',          'var(--yellow)')
    + adminStat('&#128260;', stats.totalReturns||0,    'Returns',        'var(--red)')
    + '</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px">'
    + adminStat('&#129489;', stats.totalSellers||0,    'Sellers',        'var(--orange)')
    + adminStat('&#128230;', stats.totalProducts||0,   'Products',       'var(--blue)')
    + adminStat('&#9851;',   stats.ecoProducts||0,     'Eco Products',   'var(--green)')
    + adminStat('&#127881;', stats.deliveredOrders||0, 'Delivered',      'var(--green)')
    + '</div>';

  const tabs = [{id:'overview',label:'&#128200; Overview'},{id:'users',label:'&#128100; Users'},{id:'orders',label:'&#128233; Orders'},{id:'products',label:'&#128230; Products'},{id:'returns',label:'&#128260; Returns'},{id:'analytics',label:'&#128202; Analytics'},{id:'settings',label:'&#9881; Settings'}];
  const tabsHtml = '<div class="sel-tabs" style="flex-wrap:wrap;margin-bottom:20px">' + tabs.map(t=>'<button class="sel-tab'+(adminTabActive===t.id?' active':'')+'" onclick="switchAdminTab(\''+t.id+'\')">'+t.label+'</button>').join('') + '</div>';

  el.innerHTML = statsHtml + tabsHtml + '<div id="adminTabContent"></div>';
  renderAdminTabContent(stats);
}

async function renderAdminTabContent(stats) {
  const el = document.getElementById('adminTabContent');
  if (!el) return;

  if (adminTabActive === 'overview') {
    renderAdminOverview(stats, el);

  } else if (adminTabActive === 'users') {
    const data = await tryAPI(
      () => api.getAdminUsers(),
      () => { const allU=Object.values({...(typeof DEMO_USERS!=='undefined'?DEMO_USERS:{}), ...(registeredUsers||{})}); return {users:allU.map(u=>{const{password:_,...s}=u;return s;})}; }
    ) || {users:[]};
    renderAdminUsers(data.users||[], el);

  } else if (adminTabActive === 'orders') {
    const data = await tryAPI(
      () => api.getAllOrders(),
      () => ({orders: ORDERS_DB||[]})
    ) || {orders:[]};
    renderAdminOrders_fromData(data.orders||[], el);

  } else if (adminTabActive === 'products') {
    renderAdminProducts(el);

  } else if (adminTabActive === 'returns') {
    const data = await tryAPI(
      () => api.getAllReturns(),
      () => ({returns: RETURNS_DB||[]})
    ) || {returns:[]};
    renderAdminReturns_fromData(data.returns||[], el);

  } else if (adminTabActive === 'analytics') {
    const data = await tryAPI(
      () => api.getAnalytics(),
      () => ({categoryRevenue:{}, topProducts: Object.values(PRODUCTS||{}).sort((a,b)=>(b.reviews||0)-(a.reviews||0)).slice(0,10)})
    ) || {};
    renderAdminAnalytics(stats, el);

  } else if (adminTabActive === 'settings') {
    renderAdminSettings(el);
  }
}

function switchAdminTab(t) { adminTabActive = t; renderAdminPanel(); }

async function adminToggleRole(email) {
  const allUsers = Object.values({...(typeof DEMO_USERS!=='undefined'?DEMO_USERS:{}), ...(registeredUsers||{})});
  const user = allUsers.find(u=>u.email===email);
  if (!user) return;
  const newRole = user.role==='seller' ? 'customer' : 'seller';
  if (!confirm('Change '+user.name+'\'s role to '+newRole+'?')) return;

  await tryAPI(
    () => api.updateUserRole(user.id||user._id, newRole),
    () => { user.role=newRole; if(registeredUsers&&registeredUsers[email]) registeredUsers[email].role=newRole; if(typeof saveUsers==='function') saveUsers(); }
  );
  showToast(user.name+' is now a '+newRole,'success');
  renderAdminPanel();
}

async function adminToggleProduct(pid) {
  const p = (PRODUCTS||{})[pid];
  if (!p) return;
  await tryAPI(
    () => api.toggleProduct(pid),
    () => { p.active = !p.active; }
  );
  showToast('"'+p.name+'" '+(p.active!==false?'activated':'deactivated'),'info');
  renderAdminPanel();
}

async function adminApproveReturn(retId) {
  await tryAPI(
    () => api.approveReturn(retId),
    () => { const r=(RETURNS_DB||[]).find(r=>r.returnId===retId||r.id===retId); if(r){r.status='approved';r.resolvedAt=new Date().toLocaleDateString('en-IN');} if(typeof saveReturnsDB==='function')saveReturnsDB(); }
  );
  showToast('Return approved. Refund processed! &#10003;','success');
  renderAdminPanel();
}

async function adminRejectReturn(retId) {
  const ret = (RETURNS_DB||[]).find(r=>r.returnId===retId||r.id===retId);
  if (!confirm('Reject return'+(ret?' for "'+ret.productName+'"':'')+' ?')) return;
  await tryAPI(
    () => api.rejectReturn(retId,'Admin rejection'),
    () => { if(ret){ret.status='rejected';ret.resolvedAt=new Date().toLocaleDateString('en-IN');} if(typeof saveReturnsDB==='function')saveReturnsDB(); }
  );
  showToast('Return rejected','info');
  renderAdminPanel();
}

async function adminUpdateOrderStatus(ordId, status) {
  await tryAPI(
    () => api.updateOrderStatus(ordId, {status}),
    () => { const o=(ORDERS_DB||[]).find(o=>o.orderId===ordId||o.id===ordId); if(o) o.status=status; }
  );
  showToast('Order #'+ordId+' → '+status,'success');
  renderAdminPanel();
}

function renderAdminOrders_fromData(orders, el) {
  el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
    + '<h4 style="font-weight:700;font-size:15px;margin-bottom:18px">All Orders ('+orders.length+')</h4>'
    + orders.slice(0,20).map(o =>
        '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
        + '<div><div style="font-weight:700">#'+(o.orderId||o.id)+'</div>'
        + '<div style="font-size:12px;color:var(--text3)">'+(o.createdAt||o.date||'').toString().substring(0,10)+' &bull; '+(o.paymentMethod||'')+'</div></div>'
        + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
        + '<span class="chip chip-'+o.status+'">'+o.status+'</span>'
        + '<span style="font-weight:800">&#8377;'+(o.total||0).toLocaleString('en-IN')+'</span>'
        + '<select onchange="adminUpdateOrderStatus(\''+(o.orderId||o.id)+'\',this.value)" style="font-size:11px;background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:6px;padding:4px 6px;font-family:inherit;cursor:pointer">'
        + ['processing','confirmed','shipped','delivered','cancelled'].map(s=>'<option value="'+s+'"'+(o.status===s?' selected':'')+'>'+s+'</option>').join('')
        + '</select></div></div>'
      ).join('')
    + '</div>';
}

function renderAdminReturns_fromData(returns, el) {
  el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
    + '<h4 style="font-weight:700;font-size:15px;margin-bottom:18px">Return Requests ('+returns.length+')</h4>'
    + (returns.length ? returns.map(r => adminReturnCard(r)).join('')
       : '<div style="text-align:center;padding:32px;color:var(--text3)"><div style="font-size:3rem;margin-bottom:10px">&#128260;</div><p>No returns yet.</p></div>')
    + '</div>';
}

/* ─── NOTIFICATION PREFS SYNC ─────────────────────────────────── */
async function saveNotifPrefs() {
  localStorage.setItem('hb_notif_prefs', JSON.stringify(NOTIF_PREFS));
  if (currentUser) {
    await tryAPI(() => api.updateNotifPrefs(NOTIF_PREFS), null);
  }
}

console.log('✅ Hubooze app.js loaded — all pages API-connected with graceful fallback');
