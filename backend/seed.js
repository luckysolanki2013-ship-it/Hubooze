/**
 * HUBOOZE — Seed MongoDB with demo data
 * Run once: node backend/seed.js
 */
require('dotenv').config();
const { connectDB } = require('./mongoose');
const { User, Product, Order, Return } = require('./models');
const { DB } = require('./db');

async function seed() {
  await connectDB();
  
  console.log('Seeding...');

  // Clear existing
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Return.deleteMany({});

  // Seed users
  await User.insertMany(DB.users.map(u => ({...u, _id: undefined})));
  console.log('✅ Users seeded:', DB.users.length);

  // Seed products
  await Product.insertMany(DB.products.map(p => ({
    ...p,
    originalPrice: p.originalPrice || p.price,
    _id: undefined
  })));
  console.log('✅ Products seeded:', DB.products.length);

  // Seed orders
  await Order.insertMany(DB.orders.map(o => ({...o, _id: undefined})));
  console.log('✅ Orders seeded:', DB.orders.length);

  console.log('\n🎉 Database seeded successfully!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
