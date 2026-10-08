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

function buildHtml(p) {
  const url = productUrl(p);
  const brand = p.brand || 'Hubooze';
  const imgs = [p.image].concat(p.images || []).map(absImg).filter(Boolean);
  const imgList = imgs.filter((v, i) => imgs.indexOf(v) === i).slice(0, 5);
  const plain = String(p.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
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
}
module.exports = { mount, productPath, productUrl, slugify, isLive, buildHtml };
