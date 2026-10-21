// HUBOOZE GFEED: Google Merchant Center product feed (RSS 2.0 + g: attributes) at /feeds/google.xml
const SITE = 'https://hubooze.in';
const esc = s => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = u => !u ? '' : /^https?:\/\//i.test(u) ? u : SITE + (u.startsWith('/') ? '' : '/') + u;
const money = n => Number(n).toFixed(2) + ' INR';
const plain = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (k, v) => (v === undefined || v === null || v === '') ? '' : '<g:' + k + '>' + esc(v) + '</g:' + k + '>';

function buildGoogleFeed(products, seo) {
  const items = [];
  (products || []).filter(seo.isLive).forEach(p => {
    const price = Number(p.price), mrp = Number(p.originalPrice);
    const img = abs(p.image || (p.images && p.images[0]));
    if (!(price > 0) || !img || !p.name) return;
    const onSale = mrp > price;
    const desc = plain(p.description) || plain(p.name);
    const extra = (p.images || []).map(abs).filter(u => u && u !== img).slice(0, 10);
    const brand = String(p.brand || 'Hubooze').replace(/_/g, ' ');
    const cat = [p.category, p.subcategory].filter(Boolean).join(' > ');
    items.push('<item>' +
      tag('id', p.id) +
      '<title>' + esc(String(p.name).slice(0, 150)) + '</title>' +
      '<description>' + esc(desc.slice(0, 4900)) + '</description>' +
      '<link>' + esc(seo.productUrl(p)) + '</link>' +
      tag('image_link', img) + extra.map(u => tag('additional_image_link', u)).join('') +
      tag('availability', Number(p.stock) > 0 ? 'in_stock' : 'out_of_stock') +
      tag('price', money(onSale ? mrp : price)) + (onSale ? tag('sale_price', money(price)) : '') +
      tag('condition', 'new') + tag('brand', brand) +
      (p.sku ? tag('mpn', p.sku) : '') + tag('identifier_exists', 'no') +
      tag('product_type', [cat, p.productType].filter(Boolean).join(' > ')) +
      (p.colors && p.colors.length ? tag('color', p.colors.join('/')) : '') +
      (p.sizes && p.sizes.length ? tag('size', p.sizes.join('/')) : '') +
      (p.category === 'fashion' ? tag('gender', 'female') + tag('age_group', 'adult') : '') +
      '</item>');
  });
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>' +
    '<title>Hubooze</title><link>' + SITE + '/</link><description>Hubooze product feed</description>\n' + items.join('\n') + '\n</channel></rss>';
}

module.exports = function mountGoogleFeed(app) {
  const seo = require('./seo');
  app.get(['/feeds/google.xml', '/google-feed.xml'], async (req, res) => {
    try {
      const list = await require('./dbAdapter').findProducts({});
      res.set('Cache-Control', 'public, max-age=900').type('application/xml').send(buildGoogleFeed(list, seo));
    } catch (e) { console.error('gfeed:', e.message); res.status(500).type('text/plain').send('feed unavailable'); }
  });
};
module.exports.buildGoogleFeed = buildGoogleFeed;
