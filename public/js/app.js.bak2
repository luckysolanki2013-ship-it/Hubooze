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
async function renderSellerPage() {
  var el = document.getElementById('sellerContentEl');
  if (!el) return;
  if (!currentUser) {
    el.innerHTML = sellerGate ? sellerGate('&#129489;','Login Required','Login as a seller to access your dashboard.','Login',"showPage('account')") : '<p>Please login</p>';
    return;
  }
  if (currentUser.role !== 'seller' && currentUser.role !== 'admin') {
    el.innerHTML = sellerGate ? sellerGate('&#129489;','Seller Account Required','Use: amit@demo.com / demo123','Switch Account',"showPage('account')") : '<p>Not a seller account</p>';
    return;
  }
  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3)">Loading dashboard...</div>';
  // Always reload products from API to get latest
  await loadProductsFromAPI();
  var data = await tryAPI(
    function(){ return api.getSellerDashboard(); },
    function(){
      var myProds = Object.values(PRODUCTS||{}).filter(function(p){ 
        return p.sellerId===currentUser.id || p.sellerId==='u2' || !p.sellerId; 
      }).map(function(p){
        // Normalize fields for seller display
        return Object.assign({
          sellerId: currentUser.id,
          price: p.price||0,
          orig: p.orig||p.originalPrice||p.price||0,
          originalPrice: p.orig||p.originalPrice||p.price||0,
          stock: p.stock||p.inStock?50:0,
          active: true,
          rating: p.rating||0,
          reviews: p.reviews||0,
          category: p.cat||p.category||'other',
          cat: p.cat||p.category||'other'
        }, p);
      });
      var myIds   = myProds.map(function(p){ return p.id; });
      var myOrders= (ORDERS_DB||[]).filter(function(o){ return o.items&&o.items.some(function(it){ return myIds.includes(it.productId); }); });
      var rev     = myOrders.filter(function(o){ return o.status!=='cancelled'; }).reduce(function(s,o){ return s+o.total; },0);
      return {stats:{totalProducts:myProds.length,totalOrders:myOrders.length,pendingOrders:myOrders.filter(function(o){ return o.status==='processing'; }).length,totalRevenue:rev,netPayout:Math.round(rev*.9),totalReturns:0},recentOrders:myOrders.slice(0,5),products:myProds};
    }
  );
  if (!data) return;
  var s = data.stats||{};
  var statsHtml = '<div class="sel-stat-grid">'
    + (typeof selStat==='function' ? (selStat(s.totalProducts||0,'Products','var(--green)','&#128230;')+selStat(s.totalOrders||0,'Orders','var(--blue)','&#128233;')+selStat(s.pendingOrders||0,'Pending','var(--yellow)','&#9203;')+selStat('&#8377;'+(s.totalRevenue||0).toLocaleString('en-IN'),'Revenue','var(--green)','&#128176;')+selStat('&#8377;'+(s.netPayout||0).toLocaleString('en-IN'),'Payout','var(--blue)','&#128184;')+selStat(s.totalReturns||0,'Returns','var(--red)','&#128260;')) : '')
    + '</div>';
  var tabs = [{id:'overview',label:'&#128200; Overview'},{id:'products',label:'&#128230; Products'},{id:'orders',label:'&#128233; Orders'},{id:'returns',label:'&#128260; Returns'},{id:'add_product',label:'&#10133; Add Product'},{id:'payouts',label:'&#128184; Payouts'},{id:'brand',label:'&#127978; Brand Approval'}];
  var tabsHtml = '<div class="sel-tabs">' + tabs.map(function(t){ return '<button class="sel-tab'+(sellerTabActive===t.id?' active':'')+('" onclick="switchSelTab(\''+t.id+'\')">')+t.label+'</button>'; }).join('') + '</div>';
  el.innerHTML = statsHtml + tabsHtml + '<div id="selTabContent"></div>';
  renderSellerTabFromData(data);
}

async function renderSellerTabFromData(cachedData) {
  var el = document.getElementById('selTabContent');
  if (!el) return;
  if (sellerTabActive === 'overview') {
    var recent = (cachedData&&cachedData.recentOrders)||[];
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px"><h4 style="font-weight:700;margin-bottom:16px">&#128233; Recent Orders</h4>'
      + (recent.length ? recent.map(function(o){ return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap"><div style="flex:1"><div style="font-weight:600">#'+(o.orderId||o.id)+'</div><div style="font-size:11px;color:var(--text3)">'+(o.createdAt||'').toString().substring(0,10)+'</div></div><span class="chip chip-'+o.status+'">'+o.status+'</span><span style="font-weight:800">&#8377;'+(o.total||0).toLocaleString('en-IN')+'</span></div>'; }).join('') : '<p style="color:var(--text3)">No orders yet.</p>')
      + '</div>';
  } else if (sellerTabActive === 'products') {
    // Always fetch fresh from API
    var prods = [];
    try {
      var token = localStorage.getItem('hb_token');
      var r = await fetch('/api/seller/products', {headers:{'Authorization':'Bearer '+token}});
      var d = await r.json();
      prods = d.products || [];
      // Merge into local PRODUCTS
      prods.forEach(function(p){ p.orig=p.orig||p.originalPrice||p.price; p.cat=p.cat||p.category; PRODUCTS[p.id]=p; });
    } catch(e) {
      prods = Object.values(PRODUCTS||{}).filter(function(p){ return p.sellerId===currentUser.id || p.sellerId==='u2'; });
    }
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><h4 style="font-weight:700">My Products ('+prods.length+')</h4><button class="btn-grad" style="padding:9px 18px;font-size:13px" onclick="switchSelTab(\'add_product\')">&#10133; Add Product</button></div>'
      + (prods.length ? prods.map(function(p){ return typeof sellerProductRow==='function'?sellerProductRow(p):'<div>'+p.name+'</div>'; }).join('') : '<p style="color:var(--text3)">No products yet.</p>')
      + '</div>';
  } else if (sellerTabActive === 'orders') {
    var orders = await (async function(){
      try {
        var token = localStorage.getItem('hb_token');
        var r = await fetch('/api/seller/orders', {headers:{'Authorization':'Bearer '+token}});
        var d = await r.json();
        return d.orders || [];
      } catch(e) {
        return Object.values(PRODUCTS||{}).filter(function(p){ return p.sellerId===currentUser.id; }).reduce(function(acc,p){
          return acc.concat((ORDERS_DB||[]).filter(function(o){ return o.items&&o.items.some(function(it){ return it.productId===p.id; }); }));
        },[]);
      }
    })();
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
      + '<h4 style="font-weight:700;margin-bottom:18px">&#128233; My Orders ('+orders.length+')</h4>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
      + ['all','accepted','packed','shipped','out_for_delivery','delivered','cancelled'].map(function(s){
          return '<button data-sf="'+s+'" class="sel-order-filter" style="padding:5px 12px;border-radius:14px;border:1px solid var(--border);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+s+'</button>';
        }).join('')
      + '</div>'
      + '<div id="selOrderList">'
      + (orders.length ? orders.map(function(o){ return sellerOrderCardFull(o); }).join('') : '<p style="color:var(--text3)">No orders yet.</p>')
      + '</div></div>';
    window._selOrders = orders;
  } else if (sellerTabActive === 'add_product') {
    if (typeof renderSelAddProduct==='function') renderSelAddProduct(el);
  } else if (sellerTabActive === 'brand') {
    if (typeof renderBrandApproval === 'function') renderBrandApproval(el);
  } else if (sellerTabActive === 'payouts') {
    var p = await tryAPI(function(){ return api.getSellerPayouts(); }, function(){ var rev=(cachedData&&cachedData.stats&&cachedData.stats.totalRevenue)||0; return {netPayout:Math.round(rev*.9),paidOut:Math.round(rev*.54),pending:Math.round(rev*.36)}; }) || {};
    if (typeof renderPayoutsTab==='function') el.innerHTML = renderPayoutsTab(p);
  }
}

function switchSelTab(t) { sellerTabActive = t; renderSellerPage(); }

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

function switchAdminTab(t) { adminTabActive = t; _adminPanelRender(); }

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

async function uploadProductImage(input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('Image must be under 5MB', 'error'); return; }
  // Show local preview immediately
  var reader = new FileReader();
  reader.onload = function(e) {
    var prev = document.getElementById('prodImgPreview');
    if (prev) {
      prev.innerHTML = '<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px">';
      prev.dataset.localImage = e.target.result;
    }
  };
  reader.readAsDataURL(file);
  // Upload to S3 via server
  showToast('Uploading image...', 'info');
  var formData = new FormData();
  formData.append('image', file);
  var token = localStorage.getItem('hb_token');
  try {
    var res = await fetch('/api/upload/product-image', {
      method: 'POST',
      headers: token ? {'Authorization': 'Bearer ' + token} : {},
      body: formData
    });
    var data = await res.json();
    if (data.url) {
      var prev = document.getElementById('prodImgPreview');
      if (prev) prev.dataset.s3Url = data.url;
      showToast('Image uploaded to S3!', 'success');
    } else {
      showToast(data.error || 'Upload failed', 'error');
    }
  } catch(e) {
    showToast('Upload failed: ' + e.message, 'error');
  }
}

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
function toggleListProduct(pid) {
  var token = localStorage.getItem('hb_token');
  var p = PRODUCTS[pid];
  var newListed = p ? (p.listed === false ? true : false) : true;
  fetch('/api/products/' + pid, {
    method: 'PUT',
    headers: {'Content-Type':'application/json','Authorization':'Bearer '+token},
    body: JSON.stringify({listed: newListed, active: newListed})
  })
  .then(function(r){ return r.json(); })
  .then(function(d){
    if (d.product || d.message) {
      if (PRODUCTS[pid]) { PRODUCTS[pid].listed = newListed; PRODUCTS[pid].active = newListed; }
      showToast(newListed ? '✅ Product listed!' : '❌ Product unlisted!', 'success');
      renderSellerPage();
    } else {
      showToast(d.error || 'Failed to update', 'error');
    }
  })
  .catch(function(){ showToast('Could not update product', 'error'); });
}

function editSellerProduct(pid) {
  sellerEditProductId = pid;
  switchSelTab('add_product');
}

// ══════════════════════════════════════════════════════════════════
//  ADMIN PANEL — FULL UI
// ══════════════════════════════════════════════════════════════════

async function renderAdminPanel() {
  var el = document.getElementById('adminContentEl');
  if (!el) return;
  if (!currentUser || currentUser.role !== 'admin') {
    el.innerHTML = '<div style="text-align:center;padding:48px"><div style="font-size:3rem">🔒</div><h3>Admin Access Only</h3><p style="color:var(--text3)">Login with admin@hubooze.in</p></div>';
    return;
  }
  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3)">Loading admin panel...</div>';
  
  // Fetch stats
  var token = localStorage.getItem('hb_token');
  var headers = {'Authorization':'Bearer '+token,'Content-Type':'application/json'};
  
  var stats = {};
  try {
    var r = await fetch('/api/admin/stats', {headers});
    stats = await r.json();
  } catch(e) {}

  var tabs = [
    {id:'overview',    label:'&#128202; Overview'},
    {id:'products',    label:'&#128230; Products'},
    {id:'orders',      label:'&#128722; Orders'},
    {id:'returns',     label:'&#128260; Returns'},
    {id:'users',       label:'&#128101; Users'},
    {id:'sellers',     label:'&#127978; Sellers'},
    {id:'promotions',  label:'&#128226; Promotions'},
    {id:'icons',       label:'&#127912; Icons & Images'},
    {id:'settings',    label:'&#9881; Settings'},
  ];

  var statsHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;margin-bottom:24px">'
    + adminStatCard('🛒', stats.totalOrders||0, 'Orders', 'var(--blue)')
    + adminStatCard('₹', (stats.totalRevenue||0).toLocaleString('en-IN'), 'Revenue', 'var(--green)')
    + adminStatCard('👥', stats.totalUsers||0, 'Users', 'var(--yellow)')
    + adminStatCard('🏪', stats.totalSellers||0, 'Sellers', 'var(--blue)')
    + adminStatCard('📦', stats.totalProducts||0, 'Products', 'var(--green)')
    + adminStatCard('↩️', stats.totalReturns||0, 'Returns', 'var(--red)')
    + adminStatCard('⚡', stats.pendingReturns||0, 'Pending Returns', 'var(--yellow)')
    + adminStatCard('💰', '₹'+(stats.platformFee||0).toLocaleString('en-IN'), 'Platform Fee', 'var(--green)')
    + '</div>';

  var tabsHtml = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">'
    + tabs.map(function(t){ return '<button onclick="switchAdminTab(\''+t.id+'\')" style="padding:8px 14px;border-radius:20px;border:1px solid '+(adminTabActive===t.id?'var(--green)':'var(--border)')+';background:'+(adminTabActive===t.id?'var(--green)':'var(--bg3)')+';color:'+(adminTabActive===t.id?'#000':'var(--text)')+';cursor:pointer;font-size:13px;font-family:inherit;font-weight:'+(adminTabActive===t.id?'700':'400')+'">'+t.label+'</button>'; }).join('')
    + '</div>';

  el.innerHTML = statsHtml + tabsHtml + '<div id="adminTabContent"></div>';
  renderAdminTabContent(stats);
}

function adminStatCard(icon, val, label, color) {
  return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">'
    + '<div style="font-size:1.6rem;margin-bottom:4px">'+icon+'</div>'
    + '<div style="font-size:20px;font-weight:900;color:'+color+'">'+val+'</div>'
    + '<div style="font-size:11px;color:var(--text3);margin-top:2px">'+label+'</div>'
    + '</div>';
}

function switchAdminTab(t) { adminTabActive = t; renderAdminPanel(); }

async function renderAdminTabContent(stats) {
  var el = document.getElementById('adminTabContent');
  if (!el) return;
  var token = localStorage.getItem('hb_token');
  var headers = {'Authorization':'Bearer '+token,'Content-Type':'application/json'};

  if (adminTabActive === 'overview') {
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
      + '<h4 style="font-weight:700;margin-bottom:16px">📊 Platform Overview</h4>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
      + '<div><p style="color:var(--text3);font-size:13px">Total Revenue</p><p style="font-size:22px;font-weight:800;color:var(--green)">₹'+(stats.totalRevenue||0).toLocaleString('en-IN')+'</p></div>'
      + '<div><p style="color:var(--text3);font-size:13px">Platform Earnings (10%)</p><p style="font-size:22px;font-weight:800;color:var(--blue)">₹'+(stats.platformFee||0).toLocaleString('en-IN')+'</p></div>'
      + '<div><p style="color:var(--text3);font-size:13px">Delivered Orders</p><p style="font-size:22px;font-weight:800">'+( stats.deliveredOrders||0)+'</p></div>'
      + '<div><p style="color:var(--text3);font-size:13px">Cancelled Orders</p><p style="font-size:22px;font-weight:800;color:var(--red)">'+(stats.cancelledOrders||0)+'</p></div>'
      + '</div></div>';

  } else if (adminTabActive === 'products') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading products...</div>';
    try {
      var r = await fetch('/api/admin/products', {headers});
      var d = await r.json();
      var prods = d.products || [];
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">'
        + '<h4 style="font-weight:700">📦 All Products ('+prods.length+')</h4>'
        + '<input id="adminProdSearch" placeholder="Search products..." oninput="adminFilterProducts(this.value)" style="padding:8px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;width:200px">'
        + '</div>'
        + '<div id="adminProdList">'
        + prods.map(function(p){ return adminProductRow(p); }).join('')
        + '</div></div>';
      window._adminProds = prods;
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error loading products</p>'; }

  } else if (adminTabActive === 'orders') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading orders...</div>';
    try {
      var r = await fetch('/api/admin/orders', {headers});
      var d = await r.json();
      var orders = d.orders || [];
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">🛒 All Orders ('+orders.length+')</h4>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
        + ['all','processing','confirmed','shipped','delivered','cancelled'].map(function(s){
            return '<button onclick="adminFilterOrders(\''+s+'\')" style="padding:6px 12px;border-radius:16px;border:1px solid var(--border);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+s+'</button>';
          }).join('')
        + '</div>'
        + '<div id="adminOrderList">'
        + orders.map(function(o){ return adminOrderRow(o); }).join('')
        + '</div></div>';
      window._adminOrders = orders;
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error loading orders</p>'; }

  } else if (adminTabActive === 'returns') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading returns...</div>';
    try {
      var r = await fetch('/api/admin/returns', {headers});
      var d = await r.json();
      var returns = d.returns || [];
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">↩️ Return Requests ('+returns.length+')</h4>'
        + (returns.length ? returns.map(function(ret){ return adminReturnRow(ret); }).join('') : '<p style="color:var(--text3)">No returns yet.</p>')
        + '</div>';
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error loading returns</p>'; }

  } else if (adminTabActive === 'users') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading users...</div>';
    try {
      var r = await fetch('/api/admin/users', {headers});
      var d = await r.json();
      var users = d.users || [];
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">'
        + '<h4 style="font-weight:700">👥 All Users ('+users.length+')</h4>'
        + '<div style="display:flex;gap:8px">'
        + ['all','customer','seller','admin'].map(function(role){
            return '<button onclick="adminFilterUsers(\''+role+'\')" style="padding:6px 12px;border-radius:16px;border:1px solid var(--border);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+role+'</button>';
          }).join('')
        + '</div></div>'
        + '<div id="adminUserList">'
        + users.map(function(u){ return adminUserRow(u); }).join('')
        + '</div></div>';
      window._adminUsers = users;
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error loading users</p>'; }

  } else if (adminTabActive === 'sellers') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading sellers...</div>';
    try {
      var r = await fetch('/api/admin/sellers', {headers});
      var d = await r.json();
      var sellers = d.sellers || [];
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">🏪 Seller Management ('+sellers.length+')</h4>'
        + sellers.map(function(s){ return adminSellerRow(s); }).join('')
        + '</div>';
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error loading sellers</p>'; }

  } else if (adminTabActive === 'promotions') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading promotions...</div>';
    try {
      var r = await fetch('/api/admin/promotions', {headers});
      var d = await r.json();
      var promo = d.promotions || {};
      el.innerHTML = '<div style="display:grid;gap:16px">'
        // Flash Sale
        + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">⚡ Flash Sale</h4>'
        + '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">'
        + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Discount %</label><input id="flashDiscount" type="number" min="1" max="90" value="'+(promo.flashSale&&promo.flashSale.discount||30)+'" style="padding:8px 12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;width:100px"></div>'
        + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Label</label><input id="flashLabel" type="text" value="'+(promo.flashSale&&promo.flashSale.label||'')+'" placeholder="Flash Sale!" style="padding:8px 12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;width:200px"></div>'
        + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Duration (hours)</label><input id="flashHours" type="number" min="1" max="168" value="24" style="padding:8px 12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;width:100px"></div>'
        + '<button onclick="activateFlashSale()" class="btn-grad" style="padding:10px 20px">⚡ Activate</button>'
        + '<button onclick="deactivateFlashSale()" style="padding:10px 20px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--red);cursor:pointer;font-family:inherit">✕ Stop Sale</button>'
        + '</div>'
        + (promo.flashSale&&promo.flashSale.active ? '<div style="margin-top:12px;padding:10px;background:rgba(0,200,83,.1);border-radius:8px;color:var(--green);font-size:13px">✅ Flash sale ACTIVE: '+promo.flashSale.discount+'% OFF until '+new Date(promo.flashSale.endTime).toLocaleString('en-IN')+'</div>' : '<div style="margin-top:12px;padding:10px;background:var(--bg4);border-radius:8px;color:var(--text3);font-size:13px">No active flash sale</div>')
        + '</div>'
        // Announcement Bar
        + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:12px">📢 Announcement Bar</h4>'
        + '<div style="display:flex;gap:10px;flex-wrap:wrap">'
        + '<input id="announcementText" value="'+(promo.announcement||'')+'" style="flex:1;min-width:200px;padding:10px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit">'
        + '<button onclick="updateAnnouncement()" class="btn-grad" style="padding:10px 20px">Update</button>'
        + '</div></div>'
        // Free Delivery
        + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:12px">🚚 Free Delivery Minimum</h4>'
        + '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
        + '<span style="color:var(--text3)">₹</span>'
        + '<input id="freeDeliveryMin" type="number" value="'+(promo.freeDeliveryMin||499)+'" style="width:120px;padding:10px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit">'
        + '<button onclick="updateFreeDelivery()" class="btn-grad" style="padding:10px 20px">Update</button>'
        + '</div></div>'
        + '</div>';
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error loading promotions</p>'; }

  } else if (adminTabActive === 'settings') {
    try {
      var r2 = await fetch('/api/admin/promotions', {headers});
      var pd = await r2.json();
      var promo2 = pd.promotions || {};
      el.innerHTML = '<div style="display:grid;gap:16px">'
        // Hero Banner
        + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">🖼️ Hero Banner Image</h4>'
        + (promo2.heroBgImage ? '<img src="'+promo2.heroBgImage+'" style="width:100%;max-height:200px;object-fit:cover;border-radius:10px;margin-bottom:12px">' : '<div style="width:100%;height:120px;background:var(--bg4);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--text3);margin-bottom:12px">No banner image set</div>')
        + '<div style="display:flex;gap:10px;flex-wrap:wrap">'
        + '<input type="file" id="heroBannerFile" accept="image/*" style="display:none" onchange="uploadHeroBanner(this)">'
        + '<button onclick="document.getElementById(\'heroBannerFile\').click()" class="btn-grad" style="padding:10px 20px">&#128247; Upload Banner Image</button>'
        + '<button onclick="clearHeroBanner()" style="padding:10px 20px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--red);cursor:pointer;font-family:inherit">✕ Remove Image</button>'
        + '</div>'
        + '<p style="font-size:12px;color:var(--text3);margin-top:8px">Recommended: 1920x600px. Indian fashion/lifestyle images work best.</p>'
        + '</div>'
        // Hero Text
        + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">✍️ Hero Text Content</h4>'
        + '<div style="display:grid;gap:12px">'
        + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Badge Text</label><input id="s_heroBadge" value="'+(promo2.heroBadge||'🇮🇳 INDIA KI ECO COMMERCE')+'" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>'
        + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Main Headline</label><input id="s_heroTitle" value="'+(promo2.heroTitle||'Khareedein Aaram Se.')+'" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>'
        + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Sub Headline</label><input id="s_heroSubtitle" value="'+(promo2.heroSubtitle||'Return Karen Free Mein.')+'" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>'
        + '</div>'
        + '<button onclick="saveHeroText()" class="btn-grad" style="margin-top:14px;padding:10px 24px">Save Hero Text</button>'
        + '</div>'
        // Promo Sections
        + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">🏷️ Promotional Sections</h4>'
        + '<div style="display:grid;gap:10px">'
        + '<div style="background:var(--bg4);border-radius:10px;padding:14px">'
        + '<div style="font-weight:600;margin-bottom:8px">Section 1 — Featured Collection</div>'
        + '<input id="promo1_title" placeholder="Section title e.g. Summer Collection" value="'+(promo2.promo1Title||'')+'" style="width:100%;padding:8px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:inherit;margin-bottom:6px;box-sizing:border-box">'
        + '<input id="promo1_subtitle" placeholder="Subtitle e.g. Starting ₹299" value="'+(promo2.promo1Subtitle||'')+'" style="width:100%;padding:8px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:inherit;box-sizing:border-box">'
        + '</div>'
        + '</div>'
        + '<button onclick="savePromoSections()" class="btn-grad" style="margin-top:12px;padding:10px 24px">Save Promo Sections</button>'
        + '</div>'
        + '</div>';
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error loading settings: '+e.message+'</p>'; }
  }
}

function adminSettingRow(label, id, placeholder) {
  return '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">'+label+'</label>'
    + '<input id="setting_'+id+'" value="'+placeholder+'" style="width:100%;padding:10px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>';
}

function adminProductRow(p) {
  return '<div id="aprow-'+p.id+'" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">'
    + '<div style="width:48px;height:48px;background:var(--bg4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;overflow:hidden;flex-shrink:0">'
    + (p.image ? '<img src="'+p.image+'" style="width:100%;height:100%;object-fit:cover">' : (p.icon||'📦'))
    + '</div>'
    + '<div style="flex:1;min-width:150px">'
    + '<div style="font-weight:600;font-size:14px">'+p.name+'</div>'
    + '<div style="font-size:12px;color:var(--text3)">'+(p.brand||'')+' • '+(p.category||p.cat||'')+' • ₹'+p.price+'</div>'
    + '<div style="font-size:11px;color:var(--text3)">Seller: '+(p.sellerId||'N/A')+'</div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<span style="padding:3px 8px;border-radius:12px;font-size:11px;background:'+(p.active?'rgba(0,200,83,.15)':'rgba(255,59,48,.15)')+';color:'+(p.active?'var(--green)':'var(--red)')+'">'+( p.active?'Active':'Inactive')+'</span>'
    + '<button onclick="adminToggleProduct(\''+p.id+'\')" style="padding:5px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+(p.active?'Deactivate':'Activate')+'</button>'
    + '<button onclick="adminEditProduct(\''+p.id+'\')" style="padding:5px 10px;border-radius:6px;border:1px solid var(--blue);background:transparent;color:var(--blue);cursor:pointer;font-size:12px;font-family:inherit">Edit</button>'
    + '<button onclick="adminDeleteProduct(\''+p.id+'\',\''+p.name+'\')" style="padding:5px 10px;border-radius:6px;border:1px solid var(--red);background:transparent;color:var(--red);cursor:pointer;font-size:12px;font-family:inherit">Delete</button>'
    + '</div></div>';
}

function adminOrderRow(o) {
  var statuses = ['processing','confirmed','shipped','out_for_delivery','delivered','cancelled'];
  return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">'
    + '<div><div style="font-weight:700">#'+(o.orderId||o.id)+'</div><div style="font-size:12px;color:var(--text3)">'+(o.createdAt||'').toString().substring(0,10)+' • '+((o.address&&o.address.name)||'')+'</div></div>'
    + '<div style="display:flex;align-items:center;gap:8px"><span class="chip chip-'+o.status+'">'+o.status+'</span><span style="font-weight:800">₹'+(o.total||0).toLocaleString('en-IN')+'</span></div>'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
    + statuses.map(function(s){ return '<button onclick="adminUpdateOrderStatus(\''+o.id+'\',\''+s+'\')" style="padding:4px 10px;border-radius:12px;border:1px solid '+(o.status===s?'var(--green)':'var(--border)')+';background:'+(o.status===s?'var(--green)':'var(--bg3)')+';color:'+(o.status===s?'#000':'var(--text3)')+';cursor:pointer;font-size:11px;font-family:inherit">'+s+'</button>'; }).join('')
    + '</div></div>';
}

function adminReturnRow(r) {
  return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">'
    + '<div><div style="font-weight:700">Return #'+(r.id||'')+'</div><div style="font-size:12px;color:var(--text3)">Order: '+(r.orderId||'')+' • Reason: '+(r.reason||'')+'</div></div>'
    + '<span class="chip chip-'+(r.status||'pending')+'">'+( r.status||'pending')+'</span>'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
    + ['approved','rejected','picked_up','refunded'].map(function(s){ return '<button onclick="adminUpdateReturn(\''+r.id+'\',\''+s+'\')" style="padding:5px 10px;border-radius:12px;border:1px solid var(--border);background:var(--bg3);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+s+'</button>'; }).join('')
    + '</div></div>';
}

function adminUserRow(u) {
  return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">'
    + '<div style="width:40px;height:40px;border-radius:50%;background:var(--bg4);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">'+(u.role==='admin'?'👑':u.role==='seller'?'🏪':'👤')+'</div>'
    + '<div style="flex:1;min-width:150px"><div style="font-weight:600">'+u.name+'</div><div style="font-size:12px;color:var(--text3)">'+u.email+' • '+u.role+'</div></div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + (u.role!=='admin' ? '<button onclick="adminChangeRole(\''+u.id+'\',\''+u.role+'\')" style="padding:5px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">Change Role</button>' : '')
    + '<button onclick="adminSuspendUser(\''+u.id+'\',\''+u.name+'\')" style="padding:5px 10px;border-radius:6px;border:1px solid var(--red);background:transparent;color:var(--red);cursor:pointer;font-size:12px;font-family:inherit">Suspend</button>'
    + '</div></div>';
}

function adminSellerRow(s) {
  var docs = s.brandDocuments || {};
  var approved = s.brandApproved || false;
  var commission = s.commission || 10;
  var statusColor = approved ? 'var(--green)' : (docs.submittedAt ? 'var(--yellow)' : 'var(--text3)');
  var statusLabel = approved ? '&#10003; Approved' : (docs.submittedAt ? '&#9203; Pending Review' : 'Not Submitted');

  var docsHtml = docs.submittedAt ? (
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">'
    + (docs.trademark ? '<a href="'+docs.trademark+'" target="_blank" style="padding:5px 10px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--blue);font-size:12px;text-decoration:none">&#174; Trademark</a>' : '')
    + (docs.authorization ? '<a href="'+docs.authorization+'" target="_blank" style="padding:5px 10px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--blue);font-size:12px;text-decoration:none">&#128196; Auth Letter</a>' : '')
    + (docs.invoice ? '<a href="'+docs.invoice+'" target="_blank" style="padding:5px 10px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--blue);font-size:12px;text-decoration:none">&#129534; Invoice</a>' : '')
    + '</div>'
  ) : '<div style="font-size:12px;color:var(--text3);margin:8px 0">No documents submitted yet</div>';

  return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:12px">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:12px">'
    + '<div>'
    + '<div style="font-weight:700;font-size:15px">&#127978; '+s.name+'</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:2px">'+s.email+' • '+(s.city||'')+'</div>'
    + '<div style="margin-top:6px"><span style="padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;background:rgba(0,0,0,.2);color:'+statusColor+'">'+statusLabel+'</span></div>'
    + '</div>'
    + '<div style="display:flex;gap:14px;flex-wrap:wrap">'
    + '<div style="text-align:center"><div style="font-weight:700;color:var(--blue);font-size:16px">'+(s.productCount||0)+'</div><div style="font-size:11px;color:var(--text3)">Products</div></div>'
    + '<div style="text-align:center"><div style="font-weight:700;color:var(--green);font-size:16px">'+(s.orderCount||0)+'</div><div style="font-size:11px;color:var(--text3)">Orders</div></div>'
    + '<div style="text-align:center"><div style="font-weight:700;color:var(--green);font-size:16px">&#8377;'+(s.revenue||0).toLocaleString('en-IN')+'</div><div style="font-size:11px;color:var(--text3)">Revenue</div></div>'
    + '</div></div>'
    + '<div style="border-top:1px solid var(--border);padding-top:12px">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:8px">&#128196; Brand Documents:</div>'
    + docsHtml
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px">'
    // Commission setting
    + '<div style="display:flex;align-items:center;gap:6px;background:var(--bg3);padding:6px 10px;border-radius:8px">'
    + '<span style="font-size:13px;color:var(--text3)">Commission:</span>'
    + '<input id="comm_'+s.id+'" type="number" value="'+commission+'" min="1" max="50" style="width:50px;padding:4px;background:var(--bg4);border:1px solid var(--border2);border-radius:4px;color:var(--text);font-family:inherit;text-align:center">'
    + '<span style="font-size:13px;color:var(--text3)">%</span>'
    + '<button data-uid="'+s.id+'" class="admin-save-comm" style="padding:4px 8px;background:var(--green);border:none;border-radius:4px;color:#000;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit">Save</button>'
    + '</div>'
    // Approve/Disapprove buttons
    + (docs.submittedAt ? (
        approved
          ? '<button data-uid="'+s.id+'" data-name="'+s.name+'" class="admin-disapprove-seller" style="padding:7px 16px;background:var(--bg3);border:1px solid var(--red);border-radius:8px;color:var(--red);cursor:pointer;font-size:13px;font-family:inherit">&#10005; Disapprove Brand</button>'
          : '<button data-uid="'+s.id+'" data-name="'+s.name+'" class="admin-approve-seller" style="padding:7px 16px;background:var(--green);border:none;border-radius:8px;color:#000;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">&#10003; Approve Brand</button>'
      ) : '')
    + '<button data-uid="'+s.id+'" data-name="'+s.name+'" class="admin-suspend-seller" style="padding:7px 16px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;color:var(--text3);cursor:pointer;font-size:13px;font-family:inherit">&#128683; Suspend</button>'
    + '</div></div></div>';
}


// ── ADMIN ACTIONS ─────────────────────────────────────────────────
async function adminToggleProduct(pid) {
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/products/'+pid+'/toggle', {method:'PATCH',headers:{'Authorization':'Bearer '+token}});
    var d = await r.json();
    showToast(d.message||'Updated', 'success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminDeleteProduct(pid, name) {
  if (!confirm('Delete "'+name+'"? This cannot be undone.')) return;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/products/'+pid, {method:'DELETE',headers:{'Authorization':'Bearer '+token}});
    var d = await r.json();
    showToast(d.message||'Deleted','success');
    delete PRODUCTS[pid];
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

function adminEditProduct(pid) {
  var p = window._adminProds && window._adminProds.find(function(x){return x.id===pid;});
  if (!p) { showToast('Product not found','error'); return; }
  var row = document.getElementById('aprow-'+pid);
  if (!row) return;
  window._editingPid = pid;
  window._editingImage = p.image || '';
  var imgHtml = p.image
    ? '<img src="'+p.image+'" style="width:100%;height:100%;object-fit:cover">'
    : '<span>'+(p.icon||'&#128230;')+'</span>';
  row.innerHTML = [
    '<div style="width:100%;padding:16px;background:var(--bg3);border-radius:10px;margin:4px 0">',
    '<div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap">',
    '<div id="ae_imgPreview" style="width:80px;height:80px;background:var(--bg4);border:2px dashed var(--border2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;overflow:hidden;flex-shrink:0">'+imgHtml+'</div>',
    '<div style="flex:1;min-width:160px">',
    '<input type="file" id="ae_imgFile" accept="image/*" style="display:none">',
    '<button type="button" id="ae_imgBtn" class="btn-ghost" style="width:100%;padding:8px;font-size:13px;margin-bottom:6px">&#128247; Upload Image</button>',
    '<input id="ae_imgUrl" placeholder="Or paste image URL" value="'+(p.image||'')+'" style="width:100%;padding:6px 10px;background:var(--bg4);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box">',
    '</div></div>',
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">',
    adminEditInput('Name', 'ae_name', p.name),
    adminEditInput('Price ₹', 'ae_price', p.price),
    adminEditInput('MRP ₹', 'ae_orig', p.orig||p.originalPrice||p.price),
    adminEditInput('Stock', 'ae_stock', p.stock||0),
    adminEditInput('Category', 'ae_cat', p.category||p.cat||''),
    adminEditInput('Brand', 'ae_brand', p.brand||''),
    '</div>',
    '<div style="display:flex;gap:8px">',
    '<button onclick="adminSaveProduct(\''+pid+'\')" class="btn-grad" style="padding:8px 16px;font-size:13px">&#10003; Save</button>',
    '<button onclick="renderAdminTabContent({})" style="padding:8px 16px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);cursor:pointer;font-family:inherit;font-size:13px">Cancel</button>',
    '</div></div>'
  ].join('');
  // Attach events after innerHTML set
  var btn = document.getElementById('ae_imgBtn');
  var fileInput = document.getElementById('ae_imgFile');
  if (btn && fileInput) {
    btn.onclick = function() { fileInput.click(); };
    fileInput.onchange = function() { adminUploadProductImage(fileInput, pid); };
  }
  var urlInput = document.getElementById('ae_imgUrl');
  if (urlInput) {
    urlInput.oninput = function() {
      window._editingImage = this.value;
      var prev = document.getElementById('ae_imgPreview');
      if (prev) prev.innerHTML = this.value ? '<img src="'+this.value+'" style="width:100%;height:100%;object-fit:cover">' : '<span>'+(p.icon||'&#128230;')+'</span>';
    };
  }
}

async function adminUploadProductImage(input, pid) {
  var file = input.files[0];
  if (!file) return;
  showToast('Uploading...', 'info');
  var token = localStorage.getItem('hb_token');
  var formData = new FormData();
  formData.append('image', file);
  try {
    var r = await fetch('/api/upload/product-image', {method:'POST',headers:{'Authorization':'Bearer '+token},body:formData});
    var d = await r.json();
    if (d.url) {
      window._editingImage = d.url;
      var prev = document.getElementById('ae_imgPreview');
      if (prev) prev.innerHTML = '<img src="'+d.url+'" style="width:100%;height:100%;object-fit:cover">';
      var urlInput = document.getElementById('ae_imgUrl');
      if (urlInput) urlInput.value = d.url;
      showToast('&#9989; Image uploaded!', 'success');
    } else { showToast(d.error||'Failed','error'); }
  } catch(e) { showToast('Error: '+e.message,'error'); }
}


async function adminUploadProductImage(input, pid) {
  var file = input.files[0];
  if (!file) return;
  showToast('Uploading image...', 'info');
  var token = localStorage.getItem('hb_token');
  var formData = new FormData();
  formData.append('image', file);
  try {
    var r = await fetch('/api/upload/product-image', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + token},
      body: formData
    });
    var d = await r.json();
    if (d.url) {
      window._editingImage = d.url;
      var prev = document.getElementById('ae_imgPreview');
      if (prev) prev.innerHTML = '<img src="'+d.url+'" style="width:100%;height:100%;object-fit:cover">';
      var urlInput = document.getElementById('ae_imgUrl');
      if (urlInput) urlInput.value = d.url;
      showToast('&#9989; Image uploaded!', 'success');
    } else {
      showToast(d.error || 'Upload failed', 'error');
    }
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}


function adminEditInput(label, id, val) {
  return '<div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:3px">'+label+'</label>'
    + '<input id="'+id+'" value="'+val+'" style="width:100%;padding:7px 10px;background:var(--bg4);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:inherit;font-size:13px;box-sizing:border-box"></div>';
}

async function adminSaveProduct(pid) {
  var token = localStorage.getItem('hb_token');
  var imgUrl = (document.getElementById('ae_imgUrl')||{value:''}).value || window._editingImage || '';
  var update = {
    name:  (document.getElementById('ae_name')||{value:''}).value,
    price: Number((document.getElementById('ae_price')||{value:0}).value),
    originalPrice: Number((document.getElementById('ae_orig')||{value:0}).value),
    orig:  Number((document.getElementById('ae_orig')||{value:0}).value),
    stock: Number((document.getElementById('ae_stock')||{value:0}).value),
    category: (document.getElementById('ae_cat')||{value:''}).value,
    cat:  (document.getElementById('ae_cat')||{value:''}).value,
    brand: (document.getElementById('ae_brand')||{value:''}).value,
    image: imgUrl,
  };
  try {
    var r = await fetch('/api/admin/products/'+pid, {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(update)});
    var d = await r.json();
    if (d.product) { PRODUCTS[pid] = Object.assign(PRODUCTS[pid]||{}, d.product); }
    showToast(d.message||'Product saved!','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminUpdateOrderStatus(oid, status) {
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/orders/'+oid+'/status', {method:'PATCH',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status})});
    var d = await r.json();
    showToast(d.message||'Status updated','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminUpdateReturn(rid, status) {
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/returns/'+rid+'/status', {method:'PATCH',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status})});
    var d = await r.json();
    showToast(d.message||'Return updated','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminChangeRole(uid, currentRole) {
  var roles = ['customer','seller','admin'];
  var newRole = prompt('Change role to (customer/seller/admin):', currentRole);
  if (!newRole || !roles.includes(newRole)) return;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/users/'+uid+'/role', {method:'PATCH',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({role:newRole})});
    var d = await r.json();
    showToast(d.message||'Role updated','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminSuspendUser(uid, name) {
  if (!confirm('Suspend '+name+'?')) return;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/users/'+uid+'/role', {method:'PATCH',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({suspended:true})});
    var d = await r.json();
    showToast(d.message||'User suspended','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function activateFlashSale() {
  var token = localStorage.getItem('hb_token');
  var discount = document.getElementById('flashDiscount').value;
  var label    = document.getElementById('flashLabel').value;
  var hours    = document.getElementById('flashHours').value;
  try {
    var r = await fetch('/api/admin/promotions/flash-sale', {method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({discount:Number(discount),label,durationHours:Number(hours)})});
    var d = await r.json();
    showToast(d.message||'Flash sale activated!','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function deactivateFlashSale() {
  var token = localStorage.getItem('hb_token');
  try {
    await fetch('/api/admin/promotions/flash-sale', {method:'DELETE',headers:{'Authorization':'Bearer '+token}});
    showToast('Flash sale deactivated','info');
    renderAdminTabContent({});
  } catch(e) { showToast('Error','error'); }
}

async function updateAnnouncement() {
  var token = localStorage.getItem('hb_token');
  var text = document.getElementById('announcementText').value;
  try {
    var r = await fetch('/api/admin/promotions', {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({announcement:text})});
    var d = await r.json();
    showToast('Announcement updated!','success');
  } catch(e) { showToast('Error','error'); }
}

async function updateFreeDelivery() {
  var token = localStorage.getItem('hb_token');
  var min = Number(document.getElementById('freeDeliveryMin').value);
  try {
    var r = await fetch('/api/admin/promotions', {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({freeDeliveryMin:min})});
    showToast('Free delivery minimum updated to ₹'+min,'success');
  } catch(e) { showToast('Error','error'); }
}

function adminFilterProducts(q) {
  var prods = window._adminProds || [];
  var filtered = q ? prods.filter(function(p){ return (p.name||'').toLowerCase().includes(q.toLowerCase())||(p.brand||'').toLowerCase().includes(q.toLowerCase()); }) : prods;
  var el = document.getElementById('adminProdList');
  if (el) el.innerHTML = filtered.map(function(p){ return adminProductRow(p); }).join('');
}

function adminFilterOrders(status) {
  var orders = window._adminOrders || [];
  var filtered = status==='all' ? orders : orders.filter(function(o){ return o.status===status; });
  var el = document.getElementById('adminOrderList');
  if (el) el.innerHTML = filtered.map(function(o){ return adminOrderRow(o); }).join('');
}

function adminFilterUsers(role) {
  var users = window._adminUsers || [];
  var filtered = role==='all' ? users : users.filter(function(u){ return u.role===role; });
  var el = document.getElementById('adminUserList');
  if (el) el.innerHTML = filtered.map(function(u){ return adminUserRow(u); }).join('');
}

async function saveWebsiteSettings() {
  showToast('Settings saved! (Refresh to see changes)', 'success');
}


async function uploadHeroBanner(input) {
  var file = input.files[0];
  if (!file) return;
  showToast('Uploading banner...', 'info');
  var token = localStorage.getItem('hb_token');
  var formData = new FormData();
  formData.append('image', file);
  try {
    var r = await fetch('/api/admin/hero-image', {
      method: 'POST',
      headers: {'Authorization': 'Bearer ' + token},
      body: formData
    });
    var d = await r.json();
    if (d.url) {
      showToast('Banner uploaded! Applying...', 'success');
      // Apply immediately
      var heroBg = document.querySelector('.hero-bg');
      if (heroBg) {
        heroBg.style.backgroundImage = 'url(' + d.url + ')';
        heroBg.style.backgroundSize = 'cover';
        heroBg.style.backgroundPosition = 'center';
        heroBg.classList.add('has-image');
      }
      renderAdminPanel();
    } else {
      showToast(d.error || 'Upload failed', 'error');
    }
  } catch(e) { showToast('Upload failed: ' + e.message, 'error'); }
}

async function clearHeroBanner() {
  var token = localStorage.getItem('hb_token');
  try {
    await fetch('/api/admin/promotions', {
      method: 'PUT',
      headers: {'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify({heroBgImage: ''})
    });
    var heroBg = document.querySelector('.hero-bg');
    if (heroBg) { heroBg.style.backgroundImage = ''; heroBg.classList.remove('has-image'); }
    showToast('Banner removed', 'info');
    renderAdminPanel();
  } catch(e) { showToast('Error', 'error'); }
}

async function saveHeroText() {
  var token = localStorage.getItem('hb_token');
  var data = {
    heroBadge:    (document.getElementById('s_heroBadge')||{value:''}).value,
    heroTitle:    (document.getElementById('s_heroTitle')||{value:''}).value,
    heroSubtitle: (document.getElementById('s_heroSubtitle')||{value:''}).value,
  };
  try {
    var r = await fetch('/api/admin/promotions', {
      method: 'PUT',
      headers: {'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    var d = await r.json();
    // Apply immediately
    var h1 = document.getElementById('heroH1El');
    var sub = document.getElementById('heroSubEl');
    var badge = document.getElementById('heroBadgeEl');
    if (h1) h1.innerHTML = data.heroTitle;
    if (sub) sub.innerHTML = data.heroSubtitle;
    if (badge) badge.textContent = data.heroBadge;
    showToast('Hero text updated!', 'success');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
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
function adminIconRow(id, emoji, label, key) {
  var currentUrl = (window.SITE_ICONS && window.SITE_ICONS[key]) || '';
  var imgHtml = currentUrl
    ? '<img src="'+currentUrl+'" style="width:100%;height:100%;object-fit:cover">'
    : '<span>'+emoji+'</span>';
  var viewLink = currentUrl
    ? '<a href="'+currentUrl+'" target="_blank" style="color:var(--blue)">View image</a>'
    : emoji+' (emoji)';
  var clearBtn = currentUrl
    ? '<button data-id="'+id+'" data-key="'+key+'" data-emoji="'+emoji+'" class="admin-clear-icon" style="padding:6px 10px;border:1px solid var(--red);background:transparent;border-radius:6px;color:var(--red);cursor:pointer;font-size:12px;font-family:inherit">&#128465;</button>'
    : '';
  return '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg4);border-radius:8px;flex-wrap:wrap">'
    + '<div style="width:44px;height:44px;background:var(--bg3);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;overflow:hidden;flex-shrink:0">'+imgHtml+'</div>'
    + '<div style="flex:1;min-width:160px">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:4px">'+label+'</div>'
    + '<div style="font-size:11px;color:var(--text3);margin-bottom:6px">Current: '+viewLink+'</div>'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
    + '<button data-id="'+id+'" data-key="'+key+'" data-emoji="'+emoji+'" class="admin-upload-icon btn-ghost" style="padding:6px 12px;font-size:12px">&#128247; Upload</button>'
    + '<input data-key="'+key+'" class="admin-icon-url" placeholder="Paste URL" value="'+currentUrl+'" style="padding:6px 10px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:inherit;font-size:12px;width:160px">'
    + '<button data-id="'+id+'" data-key="'+key+'" class="admin-save-icon" style="padding:6px 12px;background:var(--green);border:none;border-radius:6px;color:#000;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit">&#10003;</button>'
    + clearBtn
    + '</div></div>';
}

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

async function adminSaveIconFromInput(id, key, url) {
  await adminSaveIconToServer(key, url.trim());
  window.SITE_ICONS[key] = url.trim();
  applyIconToPage(key, url.trim());
  showToast('Icon saved!', 'success');
  renderAdminTabContent({});
}

window.SITE_ICONS = window.SITE_ICONS || {};

async function adminUploadIcon(id, key, emoji) {
  var input = document.getElementById('icon_file_'+id);
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
  }
  input.onchange = async function() {
    var file = input.files[0];
    if (!file) return;
    showToast('Uploading icon...', 'info');
    var token = localStorage.getItem('hb_token');
    var formData = new FormData();
    formData.append('image', file);
    try {
      var r = await fetch('/api/upload/product-image', {method:'POST',headers:{'Authorization':'Bearer '+token},body:formData});
      var d = await r.json();
      if (d.url) {
        await adminSaveIconToServer(key, d.url);
        window.SITE_ICONS[key] = d.url;
        applyIconToPage(key, d.url);
        showToast('&#9989; Icon uploaded and applied!', 'success');
        // Refresh icons tab
        var el = document.getElementById('adminTabContent');
        if (el) renderAdminTabContent({});
      } else { showToast(d.error||'Failed','error'); }
    } catch(e) { showToast('Error: '+e.message,'error'); }
  };
  input.click();
}

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

async function adminClearIcon(id, key, emoji) {
  await adminSaveIconToServer(key, '');
  window.SITE_ICONS[key] = '';
  applyIconToPage(key, '');
  showToast('Icon cleared, using emoji', 'info');
  renderAdminTabContent({});
}

async function adminSaveIconToServer(key, url) {
  var token = localStorage.getItem('hb_token');
  var icons = window.SITE_ICONS || {};
  icons[key] = url;
  try {
    await fetch('/api/admin/promotions', {
      method: 'PUT',
      headers: {'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify({siteIcons: icons})
    });
  } catch(e) { console.warn('Icon save error:', e); }
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
function sellerOrderCardFull(o) {
  var addr = typeof o.address === 'object'
    ? ((o.address.name||'') + ', ' + (o.address.line1||'') + ', ' + (o.address.city||'') + ' ' + (o.address.pincode||''))
    : (o.address || '');
  
  var statusColors = {
    processing:'var(--yellow)', accepted:'var(--blue)', packed:'var(--blue)',
    shipped:'var(--green)', out_for_delivery:'var(--green)', delivered:'var(--green)',
    cancelled:'var(--red)'
  };
  var color = statusColors[o.status] || 'var(--text3)';

  // Timeline
  var timelineHtml = '';
  var steps = [
    {key:'accepted', label:'Order Accepted', icon:'✅'},
    {key:'packed',   label:'Order Packed',   icon:'📦'},
    {key:'shipped',  label:'Shipped',         icon:'🚚'},
    {key:'out_for_delivery', label:'Out for Delivery', icon:'🏃'},
    {key:'delivered', label:'Delivered',     icon:'🎉'},
  ];
  var timeline = o.timeline || [];
  var doneStatuses = timeline.map(function(t){ return t.status; });

  timelineHtml = '<div style="display:flex;gap:0;margin:14px 0;overflow-x:auto;padding-bottom:4px">'
    + steps.map(function(step, idx) {
        var done = doneStatuses.includes(step.key) || o.status === step.key;
        var event = timeline.find(function(t){ return t.status === step.key; });
        return '<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:70px">'
          + '<div style="width:32px;height:32px;border-radius:50%;background:'+(done?'var(--green)':'var(--bg4)')+';border:2px solid '+(done?'var(--green)':'var(--border)')+';display:flex;align-items:center;justify-content:center;font-size:14px;z-index:1">'
          + (done ? step.icon : '<span style="color:var(--text3);font-size:16px">○</span>')
          + '</div>'
          + (idx < steps.length-1 ? '<div style="position:absolute;left:calc(50% + 16px);top:16px;width:calc(100% - 32px);height:2px;background:'+(done?'var(--green)':'var(--border)')+'"></div>' : '')
          + '<div style="font-size:10px;color:'+(done?'var(--text)':'var(--text3)')+';text-align:center;margin-top:4px;font-weight:'+(done?'600':'400')+'">'+step.label+'</div>'
          + (event ? '<div style="font-size:9px;color:var(--text3)">'+event.timestamp.substring(0,10)+'</div>' : '')
          + '</div>';
      }).join('')
    + '</div>';

  // Tracking info
  var trackingHtml = o.trackingNumber
    ? '<div style="background:var(--bg4);border-radius:8px;padding:10px;margin:10px 0;font-size:13px">'
      + '&#128666; <strong>Tracking:</strong> ' + o.trackingNumber
      + (o.courierName ? ' via ' + o.courierName : '')
      + '</div>'
    : '';

  return '<div id="sorder-'+o.id+'" style="background:var(--bg4);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">'
    + '<div>'
    + '<div style="font-weight:700;font-size:14px">#'+(o.orderId||o.id)+'</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:2px">'+(o.createdAt||'').toString().substring(0,10)+'</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:2px">&#128205; '+addr.substring(0,50)+'</div>'
    + '</div>'
    + '<div style="text-align:right">'
    + '<span style="background:rgba(0,200,83,.1);color:'+color+';padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600">'+o.status+'</span>'
    + '<div style="font-weight:800;font-size:16px;margin-top:4px">&#8377;'+(o.total||0).toLocaleString('en-IN')+'</div>'
    + '</div></div>'
    + timelineHtml
    + trackingHtml
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'
    + '<button onclick="selUpdateOrderStatus(\''+o.id+'\',\''+o.orderId+'\')" style="padding:7px 14px;background:var(--green);border:none;border-radius:8px;color:#000;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">&#9998; Update Status</button>'
    + '<button onclick="selUpdatePickupAddress(\''+o.id+'\')" style="padding:7px 14px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;color:var(--text);cursor:pointer;font-size:13px;font-family:inherit">&#128205; Pickup Address</button>'
    + '</div></div>';
}

// ── SELLER ORDER STATUS UPDATE ────────────────────────────────────
function selUpdateOrderStatus(oid, orderId) {
  var statusOptions = ['accepted','packed','shipped','out_for_delivery','delivered','cancelled'];
  var html = '<div style="padding:20px;background:var(--bg3);border-radius:14px;max-width:400px">'
    + '<h4 style="font-weight:700;margin-bottom:16px">&#9998; Update Order #'+(orderId||oid)+'</h4>'
    + '<div style="margin-bottom:12px">'
    + '<label style="font-size:13px;color:var(--text3);display:block;margin-bottom:6px">New Status</label>'
    + '<select id="newOrderStatus" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;font-size:14px">'
    + statusOptions.map(function(s){ return '<option value="'+s+'">'+s+'</option>'; }).join('')
    + '</select></div>'
    + '<div style="margin-bottom:12px">'
    + '<label style="font-size:13px;color:var(--text3);display:block;margin-bottom:6px">Tracking Number (optional)</label>'
    + '<input id="trackingNum" placeholder="e.g. BD123456789IN" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box">'
    + '</div>'
    + '<div style="margin-bottom:16px">'
    + '<label style="font-size:13px;color:var(--text3);display:block;margin-bottom:6px">Courier Name (optional)</label>'
    + '<input id="courierName" placeholder="e.g. BlueDart, Delhivery" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box">'
    + '</div>'
    + '<div style="display:flex;gap:10px">'
    + '<button onclick="confirmSelOrderStatus(\''+oid+'\')" class="btn-grad" style="flex:1;padding:12px">Confirm Update</button>'
    + '<button onclick="closeModal()" style="flex:1;padding:12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);cursor:pointer;font-family:inherit">Cancel</button>'
    + '</div></div>';
  showModal(html);
}

async function confirmSelOrderStatus(oid) {
  var status  = (document.getElementById('newOrderStatus')||{value:''}).value;
  var tracking = (document.getElementById('trackingNum')||{value:''}).value;
  var courier  = (document.getElementById('courierName')||{value:''}).value;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/seller/orders/'+oid+'/status', {
      method: 'PATCH',
      headers: {'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({status, trackingNumber:tracking, courierName:courier})
    });
    var d = await r.json();
    if (d.order || d.message) {
      closeModal();
      showToast(d.message || 'Status updated!', 'success');
      switchSelTab('orders');
    } else {
      showToast(d.error || 'Failed', 'error');
    }
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

// ── SELLER PICKUP ADDRESS ─────────────────────────────────────────
function selUpdatePickupAddress(oid) {
  var html = '<div style="padding:20px;background:var(--bg3);border-radius:14px;max-width:400px">'
    + '<h4 style="font-weight:700;margin-bottom:16px">&#128205; Update Pickup Address</h4>'
    + '<div style="display:grid;gap:10px">'
    + '<input id="pa_name" placeholder="Contact Name" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box">'
    + '<input id="pa_phone" placeholder="Phone Number" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box">'
    + '<input id="pa_line1" placeholder="Address Line 1" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box">'
    + '<input id="pa_city" placeholder="City" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box">'
    + '<input id="pa_state" placeholder="State" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box">'
    + '<input id="pa_pin" placeholder="Pincode" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box">'
    + '</div>'
    + '<div style="display:flex;gap:10px;margin-top:16px">'
    + '<button onclick="confirmPickupAddress(\''+oid+'\')" class="btn-grad" style="flex:1;padding:12px">Save Address</button>'
    + '<button onclick="closeModal()" style="flex:1;padding:12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);cursor:pointer;font-family:inherit">Cancel</button>'
    + '</div></div>';
  showModal(html);
}

async function confirmPickupAddress(oid) {
  var addr = {
    name:  (document.getElementById('pa_name')||{value:''}).value,
    phone: (document.getElementById('pa_phone')||{value:''}).value,
    line1: (document.getElementById('pa_line1')||{value:''}).value,
    city:  (document.getElementById('pa_city')||{value:''}).value,
    state: (document.getElementById('pa_state')||{value:''}).value,
    pincode: (document.getElementById('pa_pin')||{value:''}).value,
  };
  if (!addr.line1 || !addr.city) { showToast('Address and city required','error'); return; }
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/seller/orders/'+oid+'/pickup-address', {
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({pickupAddress: addr})
    });
    var d = await r.json();
    closeModal();
    showToast(d.message || 'Pickup address updated!', 'success');
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

// ── BRAND APPROVAL ────────────────────────────────────────────────
function renderBrandApproval(el) {
  el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:6px">&#127978; Brand Approval</h4>'
    + '<p style="color:var(--text3);font-size:13px;margin-bottom:20px">Submit your brand documents for verification. Approved brands get a verified badge.</p>'
    + '<div style="display:grid;gap:14px">'
    + brandDocRow('trademark', '&#174;', 'Trademark Certificate', 'PDF/JPG - Official trademark registration document')
    + brandDocRow('authorization', '&#128196;', 'Brand Authorization Letter', 'PDF/JPG - Letter from brand owner authorizing you to sell')
    + brandDocRow('invoice', '&#129534;', 'Purchase Invoice', 'PDF/JPG - Invoice showing you purchased from brand')
    + '</div>'
    + '<button onclick="submitBrandDocs()" class="btn-grad" style="margin-top:20px;padding:12px 28px">&#128228; Submit for Review</button>'
    + '<p style="font-size:12px;color:var(--text3);margin-top:10px">Review takes 2-3 business days. Documents are kept private and secure.</p>'
    + '</div>';
}

function brandDocRow(field, icon, label, hint) {
  return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<div style="font-size:2rem">'+icon+'</div>'
    + '<div style="flex:1;min-width:150px">'
    + '<div style="font-weight:600;font-size:14px">'+label+'</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:2px">'+hint+'</div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;align-items:center">'
    + '<input type="file" id="doc_'+field+'" accept=".pdf,.jpg,.jpeg,.png" style="display:none">'
    + '<button onclick="document.getElementById(\'doc_'+field+'\').click()" class="btn-ghost" style="padding:7px 14px;font-size:13px">&#128196; Choose File</button>'
    + '<span id="doc_'+field+'_name" style="font-size:12px;color:var(--text3)">No file chosen</span>'
    + '</div></div>';
}

async function submitBrandDocs() {
  var formData = new FormData();
  var hasFile = false;
  ['trademark','authorization','invoice'].forEach(function(field) {
    var input = document.getElementById('doc_'+field);
    if (input && input.files[0]) {
      formData.append(field, input.files[0]);
      hasFile = true;
    }
  });
  if (!hasFile) { showToast('Please select at least one document','error'); return; }
  showToast('Uploading documents...','info');
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/seller/brand/documents', {
      method:'POST',
      headers:{'Authorization':'Bearer '+token},
      body: formData
    });
    var d = await r.json();
    if (d.message) {
      showToast(d.message, 'success');
      switchSelTab('brand');
    } else {
      showToast(d.error || 'Upload failed','error');
    }
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

// ── FILTER SELLER ORDERS ──────────────────────────────────────────
function selFilterOrders(status) {
  var orders = window._selOrders || [];
  var filtered = status === 'all' ? orders : orders.filter(function(o){ return o.status === status; });
  var el = document.getElementById('selOrderList');
  if (el) el.innerHTML = filtered.length
    ? filtered.map(function(o){ return sellerOrderCardFull(o); }).join('')
    : '<p style="color:var(--text3)">No orders with status: '+status+'</p>';
}

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

async function adminApproveSeller(uid, name) {
  if (!confirm('Approve brand for ' + name + '?')) return;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/sellers/'+uid+'/approve', {
      method: 'PATCH',
      headers: {'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify({approved: true})
    });
    var d = await r.json();
    showToast(d.message || name + ' brand approved!', 'success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminDisapproveSeller(uid, name) {
  if (!confirm('Disapprove brand for ' + name + '?')) return;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/sellers/'+uid+'/approve', {
      method: 'PATCH',
      headers: {'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify({approved: false})
    });
    var d = await r.json();
    showToast(d.message || name + ' brand disapproved', 'info');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminSaveCommission(uid) {
  var input = document.getElementById('comm_'+uid);
  if (!input) return;
  var commission = Number(input.value);
  if (commission < 1 || commission > 50) { showToast('Commission must be 1-50%','error'); return; }
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/sellers/'+uid+'/commission', {
      method: 'PATCH',
      headers: {'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      body: JSON.stringify({commission})
    });
    var d = await r.json();
    showToast(d.message || 'Commission updated to '+commission+'%', 'success');
  } catch(e) { showToast('Error: '+e.message,'error'); }
}
