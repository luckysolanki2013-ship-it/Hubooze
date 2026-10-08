/* HUBOOZE PRESS ADMIN v1 - adds a "Press" tab to the admin panel */
(function () {
  if (window.__pressAdminLoaded) return;
  window.__pressAdminLoaded = true;
  var TYPES = [['press_release', 'Press release'], ['article_by_hubooze', 'Article by Hubooze'], ['coverage', 'News coverage']];
  var items = [], editing = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tok() { try { return localStorage.getItem('hb_token') || ''; } catch (e) { return ''; } }
  function toast(m, t) { if (typeof showToast === 'function') showToast(m, t); else alert(m); }
  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }
  function typeLabel(t) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i][0] === t) return TYPES[i][1]; return 'News coverage'; }

  function load(cb) {
    fetch('/api/press').then(function (r) { return r.json(); })
      .then(function (d) { items = d.items || []; cb(); })
      .catch(function () { items = []; cb(); });
  }

  var INP = 'width:100%;padding:10px 14px;background:var(--bg4);border:1px solid var(--border2);border-radius:8px;color:var(--text);font-family:inherit;box-sizing:border-box;margin-bottom:12px';
  var LBL = 'font-size:13px;font-weight:600;display:block;margin-bottom:6px';

  function formHtml() {
    if (!editing) return '';
    var it = editing === 'new' ? { type: 'coverage', date: new Date().toISOString().slice(0, 10) } : (items.filter(function (x) { return x.id === editing; })[0] || {});
    var opts = TYPES.map(function (t) { return '<option value="' + t[0] + '"' + (it.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('');
    return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:22px;margin-bottom:16px">'
      + '<h4 style="font-weight:700;margin-bottom:14px">' + (editing === 'new' ? 'Add press item' : 'Edit press item') + '</h4>'
      + '<label style="' + LBL + '">Headline</label><input id="pr_title" type="text" maxlength="200" value="' + esc(it.title) + '" style="' + INP + '">'
      + '<label style="' + LBL + '">Publisher (e.g. Business Standard)</label><input id="pr_pub" type="text" maxlength="100" value="' + esc(it.publisher) + '" style="' + INP + '">'
      + '<label style="' + LBL + '">Link to the article</label><input id="pr_url" type="url" placeholder="https://" value="' + esc(it.url) + '" style="' + INP + '">'
      + '<label style="' + LBL + '">Date</label><input id="pr_date" type="date" value="' + esc(it.date) + '" style="' + INP + '">'
      + '<label style="' + LBL + '">Type</label><select id="pr_type" style="' + INP + '">' + opts + '</select>'
      + '<label style="' + LBL + '">Short summary (optional, max 400 characters)</label><textarea id="pr_sum" rows="3" maxlength="400" style="' + INP + '">' + esc(it.summary) + '</textarea>'
      + '<div style="display:flex;gap:10px"><button class="btn-grad" style="padding:10px 22px;font-size:13px" onclick="__pressAdmin.save()">Save</button>'
      + '<button class="btn-ghost" style="padding:10px 22px;font-size:13px" onclick="__pressAdmin.cancel()">Cancel</button></div></div>';
  }

  function render() {
    var el = document.getElementById('adminTabContent');
    if (!el || window.adminTabActive !== 'press') return;
    var rows = items.length ? items.map(function (it) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:var(--bg4);border-radius:8px">'
        + '<div style="min-width:0"><div style="font-weight:600;font-size:14px">' + esc(it.title) + '</div>'
        + '<div style="font-size:11px;color:var(--text3)">' + esc(typeLabel(it.type)) + ' &middot; ' + esc(it.publisher) + ' &middot; ' + esc(it.date) + '</div></div>'
        + '<div style="display:flex;gap:8px;flex-shrink:0"><button class="btn-ghost" style="padding:6px 12px;font-size:12px" onclick="__pressAdmin.edit(\'' + esc(it.id) + '\')">Edit</button>'
        + '<button class="btn-danger" style="padding:6px 12px;font-size:12px" onclick="__pressAdmin.del(\'' + esc(it.id) + '\')">Delete</button></div></div>';
    }).join('') : '<p style="color:var(--text3);font-size:13px">No press items yet.</p>';
    el.innerHTML = formHtml()
      + '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:24px">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><h4 style="font-weight:700">Press &amp; Media</h4>'
      + '<button class="btn-grad" style="padding:8px 16px;font-size:13px" onclick="__pressAdmin.add()">+ Add item</button></div>'
      + '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">Shown on <a href="/press" target="_blank" style="color:var(--accent,inherit)">hubooze.in/press</a> and in the sitemap. Newest first.</p>'
      + '<div style="display:grid;gap:10px">' + rows + '</div></div>';
  }

  window.__pressAdmin = {
    add: function () { editing = 'new'; render(); },
    edit: function (id) { editing = id; render(); },
    cancel: function () { editing = null; render(); },
    save: function () {
      var body = { title: val('pr_title'), publisher: val('pr_pub'), url: val('pr_url'), date: val('pr_date'), type: val('pr_type'), summary: val('pr_sum') };
      var isNew = editing === 'new';
      fetch('/api/press' + (isNew ? '' : '/' + encodeURIComponent(editing)), {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Authorization': 'Bearer ' + tok(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok) { toast(x.d.error || 'Failed to save', 'error'); return; }
          toast('Saved', 'success'); editing = null; load(render);
        }).catch(function (e) { toast('Error: ' + e.message, 'error'); });
    },
    del: function (id) {
      if (!confirm('Delete this press item?')) return;
      fetch('/api/press/' + encodeURIComponent(id), { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + tok() } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          if (!x.ok) { toast(x.d.error || 'Failed to delete', 'error'); return; }
          toast('Deleted', 'success'); load(render);
        }).catch(function (e) { toast('Error: ' + e.message, 'error'); });
    }
  };

  function wrap() {
    var f = window.renderAdminTabContent;
    if (typeof f !== 'function' || f.__press) return;
    var w = function () {
      if (window.adminTabActive === 'press') { editing = null; load(render); return; }
      return f.apply(this, arguments);
    };
    w.__press = true;
    window.renderAdminTabContent = w;
  }

  function ensureTab() {
    wrap();
    var root = document.getElementById('adminContentEl') || document;
    var btns = root.querySelectorAll('button[onclick^="switchAdminTab("]');
    if (!btns.length) return;
    var bar = btns[0].parentNode;
    if (bar.querySelector('[data-press-tab]')) return;
    var tpl = null;
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute('onclick').indexOf("'" + window.adminTabActive + "'") < 0) { tpl = btns[i]; break; }
    }
    if (!tpl) tpl = btns[0];
    var b = tpl.cloneNode(true);
    b.setAttribute('data-press-tab', '1');
    b.setAttribute('onclick', "switchAdminTab('press')");
    b.innerHTML = '&#128240; Press';
    if (window.adminTabActive === 'press') {
      b.className = (b.className + ' active').trim();
      b.style.background = 'linear-gradient(135deg,#a855f7,#6366f1)';
      b.style.color = '#fff';
      b.style.borderColor = 'transparent';
    }
    bar.appendChild(b);
  }

  var timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(ensureTab, 40); }
  function start() {
    wrap();
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
