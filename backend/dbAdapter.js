/**
 * HUBOOZE — DB Adapter
 * Tries MongoDB first, falls back to in-memory DB
 */
const { DB } = require('./db');

let useMongo = false;
let Models = null;

async function init() {
  try {
    const { connectDB } = require('./mongoose');
    await connectDB();
    Models = require('./models');
    useMongo = true;
    console.log('✅ Using MongoDB Atlas');
  } catch(e) {
    console.log('⚠️  Using in-memory DB:', e.message);
  }
}

// ── USERS ─────────────────────────────────────────────────────────
async function findUser(query) {
  if (useMongo) {
    return await Models.User.findOne(query).lean();
  }
  if (query.email) return DB.users.find(u => u.email === query.email) || null;
  if (query.id)    return DB.users.find(u => u.id === query.id) || null;
  return null;
}

async function createUser(data) {
  if (useMongo) {
    const u = new Models.User(data);
    await u.save();
    return u.toObject();
  }
  DB.users.push(data);
  return data;
}

async function updateUser(id, update) {
  if (useMongo) {
    const query = String(id).length === 24 ? {_id: id} : {id: id};
    return await Models.User.findOneAndUpdate(query, {$set: update}, {new:true}).lean();
  }
  const idx = DB.users.findIndex(u => u.id === id);
  if (idx >= 0) { Object.assign(DB.users[idx], update); return DB.users[idx]; }
  return null;
}

async function getAllUsers() {
  if (useMongo) return await Models.User.find({}).lean();
  return DB.users;
}

// ── PRODUCTS ──────────────────────────────────────────────────────
async function findProducts(query = {}) {
  if (useMongo) return await Models.Product.find(query).lean();
  let prods = DB.products;
  if (query.category)  prods = prods.filter(p => p.category === query.category);
  if (query.sellerId)  prods = prods.filter(p => p.sellerId === query.sellerId);
  if (query.active !== undefined) prods = prods.filter(p => p.active === query.active);
  return prods;
}

async function findProduct(id) {
  if (useMongo) return await Models.Product.findOne({id}).lean();
  return DB.products.find(p => p.id === id) || null;
}

async function createProduct(data) {
  if (useMongo) {
    const p = new Models.Product(data);
    await p.save();
    return p.toObject();
  }
  DB.products.push(data);
  return data;
}

async function updateProduct(id, update) {
  if (useMongo) return await Models.Product.findOneAndUpdate({id}, {$set: update}, {new:true}).lean();
  const idx = DB.products.findIndex(p => p.id === id);
  if (idx >= 0) { Object.assign(DB.products[idx], update); return DB.products[idx]; }
  return null;
}

async function deleteProduct(id) {
  if (useMongo) { await Models.Product.deleteOne({id}); return true; }
  const idx = DB.products.findIndex(p => p.id === id);
  if (idx >= 0) { DB.products.splice(idx, 1); return true; }
  return false;
}

// ── ORDERS ────────────────────────────────────────────────────────
async function findOrders(query = {}) {
  if (useMongo) return await Models.Order.find(query).sort({createdAt:-1}).lean();
  let orders = DB.orders;
  if (query.userId) orders = orders.filter(o => o.userId === query.userId);
  return orders;
}

async function findOrder(id) {
  if (useMongo) return await Models.Order.findOne({$or:[{id},{orderId:id}]}).lean();
  return DB.orders.find(o => o.id === id || o.orderId === id) || null;
}

async function createOrder(data) {
  if (useMongo) {
    const o = new Models.Order(data);
    await o.save();
    return o.toObject();
  }
  DB.orders.push(data);
  return data;
}

async function updateOrder(id, update) {
  if (useMongo) return await Models.Order.findOneAndUpdate({$or:[{id},{orderId:id}]}, {$set: update}, {new:true}).lean();
  const idx = DB.orders.findIndex(o => o.id === id || o.orderId === id);
  if (idx >= 0) { Object.assign(DB.orders[idx], update); return DB.orders[idx]; }
  return null;
}

// ── RETURNS ───────────────────────────────────────────────────────
async function findReturns(query = {}) {
  if (useMongo) return await Models.Return.find(query).sort({createdAt:-1}).lean();
  let returns = DB.returns || [];
  if (query.userId) returns = returns.filter(r => r.userId === query.userId);
  return returns;
}

async function createReturn(data) {
  if (useMongo) {
    const r = new Models.Return(data);
    await r.save();
    return r.toObject();
  }
  if (!DB.returns) DB.returns = [];
  DB.returns.push(data);
  return data;
}

async function updateReturn(id, update) {
  if (useMongo) return await Models.Return.findOneAndUpdate({id}, update, {new:true}).lean();
  const idx = (DB.returns||[]).findIndex(r => r.id === id);
  if (idx >= 0) { Object.assign(DB.returns[idx], update); return DB.returns[idx]; }
  return null;
}

module.exports = {
  deleteUser,
  init, useMongo: () => useMongo,
  findUser, createUser, updateUser, getAllUsers,
  findProducts, findProduct, createProduct, updateProduct, deleteProduct,
  findOrders, findOrder, createOrder, updateOrder,
  findReturns, createReturn, updateReturn,
};

async function deleteUser(id) {
  if (useMongo) { await Models.User.deleteOne({id}); return true; }
  const idx = DB.users.findIndex(u => u.id === id);
  if (idx >= 0) { DB.users.splice(idx, 1); return true; }
  return false;
}
