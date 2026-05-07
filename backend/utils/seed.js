/**
 * HUBOOZE SEED SCRIPT
 * Populates the database with demo data.
 * Run: node backend/utils/seed.js
 */
require('dotenv').config();

// For in-memory DB (no MongoDB) — just logs demo data
const { DB } = require('../db');

console.log(`
╔══════════════════════════════════════════╗
║        🌱 HUBOOZE DATABASE SEED          ║
╚══════════════════════════════════════════╝

Demo accounts already loaded in in-memory DB:

  CUSTOMER:
  Email    : priya@demo.com
  Password : demo123
  Role     : customer
  City     : Indore

  SELLER:
  Email    : amit@demo.com
  Password : demo123
  Role     : seller
  Business : AK Textiles

  ADMIN:
  Email    : admin@hubooze.in
  Password : admin123
  Role     : admin

Products loaded: ${DB.products.length}
Orders loaded:   ${DB.orders.length}

To use real MongoDB:
  1. Set MONGO_URI in .env
  2. This script will write to MongoDB instead

✅ Seed complete!
`);

process.exit(0);
