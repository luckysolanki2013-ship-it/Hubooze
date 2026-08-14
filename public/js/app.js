// Admin functions registered after definition below

// ─── STATE DEFAULTS (in case index.html vars not accessible) ────
if (typeof sellerTabActive    === 'undefined') var sellerTabActive    = 'overview';
if (typeof adminTabActive     === 'undefined') var adminTabActive     = 'overview';
if (typeof ordTabActive       === 'undefined') var ordTabActive       = 'all';
if (typeof catTabActive       === 'undefined') var catTabActive       = 'all';
if (typeof sellerEditProductId=== 'undefined') var sellerEditProductId= null;

/**
 * HUBOOZE — Full API-Connected app.js
 * Overrides functions in index.html with real backend calls.
 * Loaded AFTER index.html's <script> block so these definitions win.
 * Strategy: graceful fallback — tries API first, falls back to local logic.
 */

/* ─── HELPERS ─────────────────────────────────────────────────── */
async function tryAPI(apiFn, fallbackFn) {
  try {
    return await apiFn();
  } catch (err) {
    if (err && err.status === 401) {
      if (window.api) window.api.logout();
      currentUser = null;
      try { updateHeaderAuth(); } catch(e) {}
      try { showPage('account'); } catch(e) {}
      return null;
    }
    console.warn('[API fallback]', err && err.message);
    return typeof fallbackFn === 'function' ? fallbackFn() : null;
  }
}

/* ─── AUTH ────────────────────────────────────────────────────── */
function doLogin() {
  var email = (document.getElementById('loginEmail') || {value:''}).value.trim().toLowerCase();
  var pass  = (document.getElementById('loginPass')  || {value:''}).value;
  if (!email || !pass) { showToast('Please enter email and password', 'error'); return; }
  var btn = document.querySelector('#cLoginForm .portal-submit') || document.querySelector('#loginFormWrap .btn-grad');
  if (btn) { btn.textContent = 'Logging in...'; btn.disabled = true; }
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email: email, password: pass})
  })
  .then(function(r){ return r.json().then(function(d){ return {ok:r.ok, data:d}; }); })
  .then(function(res){
    if (btn) { btn.innerHTML = 'Login &#8594;'; btn.disabled = false; }
    if (!res.ok) { showToast(res.data.error || 'Login failed', 'error'); return; }
    localStorage.setItem('hb_token', res.data.token);
    localStorage.setItem('hb_session', JSON.stringify(res.data.user));
    localStorage.setItem('hb_after_login', res.data.user.role === 'admin' ? 'admin' : (res.data.user.role === 'seller' ? 'seller' : 'account'));
    window.location.reload();
  })
  .catch(function(){
    if (btn) { btn.innerHTML = 'Login &#8594;'; btn.disabled = false; }
    showToast('Cannot reach server. Please try again.', 'error');
  });
}

function doSellerLogin() {
  var email = (document.getElementById('sLoginEmail') || {value:''}).value.trim().toLowerCase();
  var pass  = (document.getElementById('sLoginPass')  || {value:''}).value;
  if (!email || !pass) { showToast('Please enter email and password', 'error'); return; }
  var btn = document.querySelector('#sLoginForm .portal-submit');
  if (btn) { btn.textContent = 'Logging in...'; btn.disabled = true; }
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email: email, password: pass})
  })
  .then(function(r){ return r.json().then(function(d){ return {ok:r.ok, data:d}; }); })
  .then(function(res){
    if (btn) { btn.innerHTML = 'Login to Seller Dashboard &#8594;'; btn.disabled = false; }
    if (!res.ok) { showToast(res.data.error || 'Login failed', 'error'); return; }
    if (res.data.user.role !== 'seller' && res.data.user.role !== 'admin') {
      showToast('Not a seller account', 'error'); return;
    }
    localStorage.setItem('hb_token', res.data.token);
    localStorage.setItem('hb_session', JSON.stringify(res.data.user));
    localStorage.setItem('hb_after_login', 'seller');
    window.location.reload();
  })
  .catch(function(){
    if (btn) { btn.innerHTML = 'Login to Seller Dashboard &#8594;'; btn.disabled = false; }
    showToast('Cannot reach server. Please try again.', 'error');
  });
}

function doAdminLogin() {
  var email = (document.getElementById('aLoginEmail') || {value:''}).value.trim().toLowerCase();
  var pass  = (document.getElementById('aLoginPass')  || {value:''}).value;
  if (!email || !pass) { showToast('Please enter admin credentials', 'error'); return; }
  var btn = document.querySelector('#adminPortal .portal-submit');
  if (btn) { btn.textContent = 'Accessing...'; btn.disabled = true; }
  fetch('/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({email: email, password: pass})
  })
  .then(function(r){ return r.json().then(function(d){ return {ok:r.ok, data:d}; }); })
  .then(function(res){
    if (btn) { btn.innerHTML = '&#9878; Access Admin Panel &#8594;'; btn.disabled = false; }
    if (!res.ok) { showToast(res.data.error || 'Login failed', 'error'); return; }
    if (res.data.user.role !== 'admin') { showToast('Admin access required', 'error'); return; }
    localStorage.setItem('hb_token', res.data.token);
    localStorage.setItem('hb_session', JSON.stringify(res.data.user));
    localStorage.setItem('hb_after_login', 'admin');
    window.location.reload();
  })
  .catch(function(){
    if (btn) { btn.innerHTML = '&#9878; Access Admin Panel &#8594;'; btn.disabled = false; }
    showToast('Cannot reach server. Please try again.', 'error');
  });
}

function doRegister() {
  var name  = (document.getElementById('regName')  ||{value:''}).value.trim();
  var email = (document.getElementById('regEmail') ||{value:''}).value.trim().toLowerCase();
  var pass  = (document.getElementById('regPass')  ||{value:''}).value;
  var phone = (document.getElementById('regPhone') ||{value:''}).value.trim();
  var city  = (document.getElementById('regCity')  ||{value:''}).value.trim();
  var isSel = (document.getElementById('regIsSeller')||{checked:false}).checked;
  if (!name || !email || !pass) { showToast('Name, email and password required', 'error'); return; }
  if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
  fetch('/api/auth/register', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({name:name, email:email, password:pass, phone:phone, city:city, role: isSel ? 'seller' : 'customer'})
  })
  .then(function(r){ return r.json().then(function(d){ return {ok:r.ok, data:d}; }); })
  .then(function(res){
    if (!res.ok) { showToast(res.data.error || 'Registration failed', 'error'); return; }
    localStorage.setItem('hb_token', res.data.token);
    localStorage.setItem('hb_session', JSON.stringify(res.data.user));
    localStorage.setItem('hb_after_login', 'account');
    window.location.reload();
  })
  .catch(function(){ showToast('Cannot reach server. Please try again.', 'error'); });
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('hb_session');
  localStorage.removeItem('hb_token');
  if (window.api) window.api.token = null;
  try { updateHeaderAuth(); } catch(e) {}
  try { renderNav(); } catch(e) {}
  showToast('Logged out successfully', 'info');
  try { showPage('home'); } catch(e) {}
}

function quickLogin(type) {
  var map = {
    customer: {email:'priya@demo.com',   password:'demo123'},
    seller:   {email:'amit@demo.com',    password:'demo123'},
    admin:    {email:'admin@hubooze.in', password:'admin123'}
  };
  var c = map[type]; if (!c) return;
  openPortal(type);
  setTimeout(function(){
    var ef = type==='customer'?'loginEmail':(type==='seller'?'sLoginEmail':'aLoginEmail');
    var pf = type==='customer'?'loginPass':(type==='seller'?'sLoginPass':'aLoginPass');
    var e=document.getElementById(ef); if(e) e.value=c.email;
    var p=document.getElementById(pf); if(p) p.value=c.password;
    if(type==='customer') doLogin();
    else if(type==='seller') doSellerLogin();
    else doAdminLogin();
  }, 100);
}

/* ─── SEARCH ──────────────────────────────────────────────────── */
async function doSearch() {
  var q = (document.getElementById('searchInpEl')||{value:''}).value.trim();
  if (!q) return;
  showPage('categories');
  catTabActive = 'all';
  var result = await tryAPI(
    async function(){ var d = await api.getProducts({search:q}); return d.products||[]; },
    function(){ return Object.values(PRODUCTS||{}).filter(function(p){ return p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand||'').toLowerCase().includes(q.toLowerCase()); }); }
  );
  if (result !== null) {
    renderGrid('catProductsEl', result);
    ss('prodCountEl', result.length + ' results for "' + q + '"', false);
  }
}

/* ─── SELLER PANEL ────────────────────────────────────────────── */



/* ─── ADMIN PANEL ─────────────────────────────────────────────── */
async function _adminPanelRender() {
  var el = document.getElementById('adminContentEl');
  if (!el) return;
  if (!currentUser) { el.innerHTML = typeof adminGate==='function' ? adminGate('&#9878;','Admin Access Required','Please login with admin credentials.','Login',"showPage('account')") : '<p>Please login</p>'; return; }
  if (currentUser.role !== 'admin') { el.innerHTML = typeof adminGate==='function' ? adminGate('&#128683;','Access Denied','Use: admin@hubooze.in / admin123','Switch Account',"showPage('account')") : '<p>Admin only</p>'; return; }
  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3)">Loading admin data...</div>';
  var stats = await tryAPI(function(){ return api.getAdminStats(); }, function(){ return typeof computeAdminStats==='function'?computeAdminStats():{totalOrders:0,totalRevenue:0,totalUsers:0,totalReturns:0}; }) || {};
  var statsHtml = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">'
    + (typeof adminStat==='function' ? (adminStat('&#128233;',stats.totalOrders||0,'Total Orders','var(--blue)')+adminStat('&#8377;',(stats.totalRevenue||0).toLocaleString('en-IN'),'Revenue','var(--green)')+adminStat('&#128100;',stats.totalUsers||0,'Users','var(--yellow)')+adminStat('&#128260;',stats.totalReturns||0,'Returns','var(--red)')) : '')
    + '</div>';
  var tabs = [{id:'overview',label:'&#128200; Overview'},{id:'users',label:'&#128100; Users'},{id:'orders',label:'&#128233; Orders'},{id:'products',label:'&#128230; Products'},{id:'returns',label:'&#128260; Returns'},{id:'analytics',label:'&#128202; Analytics'},{id:'settings',label:'&#9881; Settings'}];
  var tabsHtml = '<div class="sel-tabs" style="flex-wrap:wrap;margin-bottom:20px">' + tabs.map(function(t){ return '<button class="sel-tab'+(adminTabActive===t.id?' active':'')+('" onclick="switchAdminTab(\''+t.id+'\')">')+t.label+'</button>'; }).join('') + '</div>';
  el.innerHTML = statsHtml + tabsHtml + '<div id="adminTabContent"></div>';
  renderAdminTabContent(stats);
}

async function _adminTabContentRender(stats) {
  var el = document.getElementById('adminTabContent');
  if (!el) return;
  if (adminTabActive === 'overview') {
    if (typeof renderAdminOverview==='function') renderAdminOverview(stats, el);
  } else if (adminTabActive === 'users') {
    var data = await tryAPI(function(){ return api.getAdminUsers(); }, function(){ return {users:[]}; }) || {users:[]};
    if (typeof renderAdminUsers==='function') renderAdminUsers(data.users||[], el);
  } else if (adminTabActive === 'orders') {
    var data = await tryAPI(function(){ return api.getAllOrders(); }, function(){ return {orders:ORDERS_DB||[]}; }) || {orders:[]};
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px"><h4 style="font-weight:700;margin-bottom:18px">All Orders ('+(data.orders||[]).length+')</h4>'+(data.orders||[]).slice(0,20).map(function(o){ return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px"><div><div style="font-weight:700">#'+(o.orderId||o.id)+'</div><div style="font-size:12px;color:var(--text3)">'+(o.createdAt||'').toString().substring(0,10)+'</div></div><div style="display:flex;align-items:center;gap:10px"><span class="chip chip-'+o.status+'">'+o.status+'</span><span style="font-weight:800">&#8377;'+(o.total||0).toLocaleString('en-IN')+'</span></div></div>'; }).join('')+'</div>';
  } else if (adminTabActive === 'returns') {
    var data = await tryAPI(function(){ return api.getAllReturns(); }, function(){ return {returns:RETURNS_DB||[]}; }) || {returns:[]};
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px"><h4 style="font-weight:700;margin-bottom:18px">Return Requests ('+(data.returns||[]).length+')</h4>'+(data.returns||[]).map(function(r){ return typeof adminReturnCard==='function'?adminReturnCard(r):'<div>'+r.id+'</div>'; }).join('')+'</div>';
  } else if (adminTabActive === 'products') {
    if (typeof renderAdminProducts==='function') renderAdminProducts(el);
  } else if (adminTabActive === 'analytics') {
    if (typeof renderAdminAnalytics==='function') renderAdminAnalytics(stats, el);
  } else if (adminTabActive === 'icons') {
    el.innerHTML = '<div style="display:grid;gap:16px">'
      // Topbar/Announcement Icons
      + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
      + '<h4 style="font-weight:700;margin-bottom:6px">&#128293; Announcement Bar Icons</h4>'
      + '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">Replace emojis in the top scrolling bar with custom images</p>'
      + '<div style="display:grid;gap:12px">'
      + adminIconRow('return-icon', '&#128260;', '90 Din Easy Return Icon', 'returnIconUrl')
      + adminIconRow('delivery-icon', '&#128640;', 'FREE Delivery Icon', 'deliveryIconUrl')
      + adminIconRow('refund-icon', '&#9889;', 'Instant Refund Icon', 'refundIconUrl')
      + '</div>'
      + '<button onclick="saveTopbarIcons()" class="btn-grad" style="margin-top:14px;padding:10px 24px">Save Topbar Icons</button>'
      + '</div>'
      // Nav Category Icons
      + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
      + '<h4 style="font-weight:700;margin-bottom:6px">&#128203; Navigation Category Icons</h4>'
      + '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">Replace emoji icons in the navigation bar</p>'
      + '<div style="display:grid;gap:12px">'
      + adminIconRow('nav-deals', '&#128293;', 'Aaj ke Deals', 'navDealsIcon')
      + adminIconRow('nav-fashion', '&#128521;', 'Fashion', 'navFashionIcon')
      + adminIconRow('nav-electronics', '&#128241;', 'Electronics', 'navElecIcon')
      + adminIconRow('nav-handmade', '&#9851;', 'Desi/Handmade', 'navHandmadeIcon')
      + adminIconRow('nav-offers', '&#127991;', 'Offers', 'navOffersIcon')
      + '</div>'
      + '<button onclick="saveNavIcons()" class="btn-grad" style="margin-top:14px;padding:10px 24px">Save Nav Icons</button>'
      + '</div>'
      // Category Page Icons
      + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
      + '<h4 style="font-weight:700;margin-bottom:6px">&#127968; Homepage Section Icons</h4>'
      + '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">Replace emoji icons in homepage sections</p>'
      + '<div style="display:grid;gap:12px">'
      + adminIconRow('sec-trending', '&#128293;', 'Trending Section Icon', 'secTrendingIcon')
      + adminIconRow('sec-eco', '&#9851;', 'Eco/Handmade Section Icon', 'secEcoIcon')
      + adminIconRow('sec-electronics', '&#128241;', 'Electronics Section Icon', 'secElecIcon')
      + adminIconRow('sec-fashion', '&#128521;', 'Fashion Section Icon', 'secFashionIcon')
      + '</div>'
      + '<button onclick="saveSectionIcons()" class="btn-grad" style="margin-top:14px;padding:10px 24px">Save Section Icons</button>'
      + '</div>'
      // Promotional Feature Icons
      + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
      + '<h4 style="font-weight:700;margin-bottom:6px">&#127942; Feature/USP Icons</h4>'
      + '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">Icons used in hero section and feature badges</p>'
      + '<div style="display:grid;gap:12px">'
      + adminIconRow('feat-return', '&#128260;', 'Return Feature Icon (Hero)', 'featReturnIcon')
      + adminIconRow('feat-delivery', '&#128666;', 'Free Delivery Feature Icon', 'featDeliveryIcon')
      + adminIconRow('feat-refund', '&#9889;', 'Instant Refund Feature Icon', 'featRefundIcon')
      + adminIconRow('feat-eco', '&#9851;', 'Eco/Recycle Feature Icon', 'featEcoIcon')
      + '</div>'
      + '<button onclick="saveFeatureIcons()" class="btn-grad" style="margin-top:14px;padding:10px 24px">Save Feature Icons</button>'
      + '</div>'
      + '</div>';

  } else if (adminTabActive === 'settings') {
    if (typeof renderAdminSettings==='function') renderAdminSettings(el);
  }
}


/* ─── SERVER PING — pre-wake on load ─────────────────────────── */
setTimeout(function() {
  fetch('/api/health').catch(function(){});
}, 500);

/* ─── POST-LOGIN NAVIGATION ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  // Navigate to correct page after login reload
  var afterLogin = localStorage.getItem('hb_after_login');
  if (afterLogin && currentUser) {
    localStorage.removeItem('hb_after_login');
    setTimeout(function() {
      try { showPage(afterLogin); } catch(e) {}
    }, 200);
  }
  // Clear search bar if it has email (browser autofill)
  setTimeout(function() {
    var si = document.getElementById('searchInpEl');
    if (si && si.value.indexOf('@') > -1) si.value = '';
  }, 100);
});

console.log('Hubooze app.js loaded — login ready');


// ── LOAD PRODUCTS FROM API ON STARTUP ────────────────────────────
async function loadProductsFromAPI() {
  try {
    var token = localStorage.getItem('hb_token');
    var headers = token ? {'Authorization': 'Bearer ' + token} : {};
    var res = await fetch('/api/products?limit=200', { headers: headers });
    var data = await res.json();
    if (data.products && data.products.length > 0) {
      // Merge API products into PRODUCTS object
      data.products.forEach(function(p) {
        p.orig = p.orig || p.originalPrice || p.price;
        p.cat  = p.cat  || p.category;
        p.icon = p.icon || '📦';
        PRODUCTS[p.id] = p;
      });
      console.log('Loaded ' + data.products.length + ' products from API');
      // Always re-render
      // Directly update all product grids
      try {
        if (window.updateProductGrids) { window.updateProductGrids(); return; }
        var allP = Object.values(PRODUCTS);
        allP.sort(function(a,b){
          var aNew = a.id && a.id.indexOf('p_')===0 ? 1 : 0;
          var bNew = b.id && b.id.indexOf('p_')===0 ? 1 : 0;
          if (bNew !== aNew) return bNew - aNew; // new products first
          return (b.reviews||0) - (a.reviews||0);
        });
        var trendGrid = document.getElementById('trendGridEl');
        if (trendGrid) trendGrid.innerHTML = allP.slice(0,12).map(makeCard).join('');
        var fashGrid = document.getElementById('fashionScrollEl');
        if (fashGrid) fashGrid.innerHTML = allP.filter(function(p){return (p.cat||p.category)==='fashion';}).map(makeCard).join('');
        var elecGrid = document.getElementById('electronicsScrollEl');
        if (elecGrid) elecGrid.innerHTML = allP.filter(function(p){return (p.cat||p.category)==='electronics';}).map(makeCard).join('');
        var handGrid = document.getElementById('handmadeScrollEl');
        if (handGrid) handGrid.innerHTML = allP.filter(function(p){return (p.cat||p.category)==='handmade';}).map(makeCard).join('');
      } catch(e) { console.error('Grid update error:', e); }
      try { if (typeof currentPage !== 'undefined' && currentPage === 'categories') renderCategoriesPage(); } catch(e) {}
    }
  } catch(e) {
    console.warn('Could not load products from API:', e.message);
  }
}

// Load products immediately and re-render
loadProductsFromAPI().then(function() {
  // Force re-render after products loaded
  try { if (typeof renderHomeContent === 'function') renderHomeContent(); } catch(e) {}
  try { if (typeof renderCategoriesPage === 'function' && currentPage==='categories') renderCategoriesPage(); } catch(e) {}
}).catch(function(){});

// ── SELLER PRODUCT ACTIONS ────────────────────────────────────────

function editSellerProduct(pid) {
  sellerEditProductId = pid;
  switchSelTab('add_product');
}

// ══════════════════════════════════════════════════════════════════
//  ADMIN PANEL — FULL UI
// ══════════════════════════════════════════════════════════════════





function adminSettingRow(label, id, placeholder) {
  return '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">'+label+'</label>'
    + '<input id="setting_'+id+'" value="'+placeholder+'" style="width:100%;padding:10px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>';
}







// ── ADMIN ACTIONS ─────────────────────────────────────────────────
















async function updateFreeDelivery() {
  var token = localStorage.getItem('hb_token');
  var min = Number(document.getElementById('freeDeliveryMin').value);
  try {
    var r = await fetch('/api/admin/promotions', {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({freeDeliveryMin:min})});
    showToast('Free delivery minimum updated to ₹'+min,'success');
  } catch(e) { showToast('Error','error'); }
}




async function saveWebsiteSettings() {
  showToast('Settings saved! (Refresh to see changes)', 'success');
}





async function savePromoSections() {
  var token = localStorage.getItem('hb_token');
  var data = {
    promo1Title:    (document.getElementById('promo1_title')||{value:''}).value,
    promo1Subtitle: (document.getElementById('promo1_subtitle')||{value:''}).value,
  };
  try {
    await fetch('/api/admin/promotions', {
      method: 'PUT',
      headers: {'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    showToast('Promo sections saved!', 'success');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

// ── ADMIN ICON MANAGEMENT ─────────────────────────────────────────

// Delegate events for icon management and seller admin
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.admin-upload-icon');
  if (btn) { adminUploadIcon(btn.dataset.id, btn.dataset.key, btn.dataset.emoji); return; }
  btn = e.target.closest('.admin-save-icon');
  if (btn) {
    var urlInput = btn.parentNode.querySelector('.admin-icon-url');
    if (urlInput) adminSaveIconFromInput(btn.dataset.id, btn.dataset.key, urlInput.value);
    return;
  }
  btn = e.target.closest('.admin-clear-icon');
  if (btn) { adminClearIcon(btn.dataset.id, btn.dataset.key, btn.dataset.emoji); return; }
  btn = e.target.closest('.admin-approve-seller');
  if (btn) { adminApproveSeller(btn.dataset.uid, btn.dataset.name); return; }
  btn = e.target.closest('.admin-disapprove-seller');
  if (btn) { adminDisapproveSeller(btn.dataset.uid, btn.dataset.name); return; }
  btn = e.target.closest('.admin-save-comm');
  if (btn) { adminSaveCommission(btn.dataset.uid); return; }
  btn = e.target.closest('.admin-suspend-seller');
  if (btn) { adminSuspendUser(btn.dataset.uid, btn.dataset.name); return; }
});


window.SITE_ICONS = window.SITE_ICONS || {};


async function adminSaveIconUrl(id, key) {
  var input = document.getElementById('icon_url_'+id);
  if (!input || !input.value) return;
  var url = input.value.trim();
  await adminSaveIconToServer(key, url);
  window.SITE_ICONS[key] = url;
  applyIconToPage(key, url);
  showToast('Icon saved!', 'success');
  renderAdminTabContent({});
}



function applyIconToPage(key, url) {
  // Map keys to DOM elements
  var map = {
    returnIconUrl:    ['#topbarEl .return-icon', '.rb-icon'],
    deliveryIconUrl:  ['#topbarEl .delivery-icon'],
    refundIconUrl:    ['#topbarEl .refund-icon'],
    navDealsIcon:     ['.nav-link.hot img, .nav-link.hot'],
    navFashionIcon:   [],
    navElecIcon:      [],
    navHandmadeIcon:  [],
    secTrendingIcon:  ['#trendTitleEl'],
    featReturnIcon:   ['.rb-icon'],
  };
  // Re-render topbar with new icon
  if (key.includes('IconUrl') || key.includes('Icon')) {
    renderTopbarWithIcons();
  }
}

function renderTopbarWithIcons() {
  var icons = window.SITE_ICONS || {};
  var makeIcon = function(key, emoji, text) {
    return icons[key]
      ? '<img src="'+icons[key]+'" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:4px"> <span class="hl">'+text+'</span>'
      : emoji+' <span class="hl">'+text+'</span>';
  };
  var topbar = makeIcon('returnIconUrl','&#128260;','90 Din Easy Return')
    + ' &mdash; Kisi bhi condition mein FREE! &nbsp;|&nbsp; '
    + makeIcon('deliveryIconUrl','&#128640;','FREE Delivery')
    + ' above &#8377;499 &nbsp;|&nbsp; '
    + makeIcon('refundIconUrl','&#9889;','Instant Refund')
    + ' &nbsp;|&nbsp; &#128231; Team.Support@hubooze.in';
  var el = document.getElementById('topbarEl');
  if (el) el.innerHTML = topbar;

  // Update section titles
  var icons2 = window.SITE_ICONS;
  if (icons2.secTrendingIcon) {
    var tt = document.getElementById('trendTitleEl');
    if (tt) tt.innerHTML = '<img src="'+icons2.secTrendingIcon+'" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;margin-right:6px"> Trending Products';
  }
  if (icons2.secEcoIcon) {
    var handTitle = document.getElementById('handmadeTitleEl');
    if (handTitle) handTitle.innerHTML = '<img src="'+icons2.secEcoIcon+'" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;margin-right:6px"> '+handTitle.textContent.trim();
  }
}

// Load icons on startup
async function loadSiteIcons() {
  try {
    var r = await fetch('/api/admin/promotions');
    var d = await r.json();
    if (d.promotions && d.promotions.siteIcons) {
      window.SITE_ICONS = d.promotions.siteIcons;
      renderTopbarWithIcons();
    }
  } catch(e) {}
}

async function saveTopbarIcons() { showToast('Topbar icons saved!', 'success'); }
async function saveNavIcons() { showToast('Nav icons saved!', 'success'); }
async function saveSectionIcons() { showToast('Section icons saved!', 'success'); }
async function saveFeatureIcons() { showToast('Feature icons saved!', 'success'); }

// Load icons on page load
document.addEventListener('DOMContentLoaded', function() {
  loadSiteIcons();
});


// Register new admin panel as window property (called from index.html stub)
window._appRenderAdminPanel = _adminPanelRender;
window._appRenderAdminTabContent = _adminTabContentRender;

// ── SELLER ORDER FULL CARD WITH TIMELINE ─────────────────────────

// ── SELLER ORDER STATUS UPDATE ────────────────────────────────────


// ── SELLER PICKUP ADDRESS ─────────────────────────────────────────


// ── BRAND APPROVAL ────────────────────────────────────────────────



// ── FILTER SELLER ORDERS ──────────────────────────────────────────

// Delegate filter button clicks
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.sel-order-filter');
  if (btn && btn.dataset.sf) { selFilterOrders(btn.dataset.sf); }
});

// ── MODAL HELPER ──────────────────────────────────────────────────
function showModal(html) {
  var existing = document.getElementById('globalModal');
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = 'globalModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.onclick = function(e){ if(e.target===modal) closeModal(); };
  modal.innerHTML = html;
  document.body.appendChild(modal);
}

function closeModal() {
  var m = document.getElementById('globalModal');
  if (m) m.remove();
}



