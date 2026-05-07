const router = require('express').Router();
const { protect, requireSeller, optionalAuth } = require('../middleware');
const { DB } = require('../db');

// GET /api/products  — with filters, search, pagination
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search, sort, eco, badge, page = 1, limit = 12 } = req.query;
    let products = DB.products.filter(p => p.active !== false);
    if (category && category !== 'all') products = products.filter(p => p.category === category);
    if (eco === 'true') products = products.filter(p => p.eco);
    if (badge) products = products.filter(p => p.badge === badge.toUpperCase());
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (sort === 'price_asc')  products.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
    else if (sort === 'rating')     products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else                            products.sort((a, b) => (b.reviews || b.reviewCount || 0) - (a.reviews || a.reviewCount || 0));

    const total = products.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const data  = products.slice(start, start + parseInt(limit)).map(p => ({
      ...p, discount: Math.round((1 - p.price / p.originalPrice) * 100)
    }));
    res.json({ products: data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, (req, res) => {
  const product = DB.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product: { ...product, discount: Math.round((1 - product.price / product.originalPrice) * 100) } });
});

// POST /api/products  — seller creates product
router.post('/', protect, requireSeller, (req, res) => {
  try {
    const { name, brand, category, price, originalPrice, stock, description, sizes, colors, badge, eco, icon } = req.body;
    if (!name || !brand || !category || !price || !originalPrice || stock === undefined)
      return res.status(400).json({ error: 'Name, brand, category, price, originalPrice, stock are required.' });
    if (price >= originalPrice) return res.status(400).json({ error: 'Selling price must be less than MRP.' });

    const product = {
      id: 'p_' + Date.now(), name, brand, category,
      price: Number(price), originalPrice: Number(originalPrice),
      stock: Number(stock), description: description || '',
      sizes: sizes || [], colors: colors || [],
      badge: badge || null, eco: !!eco, icon: icon || '📦',
      sellerId: req.user.id, active: true, listed: true,
      rating: 0, reviews: 0, reviewCount: 0,
      images: [], createdAt: new Date().toISOString(),
    };
    DB.products.push(product);
    res.status(201).json({ product, message: `"${name}" listed successfully!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, requireSeller, (req, res) => {
  const product = DB.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  if (product.sellerId !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Not authorized.' });

  const allowed = ['name','brand','price','originalPrice','stock','description','sizes','colors','badge','eco','icon','active','listed'];
  allowed.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
  res.json({ product, message: 'Product updated.' });
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', protect, (req, res) => {
  try {
    const product = DB.products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1–5.' });

    if (!product.reviewList) product.reviewList = [];
    const review = { id: 'r_' + Date.now(), userId: req.user.id, userName: req.user.name, rating: Number(rating), comment: comment || '', createdAt: new Date().toISOString() };
    product.reviewList.push(review);
    product.reviewCount = product.reviewList.length;
    product.rating = parseFloat((product.reviewList.reduce((s, r) => s + r.rating, 0) / product.reviewList.length).toFixed(1));
    product.reviews = product.reviewCount;
    res.status(201).json({ review, message: 'Review submitted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
