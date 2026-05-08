/**
 * HUBOOZE app.js — Loaded AFTER index.html inline script
 * Cloudflare does NOT modify .js files, so login is safe here.
 * These functions override the ones inside index.html.
 */

// ── SHARED LOGIN HELPER ────────────────────────────────────────
function showLoginOverlay(msg) {
  var ov = document.getElementById('loginLoadingOverlay');
  var ms = document.getElementById('loginOverlayMsg');
  var sb = document.getElementById('loginOverlaySub');
  var br = document.getElementById('loginOverlayBar');
  if (ms) ms.textContent = msg || 'Signing you in...';
  if (sb) sb.textContent = 'Please wait a moment';
  if (br) br.style.width = '0%';
  if (ov) ov.className = 'login-overlay show';
  var pct = 0;
  var intv = setInterval(function() {
    pct = Math.min(pct + (pct < 30 ? 3 : pct < 70 ? 1 : 0.2), 90);
    if (br) br.style.width = pct + '%';
  }, 300);
  var wakeTimer = setTimeout(function() {
    if (ms) ms.textContent = 'Server is waking up...';
    if (sb) sb.innerHTML = 'Render free tier sleeps when idle.<br>Please wait 20\u201340 seconds.';
  }, 4000);
  return { intv: intv, wakeTimer: wakeTimer };
}

function hideLoginOverlay(timers) {
  if (timers) { clearInterval(timers.intv); clearTimeout(timers.wakeTimer); }
  var ov = document.getElementById('loginLoadingOverlay');
  var br = document.getElementById('loginOverlayBar');
  if (br) br.style.width = '100%';
  setTimeout(function() { if (ov) ov.className = 'login-overlay'; }, 500);
}

function callLoginAPI(email, password, role, callback) {
  var timers = showLoginOverlay('Signing in...');
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    hideLoginOverlay(timers);
    if (!res.ok) {
      showToast(res.data.error || 'Invalid email or password', 'error');
      return;
    }
    if (role && res.data.user.role !== role && !(role === 'seller' && res.data.user.role === 'admin')) {
      showToast('Wrong portal. This is a ' + res.data.user.role + ' account.', 'error');
      return;
    }
    if (res.data.token) {
      localStorage.setItem('hb_token', res.data.token);
      if (window.api) window.api.token = res.data.token;
    }
    loginSuccess(res.data.user);
    if (callback) callback(res.data.user);
  })
  .catch(function() {
    hideLoginOverlay(timers);
    showToast('Cannot reach server. Please try again.', 'error');
  });
}

// ── CUSTOMER LOGIN ─────────────────────────────────────────────
function doLogin() {
  var email = (document.getElementById('loginEmail') || { value: '' }).value.trim().toLowerCase();
  var pass  = (document.getElementById('loginPass')  || { value: '' }).value;
  if (!email || !pass) { showToast('Please enter email and password', 'error'); return; }
  callLoginAPI(email, pass, 'customer', null);
}

// ── SELLER LOGIN ───────────────────────────────────────────────
function doSellerLogin() {
  var email = (document.getElementById('sLoginEmail') || { value: '' }).value.trim().toLowerCase();
  var pass  = (document.getElementById('sLoginPass')  || { value: '' }).value;
  if (!email || !pass) { showToast('Please enter email and password', 'error'); return; }
  callLoginAPI(email, pass, 'seller', null);
}

// ── ADMIN LOGIN ────────────────────────────────────────────────
function doAdminLogin() {
  var email = (document.getElementById('aLoginEmail') || { value: '' }).value.trim().toLowerCase();
  var pass  = (document.getElementById('aLoginPass')  || { value: '' }).value;
  if (!email || !pass) { showToast('Please enter admin credentials', 'error'); return; }
  callLoginAPI(email, pass, 'admin', null);
}

// ── REGISTER ───────────────────────────────────────────────────
function doRegister() {
  var name   = (document.getElementById('regName')    || { value: '' }).value.trim();
  var email  = (document.getElementById('regEmail')   || { value: '' }).value.trim().toLowerCase();
  var pass   = (document.getElementById('regPass')    || { value: '' }).value;
  var phone  = (document.getElementById('regPhone')   || { value: '' }).value.trim();
  var city   = (document.getElementById('regCity')    || { value: '' }).value.trim();
  var isSelEl= document.getElementById('regIsSeller');
  var isSel  = isSelEl ? (isSelEl.checked || isSelEl.value === 'true') : false;

  if (!name || !email || !pass) { showToast('Name, email and password are required', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

  var timers = showLoginOverlay('Creating your account...');
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, email: email, password: pass, phone: phone, city: city, role: isSel ? 'seller' : 'customer' })
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    hideLoginOverlay(timers);
    if (!res.ok) { showToast(res.data.error || 'Registration failed', 'error'); return; }
    if (res.data.token) {
      localStorage.setItem('hb_token', res.data.token);
      if (window.api) window.api.token = res.data.token;
    }
    loginSuccess(res.data.user);
    showToast('Welcome to Hubooze, ' + res.data.user.name.split(' ')[0] + '!', 'success');
  })
  .catch(function() {
    hideLoginOverlay(timers);
    showToast('Cannot reach server. Please try again.', 'error');
  });
}

// ── SELLER REGISTER ────────────────────────────────────────────
function doSellerRegister() {
  var name     = (document.getElementById('sRegName')     || { value: '' }).value.trim();
  var business = (document.getElementById('sRegBusiness') || { value: '' }).value.trim();
  var email    = (document.getElementById('sRegEmail')    || { value: '' }).value.trim().toLowerCase();
  var pass     = (document.getElementById('sRegPass')     || { value: '' }).value;
  var phone    = (document.getElementById('sRegPhone')    || { value: '' }).value.trim();
  var city     = (document.getElementById('sRegCity')     || { value: '' }).value.trim();

  if (!name || !email || !pass) { showToast('Name, email and password are required', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

  var timers = showLoginOverlay('Creating seller account...');
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, email: email, password: pass, phone: phone, city: city, role: 'seller', businessName: business })
  })
  .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    hideLoginOverlay(timers);
    if (!res.ok) { showToast(res.data.error || 'Registration failed', 'error'); return; }
    if (res.data.token) {
      localStorage.setItem('hb_token', res.data.token);
      if (window.api) window.api.token = res.data.token;
    }
    loginSuccess(res.data.user);
    showToast('Seller account created! Welcome, ' + res.data.user.name.split(' ')[0] + '!', 'success');
  })
  .catch(function() {
    hideLoginOverlay(timers);
    showToast('Cannot reach server. Please try again.', 'error');
  });
}

// ── QUICK DEMO LOGIN ───────────────────────────────────────────
function quickLogin(type) {
  var map = {
    customer: { email: 'priya@demo.com',   password: 'demo123'  },
    seller:   { email: 'amit@demo.com',    password: 'demo123'  },
    admin:    { email: 'admin@hubooze.in', password: 'admin123' }
  };
  var c = map[type];
  if (!c) return;
  openPortal(type);
  setTimeout(function() {
    callLoginAPI(c.email, c.password, type, null);
  }, 150);
}

// ── LOGOUT ─────────────────────────────────────────────────────
function doLogout() {
  currentUser = null;
  localStorage.removeItem('hb_session');
  localStorage.removeItem('hb_token');
  if (window.api) window.api.token = null;
  updateHeaderAuth();
  if (typeof renderNav === 'function') renderNav();
  showToast('Logged out successfully', 'info');
  showPage('account');
}

// ── SEARCH ─────────────────────────────────────────────────────
async function doSearch() {
  var q = (document.getElementById('searchInpEl') || { value: '' }).value.trim();
  if (!q) return;
  showPage('categories');
  catTabActive = 'all';
  try {
    var res  = await fetch('/api/products?search=' + encodeURIComponent(q) + '&limit=60');
    var data = await res.json();
    renderGrid('catProductsEl', data.products || []);
    ss('prodCountEl', (data.products || []).length + ' results for "' + q + '"', false);
  } catch(e) {
    var results = Object.values(typeof PRODUCTS !== 'undefined' ? PRODUCTS : {}).filter(function(p) {
      return p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand||'').toLowerCase().includes(q.toLowerCase());
    });
    renderGrid('catProductsEl', results);
    ss('prodCountEl', results.length + ' results for "' + q + '"', false);
  }
}

// ── SERVER PING (pre-wake Render on page load) ─────────────────
setTimeout(function() {
  fetch('/api/health').catch(function() {});
}, 500);

console.log('Hubooze app.js loaded — login ready');

// ── Show admin portal card when logged in as admin ─────────────
// Called by loginSuccess in index.html — show admin card if admin
var _origLoginSuccess2 = window.loginSuccess;
document.addEventListener('DOMContentLoaded', function() {
  // After page loads, check if already logged in as admin
  try {
    var session = JSON.parse(localStorage.getItem('hb_session') || 'null');
    if (session && session.role === 'admin') {
      var card = document.getElementById('adminPortalCard');
      if (card) card.style.display = '';
    }
  } catch(e) {}
});
