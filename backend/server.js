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
app.use('/api/otp',          require('./routes/otp'));
app.use('/api/ccavenue',     require('./routes/ccavenue'));

// Health check
// Dynamic sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
  try {
    const dba = require('./dbAdapter');
    const products = await dba.findProducts({});
    const staticUrls = ['', 'categories', 'returns'];
    const now = new Date().toISOString().split('T')[0];
    let urls = staticUrls.map(p => `<url><loc>https://hubooze.in/${p}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>${p === '' ? '1.0' : '0.7'}</priority></url>`);
    products.forEach(p => {
      urls.push(`<url><loc>https://hubooze.in/?product=${p.id}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch(e) {
    res.status(500).send('Error generating sitemap');
  }
});

app.get('/api/health', async (req, res) => {
  const dba = require('./dbAdapter');
  try {
    const [users, products, orders] = await Promise.all([
      dba.getAllUsers(), dba.findProducts({}), dba.findOrders({})
    ]);
    res.json({
      status:   'ok',
      version:  '1.0.0',
      env:      process.env.NODE_ENV || 'development',
      uptime:   Math.floor(process.uptime()) + 's',
      db:       dba.useMongo() ? 'mongodb' : 'in-memory',
      counts:   { users: users.length, products: products.length, orders: orders.length },
    });
  } catch(e) {
    res.json({ status: 'ok', version: '1.0.0', env: process.env.NODE_ENV || 'development', uptime: Math.floor(process.uptime()) + 's', db: dba.useMongo() ? 'mongodb' : 'in-memory', counts: { error: e.message } });
  }
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
const { sendErrorAlert } = require('./utils/errorAlert');

app.use((err, req, res, _next) => {
  console.error('ERROR:', err.message);
  sendErrorAlert('API Error', err.message + '\n' + (err.stack || ''), {
    method: req.method, url: req.originalUrl, ip: req.ip
  }).catch(() => {});
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Catch crashes / unhandled errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  sendErrorAlert('Uncaught Exception (Server Crash Risk)', err.message + '\n' + (err.stack || '')).catch(() => {});
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  sendErrorAlert('Unhandled Promise Rejection', String(reason && reason.stack || reason)).catch(() => {});
});

const PORT = parseInt(process.env.PORT) || 3000;

// Connect MongoDB then start server
const dba = require('./dbAdapter');
dba.init().then(() => {
  const { startResourceMonitor } = require('./utils/resourceMonitor');
  app.listen(PORT, () => {
    startResourceMonitor();
    console.log(`
╔══════════════════════════════════════════╗
║       🛒  HUBOOZE API SERVER v1.0        ║
╠══════════════════════════════════════════╣
║  http://localhost:${PORT}                   ║
║  DB: ${dba.useMongo() ? 'MongoDB Atlas ✅        ' : 'In-Memory ⚠️          '}           ║
╚══════════════════════════════════════════╝`);
  });
});

module.exports = app;
