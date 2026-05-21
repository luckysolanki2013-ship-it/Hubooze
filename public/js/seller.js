/**
 * HUBOOZE — Seller Dashboard
 * All seller functionality in one clean file
 */

'use strict';

// ── STATE ─────────────────────────────────────────────────────────
var sellerTabActive = window.sellerTabActive || 'overview';
var sellerEditProductId = null;

// ── MAIN RENDER ───────────────────────────────────────────────────
async function renderSellerPage() {
  var el = document.getElementById('sellerContentEl');
  if (!el) return;
  if (!currentUser || currentUser.role !== 'seller') {
    el.innerHTML = '<div style="text-align:center;padding:48px"><div style="font-size:3rem">🔒</div><h3>Seller Access Only</h3></div>';
    return;
  }

  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3)">Loading dashboard...</div>';

  // Always reload products from API
  await loadProductsFromAPI();

  var token = localStorage.getItem('hb_token');
  var headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  // Fetch dashboard data
  var data = {};
  try {
    var r = await fetch('/api/seller/dashboard', { headers: headers });
    data = await r.json();
  } catch(e) {}

  var stats = data.stats || {};

  // Stat cards
  var statsHtml = '<div class="sel-stat-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:20px">'
    + selStat('📦', stats.totalProducts||0, 'Products', 'var(--blue)')
    + selStat('🛒', stats.totalOrders||0, 'Orders', 'var(--green)')
    + selStat('⏳', stats.pendingOrders||0, 'Pending', 'var(--yellow)')
    + selStat('₹', '₹'+(stats.netPayout||0).toLocaleString('en-IN'), 'Net Payout', 'var(--green)')
    + selStat('↩️', stats.totalReturns||0, 'Returns', 'var(--red)')
    + '</div>';

  // Tabs
  var tabs = [
    {id:'overview',     label:'📊 Overview'},
    {id:'products',     label:'📦 My Products'},
    {id:'orders',       label:'🛒 Orders'},
    {id:'returns',      label:'↩️ Returns'},
    {id:'add_product',  label:'➕ Add Product'},
    {id:'payouts',      label:'💰 Payouts'},
    {id:'brand',        label:'🏪 Brand Approval'},
    {id:'bank',         label:'🏦 Bank Details'},
  ];

  var tabsHtml = '<div class="sel-tabs" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">'
    + tabs.map(function(t) {
        var active = sellerTabActive === t.id;
        return '<button onclick="switchSelTab(\'' + t.id + '\')" class="sel-tab'+(active?' active':'')+'" style="padding:8px 14px;border-radius:20px;border:1px solid '+(active?'var(--green)':'var(--border)')+';background:'+(active?'var(--green)':'var(--bg3)')+';color:'+(active?'#000':'var(--text)')+';cursor:pointer;font-size:13px;font-family:inherit;font-weight:'+(active?'700':'400')+'">'+t.label+'</button>';
      }).join('')
    + '</div>';

  el.innerHTML = statsHtml + tabsHtml + '<div id="selTabInner"></div>';
  renderSellerTabFromData(data, headers);
}

function switchSelTab(tab) {
  sellerTabActive = tab;
  window.sellerTabActive = tab;
  renderSellerPage();
}

function selStat(icon, val, label, color) {
  return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px;text-align:center">'
    + '<div style="font-size:1.4rem;margin-bottom:4px">' + icon + '</div>'
    + '<div style="font-size:18px;font-weight:900;color:' + color + '">' + val + '</div>'
    + '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + label + '</div>'
    + '</div>';
}

// ── TAB CONTENT ───────────────────────────────────────────────────
async function renderSellerTabFromData(data, headers) {
  var el = document.getElementById('selTabInner');
  if (!el) return;

  if (!headers) {
    var token = localStorage.getItem('hb_token');
    headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  }

  var stats = data.stats || {};

  if (sellerTabActive === 'overview') {
    var recentOrders = data.recentOrders || [];
    el.innerHTML = '<div style="display:grid;gap:16px">'
      + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:20px">'
      + '<h4 style="font-weight:700;margin-bottom:14px">📈 Quick Stats</h4>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
      + '<div><div style="color:var(--text3);font-size:13px">Total Revenue</div><div style="font-size:20px;font-weight:800;color:var(--green)">₹'+(stats.totalRevenue||0).toLocaleString('en-IN')+'</div></div>'
      + '<div><div style="color:var(--text3);font-size:13px">Net Payout (90%)</div><div style="font-size:20px;font-weight:800;color:var(--blue)">₹'+(stats.netPayout||0).toLocaleString('en-IN')+'</div></div>'
      + '</div></div>'
      + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:20px">'
      + '<h4 style="font-weight:700;margin-bottom:14px">🕐 Recent Orders</h4>'
      + (recentOrders.length ? recentOrders.slice(0,5).map(function(o){
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:6px">'
            + '<div><div style="font-weight:600">#'+(o.orderId||o.id)+'</div><div style="font-size:12px;color:var(--text3)">'+(o.createdAt||'').toString().substring(0,10)+'</div></div>'
            + '<div style="display:flex;align-items:center;gap:8px"><span style="padding:3px 10px;border-radius:12px;font-size:12px;background:var(--bg4)">'+o.status+'</span><span style="font-weight:700">₹'+(o.total||0).toLocaleString('en-IN')+'</span></div>'
            + '</div>';
        }).join('') : '<p style="color:var(--text3)">No orders yet.</p>')
      + '</div></div>';

  } else if (sellerTabActive === 'products') {
    // Always fetch fresh from API
    var prods = [];
    try {
      var r = await fetch('/api/seller/products', {headers:headers});
      var d = await r.json();
      prods = d.products || [];
      prods.forEach(function(p){ p.orig=p.orig||p.originalPrice||p.price; p.cat=p.cat||p.category; if(window.PRODUCTS) window.PRODUCTS[p.id]=p; });
    } catch(e) { prods = Object.values(window.PRODUCTS||{}).filter(function(p){return p.sellerId===currentUser.id;}); }

    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
      + '<h4 style="font-weight:700">My Products (' + prods.length + ')</h4>'
      + '<button onclick="switchSelTab(\'add_product\')" class="btn-grad" style="padding:8px 16px;font-size:13px">➕ Add Product</button>'
      + '</div>'
      + (prods.length ? prods.map(sellerProductRow).join('') : '<p style="color:var(--text3)">No products yet. Add your first product!</p>')
      + '</div>';

  } else if (sellerTabActive === 'orders') {
    var orders = [];
    try {
      var r = await fetch('/api/seller/orders', {headers:headers});
      var d = await r.json();
      orders = d.orders || [];
    } catch(e) {}
    window._selOrders = orders;

    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
      + '<h4 style="font-weight:700;margin-bottom:16px">🛒 My Orders (' + orders.length + ')</h4>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
      + ['all','accepted','packed','shipped','out_for_delivery','delivered','cancelled'].map(function(s){
          return '<button data-sf="'+s+'" class="sel-order-filter" style="padding:5px 12px;border-radius:14px;border:1px solid var(--border);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+s+'</button>';
        }).join('')
      + '</div>'
      + '<div id="selOrderList">'
      + (orders.length ? orders.map(sellerOrderCardFull).join('') : '<p style="color:var(--text3)">No orders yet.</p>')
      + '</div></div>';

  } else if (sellerTabActive === 'returns') {
    var returns = [];
    try {
      var r = await fetch('/api/seller/orders', {headers:headers});
      var d = await r.json();
      returns = (d.orders||[]).filter(function(o){return o.status==='return_initiated'||o.status==='returned';});
    } catch(e) {}
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px">'
      + '<h4 style="font-weight:700;margin-bottom:16px">↩️ Returns (' + returns.length + ')</h4>'
      + (returns.length ? returns.map(function(r){
          return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">'
            + '<div style="font-weight:700">#'+(r.orderId||r.id)+'</div>'
            + '<div style="font-size:12px;color:var(--text3)">'+(r.createdAt||'').toString().substring(0,10)+' • '+r.status+'</div>'
            + '</div>';
        }).join('') : '<p style="color:var(--text3)">No returns yet.</p>')
      + '</div>';

  } else if (sellerTabActive === 'add_product') {
    renderSelAddProduct(el);

  } else if (sellerTabActive === 'payouts') {
    var payouts = {};
    try {
      var r = await fetch('/api/seller/payouts', {headers:headers});
      payouts = await r.json();
    } catch(e) {}
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
      + '<h4 style="font-weight:700;margin-bottom:16px">💰 Payout Summary</h4>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">'
      + '<div style="background:var(--bg4);border-radius:10px;padding:14px"><div style="color:var(--text3);font-size:12px">Total Revenue</div><div style="font-size:22px;font-weight:800;color:var(--green)">₹'+(payouts.totalRevenue||0).toLocaleString('en-IN')+'</div></div>'
      + '<div style="background:var(--bg4);border-radius:10px;padding:14px"><div style="color:var(--text3);font-size:12px">Platform Fee (10%)</div><div style="font-size:22px;font-weight:800;color:var(--red)">₹'+(payouts.platformFee||0).toLocaleString('en-IN')+'</div></div>'
      + '<div style="background:var(--bg4);border-radius:10px;padding:14px"><div style="color:var(--text3);font-size:12px">Net Payout</div><div style="font-size:22px;font-weight:800;color:var(--blue)">₹'+(payouts.netPayout||0).toLocaleString('en-IN')+'</div></div>'
      + '<div style="background:var(--bg4);border-radius:10px;padding:14px"><div style="color:var(--text3);font-size:12px">Next Payout</div><div style="font-size:16px;font-weight:700">'+(payouts.nextPayoutDate||'Every Monday')+'</div></div>'
      + '</div>'
      + '<button onclick="switchSelTab(\'bank\')" class="btn-ghost" style="padding:10px 20px">🏦 Add/Update Bank Details</button>'
      + '</div>';

  } else if (sellerTabActive === 'brand') {
    await renderBrandApproval(el);

  } else if (sellerTabActive === 'bank') {
    renderSellerBankForm(el);
  }
}

// ── PRODUCT ROW ───────────────────────────────────────────────────
function sellerProductRow(p) {
  var imgHtml = p.image
    ? '<img src="'+p.image+'" style="width:48px;height:48px;object-fit:cover;border-radius:8px">'
    : '<span style="font-size:2rem">'+(p.icon||'📦')+'</span>';

  return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">'
    + '<div style="width:48px;height:48px;background:var(--bg4);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">'+imgHtml+'</div>'
    + '<div style="flex:1;min-width:160px">'
    + '<div style="font-weight:600;font-size:14px">'+p.name+'</div>'
    + '<div style="font-size:12px;color:var(--text3)">'+(p.brand||'')+' • '+(p.cat||p.category||'')+' • Stock: '+(p.stock||0)+'</div>'
    + '</div>'
    + '<div style="text-align:right">'
    + '<div style="font-weight:700">₹'+p.price+'</div>'
    + (p.orig && p.orig > p.price ? '<div style="font-size:12px;color:var(--text3);text-decoration:line-through">₹'+p.orig+'</div>' : '')
    + '<div style="font-size:11px;color:var(--green)">'+(p.orig && p.orig > p.price ? Math.round((1-p.price/p.orig)*100)+'% off' : '')+'</div>'
    + '</div>'
    + '<div style="display:flex;gap:8px">'
    + '<button data-pid="'+p.id+'" class="sel-edit-prod" style="padding:6px 12px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">✏️ Edit</button>'
    + '<button data-pid="'+p.id+'" class="sel-toggle-prod" style="padding:6px 12px;background:var(--bg3);border:1px solid '+(p.listed!==false?'var(--red)':'var(--green)')+';border-radius:6px;color:'+(p.listed!==false?'var(--red)':'var(--green)')+';cursor:pointer;font-size:12px;font-family:inherit">'+(p.listed!==false?'✕ Unlist':'✓ List')+'</button>'
    + '</div></div>';
}

// ── ORDER CARD WITH TIMELINE ──────────────────────────────────────
function sellerOrderCardFull(o) {
  var addr = typeof o.address === 'object'
    ? ((o.address.name||'')+', '+(o.address.line1||'')+', '+(o.address.city||'')+' '+(o.address.pincode||''))
    : (o.address||'');

  var steps = [
    {key:'accepted',         label:'Accepted',        icon:'✅'},
    {key:'packed',           label:'Packed',          icon:'📦'},
    {key:'shipped',          label:'Shipped',         icon:'🚚'},
    {key:'out_for_delivery', label:'Out for Delivery', icon:'🏃'},
    {key:'delivered',        label:'Delivered',       icon:'🎉'},
  ];
  var timeline = o.timeline || [];
  var doneStatuses = timeline.map(function(t){return t.status;});

  var timelineHtml = '<div style="display:flex;gap:0;margin:14px 0;overflow-x:auto;padding-bottom:4px">'
    + steps.map(function(step) {
        var done = doneStatuses.includes(step.key) || o.status===step.key;
        var event = timeline.find(function(t){return t.status===step.key;});
        return '<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:60px">'
          + '<div style="width:32px;height:32px;border-radius:50%;background:'+(done?'var(--green)':'var(--bg4)')+';border:2px solid '+(done?'var(--green)':'var(--border)')+';display:flex;align-items:center;justify-content:center;font-size:14px">'+(done?step.icon:'○')+'</div>'
          + '<div style="font-size:10px;color:'+(done?'var(--text)':'var(--text3)')+';text-align:center;margin-top:4px;font-weight:'+(done?'600':'400')+'">'+step.label+'</div>'
          + (event ? '<div style="font-size:9px;color:var(--text3)">'+event.timestamp.substring(0,10)+'</div>' : '')
          + '</div>';
      }).join('')
    + '</div>';

  var trackingHtml = o.trackingNumber
    ? '<div style="background:var(--bg4);border-radius:8px;padding:10px;margin:10px 0;font-size:13px">🚚 <strong>Tracking:</strong> '+o.trackingNumber+(o.courierName?' via '+o.courierName:'')+'</div>'
    : '';

  return '<div id="sorder-'+o.id+'" style="background:var(--bg4);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">'
    + '<div>'
    + '<div style="font-weight:700;font-size:14px">#'+(o.orderId||o.id)+'</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:2px">'+(o.createdAt||'').toString().substring(0,10)+'</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:2px">📍 '+addr.substring(0,50)+'</div>'
    + '</div>'
    + '<div style="text-align:right">'
    + '<span style="padding:4px 10px;border-radius:12px;font-size:12px;font-weight:600;background:var(--bg3)">'+o.status+'</span>'
    + '<div style="font-weight:800;font-size:16px;margin-top:4px">₹'+(o.total||0).toLocaleString('en-IN')+'</div>'
    + '</div></div>'
    + timelineHtml + trackingHtml
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'
    + '<button data-oid="'+o.id+'" data-orderid="'+(o.orderId||o.id)+'" class="sel-update-status" style="padding:7px 14px;background:var(--green);border:none;border-radius:8px;color:#000;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">✏️ Update Status</button>'
    + '<button data-oid="'+o.id+'" class="sel-pickup-addr" style="padding:7px 14px;background:var(--bg3);border:1px solid var(--border2);border-radius:8px;color:var(--text);cursor:pointer;font-size:13px;font-family:inherit">📍 Pickup Address</button>'
    + '</div></div>';
}

// ── ADD PRODUCT FORM ──────────────────────────────────────────────
function renderSelAddProduct(el) {
  var ep = sellerEditProductId ? (window.PRODUCTS && window.PRODUCTS[sellerEditProductId]) : null;

  el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:20px">'+(ep?'✏️ Edit Product':'➕ Add New Product')+'</h4>'
    + '<div style="display:grid;gap:14px">'

    // Basic info
    + formField('Product Name *', 'np_name', 'text', ep?ep.name:'', 'e.g. Floral Kurti', true)
    + formField('Brand Name *', 'np_brand', 'text', ep?ep.brand:'', 'e.g. EthniCraft', true)
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">'
    + formField('Selling Price ₹ *', 'np_price', 'number', ep?ep.price:'', '299', true)
    + formField('MRP ₹ *', 'np_orig', 'number', ep?( ep.orig||ep.originalPrice||ep.price):'', '499', true)
    + '</div>'
    + formField('Stock Quantity *', 'np_stock', 'number', ep?ep.stock:'', '10', true)

    // Category
    + '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Category *</label>'
    + '<select id="np_cat" style="width:100%;padding:10px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-size:14px;font-family:inherit">'
    + ['fashion','electronics','home','daily','handmade','beauty','sports','books','other'].map(function(c){
        return '<option value="'+c+'"'+(ep&&ep.category===c?' selected':'')+'>'+c.charAt(0).toUpperCase()+c.slice(1)+'</option>';
      }).join('')
    + '</select></div>'

    + formField('Description', 'np_desc', 'textarea', ep?ep.description:'', 'Describe your product...', false)
    + formField('Available Sizes (comma separated)', 'np_sizes', 'text', ep&&ep.sizes?(ep.sizes.join(', ')):'', 'XS, S, M, L, XL', false)

    // Badge & Eco
    + '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">'
    + '<div style="flex:1;min-width:150px"><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Product Badge</label>'
    + '<select id="np_badge" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit">'
    + ['','NEW','HOT','SALE','BESTSELLER','ECO','LIMITED'].map(function(b){return '<option value="'+b+'"'+(ep&&ep.badge===b?' selected':'')+'>'+( b||'No Badge')+'</option>';}).join('')
    + '</select></div>'
    + '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px"><input type="checkbox" id="np_eco"'+(ep&&ep.eco?' checked':'')+' style="width:18px;height:18px"> ♻️ Mark as Eco/Recrafted</label>'
    + '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px"><input type="checkbox" id="np_listed"'+((!ep||ep.listed!==false)?' checked':'')+' style="width:18px;height:18px"> ✅ List immediately</label>'
    + '</div>'

    // Image upload
    + '<div>'
    + '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:8px">Product Image</label>'
    + '<div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">'
    + '<div id="prodImgPreview" style="width:88px;height:88px;background:var(--bg4);border:2px dashed var(--border2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:2.6rem;flex-shrink:0;overflow:hidden">'
    + (ep&&ep.image ? '<img src="'+ep.image+'" style="width:100%;height:100%;object-fit:cover">' : (ep&&ep.icon||'📦'))
    + '</div>'
    + '<div style="flex:1;min-width:180px">'
    + '<input type="file" id="selProdImageFile" accept="image/*" style="display:none">'
    + '<button type="button" id="selProdImgBtn" class="btn-ghost" style="width:100%;padding:10px;font-size:13px;margin-bottom:8px">📷 Upload Photo</button>'
    + '<select id="selProdIcon" style="width:100%;padding:8px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-size:13px;font-family:inherit">'
    + '<option value="">-- Or pick emoji icon --</option>'
    + ['📦','👗','📱','🏠','🌿','💄','⚽','📚','🛍️','💍'].map(function(e){return '<option value="'+e+'"'+(ep&&ep.icon===e?' selected':'')+'>'+e+'</option>';}).join('')
    + '</select>'
    + '</div></div></div>'

    // Submit
    + '</div>'
    + '<div style="display:flex;gap:12px;margin-top:20px">'
    + '<button id="selSubmitBtn" class="btn-grad" style="flex:1;padding:14px;font-size:15px">List Product →</button>'
    + '<button onclick="switchSelTab(\'products\')" style="padding:14px 20px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);cursor:pointer;font-family:inherit;font-size:14px">Cancel</button>'
    + '</div></div>';

  // Attach events
  setTimeout(function() {
    var imgBtn  = document.getElementById('selProdImgBtn');
    var imgFile = document.getElementById('selProdImageFile');
    var submitBtn = document.getElementById('selSubmitBtn');
    if (imgBtn && imgFile) {
      imgBtn.onclick = function() { imgFile.click(); };
      imgFile.onchange = function() { uploadProductImage(imgFile); };
    }
    if (submitBtn) submitBtn.onclick = saveSellerProduct;
  }, 50);
}

function formField(label, id, type, val, placeholder, required) {
  var style = 'width:100%;padding:10px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-size:14px;font-family:inherit;box-sizing:border-box';
  var input = type === 'textarea'
    ? '<textarea id="'+id+'" placeholder="'+placeholder+'" style="'+style+';height:80px;resize:vertical">'+(val||'')+'</textarea>'
    : '<input type="'+type+'" id="'+id+'" value="'+(val||'')+'" placeholder="'+placeholder+'" style="'+style+'">';
  return '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">'+label+'</label>'+input+'</div>';
}

// ── SAVE PRODUCT ──────────────────────────────────────────────────
async function saveSellerProduct() {
  if (!currentUser) return;
  var name    = (document.getElementById('np_name')||{value:''}).value.trim();
  var brand   = (document.getElementById('np_brand')||{value:''}).value.trim();
  var price   = parseInt((document.getElementById('np_price')||{value:'0'}).value)||0;
  var orig    = parseInt((document.getElementById('np_orig')||{value:'0'}).value)||0;
  var stock   = parseInt((document.getElementById('np_stock')||{value:'0'}).value)||0;
  var cat     = (document.getElementById('np_cat')||{value:'other'}).value;
  var desc    = (document.getElementById('np_desc')||{value:''}).value.trim();
  var sizes   = ((document.getElementById('np_sizes')||{value:''}).value).split(',').map(function(s){return s.trim();}).filter(Boolean);
  var badge   = (document.getElementById('np_badge')||{value:''}).value || null;
  var eco     = (document.getElementById('np_eco')||{checked:false}).checked;
  var listed  = (document.getElementById('np_listed')||{checked:true}).checked;
  var iconEl  = document.getElementById('selProdIcon');
  var icon    = iconEl && iconEl.value ? iconEl.value : '📦';
  var imgPrev = document.getElementById('prodImgPreview');
  var image   = (imgPrev && imgPrev.dataset.s3Url) ? imgPrev.dataset.s3Url : '';

  if (!name)  { showToast('Product name is required','error'); return; }
  if (!brand) { showToast('Brand is required','error'); return; }
  if (!price || price <= 0) { showToast('Enter a valid selling price','error'); return; }
  if (!orig  || orig  <= 0) { showToast('Enter a valid MRP','error'); return; }
  if (price >= orig)        { showToast('Selling price must be less than MRP','error'); return; }
  if (stock <= 0)           { showToast('Enter valid stock quantity','error'); return; }

  var token  = localStorage.getItem('hb_token');
  var method = sellerEditProductId ? 'PUT' : 'POST';
  var url    = sellerEditProductId ? '/api/products/'+sellerEditProductId : '/api/products';
  var body   = { name, brand, category:cat, cat, price, originalPrice:orig, orig, stock, icon, image, description:desc, sizes, badge, eco, listed, sellerId:currentUser.id };

  var btn = document.getElementById('selSubmitBtn');
  if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }

  try {
    var r = await fetch(url, {method:method,headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify(body)});
    var d = await r.json();
    if (!r.ok) { showToast(d.error||'Failed to save product','error'); if(btn){btn.innerHTML='List Product →';btn.disabled=false;} return; }
    var p = d.product;
    if (p) { p.orig=p.originalPrice||p.price; p.cat=p.category; if(window.PRODUCTS) window.PRODUCTS[p.id]=p; }
    sellerEditProductId = null;
    showToast('🎉 "'+name+'" listed successfully!','success');
    switchSelTab('products');
  } catch(e) {
    if(btn){btn.innerHTML='List Product →';btn.disabled=false;}
    showToast('Could not save product: '+e.message,'error');
  }
}

// ── IMAGE UPLOAD ──────────────────────────────────────────────────
async function uploadProductImage(input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 5*1024*1024) { showToast('Image must be under 5MB','error'); return; }
  // Show preview immediately
  var reader = new FileReader();
  reader.onload = function(e) {
    var prev = document.getElementById('prodImgPreview');
    if (prev) prev.innerHTML = '<img src="'+e.target.result+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px">';
  };
  reader.readAsDataURL(file);
  // Upload to S3
  showToast('Uploading image...','info');
  var token = localStorage.getItem('hb_token');
  var formData = new FormData();
  formData.append('image', file);
  try {
    var r = await fetch('/api/upload/product-image', {method:'POST',headers:{'Authorization':'Bearer '+token},body:formData});
    var d = await r.json();
    if (d.url) {
      var prev = document.getElementById('prodImgPreview');
      if (prev) prev.dataset.s3Url = d.url;
      showToast('✅ Image uploaded!','success');
    } else { showToast(d.error||'Upload failed','error'); }
  } catch(e) { showToast('Upload failed: '+e.message,'error'); }
}

// ── TOGGLE PRODUCT ────────────────────────────────────────────────
async function toggleListProduct(pid) {
  var token = localStorage.getItem('hb_token');
  var p = window.PRODUCTS && window.PRODUCTS[pid];
  var newListed = p ? (p.listed===false ? true : false) : true;
  try {
    var r = await fetch('/api/products/'+pid, {method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({listed:newListed,active:newListed})});
    var d = await r.json();
    if (d.product||d.message) {
      if (p) { p.listed=newListed; p.active=newListed; }
      showToast(newListed?'✅ Product listed!':'❌ Product unlisted!','success');
      switchSelTab('products');
    } else { showToast(d.error||'Failed','error'); }
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

// ── ORDER STATUS UPDATE ───────────────────────────────────────────
function selUpdateOrderStatus(oid, orderId) {
  var statusOptions = ['accepted','packed','shipped','out_for_delivery','delivered','cancelled'];
  var html = '<div style="padding:20px;background:var(--bg3);border-radius:14px;max-width:400px">'
    + '<h4 style="font-weight:700;margin-bottom:16px">✏️ Update Order #'+(orderId||oid)+'</h4>'
    + '<div style="margin-bottom:12px"><label style="font-size:13px;color:var(--text3);display:block;margin-bottom:6px">New Status</label>'
    + '<select id="newOrderStatus" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;font-size:14px">'
    + statusOptions.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('')
    + '</select></div>'
    + '<div style="margin-bottom:12px"><label style="font-size:13px;color:var(--text3);display:block;margin-bottom:6px">Tracking Number</label>'
    + '<input id="trackingNum" placeholder="e.g. BD123456789IN" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>'
    + '<div style="margin-bottom:16px"><label style="font-size:13px;color:var(--text3);display:block;margin-bottom:6px">Courier Name</label>'
    + '<input id="courierName" placeholder="e.g. BlueDart, Delhivery" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>'
    + '<div style="display:flex;gap:10px">'
    + '<button id="confirmStatusBtn" class="btn-grad" style="flex:1;padding:12px">Confirm Update</button>'
    + '<button onclick="closeModal()" style="flex:1;padding:12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);cursor:pointer;font-family:inherit">Cancel</button>'
    + '</div></div>';
  showModal(html);
  setTimeout(function() {
    var btn = document.getElementById('confirmStatusBtn');
    if (btn) btn.onclick = function() { confirmSelOrderStatus(oid); };
  }, 50);
}

async function confirmSelOrderStatus(oid) {
  var status   = (document.getElementById('newOrderStatus')||{value:''}).value;
  var tracking = (document.getElementById('trackingNum')||{value:''}).value;
  var courier  = (document.getElementById('courierName')||{value:''}).value;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/seller/orders/'+oid+'/status', {method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({status:status,trackingNumber:tracking,courierName:courier})});
    var d = await r.json();
    if (d.order||d.message) { closeModal(); showToast(d.message||'Status updated!','success'); switchSelTab('orders'); }
    else { showToast(d.error||'Failed','error'); }
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

// ── PICKUP ADDRESS ────────────────────────────────────────────────
function selUpdatePickupAddress(oid) {
  var html = '<div style="padding:20px;background:var(--bg3);border-radius:14px;max-width:400px">'
    + '<h4 style="font-weight:700;margin-bottom:16px">📍 Update Pickup Address</h4>'
    + '<div style="display:grid;gap:10px">'
    + ['Contact Name:pa_name','Phone:pa_phone','Address Line 1:pa_line1','City:pa_city','State:pa_state','Pincode:pa_pin'].map(function(f){
        var parts = f.split(':');
        return '<input id="'+parts[1]+'" placeholder="'+parts[0]+'" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box">';
      }).join('')
    + '</div>'
    + '<div style="display:flex;gap:10px;margin-top:16px">'
    + '<button id="confirmAddrBtn" class="btn-grad" style="flex:1;padding:12px">Save Address</button>'
    + '<button onclick="closeModal()" style="flex:1;padding:12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);cursor:pointer;font-family:inherit">Cancel</button>'
    + '</div></div>';
  showModal(html);
  setTimeout(function() {
    var btn = document.getElementById('confirmAddrBtn');
    if (btn) btn.onclick = function() { confirmPickupAddress(oid); };
  }, 50);
}

async function confirmPickupAddress(oid) {
  var addr = {
    name:    (document.getElementById('pa_name')||{value:''}).value,
    phone:   (document.getElementById('pa_phone')||{value:''}).value,
    line1:   (document.getElementById('pa_line1')||{value:''}).value,
    city:    (document.getElementById('pa_city')||{value:''}).value,
    state:   (document.getElementById('pa_state')||{value:''}).value,
    pincode: (document.getElementById('pa_pin')||{value:''}).value,
  };
  if (!addr.line1||!addr.city) { showToast('Address and city required','error'); return; }
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/seller/orders/'+oid+'/pickup-address', {method:'PATCH',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({pickupAddress:addr})});
    var d = await r.json();
    closeModal();
    showToast(d.message||'Pickup address updated!','success');
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

// ── BRAND APPROVAL ────────────────────────────────────────────────
async function renderBrandApproval(el) {
  el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3)">Loading brand status...</div>';
  var token = localStorage.getItem('hb_token');
  var status = null;
  try {
    var r = await fetch('/api/seller/brand/status', {headers:{'Authorization':'Bearer '+token}});
    status = await r.json();
  } catch(e) {}

  var docs = (status && status.brandDocuments) || {};
  var approved = status && status.approved;
  var submitted = docs.submittedAt;

  var statusBanner = '';
  if (approved) {
    statusBanner = '<div style="background:rgba(0,200,83,.15);border:1px solid var(--green);border-radius:10px;padding:14px;margin-bottom:16px;display:flex;align-items:center;gap:10px"><span style="font-size:1.5rem">✅</span><div><div style="font-weight:700;color:var(--green)">Brand Approved!</div><div style="font-size:13px;color:var(--text3)">Your brand is verified.</div></div></div>';
  } else if (submitted) {
    statusBanner = '<div style="background:rgba(255,200,0,.1);border:1px solid var(--yellow);border-radius:10px;padding:14px;margin-bottom:16px;display:flex;align-items:center;gap:10px"><span style="font-size:1.5rem">⏳</span><div><div style="font-weight:700;color:var(--yellow)">Under Review</div><div style="font-size:13px;color:var(--text3)">Submitted '+new Date(submitted).toLocaleDateString('en-IN')+'. Review takes 2-3 days.</div></div></div>';
  }

  var docStatusHtml = submitted ? (
    '<div style="background:var(--bg4);border-radius:10px;padding:14px;margin-bottom:16px">'
    + '<div style="font-weight:600;margin-bottom:10px">Submitted Documents:</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + (docs.trademark ? '<a href="'+docs.trademark+'" target="_blank" style="padding:6px 12px;background:var(--bg3);border:1px solid var(--green);border-radius:6px;color:var(--green);font-size:13px;text-decoration:none">✅ Trademark</a>' : '<span style="padding:6px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text3);font-size:13px">❌ Trademark</span>')
    + (docs.authorization ? '<a href="'+docs.authorization+'" target="_blank" style="padding:6px 12px;background:var(--bg3);border:1px solid var(--green);border-radius:6px;color:var(--green);font-size:13px;text-decoration:none">✅ Auth Letter</a>' : '<span style="padding:6px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text3);font-size:13px">❌ Auth Letter</span>')
    + (docs.invoice ? '<a href="'+docs.invoice+'" target="_blank" style="padding:6px 12px;background:var(--bg3);border:1px solid var(--green);border-radius:6px;color:var(--green);font-size:13px;text-decoration:none">✅ Invoice</a>' : '<span style="padding:6px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text3);font-size:13px">❌ Invoice</span>')
    + '</div></div>'
  ) : '';

  el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:6px">🏪 Brand Approval</h4>'
    + '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">Submit brand documents for verification. Approved brands get a verified badge.</p>'
    + statusBanner + docStatusHtml
    + '<div style="display:grid;gap:14px" id="brandDocRows">'
    + brandDocRow('trademark',     '®',  'Trademark Certificate',     'PDF/JPG - Official trademark registration')
    + brandDocRow('authorization', '📄', 'Brand Authorization Letter', 'PDF/JPG - Letter authorizing you to sell')
    + brandDocRow('invoice',       '🧾', 'Purchase Invoice',           'PDF/JPG - Invoice from brand purchase')
    + '</div>'
    + '<button id="brandSubmitBtn" class="btn-grad" style="margin-top:20px;padding:12px 28px;font-size:14px">📨 '+(submitted?'Resubmit':'Submit for Review')+'</button>'
    + '<p style="font-size:12px;color:var(--text3);margin-top:10px">Documents are kept private and secure on AWS S3.</p>'
    + '</div>';

  // Attach submit button
  setTimeout(function() {
    var btn = document.getElementById('brandSubmitBtn');
    if (btn) btn.onclick = submitBrandDocs;
  }, 50);
}

function brandDocRow(field, icon, label, hint) {
  return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<div style="font-size:2rem">'+icon+'</div>'
    + '<div style="flex:1;min-width:150px">'
    + '<div style="font-weight:600;font-size:14px">'+label+'</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:2px">'+hint+'</div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
    + '<input type="file" id="doc_'+field+'" accept=".pdf,.jpg,.jpeg,.png" style="display:none">'
    + '<button type="button" data-field="'+field+'" class="brand-pick-btn btn-ghost" style="padding:7px 14px;font-size:13px">📄 Choose File</button>'
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
  var btn = document.getElementById('brandSubmitBtn');
  if (btn) { btn.textContent = 'Uploading...'; btn.disabled = true; }
  showToast('Uploading documents...','info');
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/seller/brand/documents', {method:'POST',headers:{'Authorization':'Bearer '+token},body:formData});
    var d = await r.json();
    if (d.message) {
      showToast(d.message,'success');
      switchSelTab('brand');
    } else {
      showToast(d.error||'Upload failed','error');
      if (btn) { btn.textContent = 'Submit for Review'; btn.disabled = false; }
    }
  } catch(e) {
    showToast('Error: '+e.message,'error');
    if (btn) { btn.textContent = 'Submit for Review'; btn.disabled = false; }
  }
}

// ── BANK DETAILS ──────────────────────────────────────────────────
function renderSellerBankForm(el) {
  el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:6px">🏦 Bank Details for Payouts</h4>'
    + '<p style="color:var(--text3);font-size:13px;margin-bottom:18px">Add your bank account to receive payouts.</p>'
    + '<div style="display:grid;gap:12px">'
    + formField('Bank Name', 'bank_name', 'text', '', 'e.g. State Bank of India', false)
    + formField('Account Holder Name', 'bank_holder', 'text', '', 'As per bank records', false)
    + '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Account Number</label><input type="password" id="bank_account" placeholder="Enter account number" style="width:100%;padding:10px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>'
    + formField('IFSC Code', 'bank_ifsc', 'text', '', 'e.g. SBIN0001234', false)
    + '<div><label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px">Account Type</label><select id="bank_type" style="width:100%;padding:10px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit"><option value="savings">Savings</option><option value="current">Current</option></select></div>'
    + '</div>'
    + '<button id="saveBankBtn" class="btn-grad" style="width:100%;padding:12px;margin-top:16px;font-size:14px">💰 Save Bank Details</button>'
    + '<p style="font-size:11px;color:var(--text3);margin-top:8px;text-align:center">Your bank details are encrypted and only used for payouts</p>'
    + '</div>';
  setTimeout(function() {
    var btn = document.getElementById('saveBankBtn');
    if (btn) btn.onclick = saveSellerBank;
  }, 50);
}

async function saveSellerBank() {
  var token = localStorage.getItem('hb_token');
  var data = {
    bankName:      (document.getElementById('bank_name')||{value:''}).value,
    accountName:   (document.getElementById('bank_holder')||{value:''}).value,
    accountNumber: (document.getElementById('bank_account')||{value:''}).value,
    ifsc:          (document.getElementById('bank_ifsc')||{value:''}).value,
    accountType:   (document.getElementById('bank_type')||{value:'savings'}).value,
  };
  if (!data.bankName||!data.accountNumber||!data.ifsc) { showToast('All fields required','error'); return; }
  try {
    var r = await fetch('/api/seller/bank', {method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({bankDetails:data})});
    var d = await r.json();
    showToast(d.message||'Bank details saved!','success');
    switchSelTab('payouts');
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

// ── FILTER ORDERS ─────────────────────────────────────────────────
function selFilterOrders(status) {
  var orders = window._selOrders || [];
  var filtered = status==='all' ? orders : orders.filter(function(o){return o.status===status;});
  var el = document.getElementById('selOrderList');
  if (el) el.innerHTML = filtered.length ? filtered.map(sellerOrderCardFull).join('') : '<p style="color:var(--text3)">No orders with status: '+status+'</p>';
}

// ── EVENT DELEGATION ──────────────────────────────────────────────
document.addEventListener('click', function(e) {
  // Brand doc file picker
  var btn = e.target.closest('.brand-pick-btn');
  if (btn) {
    var field = btn.dataset.field;
    var fi = document.getElementById('doc_'+field);
    if (fi) {
      fi.onchange = function() {
        var nameEl = document.getElementById('doc_'+field+'_name');
        if (nameEl) {
          nameEl.textContent = fi.files[0] ? 'OK ' + fi.files[0].name : 'No file chosen';
          nameEl.style.color = fi.files[0] ? 'var(--green)' : 'var(--text3)';
        }
      };
      fi.click();
    }
    return;
  }
  // Order filters
  btn = e.target.closest('.sel-order-filter');
  if (btn) { selFilterOrders(btn.dataset.sf); return; }
  // Product actions
  btn = e.target.closest('.sel-edit-prod');
  if (btn) { sellerEditProductId = btn.dataset.pid; switchSelTab('add_product'); return; }
  btn = e.target.closest('.sel-toggle-prod');
  if (btn) { toggleListProduct(btn.dataset.pid); return; }
  // Order actions
  btn = e.target.closest('.sel-update-status');
  if (btn) { selUpdateOrderStatus(btn.dataset.oid, btn.dataset.orderid); return; }
  btn = e.target.closest('.sel-pickup-addr');
  if (btn) { selUpdatePickupAddress(btn.dataset.oid); return; }
});

console.log('✅ seller.js loaded');
