// SEO: crawlable product pages (server-rendered head + JSON-LD), served on /product/<slug>-<id>
const fs = require('fs');
const path = require('path');
const SITE = 'https://hubooze.in';
const INDEX = path.join(__dirname, '..', 'public', 'index.html');

function slugify(s) {
  return String(s || 'product').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/g, '') || 'product';
}
function productPath(p) { return '/product/' + slugify(p.name) + '-' + p.id; }
function productUrl(p) { return SITE + productPath(p); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function absImg(u) {
  if (!u || typeof u !== 'string' || /^data:/.test(u)) return null;
  if (/^https?:\/\//.test(u)) return u;
  if (u.charAt(0) === '/') return SITE + u;
  return null;
}
function isLive(p) { return p && p.active !== false && p.listed !== false; }

let htmlCache = { mtime: 0, html: '' };
function baseHtml() {
  const st = fs.statSync(INDEX);
  if (st.mtimeMs !== htmlCache.mtime) htmlCache = { mtime: st.mtimeMs, html: fs.readFileSync(INDEX, 'utf8') };
  return htmlCache.html;
}
let prodCache = { t: 0, list: [] };
async function allProducts() {
  if (Date.now() - prodCache.t > 60000) {
    prodCache = { t: Date.now(), list: await require('./dbAdapter').findProducts({}) };
  }
  return prodCache.list;
}

// ---------- description quality: auto-clean + fallback ----------
const STOP = new Set(['for','with','and','the','from','pack','set','pcs','new','best','your','you','are','this','that','all','size','free']);
function foldWords(t) {
  return String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
    .map(w => (w.length > 4 && w.slice(-3) === 'ies') ? w.slice(0, -3) + 'y' : (w.length > 3 && w.slice(-2) === 'es') ? w.slice(0, -2) : (w.length > 3 && w.slice(-1) === 's') ? w.slice(0, -1) : w)
    .filter(w => w.length >= 3 && !STOP.has(w));
}
function cleanText(t) {
  return String(t == null ? '' : t).replace(/<[^>]*>/g, ' ').replace(/[\p{Extended_Pictographic}️‍]/gu, ' ').replace(/\s+/g, ' ').trim();
}
function nameHits(p, d) {
  const nameW = Array.from(new Set(foldWords(p.name)));
  const descSet = new Set(foldWords(d));
  return { total: nameW.length, hit: nameW.filter(w => descSet.has(w)).length };
}
function descriptionIssue(p) {
  const d = cleanText(p.description);
  if (!d) return 'missing';
  if (d.length < 40) return 'too short';
  const m = nameHits(p, d);
  if (m.total >= 3 && m.hit < 2 && m.hit / m.total < 0.25) return 'does not match product name';
  return null;
}
function seoDescription(p) {
  const issue = descriptionIssue(p);
  const d = cleanText(p.description);
  if (!issue) return d;
  const brand = p.brand && String(p.brand).toLowerCase() !== 'hubooze' ? ' by ' + String(p.brand).replace(/_/g, ' ') : '';
  const lead = cleanText(p.name) + brand + '.' + (p.productType ? ' Category: ' + p.productType + '.' : '');
  // thin but not contradictory (never mentions the product name): keep the seller's details after a clean lead
  if (issue === 'does not match product name' && nameHits(p, d).hit === 0) return (lead + ' ' + d).slice(0, 900);
  return lead + ' Buy online at Hubooze with 90-day free returns and instant refunds.';
}

function buildHtml(p) {
  const url = productUrl(p);
  const brand = p.brand || 'Hubooze';
  const imgs = [p.image].concat(p.images || []).map(absImg).filter(Boolean);
  const imgList = imgs.filter((v, i) => imgs.indexOf(v) === i).slice(0, 5);
  const plain = seoDescription(p);
  const title = (String(p.name).length > 55 ? String(p.name).slice(0, 52).trim() + '...' : p.name) + ' | Hubooze';
  const desc = (plain ? plain : 'Buy ' + p.name + ' by ' + brand + ' online at Hubooze.')
    .slice(0, 150).trim() + ' Rs.' + p.price + '. 90-day free returns.';
  const inStock = p.stock == null || Number(p.stock) > 0;
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: (plain || p.name).slice(0, 500),
    sku: String(p.sku || p.id), brand: { '@type': 'Brand', name: brand },
    offers: { '@type': 'Offer', url, priceCurrency: 'INR', price: String(p.price), itemCondition: 'https://schema.org/NewCondition',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@type': 'Organization', name: 'Hubooze' } }
  };
  if (imgList.length) ld.image = imgList;
  if (Number(p.rating) > 0 && Number(p.reviews) > 0) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: String(p.rating), reviewCount: String(p.reviews) };
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Products', item: SITE + '/categories' },
    { '@type': 'ListItem', position: 3, name: p.name, item: url } ] };
  const j = o => JSON.stringify(o).replace(/</g, '\\u003c');

  let h = baseHtml();
  h = h.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + esc(title) + '</title>');
  h = h.replace(/<meta\s+name=["']description["'][^>]*>/i, '');
  h = h.replace(/<link\s+rel=["']canonical["'][^>]*>/i, '');
  h = h.replace(/<meta\s+(?:property|name)=["'](?:og|twitter):[^>]*>/gi, '');
  const head = '<meta name="description" content="' + esc(desc) + '">\n<link rel="canonical" href="' + esc(url) + '">\n'
    + '<meta property="og:type" content="product">\n<meta property="og:site_name" content="Hubooze">\n<meta property="og:title" content="' + esc(title) + '">\n'
    + '<meta property="og:description" content="' + esc(desc) + '">\n<meta property="og:url" content="' + esc(url) + '">\n'
    + (imgList[0] ? '<meta property="og:image" content="' + esc(imgList[0]) + '">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="' + esc(imgList[0]) + '">\n' : '')
    + '<script type="application/ld+json">' + j(ld) + '</script>\n<script type="application/ld+json">' + j(crumbs) + '</script>\n';
  h = h.replace(/<\/head>/i, head + '</head>');
  const nos = '<noscript><h1>' + esc(p.name) + '</h1><p>By ' + esc(brand) + '. Price: Rs.' + esc(p.price) + '. ' + (inStock ? 'In stock.' : 'Out of stock.') + '</p><p>' + esc(plain.slice(0, 600)) + '</p>'
    + (imgList[0] ? '<img src="' + esc(imgList[0]) + '" alt="' + esc(p.name) + '">' : '') + '<p><a href="/">Hubooze home</a></p></noscript>\n';
  const boot = '<script>(function(){var id=' + j(p.id) + ',url=' + j(productPath(p)) + ',n=0,t=setInterval(function(){n++;'
    + 'if(typeof PRODUCTS!=="undefined"&&PRODUCTS&&PRODUCTS[id]&&typeof openProduct==="function"){clearInterval(t);openProduct(id);try{history.replaceState({page:"product"},"",url);}catch(e){}}'
    + 'else if(n>130){clearInterval(t);}},150);})();</script>\n';
  return h.replace(/<body[^>]*>/i, m => m + '\n' + nos + boot);
}

// ---------- category landing pages ----------
function titleCase(s) { return String(s).replace(/[_-]+/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase()); }
function groups(products) {
  const map = {};
  const add = (key, label, p, kind) => {
    if (!key) return;
    const g = map[key] || (map[key] = { slug: key, label: titleCase(label), items: {}, kind: kind, raw: label });
    if (kind === 'cat' && g.kind !== 'cat') { g.kind = 'cat'; g.raw = label; }
    g.items[p.id] = p;
  };
  (products || []).filter(isLive).forEach(p => {
    add(slugify(p.cat || p.category), p.cat || p.category, p, 'cat');
    if (p.productType) add(slugify(p.productType), p.productType, p, 'type');
  });
  return Object.keys(map).map(k => { const g = map[k]; g.list = Object.keys(g.items).map(i => g.items[i]); return g; });
}
function categoryPath(g) { return '/c/' + g.slug; }
function categoryUrls(products) {
  return groups(products).map(g => '<url><loc>' + SITE + categoryPath(g) + '</loc><lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>');
}
function buildCategoryHtml(g) {
  const url = SITE + categoryPath(g), n = g.list.length;
  const prices = g.list.map(p => Number(p.price)).filter(x => x > 0), min = prices.length ? Math.min.apply(null, prices) : null;
  const label = g.label, lower = label.toLowerCase();
  const title = 'Buy ' + label + ' Online in India | Hubooze';
  const desc = 'Shop ' + n + (n === 1 ? ' product' : ' products') + ' in ' + lower + ' at Hubooze' + (min ? ', starting at Rs.' + min : '') + '. 90-day free returns and instant refunds.';
  const items = g.list.slice(0, 60);
  const j = o => JSON.stringify(o).replace(/</g, '\\u003c');
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: label, url, description: desc,
    mainEntity: { '@type': 'ItemList', numberOfItems: n, itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: productUrl(p), name: p.name })) } };
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: label, item: url } ] };
  let h = baseHtml();
  h = h.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + esc(title) + '</title>');
  h = h.replace(/<meta\s+name=["']description["'][^>]*>/i, '');
  h = h.replace(/<link\s+rel=["']canonical["'][^>]*>/i, '');
  h = h.replace(/<meta\s+(?:property|name)=["'](?:og|twitter):[^>]*>/gi, '');
  const img = absImg(g.list[0] && g.list[0].image);
  const head = '<meta name="description" content="' + esc(desc) + '">\n<link rel="canonical" href="' + esc(url) + '">\n'
    + '<meta property="og:type" content="website">\n<meta property="og:site_name" content="Hubooze">\n<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n<meta property="og:url" content="' + esc(url) + '">\n'
    + (img ? '<meta property="og:image" content="' + esc(img) + '">\n' : '')
    + '<script type="application/ld+json">' + j(ld) + '</script>\n<script type="application/ld+json">' + j(crumbs) + '</script>\n';
  h = h.replace(/<\/head>/i, head + '</head>');
  const nos = '<noscript><h1>' + esc(label) + ' online at Hubooze</h1><p>' + esc(desc) + '</p><ul>'
    + items.map(p => '<li><a href="' + esc(productPath(p)) + '">' + esc(p.name) + '</a> - Rs.' + esc(p.price) + '</li>').join('') + '</ul><p><a href="/">Hubooze home</a></p></noscript>\n';
  const uniq = f => Array.from(new Set(g.list.map(f).filter(Boolean)));
  const cats = uniq(p => p.cat || p.category), subs = uniq(p => p.subcategory);
  const spec = g.kind === 'cat' ? { cat: g.raw, sub: 'all', type: 'all' }
    : { cat: cats.length === 1 ? cats[0] : 'all', sub: subs.length === 1 ? subs[0] : 'all', type: g.raw };
  const boot = '<script>(function(){var S=' + j(spec) + ',url=' + j(categoryPath(g)) + ',n=0,t=setInterval(function(){n++;'
    + 'if(typeof PRODUCTS!=="undefined"&&PRODUCTS&&Object.keys(PRODUCTS).length&&typeof showPage==="function"&&typeof renderCategoriesPage==="function"&&typeof renderCatProducts==="function"){clearInterval(t);'
    + 'showPage("categories");renderCategoriesPage(S.cat);subCatActive=S.sub;typeActive=S.type;renderCatProducts();if(typeof renderTypeTabs==="function")renderTypeTabs();'
    + 'try{history.replaceState({page:"categories"},"",url);}catch(e){}}'
    + 'else if(n>130){clearInterval(t);}},150);})();</script>\n';
  return h.replace(/<body[^>]*>/i, m => m + '\n' + nos + boot);
}

// ---------- Google Merchant Center product feed ----------
function xesc(s) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c])); }
function buildFeed(products) {
  const items = (products || []).filter(isLive).map(p => {
    const img = absImg(p.image) || absImg((p.images || [])[0]);
    if (!img || !(Number(p.price) > 0)) return '';
    const plain = seoDescription(p);
    const inStock = p.stock == null || Number(p.stock) > 0;
    return '<item>'
      + '<g:id>' + xesc(p.id) + '</g:id><title>' + xesc(String(p.name).slice(0, 150)) + '</title>'
      + '<description>' + xesc((plain || p.name).slice(0, 4900)) + '</description>'
      + '<link>' + xesc(productUrl(p)) + '</link><g:image_link>' + xesc(img) + '</g:image_link>'
      + '<g:availability>' + (inStock ? 'in_stock' : 'out_of_stock') + '</g:availability>'
      + '<g:price>' + Number(p.price).toFixed(2) + ' INR</g:price>'
      + '<g:brand>' + xesc(p.brand || 'Hubooze') + '</g:brand><g:condition>new</g:condition><g:identifier_exists>no</g:identifier_exists>'
      + (p.productType ? '<g:product_type>' + xesc(p.productType) + '</g:product_type>' : '')
      + '</item>';
  }).filter(Boolean);
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Hubooze</title><link>' + SITE + '</link><description>Hubooze products</description>\n' + items.join('\n') + '\n</channel></rss>';
}

function mount(app) {
  app.get('/product/:slug', async (req, res, next) => {
    try {
      const slug = String(req.params.slug || '');
      const id = slug.slice(slug.lastIndexOf('-') + 1);
      const list = await allProducts();
      const p = list.find(x => String(x.id) === id) || list.find(x => String(x.id) === slug);
      if (!isLive(p)) {
        res.status(404).set('X-Robots-Tag', 'noindex');
        return res.send(baseHtml());
      }
      if (req.path !== productPath(p)) return res.redirect(301, productPath(p));
      res.set('Cache-Control', 'public, max-age=300').type('html').send(buildHtml(p));
    } catch (e) { next(); }
  });
  app.get('/c/:slug', async (req, res, next) => {
    try {
      const g = groups(await allProducts()).find(x => x.slug === String(req.params.slug || '').toLowerCase());
      if (!g) { res.status(404).set('X-Robots-Tag', 'noindex'); return res.send(baseHtml()); }
      res.set('Cache-Control', 'public, max-age=300').type('html').send(buildCategoryHtml(g));
    } catch (e) { next(); }
  });
  app.get('/feed/google.xml', async (req, res, next) => {
    try { res.set('Cache-Control', 'public, max-age=300').type('application/xml').send(buildFeed(await allProducts())); } catch (e) { next(); }
  });
}
module.exports = { descriptionIssue, seoDescription, buildCategoryHtml, categoryUrls, groups, mount, productPath, productUrl, slugify, isLive, buildHtml };
