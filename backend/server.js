require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
const { apiLimiter } = require('./middleware');

const app = express();

// Trust proxy — required for nginx/AWS
app.set('trust proxy', 1);

// Allow all origins — frontend and backend on same server
app.use(cors({ origin: '*', credentials: false }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));
app.use('/js',      express.static(path.join(__dirname, '..', 'public', 'js')));

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/returns',       require('./routes/returns'));
app.use('/api/seller',        require('./routes/seller'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/upload',        require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  const { DB } = require('./db');
  res.json({
    status:  'ok',
    version: '1.0.0',
    env:     process.env.NODE_ENV || 'development',
    uptime:  Math.floor(process.uptime()) + 's',
    counts:  { users: DB.users.length, products: DB.products.length, orders: DB.orders.length },
  });
});

// 404 for unknown API routes
app.use('/api', (req, res) =>
  res.status(404).json({ error: 'API endpoint not found.' })
);

// Serve frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), err => {
    if (err) res.send('<h1>Hubooze API Running</h1><a href="/api/health">Health</a>');
  });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('ERROR:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = parseInt(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       🛒  HUBOOZE API SERVER v1.0        ║
╠══════════════════════════════════════════╣
║  http://localhost:${PORT}                   ║
║  priya@demo.com    / demo123 (customer)  ║
║  amit@demo.com     / demo123 (seller)    ║
║  admin@hubooze.in  / admin123 (admin)    ║
╚══════════════════════════════════════════╝`);
});

module.exports = app;
