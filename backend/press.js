/* HUBOOZE PRESS v1 - /press page + /api/press (items stored in Settings key "pressItems") */
const fs = require('fs');
const path = require('path');
const Models = require('./models');
const { protect, requireAdmin } = require('./middleware');
const KEY = 'pressItems';
const SITE = 'https://hubooze.in';
const TYPES = {
  press_release: 'Press release',
  article_by_hubooze: 'Article by Hubooze',
  coverage: 'News coverage',
};
const DEFAULTS = [
  { id: 'pr_inauthor', title: 'The Future of Indian E-commerce Is Being Rewritten—Quietly', publisher: 'inauthor.com', url: 'https://inauthor.com/the-future-of-indian-e-commerce-is-being-rewritten-quietly/', date: '2026-02-25', type: 'article_by_hubooze', summary: 'An industry-intelligence article by the Hubooze editorial team on how Indian e-commerce is changing.' },
  { id: 'pr_bs', title: 'Hubooze – Your Ultimate Destination for Fashion and Freedom', publisher: 'Business Standard', url: 'https://www.business-standard.com/content/press-releases-ani/hubooze-your-ultimate-destination-for-fashion-and-freedom-123110900611_1.html', date: '2023-11-09', type: 'press_release', summary: 'Press release introducing Hubooze, its handpicked men’s and women’s fashion and its 90-day return and exchange policy.' },
  { id: 'pr_ani', title: 'Hubooze – Your Ultimate Destination for Fashion and Freedom', publisher: 'ANI News', url: 'https://www.aninews.in/news/business/business/hubooze-your-ultimate-destination-for-fashion-and-freedom20231109132254/', date: '2023-11-09', type: 'press_release', summary: 'Press release introducing Hubooze, its handpicked men’s and women’s fashion and its 90-day return and exchange policy.' },
  { id: 'pr_theprint', title: 'Hubooze – Your Ultimate Destination for Fashion and Freedom', publisher: 'ThePrint', url: 'https://theprint.in/ani-press-releases/hubooze-your-ultimate-destination-for-fashion-and-freedom/1838404/', date: '2023-11-09', type: 'press_release', summary: 'Press release introducing Hubooze, its handpicked men’s and women’s fashion and its 90-day return and exchange policy.' },
];

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
async function load() {
  try {
    const d = await Models.Settings.findOne({ key: KEY }).lean();
    if (d && d.data && Array.isArray(d.data.items)) return d.data.items;
  } catch (e) {}
  return DEFAULTS.map(x => Object.assign({}, x));
}
async function save(items) {
  await Models.Settings.findOneAndUpdate({ key: KEY }, { data: { items } }, { upsert: true });
}
function sorted(items) {
  return items.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}
function clean(b) {
  b = b || {};
  const o = {
    title: String(b.title || '').trim().slice(0, 200),
    publisher: String(b.publisher || '').trim().slice(0, 100),
    url: String(b.url || '').trim().slice(0, 500),
    date: String(b.date || '').trim(),
    type: String(b.type || 'coverage'),
    summary: String(b.summary || '').trim().slice(0, 400),
  };
  if (!o.title) return { error: 'Title is required.' };
  if (!o.publisher) return { error: 'Publisher is required.' };
  if (!/^https?:\/\/[^\s]+$/i.test(o.url)) return { error: 'A valid link starting with http:// or https:// is required.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return { error: 'Date must be in YYYY-MM-DD format.' };
  if (!TYPES[o.type]) o.type = 'coverage';
  return { value: o };
}
function fmtDate(d) {
  const t = new Date(d + 'T00:00:00Z');
  if (isNaN(t)) return esc(d);
  return t.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
function clientBoot(items) {
  var TL = { press_release: 'Press release', article_by_hubooze: 'Article by Hubooze', coverage: 'News coverage' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(d) { try { return new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } }
  function card(it) {
    return '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:14px">'
      + '<div style="font-size:12px;color:var(--text3);margin-bottom:6px"><span style="background:var(--bg4);border:1px solid var(--border2);border-radius:99px;padding:2px 10px;margin-right:8px;font-weight:600;color:var(--text2)">' + esc(TL[it.type] || 'News coverage') + '</span>' + esc(it.publisher) + ' &middot; ' + esc(fmt(it.date)) + '</div>'
      + '<h3 style="font-size:1.05rem;font-weight:700;margin:6px 0">' + esc(it.title) + '</h3>'
      + (it.summary ? '<p style="color:var(--text2);font-size:14px;line-height:1.6;margin:0 0 12px">' + esc(it.summary) + '</p>' : '')
      + '<a class="btn-ghost" href="' + esc(it.url) + '" target="_blank" rel="noopener" style="display:inline-block;padding:8px 16px;font-size:13px;text-decoration:none">Read on ' + esc(it.publisher) + ' &rarr;</a></div>';
  }
  var html = '<p style="color:var(--text2);line-height:1.7;margin-bottom:20px">Press releases, articles and media mentions about Hubooze.</p>'
    + (items.length ? items.map(card).join('') : '<p style="color:var(--text3)">No press items yet.</p>');
  function fix() {
    try { history.replaceState({ page: 'legal' }, '', '/press'); } catch (e) {}
    document.title = 'Hubooze in the News | Press & Media';
    var l = document.querySelector('link[rel="canonical"]');
    if (!l) { l = document.createElement('link'); l.rel = 'canonical'; document.head.appendChild(l); }
    l.href = 'https://hubooze.in/press';
  }
  function show() {
    showPage('legal');
    ss('legalBcEl', 'Press & Media', false);
    var c = document.getElementById('legalContentEl');
    if (c) c.innerHTML = html;
    try { window.scrollTo(0, 0); } catch (e) {}
    fix(); setTimeout(fix, 300); setTimeout(fix, 1200);
  }
  var n = 0, t = setInterval(function () {
    n++;
    if (typeof showPage === 'function' && typeof ss === 'function' && document.getElementById('legalContentEl')) { clearInterval(t); show(); }
    else if (n > 130) clearInterval(t);
  }, 150);
}
var _baseCache = { t: 0, h: '' };
function baseHtml() {
  if (Date.now() - _baseCache.t > 30000 || !_baseCache.h) {
    _baseCache = { t: Date.now(), h: fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8') };
  }
  return _baseCache.h;
}
function page(items) {
  const list = sorted(items);
  const title = 'Hubooze in the News | Press & Media';
  const desc = 'Press releases, articles and media mentions about Hubooze, the Indian marketplace for fashion, handmade and eco-friendly products with 90-day free returns.';
  const j = o => JSON.stringify(o).replace(/</g, '\\u003c');
  const ld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description: desc, url: SITE + '/press',
    isPartOf: { '@type': 'WebSite', name: 'Hubooze', url: SITE },
    mainEntity: { '@type': 'ItemList', itemListElement: list.map((it, i) => ({ '@type': 'ListItem', position: i + 1, url: it.url, name: it.title })) },
  };
  let h = baseHtml();
  h = h.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + esc(title) + '</title>');
  h = h.replace(/<meta\s+name=["']description["'][^>]*>/i, '');
  h = h.replace(/<link\s+rel=["']canonical["'][^>]*>/i, '');
  h = h.replace(/<meta\s+(?:property|name)=["'](?:og|twitter):[^>]*>/gi, '');
  const head = '<meta name="description" content="' + esc(desc) + '">\n<link rel="canonical" href="' + SITE + '/press">\n'
    + '<meta property="og:type" content="website">\n<meta property="og:site_name" content="Hubooze">\n<meta property="og:title" content="' + esc(title) + '">\n'
    + '<meta property="og:description" content="' + esc(desc) + '">\n<meta property="og:url" content="' + SITE + '/press">\n'
    + '<script type="application/ld+json">' + j(ld) + '</script>\n';
  h = h.replace(/<\/head>/i, () => head + '</head>');
  const nos = '<noscript><h1>Hubooze in the News</h1><ul>' + list.map(it =>
    '<li><a href="' + esc(it.url) + '">' + esc(it.title) + '</a> &mdash; ' + esc(it.publisher) + ', ' + esc(it.date) + ' (' + esc(TYPES[it.type] || 'News coverage') + ')</li>').join('') +
    '</ul><p><a href="/">Hubooze home</a></p></noscript>\n';
  const boot = '<script>(' + clientBoot.toString() + ')(' + j(list) + ');</script>\n';
  return h.replace(/<body[^>]*>/i, m => m + '\n' + nos + boot);
}
function sitemapExtra(list) {
  return ['<url><loc>' + SITE + '/press</loc><lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>'];
}
function mount(app) {
  app.get('/api/press', async (req, res) => {
    try { res.json({ items: sorted(await load()) }); } catch (e) { res.json({ items: [] }); }
  });
  app.post('/api/press', protect, requireAdmin, async (req, res) => {
    try {
      const c = clean(req.body); if (c.error) return res.status(400).json({ error: c.error });
      const items = await load();
      const it = Object.assign({ id: 'pr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, c.value);
      items.push(it); await save(items);
      res.json({ message: 'Added', item: it });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.put('/api/press/:id', protect, requireAdmin, async (req, res) => {
    try {
      const c = clean(req.body); if (c.error) return res.status(400).json({ error: c.error });
      const items = await load();
      const i = items.findIndex(x => x.id === req.params.id);
      if (i < 0) return res.status(404).json({ error: 'Not found' });
      items[i] = Object.assign({ id: items[i].id }, c.value); await save(items);
      res.json({ message: 'Updated', item: items[i] });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.delete('/api/press/:id', protect, requireAdmin, async (req, res) => {
    try {
      const items = await load();
      const left = items.filter(x => x.id !== req.params.id);
      if (left.length === items.length) return res.status(404).json({ error: 'Not found' });
      await save(left); res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
  app.get('/press', async (req, res) => {
    try { res.set('Content-Type', 'text/html; charset=utf-8').send(page(await load())); }
    catch (e) { res.status(500).send('Error'); }
  });
}
module.exports = { mount, sitemapExtra, page, clean, DEFAULTS };
