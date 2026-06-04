/**
 * HUBOOZE — Admin Panel
 * All admin functionality in one clean file
 */

'use strict';

// ── STATE ─────────────────────────────────────────────────────────
var adminTabActive = window.adminTabActive || 'overview';

// ── MAIN RENDER ───────────────────────────────────────────────────
async function renderAdminPanel() {
  var el = document.getElementById('adminContentEl');
  if (!el) return;
  if (!currentUser || currentUser.role !== 'admin') {
    el.innerHTML = '<div style="text-align:center;padding:48px"><div style="font-size:3rem">🔒</div><h3>Admin Access Only</h3><p style="color:var(--text3)">Login with admin@hubooze.in</p></div>';
    return;
  }

  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3)">Loading admin panel...</div>';

  var token = localStorage.getItem('hb_token');
  var headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  // Fetch stats
  var stats = {};
  try {
    var r = await fetch('/api/admin/stats', { headers: headers });
    stats = await r.json();
  } catch(e) {}

  // Stat cards
  var statsHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-bottom:20px">'
    + adminStatCard('🛒', stats.totalOrders||0, 'Orders', 'var(--blue)')
    + adminStatCard('₹', '₹'+(stats.totalRevenue||0).toLocaleString('en-IN'), 'Revenue', 'var(--green)')
    + adminStatCard('👥', stats.totalUsers||0, 'Users', 'var(--yellow)')
    + adminStatCard('🏪', stats.totalSellers||0, 'Sellers', 'var(--blue)')
    + adminStatCard('📦', stats.totalProducts||0, 'Products', 'var(--green)')
    + adminStatCard('↩️', stats.totalReturns||0, 'Returns', 'var(--red)')
    + adminStatCard('⚡', stats.pendingReturns||0, 'Pending Returns', 'var(--yellow)')
    + adminStatCard('💰', '₹'+(stats.platformFee||0).toLocaleString('en-IN'), 'Platform Fee', 'var(--green)')
    + '</div>';

  // Tabs
  var tabs = [
    {id:'overview',   label:'📊 Overview'},
    {id:'products',   label:'📦 Products'},
    {id:'orders',     label:'🛒 Orders'},
    {id:'returns',    label:'↩️ Returns'},
    {id:'users',      label:'👥 Users'},
    {id:'sellers',    label:'🏪 Sellers'},
    {id:'promotions', label:'📢 Promotions'},
    {id:'icons',      label:'🎨 Icons & Images'},
    {id:'settings',   label:'⚙️ Settings'},
  ];

  var tabsHtml = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">'
    + tabs.map(function(t) {
        var active = adminTabActive === t.id;
        return '<button onclick="adminSwitchTab(\'' + t.id + '\')" style="padding:8px 14px;border-radius:20px;border:1px solid '+(active?'var(--green)':'var(--border)')+';background:'+(active?'var(--green)':'var(--bg3)')+';color:'+(active?'#000':'var(--text)')+';cursor:pointer;font-size:13px;font-family:inherit;font-weight:'+(active?'700':'400')+'">'+t.label+'</button>';
      }).join('')
    + '</div>';

  el.innerHTML = statsHtml + tabsHtml + '<div id="adminTabContent"></div>';
  renderAdminTabContent(stats, headers);
}

function adminSwitchTab(tab) {
  adminTabActive = tab;
  window.adminTabActive = tab;
  renderAdminPanel();
}

function adminStatCard(icon, val, label, color) {
  return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center">'
    + '<div style="font-size:1.5rem;margin-bottom:4px">' + icon + '</div>'
    + '<div style="font-size:18px;font-weight:900;color:' + color + '">' + val + '</div>'
    + '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + label + '</div>'
    + '</div>';
}

// ── TAB CONTENT ───────────────────────────────────────────────────
async function renderAdminTabContent(stats, headers) {
  var el = document.getElementById('adminTabContent');
  if (!el) return;

  if (!headers) {
    var token = localStorage.getItem('hb_token');
    headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };
  }

  if (adminTabActive === 'overview') {
    el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
      + '<h4 style="font-weight:700;margin-bottom:16px">📊 Platform Overview</h4>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">'
      + '<div><p style="color:var(--text3);font-size:13px">Total Revenue</p><p style="font-size:22px;font-weight:800;color:var(--green)">₹'+(stats.totalRevenue||0).toLocaleString('en-IN')+'</p></div>'
      + '<div><p style="color:var(--text3);font-size:13px">Platform Earnings (10%)</p><p style="font-size:22px;font-weight:800;color:var(--blue)">₹'+(stats.platformFee||0).toLocaleString('en-IN')+'</p></div>'
      + '<div><p style="color:var(--text3);font-size:13px">Delivered Orders</p><p style="font-size:22px;font-weight:800">'+(stats.deliveredOrders||0)+'</p></div>'
      + '<div><p style="color:var(--text3);font-size:13px">Cancelled Orders</p><p style="font-size:22px;font-weight:800;color:var(--red)">'+(stats.cancelledOrders||0)+'</p></div>'
      + '</div></div>';

  } else if (adminTabActive === 'products') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading products...</div>';
    try {
      var r = await fetch('/api/admin/products', {headers:headers});
      var d = await r.json();
      var prods = d.products || [];
      window._adminProds = prods;
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">'
        + '<h4 style="font-weight:700">📦 All Products (' + prods.length + ')</h4>'
        + '<input id="adminProdSearch" placeholder="Search..." oninput="adminFilterProducts(this.value)" style="padding:8px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;width:200px">'
        + '</div>'
        + '<div id="adminProdList">' + prods.map(adminProductRow).join('') + '</div>'
        + '</div>';
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error: '+e.message+'</p>'; }

  } else if (adminTabActive === 'orders') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading orders...</div>';
    try {
      var r = await fetch('/api/admin/orders', {headers:headers});
      var d = await r.json();
      var orders = d.orders || [];
      window._adminOrders = orders;
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">🛒 All Orders (' + orders.length + ')</h4>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">'
        + ['all','processing','confirmed','shipped','delivered','cancelled'].map(function(s){
            return '<button data-of="'+s+'" class="admin-order-filter" style="padding:5px 12px;border-radius:14px;border:1px solid var(--border);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+s+'</button>';
          }).join('')
        + '</div>'
        + '<div id="adminOrderList">' + orders.map(adminOrderRow).join('') + '</div>'
        + '</div>';
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error: '+e.message+'</p>'; }

  } else if (adminTabActive === 'returns') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading returns...</div>';
    try {
      var r = await fetch('/api/admin/returns', {headers:headers});
      var d = await r.json();
      var returns = d.returns || [];
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">↩️ Return Requests (' + returns.length + ')</h4>'
        + (returns.length ? returns.map(adminReturnRow).join('') : '<p style="color:var(--text3)">No returns yet.</p>')
        + '</div>';
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error: '+e.message+'</p>'; }

  } else if (adminTabActive === 'users') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading users...</div>';
    try {
      var r = await fetch('/api/admin/users', {headers:headers});
      var d = await r.json();
      var users = d.users || [];
      window._adminUsers = users;
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">'
        + '<h4 style="font-weight:700">👥 All Users (' + users.length + ')</h4>'
        + '<div style="display:flex;gap:8px">'
        + ['all','customer','seller','admin'].map(function(role){
            return '<button data-ur="'+role+'" class="admin-user-filter" style="padding:5px 12px;border-radius:14px;border:1px solid var(--border);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+role+'</button>';
          }).join('')
        + '</div></div>'
        + '<div id="adminUserList">' + users.map(adminUserRow).join('') + '</div>'
        + '</div>';
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error: '+e.message+'</p>'; }

  } else if (adminTabActive === 'sellers') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading sellers...</div>';
    try {
      var r = await fetch('/api/admin/sellers', {headers:headers});
      var d = await r.json();
      var sellers = d.sellers || [];
      el.innerHTML = '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
        + '<h4 style="font-weight:700;margin-bottom:16px">🏪 Seller Management (' + sellers.length + ')</h4>'
        + sellers.map(adminSellerRow).join('')
        + '</div>';
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error: '+e.message+'</p>'; }

  } else if (adminTabActive === 'promotions') {
    el.innerHTML = '<div style="color:var(--text3);padding:20px">Loading...</div>';
    try {
      var r = await fetch('/api/admin/promotions', {headers:headers});
      var d = await r.json();
      var promo = d.promotions || {};
      renderAdminPromotions(el, promo, headers);
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error: '+e.message+'</p>'; }

  } else if (adminTabActive === 'icons') {
    renderAdminIcons(el, headers);

  } else if (adminTabActive === 'settings') {
    try {
      var r = await fetch('/api/admin/promotions', {headers:headers});
      var d = await r.json();
      var promo = d.promotions || {};
      renderAdminSettings(el, promo, headers);
    } catch(e) { el.innerHTML = '<p style="color:var(--red)">Error: '+e.message+'</p>'; }
  }
}

// ── ROW RENDERERS ─────────────────────────────────────────────────
function adminProductRow(p) {
  var imgHtml = p.image
    ? '<img src="'+p.image+'" style="width:100%;height:100%;object-fit:cover">'
    : (p.icon||'📦');
  return '<div id="aprow-'+p.id+'" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">'
    + '<div style="width:48px;height:48px;background:var(--bg4);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;overflow:hidden;flex-shrink:0">'+imgHtml+'</div>'
    + '<div style="flex:1;min-width:150px">'
    + '<div style="font-weight:600;font-size:14px">'+p.name+'</div>'
    + '<div style="font-size:12px;color:var(--text3)">'+(p.brand||'')+' • '+(p.category||p.cat||'')+' • ₹'+p.price+'</div>'
    + '</div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + '<span style="padding:3px 8px;border-radius:12px;font-size:11px;background:'+(p.active?'rgba(0,200,83,.15)':'rgba(255,59,48,.15)')+';color:'+(p.active?'var(--green)':'var(--red)')+'">'+( p.active?'Active':'Inactive')+'</span>'
    + '<button data-pid="'+p.id+'" class="admin-toggle-prod" style="padding:5px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+(p.active?'Deactivate':'Activate')+'</button>'
    + '<button data-pid="'+p.id+'" class="admin-edit-prod" style="padding:5px 10px;border-radius:6px;border:1px solid var(--blue);background:transparent;color:var(--blue);cursor:pointer;font-size:12px;font-family:inherit">Edit</button>'
    + '<button data-pid="'+p.id+'" data-pname="'+p.name+'" class="admin-delete-prod" style="padding:5px 10px;border-radius:6px;border:1px solid var(--red);background:transparent;color:var(--red);cursor:pointer;font-size:12px;font-family:inherit">Delete</button>'
    + '</div></div>';
}

function adminOrderRow(o) {
  var statuses = ['processing','confirmed','shipped','out_for_delivery','delivered','cancelled'];
  return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">'
    + '<div><div style="font-weight:700">#'+(o.orderId||o.id)+'</div><div style="font-size:12px;color:var(--text3)">'+(o.createdAt||'').toString().substring(0,10)+' • '+((o.address&&o.address.name)||'')+'</div></div>'
    + '<div style="display:flex;align-items:center;gap:8px"><span style="padding:3px 10px;border-radius:12px;font-size:12px;background:var(--bg3)">'+o.status+'</span><span style="font-weight:800">₹'+(o.total||0).toLocaleString('en-IN')+'</span></div>'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
    + statuses.map(function(s){
        return '<button data-oid="'+o.id+'" data-status="'+s+'" class="admin-order-status" style="padding:4px 10px;border-radius:12px;border:1px solid '+(o.status===s?'var(--green)':'var(--border)')+';background:'+(o.status===s?'var(--green)':'var(--bg3)')+';color:'+(o.status===s?'#000':'var(--text3)')+';cursor:pointer;font-size:11px;font-family:inherit">'+s+'</button>';
      }).join('')
    + '</div></div>';
}

function adminReturnRow(ret) {
  return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">'
    + '<div><div style="font-weight:700">Return #'+(ret.id||'')+'</div><div style="font-size:12px;color:var(--text3)">Order: '+(ret.orderId||'')+' • '+(ret.reason||'')+'</div></div>'
    + '<span style="padding:3px 10px;border-radius:12px;font-size:12px;background:var(--bg3)">'+(ret.status||'pending')+'</span>'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
    + ['approved','rejected','picked_up','refunded'].map(function(s){
        return '<button data-rid="'+ret.id+'" data-status="'+s+'" class="admin-return-status" style="padding:5px 10px;border-radius:12px;border:1px solid var(--border);background:var(--bg3);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">'+s+'</button>';
      }).join('')
    + '</div></div>';
}

function adminUserRow(u) {
  return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap">'
    + '<div style="width:40px;height:40px;border-radius:50%;background:var(--bg4);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">'+(u.role==='admin'?'👑':u.role==='seller'?'🏪':'👤')+'</div>'
    + '<div style="flex:1;min-width:150px"><div style="font-weight:600">'+u.name+'</div><div style="font-size:12px;color:var(--text3)">'+u.email+' • '+u.role+'</div></div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
    + (u.role!=='admin' ? '<button data-uid="'+u.id+'" data-urole="'+u.role+'" class="admin-change-role" style="padding:5px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);cursor:pointer;font-size:12px;font-family:inherit">Change Role</button>' : '')
    + '<button data-uid="'+u.id+'" data-uname="'+u.name+'" class="admin-suspend-user" style="padding:5px 10px;border-radius:6px;border:1px solid var(--red);background:transparent;color:var(--red);cursor:pointer;font-size:12px;font-family:inherit">Suspend</button>'
    + '</div></div>';
}

function adminSellerRow(s) {
  var docs = s.brandDocuments || {};
  var approved = s.brandApproved || false;
  var commission = s.commission || 10;
  var statusColor = approved ? 'var(--green)' : (docs.submittedAt ? 'var(--yellow)' : 'var(--text3)');
  var statusLabel = approved ? '✅ Approved' : (docs.submittedAt ? '⏳ Pending Review' : 'Not Submitted');

  return '<div style="background:var(--bg4);border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:12px">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:12px">'
    + '<div>'
    + '<div style="font-weight:700;font-size:15px">🏪 '+s.name+'</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:2px">'+s.email+' • '+(s.city||'')+'</div>'
    + '<div style="margin-top:6px"><span style="padding:3px 10px;border-radius:12px;font-size:12px;color:'+statusColor+'">'+statusLabel+'</span></div>'
    + '</div>'
    + '<div style="display:flex;gap:14px;flex-wrap:wrap">'
    + '<div style="text-align:center"><div style="font-weight:700;color:var(--blue)">'+(s.productCount||0)+'</div><div style="font-size:11px;color:var(--text3)">Products</div></div>'
    + '<div style="text-align:center"><div style="font-weight:700;color:var(--green)">'+(s.orderCount||0)+'</div><div style="font-size:11px;color:var(--text3)">Orders</div></div>'
    + '<div style="text-align:center"><div style="font-weight:700;color:var(--green)">₹'+(s.revenue||0).toLocaleString('en-IN')+'</div><div style="font-size:11px;color:var(--text3)">Revenue</div></div>'
    + '</div></div>'
    + '<div style="border-top:1px solid var(--border);padding-top:12px">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:8px">📄 Brand Documents:</div>'
    + (docs.submittedAt
        ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'
          + (docs.trademark ? '<a href="'+docs.trademark+'" target="_blank" style="padding:5px 10px;background:var(--bg3);border:1px solid var(--green);border-radius:6px;color:var(--green);font-size:12px;text-decoration:none">✅ Trademark</a>' : '<span style="padding:5px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text3);font-size:12px">❌ Trademark</span>')
          + (docs.authorization ? '<a href="'+docs.authorization+'" target="_blank" style="padding:5px 10px;background:var(--bg3);border:1px solid var(--green);border-radius:6px;color:var(--green);font-size:12px;text-decoration:none">✅ Auth Letter</a>' : '<span style="padding:5px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text3);font-size:12px">❌ Auth Letter</span>')
          + (docs.invoice ? '<a href="'+docs.invoice+'" target="_blank" style="padding:5px 10px;background:var(--bg3);border:1px solid var(--green);border-radius:6px;color:var(--green);font-size:12px;text-decoration:none">✅ Invoice</a>' : '<span style="padding:5px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text3);font-size:12px">❌ Invoice</span>')
          + '</div>'
          + (docs.gstNumber ? '<div style="font-size:12px;margin-top:8px">🏛️ <strong>GST:</strong> '+docs.gstNumber+'</div>' : '')
          + (docs.panNumber ? '<div style="font-size:12px;margin-top:4px">🪪 <strong>PAN:</strong> '+docs.panNumber+'</div>' : '')
        : '<div style="font-size:12px;color:var(--text3);margin-bottom:12px">No documents submitted yet</div>')
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'
    + '<div style="display:flex;align-items:center;gap:6px;background:var(--bg3);padding:6px 10px;border-radius:8px">'
    + '<span style="font-size:13px;color:var(--text3)">Commission:</span>'
    + '<input id="comm_'+s.id+'" type="number" value="'+commission+'" min="1" max="50" style="width:50px;padding:4px;background:var(--bg4);border:1px solid var(--border2);border-radius:4px;color:var(--text);font-family:inherit;text-align:center">'
    + '<span style="font-size:13px;color:var(--text3)">%</span>'
    + '<button data-uid="'+s.id+'" class="admin-save-comm" style="padding:4px 8px;background:var(--green);border:none;border-radius:4px;color:#000;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit">Save</button>'
    + '</div>'
    + (docs.submittedAt
        ? (approved
            ? '<button data-uid="'+s.id+'" data-uname="'+s.name+'" class="admin-disapprove-seller" style="padding:7px 16px;background:var(--bg3);border:1px solid var(--red);border-radius:8px;color:var(--red);cursor:pointer;font-size:13px;font-family:inherit">✕ Disapprove Brand</button>'
            : '<button data-uid="'+s.id+'" data-uname="'+s.name+'" class="admin-approve-seller" style="padding:7px 16px;background:var(--green);border:none;border-radius:8px;color:#000;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit">✓ Approve Brand</button>')
        : '')
    + '</div></div></div>';
}

// ── PROMOTIONS ────────────────────────────────────────────────────
function renderAdminPromotions(el, promo, headers) {
  el.innerHTML = '<div style="display:grid;gap:16px">'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:16px">⚡ Flash Sale</h4>'
    + '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">'
    + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Discount %</label><input id="flashDiscount" type="number" min="1" max="90" value="'+(promo.flashSale&&promo.flashSale.discount||30)+'" style="padding:8px 12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;width:100px"></div>'
    + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Label</label><input id="flashLabel" type="text" value="'+(promo.flashSale&&promo.flashSale.label||'')+'" placeholder="Flash Sale!" style="padding:8px 12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;width:200px"></div>'
    + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Duration (hours)</label><input id="flashHours" type="number" min="1" max="168" value="24" style="padding:8px 12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;width:100px"></div>'
    + '<button onclick="activateFlashSale()" class="btn-grad" style="padding:10px 20px">⚡ Activate</button>'
    + '<button onclick="deactivateFlashSale()" style="padding:10px 20px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--red);cursor:pointer;font-family:inherit">✕ Stop</button>'
    + '</div>'
    + (promo.flashSale&&promo.flashSale.active ? '<div style="margin-top:12px;padding:10px;background:rgba(0,200,83,.1);border-radius:8px;color:var(--green);font-size:13px">✅ Active: '+promo.flashSale.discount+'% OFF</div>' : '<div style="margin-top:12px;padding:10px;background:var(--bg4);border-radius:8px;color:var(--text3);font-size:13px">No active flash sale</div>')
    + '</div>'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:12px">📢 Announcement Bar</h4>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap">'
    + '<input id="announcementText" value="'+(promo.announcement||'')+'" style="flex:1;min-width:200px;padding:10px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit">'
    + '<button onclick="updateAnnouncement()" class="btn-grad" style="padding:10px 20px">Update</button>'
    + '</div></div>'
    + '</div>';
}

// ── ICONS TAB ─────────────────────────────────────────────────────
function renderAdminIcons(el, headers) {
  el.innerHTML = '<div style="display:grid;gap:16px">'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:6px">🔥 Announcement Bar Icons</h4>'
    + '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">Replace emojis in the top scrolling bar with custom images</p>'
    + '<div style="display:grid;gap:12px">'
    + adminIconRow('return-icon', '♻️', '90 Din Easy Return Icon', 'returnIconUrl')
    + adminIconRow('delivery-icon', '🚀', 'FREE Delivery Icon', 'deliveryIconUrl')
    + adminIconRow('refund-icon', '⚡', 'Instant Refund Icon', 'refundIconUrl')
    + '</div></div>'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:6px">🗂️ Navigation Icons</h4>'
    + '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">Replace emoji icons in navigation bar</p>'
    + '<div style="display:grid;gap:12px">'
    + adminIconRow('nav-deals', '🔥', 'Aaj ke Deals', 'navDealsIcon')
    + adminIconRow('nav-fashion', '😊', 'Fashion', 'navFashionIcon')
    + adminIconRow('nav-electronics', '📱', 'Electronics', 'navElecIcon')
    + adminIconRow('nav-handmade', '♻️', 'Desi/Handmade', 'navHandmadeIcon')
    + '</div></div>'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:6px">🏠 Homepage Section Icons</h4>'
    + '<div style="display:grid;gap:12px">'
    + adminIconRow('sec-trending', '🔥', 'Trending Section', 'secTrendingIcon')
    + adminIconRow('sec-eco', '♻️', 'Eco/Handmade Section', 'secEcoIcon')
    + adminIconRow('sec-electronics', '📱', 'Electronics Section', 'secElecIcon')
    + adminIconRow('sec-fashion', '😊', 'Fashion Section', 'secFashionIcon')
    + '</div></div>'
    + '</div>';
}

function adminIconRow(id, emoji, label, key) {
  var currentUrl = (window.SITE_ICONS && window.SITE_ICONS[key]) || '';
  var imgHtml = currentUrl
    ? '<img src="'+currentUrl+'" style="width:100%;height:100%;object-fit:cover">'
    : '<span>'+emoji+'</span>';
  return '<div style="display:flex;align-items:center;gap:12px;padding:10px;background:var(--bg4);border-radius:8px;flex-wrap:wrap">'
    + '<div style="width:44px;height:44px;background:var(--bg3);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;overflow:hidden;flex-shrink:0">'+imgHtml+'</div>'
    + '<div style="flex:1;min-width:160px">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:4px">'+label+'</div>'
    + '<div style="font-size:11px;color:var(--text3)">Current: '+(currentUrl ? '<a href="'+currentUrl+'" target="_blank" style="color:var(--blue)">View</a>' : emoji+' (emoji)')+'</div>'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap">'
    + '<button data-iconid="'+id+'" data-iconkey="'+key+'" class="admin-upload-icon btn-ghost" style="padding:6px 12px;font-size:12px">📷 Upload</button>'
    + '<input data-iconkey="'+key+'" class="admin-icon-url" placeholder="Paste URL" value="'+currentUrl+'" style="padding:6px 10px;background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:inherit;font-size:12px;width:160px">'
    + '<button data-iconid="'+id+'" data-iconkey="'+key+'" class="admin-save-icon" style="padding:6px 12px;background:var(--green);border:none;border-radius:6px;color:#000;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit">✓</button>'
    + (currentUrl ? '<button data-iconid="'+id+'" data-iconkey="'+key+'" class="admin-clear-icon" style="padding:6px 10px;border:1px solid var(--red);background:transparent;border-radius:6px;color:var(--red);cursor:pointer;font-size:12px;font-family:inherit">🗑️</button>' : '')
    + '</div></div>';
}

// ── SETTINGS ──────────────────────────────────────────────────────
function renderAdminSettings(el, promo, headers) {
  el.innerHTML = '<div style="display:grid;gap:16px">'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:16px">🖼️ Hero Banner</h4>'
    + (promo.heroBgImage ? '<img src="'+promo.heroBgImage+'" style="width:100%;max-height:160px;object-fit:cover;border-radius:10px;margin-bottom:12px">' : '<div style="width:100%;height:80px;background:var(--bg4);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:13px;margin-bottom:12px">No banner set</div>')
    + '<div style="display:flex;gap:10px;flex-wrap:wrap">'
    + '<input type="file" id="heroBannerFile" accept="image/*" style="display:none">'
    + '<button id="heroBannerBtn" class="btn-grad" style="padding:9px 18px;font-size:13px">📸 Upload Banner</button>'
    + '<button onclick="clearHeroBanner()" style="padding:9px 18px;background:var(--bg4);border:1px solid var(--red);border-radius:8px;color:var(--red);cursor:pointer;font-family:inherit;font-size:13px">✕ Remove</button>'
    + '</div></div>'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:14px">✍️ Hero Text</h4>'
    + '<div style="display:grid;gap:10px">'
    + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Badge</label><input id="s_heroBadge" value="'+(promo.heroBadge||'')+'" style="width:100%;padding:9px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>'
    + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Headline</label><input id="s_heroTitle" value="'+(promo.heroTitle||'')+'" style="width:100%;padding:9px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>'
    + '<div><label style="font-size:12px;color:var(--text3);display:block;margin-bottom:4px">Sub Headline</label><input id="s_heroSubtitle" value="'+(promo.heroSubtitle||'')+'" style="width:100%;padding:9px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box"></div>'
    + '</div>'
    + '<button onclick="saveHeroText()" class="btn-grad" style="margin-top:12px;padding:9px 22px">Save Hero Text</button>'
    + '</div>'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:14px">🏪 Store Settings</h4>'
    + '<div style="display:grid;gap:12px">'
    + adminSettingField('Free Delivery Above', 's_freeDelivery', promo.freeDeliveryMin||499, 'number', '₹')
    + adminSettingField('Return Window (Days)', 's_returnDays', promo.returnWindowDays||90, 'number', '')
    + adminSettingField('Default Commission %', 's_commission', promo.defaultCommission||10, 'number', '')
    + adminSettingField('Delivery Fee', 's_deliveryFee', promo.deliveryFee||49, 'number', '₹')
    + '</div>'
    + '<button onclick="saveStoreSettings()" class="btn-grad" style="margin-top:14px;padding:9px 22px">Save Store Settings</button>'
    + '</div>'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:14px">💰 Payout Settings</h4>'
    + '<div style="display:grid;gap:12px">'
    + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><label style="font-size:13px;font-weight:600;min-width:180px">Payout Schedule</label>'
    + '<select id="s_payoutSchedule" style="padding:8px 12px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit"><option value="weekly">Weekly</option><option value="biweekly">Bi-Weekly</option><option value="monthly">Monthly</option></select></div>'
    + adminSettingField('Min Payout Amount', 's_minPayout', promo.minPayoutAmount||500, 'number', '₹')
    + '</div>'
    + '<button onclick="savePayoutSettings()" class="btn-grad" style="margin-top:14px;padding:9px 22px">Save Payout Settings</button>'
    + '</div>'
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:6px">🏦 Seller Bank Details</h4>'
    + '<button onclick="adminViewSellerBanks()" class="btn-ghost" style="padding:9px 18px;font-size:13px">📊 View All Seller Banks</button>'
    + '</div>'
    
    + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
    + '<h4 style="font-weight:700;margin-bottom:14px">🎨 Theme</h4>'
    + '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">'
    + '<button onclick="setTheme(\'dark\')" style="padding:10px 24px;border-radius:10px;border:2px solid var(--border2);background:#0a0a0a;color:#fff;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600">🌙 Dark Mode</button>'
    + '<button onclick="setTheme(\'light\')" style="padding:10px 24px;border-radius:10px;border:2px solid var(--border2);background:#fff;color:#111;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600">☀️ Light Mode</button>'
    + '<span id="currentThemeLabel" style="font-size:13px;color:var(--text3)">Current: Dark</span>'
    + '</div></div>'
    + '</div>';

  // Attach hero banner upload
  setTimeout(function() {
    var btn = document.getElementById('heroBannerBtn');
    var fi  = document.getElementById('heroBannerFile');
    if (btn && fi) {
      btn.onclick = function() { fi.click(); };
      fi.onchange = function() { uploadHeroBanner(fi); };
    }
  }, 100);
}

function adminSettingField(label, id, val, type, prefix) {
  return '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
    + '<label style="font-size:13px;font-weight:600;min-width:180px">'+label+'</label>'
    + (prefix ? '<span style="color:var(--text3)">'+prefix+'</span>' : '')
    + '<input id="'+id+'" type="'+type+'" value="'+val+'" style="width:120px;padding:8px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit">'
    + '</div>';
}

// ── ACTIONS ───────────────────────────────────────────────────────
async function adminToggleProduct(pid) {
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/products/'+pid+'/toggle', {method:'PATCH',headers:{'Authorization':'Bearer '+token}});
    var d = await r.json();
    showToast(d.message||'Updated','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminDeleteProduct(pid, name) {
  if (!confirm('Delete "'+name+'"? Cannot be undone.')) return;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/products/'+pid, {method:'DELETE',headers:{'Authorization':'Bearer '+token}});
    var d = await r.json();
    showToast(d.message||'Deleted','success');
    if (window.PRODUCTS) delete window.PRODUCTS[pid];
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminUpdateOrderStatus(oid, status) {
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/orders/'+oid+'/status', {method:'PATCH',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status:status})});
    var d = await r.json();
    showToast(d.message||'Status updated','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminUpdateReturn(rid, status) {
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/returns/'+rid+'/status', {method:'PATCH',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status:status})});
    var d = await r.json();
    showToast(d.message||'Return updated','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminChangeRole(uid, currentRole) {
  var newRole = prompt('Change role to (customer/seller/admin):', currentRole);
  if (!newRole || !['customer','seller','admin'].includes(newRole)) return;
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

async function adminApproveSeller(uid, name) {
  if (!confirm('Approve brand for '+name+'?')) return;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/sellers/'+uid+'/approve', {method:'PATCH',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({approved:true})});
    var d = await r.json();
    showToast(d.message||name+' approved!','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminDisapproveSeller(uid, name) {
  if (!confirm('Disapprove brand for '+name+'?')) return;
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/sellers/'+uid+'/approve', {method:'PATCH',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({approved:false})});
    var d = await r.json();
    showToast(d.message||'Disapproved','info');
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
    var r = await fetch('/api/admin/sellers/'+uid+'/commission', {method:'PATCH',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({commission:commission})});
    var d = await r.json();
    showToast(d.message||'Commission saved','success');
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function activateFlashSale() {
  var token = localStorage.getItem('hb_token');
  var discount = (document.getElementById('flashDiscount')||{value:30}).value;
  var label    = (document.getElementById('flashLabel')||{value:''}).value;
  var hours    = (document.getElementById('flashHours')||{value:24}).value;
  try {
    var r = await fetch('/api/admin/promotions/flash-sale', {method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({discount:Number(discount),label:label,durationHours:Number(hours)})});
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
  var text = (document.getElementById('announcementText')||{value:''}).value;
  try {
    await fetch('/api/admin/promotions', {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({announcement:text})});
    showToast('Announcement updated!','success');
  } catch(e) { showToast('Error','error'); }
}

async function saveHeroText() {
  var token = localStorage.getItem('hb_token');
  var data = {
    heroBadge:    (document.getElementById('s_heroBadge')||{value:''}).value,
    heroTitle:    (document.getElementById('s_heroTitle')||{value:''}).value,
    heroSubtitle: (document.getElementById('s_heroSubtitle')||{value:''}).value,
  };
  try {
    await fetch('/api/admin/promotions', {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(data)});
    var h1 = document.getElementById('heroH1El');
    var sub = document.getElementById('heroSubEl');
    var badge = document.getElementById('heroBadgeEl');
    if (h1 && data.heroTitle) h1.innerHTML = data.heroTitle;
    if (sub && data.heroSubtitle) sub.innerHTML = data.heroSubtitle;
    if (badge && data.heroBadge) badge.textContent = data.heroBadge;
    showToast('Hero text updated!','success');
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function saveStoreSettings() {
  var token = localStorage.getItem('hb_token');
  var data = {
    freeDeliveryMin:   Number((document.getElementById('s_freeDelivery')||{value:499}).value),
    returnWindowDays:  Number((document.getElementById('s_returnDays')||{value:90}).value),
    defaultCommission: Number((document.getElementById('s_commission')||{value:10}).value),
    deliveryFee:       Number((document.getElementById('s_deliveryFee')||{value:49}).value),
  };
  try {
    await fetch('/api/admin/promotions', {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(data)});
    showToast('Store settings saved!','success');
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function savePayoutSettings() {
  var token = localStorage.getItem('hb_token');
  var data = {
    payoutSchedule:  (document.getElementById('s_payoutSchedule')||{value:'weekly'}).value,
    minPayoutAmount: Number((document.getElementById('s_minPayout')||{value:500}).value),
  };
  try {
    await fetch('/api/admin/promotions', {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(data)});
    showToast('Payout settings saved!','success');
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function uploadHeroBanner(input) {
  var file = input.files[0];
  if (!file) return;
  showToast('Uploading banner...','info');
  var token = localStorage.getItem('hb_token');
  var formData = new FormData();
  formData.append('image', file);
  try {
    var r = await fetch('/api/admin/hero-image', {method:'POST',headers:{'Authorization':'Bearer '+token},body:formData});
    var d = await r.json();
    if (d.url) {
      var heroBg = document.querySelector('.hero-bg');
      if (heroBg) { heroBg.style.backgroundImage='url('+d.url+')'; heroBg.style.backgroundSize='cover'; heroBg.style.backgroundPosition='center'; heroBg.classList.add('has-image'); }
      showToast('Banner uploaded!','success');
      renderAdminPanel();
    } else { showToast(d.error||'Failed','error'); }
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function clearHeroBanner() {
  var token = localStorage.getItem('hb_token');
  try {
    await fetch('/api/admin/promotions', {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({heroBgImage:''})});
    var heroBg = document.querySelector('.hero-bg');
    if (heroBg) { heroBg.style.backgroundImage=''; heroBg.classList.remove('has-image'); }
    showToast('Banner removed','info');
    renderAdminPanel();
  } catch(e) { showToast('Error','error'); }
}

async function adminSaveIconFromInput(id, key, url) {
  await adminSaveIconToServer(key, url.trim());
  if (!window.SITE_ICONS) window.SITE_ICONS = {};
  window.SITE_ICONS[key] = url.trim();
  showToast('Icon saved!','success');
  renderAdminTabContent({});
}

async function adminSaveIconToServer(key, url) {
  var token = localStorage.getItem('hb_token');
  var icons = window.SITE_ICONS || {};
  icons[key] = url;
  try {
    await fetch('/api/admin/promotions', {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({siteIcons:icons})});
  } catch(e) {}
}

async function adminClearIcon(id, key) {
  await adminSaveIconToServer(key, '');
  if (window.SITE_ICONS) window.SITE_ICONS[key] = '';
  showToast('Icon cleared','info');
  renderAdminTabContent({});
}

async function adminUploadIcon(id, key) {
  var input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async function() {
    var file = input.files[0];
    if (!file) return;
    showToast('Uploading icon...','info');
    var token = localStorage.getItem('hb_token');
    var formData = new FormData();
    formData.append('image', file);
    try {
      var r = await fetch('/api/upload/product-image', {method:'POST',headers:{'Authorization':'Bearer '+token},body:formData});
      var d = await r.json();
      if (d.url) {
        await adminSaveIconToServer(key, d.url);
        if (!window.SITE_ICONS) window.SITE_ICONS = {};
        window.SITE_ICONS[key] = d.url;
        showToast('Icon uploaded!','success');
        renderAdminTabContent({});
      } else { showToast(d.error||'Failed','error'); }
    } catch(e) { showToast('Error: '+e.message,'error'); }
  };
  input.click();
}

async function adminViewSellerBanks() {
  var token = localStorage.getItem('hb_token');
  try {
    var r = await fetch('/api/admin/sellers', {headers:{'Authorization':'Bearer '+token}});
    var d = await r.json();
    var sellers = (d.sellers||[]).filter(function(s){return s.bankDetails;});
    if (!sellers.length) { showToast('No seller bank details yet','info'); return; }
    var html = '<div style="padding:20px;background:var(--bg3);border-radius:14px;max-width:500px;max-height:80vh;overflow-y:auto">'
      + '<h4 style="font-weight:700;margin-bottom:16px">🏦 Seller Bank Details</h4>'
      + sellers.map(function(s){
          var b = s.bankDetails||{};
          return '<div style="background:var(--bg4);border-radius:10px;padding:14px;margin-bottom:10px">'
            + '<div style="font-weight:600">'+s.name+'</div>'
            + '<div style="font-size:13px;color:var(--text3)">'+( b.bankName||'')+'</div>'
            + '<div style="font-size:13px">A/C: '+(b.accountNumber||'')+'</div>'
            + '<div style="font-size:13px">IFSC: '+(b.ifsc||'')+'</div>'
            + '</div>';
        }).join('')
      + '<button onclick="closeModal()" class="btn-grad" style="width:100%;padding:10px;margin-top:10px">Close</button>'
      + '</div>';
    showModal(html);
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

function adminFilterProducts(q) {
  var prods = window._adminProds || [];
  var filtered = q ? prods.filter(function(p){ return (p.name||'').toLowerCase().includes(q.toLowerCase())||(p.brand||'').toLowerCase().includes(q.toLowerCase()); }) : prods;
  var el = document.getElementById('adminProdList');
  if (el) el.innerHTML = filtered.map(adminProductRow).join('');
}

function adminFilterOrders(status) {
  var orders = window._adminOrders || [];
  var filtered = status==='all' ? orders : orders.filter(function(o){return o.status===status;});
  var el = document.getElementById('adminOrderList');
  if (el) el.innerHTML = filtered.map(adminOrderRow).join('');
}

function adminFilterUsers(role) {
  var users = window._adminUsers || [];
  var filtered = role==='all' ? users : users.filter(function(u){return u.role===role;});
  var el = document.getElementById('adminUserList');
  if (el) el.innerHTML = filtered.map(adminUserRow).join('');
}

function adminEditProduct(pid) {
  var p = window._adminProds && window._adminProds.find(function(x){return x.id===pid;});
  if (!p) { showToast('Product not found','error'); return; }
  var row = document.getElementById('aprow-'+pid);
  if (!row) return;
  window._editingPid = pid;
  window._editingImage = p.image || '';
  var imgHtml = p.image ? '<img src="'+p.image+'" style="width:100%;height:100%;object-fit:cover">' : '<span>'+(p.icon||'📦')+'</span>';
  row.innerHTML = '<div style="width:100%;padding:16px;background:var(--bg3);border-radius:10px;margin:4px 0">'
    + '<div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap">'
    + '<div id="ae_imgPreview" style="width:80px;height:80px;background:var(--bg4);border:2px dashed var(--border2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:2.5rem;overflow:hidden;flex-shrink:0">'+imgHtml+'</div>'
    + '<div style="flex:1;min-width:160px">'
    + '<input type="file" id="ae_imgFile" accept="image/*" style="display:none">'
    + '<button type="button" id="ae_imgBtn" class="btn-ghost" style="width:100%;padding:8px;font-size:13px;margin-bottom:6px">📷 Upload Image</button>'
    + '<input id="ae_imgUrl" placeholder="Or paste image URL" value="'+(p.image||'')+'" style="width:100%;padding:6px 10px;background:var(--bg4);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:inherit;font-size:12px;box-sizing:border-box">'
    + '</div></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">'
    + adminEditInput('Name','ae_name',p.name)
    + adminEditInput('Price ₹','ae_price',p.price)
    + adminEditInput('MRP ₹','ae_orig',p.orig||p.originalPrice||p.price)
    + adminEditInput('Stock','ae_stock',p.stock||0)
    + adminEditInput('Category','ae_cat',p.category||p.cat||'')
    + adminEditInput('Brand','ae_brand',p.brand||'')
    + '</div>'
    + '<div style="display:flex;gap:8px">'
    + '<button id="ae_saveBtn" class="btn-grad" style="padding:8px 16px;font-size:13px">✓ Save</button>'
    + '<button id="ae_cancelBtn" style="padding:8px 16px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);cursor:pointer;font-family:inherit;font-size:13px">Cancel</button>'
    + '</div></div>';

  // Attach events after render
  setTimeout(function() {
    var saveBtn = document.getElementById('ae_saveBtn');
    var cancelBtn = document.getElementById('ae_cancelBtn');
    var imgBtn = document.getElementById('ae_imgBtn');
    var imgFile = document.getElementById('ae_imgFile');
    var imgUrl = document.getElementById('ae_imgUrl');
    if (saveBtn) saveBtn.onclick = function(){ adminSaveProduct(pid); };
    if (cancelBtn) cancelBtn.onclick = function(){ renderAdminTabContent({}); };
    if (imgBtn && imgFile) imgBtn.onclick = function(){ imgFile.click(); };
    if (imgFile) imgFile.onchange = function(){ adminUploadProductImage(imgFile, pid); };
    if (imgUrl) imgUrl.oninput = function(){
      window._editingImage = this.value;
      var prev = document.getElementById('ae_imgPreview');
      if (prev) prev.innerHTML = this.value ? '<img src="'+this.value+'" style="width:100%;height:100%;object-fit:cover">' : '<span>'+(p.icon||'📦')+'</span>';
    };
  }, 50);
}

function adminEditInput(label, id, val) {
  return '<div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:3px">'+label+'</label>'
    + '<input id="'+id+'" value="'+val+'" style="width:100%;padding:7px 10px;background:var(--bg4);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-family:inherit;font-size:13px;box-sizing:border-box"></div>';
}

async function adminSaveProduct(pid) {
  var token = localStorage.getItem('hb_token');
  var imgUrl = (document.getElementById('ae_imgUrl')||{value:''}).value || window._editingImage || '';
  var update = {
    name: (document.getElementById('ae_name')||{value:''}).value,
    price: Number((document.getElementById('ae_price')||{value:0}).value),
    originalPrice: Number((document.getElementById('ae_orig')||{value:0}).value),
    orig: Number((document.getElementById('ae_orig')||{value:0}).value),
    stock: Number((document.getElementById('ae_stock')||{value:0}).value),
    category: (document.getElementById('ae_cat')||{value:''}).value,
    cat: (document.getElementById('ae_cat')||{value:''}).value,
    brand: (document.getElementById('ae_brand')||{value:''}).value,
    image: imgUrl,
  };
  try {
    var r = await fetch('/api/admin/products/'+pid, {method:'PUT',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(update)});
    var d = await r.json();
    if (d.product && window.PRODUCTS) window.PRODUCTS[pid] = Object.assign(window.PRODUCTS[pid]||{}, d.product);
    showToast(d.message||'Product saved!','success');
    renderAdminTabContent({});
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

async function adminUploadProductImage(input, pid) {
  var file = input.files[0];
  if (!file) return;
  showToast('Uploading...','info');
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
      showToast('✅ Image uploaded!','success');
    } else { showToast(d.error||'Failed','error'); }
  } catch(e) { showToast('Error: '+e.message,'error'); }
}

// ── EVENT DELEGATION ──────────────────────────────────────────────
document.addEventListener('click', function(e) {
  // Product actions
  var btn = e.target.closest('.admin-toggle-prod');
  if (btn) { adminToggleProduct(btn.dataset.pid); return; }
  btn = e.target.closest('.admin-edit-prod');
  if (btn) { adminEditProduct(btn.dataset.pid); return; }
  btn = e.target.closest('.admin-delete-prod');
  if (btn) { adminDeleteProduct(btn.dataset.pid, btn.dataset.pname); return; }
  // Order actions
  btn = e.target.closest('.admin-order-status');
  if (btn) { adminUpdateOrderStatus(btn.dataset.oid, btn.dataset.status); return; }
  btn = e.target.closest('.admin-order-filter');
  if (btn) { adminFilterOrders(btn.dataset.of); return; }
  // Return actions
  btn = e.target.closest('.admin-return-status');
  if (btn) { adminUpdateReturn(btn.dataset.rid, btn.dataset.status); return; }
  // User actions
  btn = e.target.closest('.admin-change-role');
  if (btn) { adminChangeRole(btn.dataset.uid, btn.dataset.urole); return; }
  btn = e.target.closest('.admin-suspend-user');
  if (btn) { adminSuspendUser(btn.dataset.uid, btn.dataset.uname); return; }
  btn = e.target.closest('.admin-user-filter');
  if (btn) { adminFilterUsers(btn.dataset.ur); return; }
  // Seller actions
  btn = e.target.closest('.admin-approve-seller');
  if (btn) { adminApproveSeller(btn.dataset.uid, btn.dataset.uname); return; }
  btn = e.target.closest('.admin-disapprove-seller');
  if (btn) { adminDisapproveSeller(btn.dataset.uid, btn.dataset.uname); return; }
  btn = e.target.closest('.admin-save-comm');
  if (btn) { adminSaveCommission(btn.dataset.uid); return; }
  // Icon actions
  btn = e.target.closest('.admin-upload-icon');
  if (btn) { adminUploadIcon(btn.dataset.iconid, btn.dataset.iconkey); return; }
  btn = e.target.closest('.admin-save-icon');
  if (btn) {
    var urlInput = btn.parentNode.querySelector('.admin-icon-url');
    if (urlInput) adminSaveIconFromInput(btn.dataset.iconid, btn.dataset.iconkey, urlInput.value);
    return;
  }
  btn = e.target.closest('.admin-clear-icon');
  if (btn) { adminClearIcon(btn.dataset.iconid, btn.dataset.iconkey); return; }
});

console.log('✅ admin.js loaded');

function setTheme(theme) {
  var root = document.documentElement;
  if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
    localStorage.setItem('hb_theme', 'light');
  } else {
    root.removeAttribute('data-theme');
    localStorage.setItem('hb_theme', 'dark');
  }
  var label = document.getElementById('currentThemeLabel');
  if (label) label.textContent = 'Current: ' + (theme === 'light' ? 'Light ☀️' : 'Dark 🌙');
  showToast('Theme changed to ' + theme + ' mode!', 'success');
}
