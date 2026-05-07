# 🛒 Hubooze — India's Return-to-Recycle Marketplace

> Shop with confidence. Return freely. Support rural artisans.

## ⚡ Quick Start

```bash
npm install
cp .env.example .env
npm start
# Open: http://localhost:3000
```

## 🧪 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | priya@demo.com | demo123 |
| Seller | amit@demo.com | demo123 |
| Admin | admin@hubooze.in | admin123 |

## 📁 Project Structure

```
hubooze/
├── backend/
│   ├── server.js              Express 5 server
│   ├── db.js                  In-memory database (15 products, demo orders)
│   ├── routes/
│   │   ├── auth.js            Register · Login · OTP · Profile
│   │   ├── products.js        List · Search · Filter · CRUD · Reviews
│   │   ├── orders.js          Place · Track · Cancel · Status update
│   │   ├── returns.js         Initiate · Approve · Reject · 90-day policy
│   │   ├── seller.js          Dashboard · Products · Orders · Payouts
│   │   ├── admin.js           Stats · Users · Analytics · Controls
│   │   ├── notifications.js   List · Mark read · Preferences
│   │   ├── payments.js        Razorpay create-order · Verify · Refund
│   │   └── upload.js          Product images · User avatars (multer)
│   ├── middleware/index.js    JWT auth · Rate limiting · Role guards
│   ├── utils/
│   │   ├── notifications.js   Email (Nodemailer) · WhatsApp (Twilio) · SMS
│   │   └── seed.js            Database seeder
│   ├── models/                Mongoose schemas (MongoDB-ready)
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Return.js
│   │   └── Notification.js
│   └── config/
│       ├── db.js              MongoDB connection
│       └── email.js           Nodemailer + Ethereal fallback
├── frontend/js/
│   ├── api.js                 API client — replaces mock data
│   ├── app.js                 API-connected page functions
│   └── payments.js            Razorpay checkout integration
├── public/
│   ├── index.html             Your hubooze.html goes here
│   ├── sw.js                  Service Worker (offline + push)
│   ├── manifest.json          PWA manifest (installable app)
│   └── js/                    Served frontend JS files
├── docs/
│   ├── SETUP.md               Detailed setup guide
│   └── API.md                 Complete API reference
├── .env.example               All environment variables
├── .gitignore
└── README.md                  This file
```

## 🔌 Connecting Frontend to Backend

1. Copy `hubooze.html` → `public/index.html`
2. Add these 3 lines before `</body>`:

```html
<link rel="manifest" href="/manifest.json">
<script src="/js/api.js"></script>
<script src="/js/app.js"></script>
<!-- Optional — Razorpay real payments: -->
<script src="/js/payments.js"></script>
<!-- Optional — PWA install prompt: -->
<script src="/js/pwa.js"></script>
```

## 🔑 Environment Variables

Copy `.env.example` → `.env` and fill in:

```env
# Required
PORT=3000
JWT_SECRET=change_this_in_production

# Optional — MongoDB (works without it using in-memory DB)
MONGO_URI=mongodb://localhost:27017/hubooze

# Optional — Real email (uses Ethereal test email if not set)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# Optional — WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Optional — Payments (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

## 🌐 API Endpoints

| Group | Base | Description |
|-------|------|-------------|
| Auth | `/api/auth` | Register, login, OTP, profile |
| Products | `/api/products` | List, search, CRUD, reviews |
| Orders | `/api/orders` | Place, track, cancel, status |
| Returns | `/api/returns` | Initiate, approve, reject |
| Seller | `/api/seller` | Dashboard, products, payouts |
| Admin | `/api/admin` | Stats, users, analytics |
| Payments | `/api/payments` | Razorpay integration |
| Upload | `/api/upload` | Images (multer) |

See [`docs/API.md`](docs/API.md) for full documentation.

## 🚀 Deploy to Production

**Render.com (free tier):**
```
Build: npm install
Start: npm start
Add env vars in dashboard
```

**Railway:**
```bash
railway login && railway up
```

**PM2 (VPS):**
```bash
npm install -g pm2
pm2 start backend/server.js --name hubooze
pm2 save && pm2 startup
```

## 📱 PWA — Install as Mobile App

The app is fully PWA-ready:
- Offline support via Service Worker
- "Add to Home Screen" prompt
- Push notification support
- Background sync for failed orders

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 5 |
| Database | MongoDB (Mongoose) / In-memory |
| Auth | JWT (jsonwebtoken) |
| Passwords | bcryptjs |
| Email | Nodemailer + Gmail SMTP |
| WhatsApp | Twilio API |
| Payments | Razorpay |
| Uploads | Multer |
| PWA | Service Worker + Web Push |
| Frontend | Vanilla JS SPA (no framework) |

## 📄 License

MIT © 2025 Hubooze
