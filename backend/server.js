require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const { apiLimiter } = require('./middleware');

const app = express();

// Trust Render's proxy (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
// CORS — allow same-origin requests + any configured frontend URL
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow localhost in development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    // Allow any onrender.com subdomain
    if (origin.includes('onrender.com')) return callback(null, true);
    // Allow configured frontend URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    // Allow same-origin requests (when frontend is served by same server)
    return callback(null, true);
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// ── Static ────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use('/js',      express.static(path.join(__dirname, '..', 'public', 'js')));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/returns',       require('./routes/returns'));
app.use('/api/seller',        require('./routes/seller'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/upload',        require('./routes/upload'));

// ── Health ────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const { DB } = require('./db');
  res.json({
    status:   'ok',
    version:  '1.0.0',
    env:      process.env.NODE_ENV || 'development',
    uptime:   Math.floor(process.uptime()) + 's',
    counts:   { users: DB.users.length, products: DB.products.length, orders: DB.orders.length },
  });
});

// ── 404 for unknown API ───────────────────────────────────────────
app.use('/api', (req, res) =>
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` })
);

// ── Serve SPA ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), err => {
    if (err) res.status(200).send(`
      <h1>🛒 Hubooze API Server</h1>
      <p>API is running. <a href="/api/health">Health check</a></p>
      <p>Copy <code>hubooze.html</code> → <code>public/index.html</code> to serve the frontend.</p>
    `);
  });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(`[ERROR]`, err.message);
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start ─────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       🛒  HUBOOZE API SERVER v1.0        ║
╠══════════════════════════════════════════╣
║  URL   : http://localhost:${PORT}           ║
║  Health: http://localhost:${PORT}/api/health║
║  Mode  : ${(process.env.NODE_ENV || 'development').padEnd(14)}          ║
╠══════════════════════════════════════════╣
║  Demo accounts:                          ║
║  priya@demo.com    / demo123 (customer)  ║
║  amit@demo.com     / demo123 (seller)    ║
║  admin@hubooze.in  / admin123 (admin)    ║
╚══════════════════════════════════════════╝`);
});

module.exports = app;
