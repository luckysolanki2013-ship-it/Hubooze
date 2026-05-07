# Hubooze — Setup Guide

## Quick Start (2 minutes)
```bash
cd hubooze
npm install
cp .env.example .env
npm start
# Server: http://localhost:3000/api/health
```

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Customer | priya@demo.com | demo123 |
| Seller | amit@demo.com | demo123 |
| Admin | admin@hubooze.in | admin123 |

## Project Structure
```
hubooze/
├── backend/
│   ├── server.js            Express server
│   ├── db.js                In-memory demo database
│   ├── routes/
│   │   ├── auth.js          Register, login, OTP
│   │   ├── products.js      Product CRUD + search
│   │   ├── orders.js        Place, track, cancel
│   │   ├── returns.js       Return + refund flow
│   │   ├── seller.js        Seller dashboard API
│   │   ├── admin.js         Admin panel API
│   │   └── notifications.js Notification prefs
│   ├── middleware/index.js   JWT auth + rate limiting
│   ├── utils/
│   │   ├── notifications.js Email + WhatsApp + SMS
│   │   └── seed.js          Demo data seeder
│   └── config/
│       ├── db.js            MongoDB connector
│       └── email.js         Nodemailer setup
├── frontend/js/
│   ├── api.js               API client (fetch wrapper)
│   └── app.js               API-connected page logic
├── public/index.html        Copy hubooze.html here
├── docs/
│   ├── SETUP.md             This file
│   └── API.md               Full API reference
└── .env.example             Environment template
```

## Connect Frontend to Backend
1. Copy `hubooze.html` → `public/index.html`
2. Add before `</body>`:
```html
<script src="/js/api.js"></script>
<script src="/js/app.js"></script>
```

## Optional Integrations
- **MongoDB**: Set `MONGO_URI` in `.env`
- **Email**: Gmail App Password in `EMAIL_USER` + `EMAIL_PASS`
- **WhatsApp**: Twilio credentials in `.env`
- **Payments**: Razorpay keys in `.env`

## Deploy to Render.com (Free)
1. Push to GitHub
2. New Web Service → connect repo
3. Start: `npm start`
4. Add env vars in dashboard
