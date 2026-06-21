/**
 * HUBOOZE — Mongoose Models
 */
const { mongoose } = require('./mongoose');
const bcrypt = require('bcryptjs');

// ── USER ──────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  id:           { type: String, unique: true },
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  phone:        String,
  password:     { type: String, required: true },
  role:         { type: String, enum: ['customer','seller','admin'], default: 'customer' },
  city:         String,
  businessName: String,
  addresses:    [{ type: mongoose.Schema.Types.Mixed }],
  brandDocuments: { type: mongoose.Schema.Types.Mixed, default: null },
  brandApproved:  { type: Boolean, default: false },
  commission:     { type: Number, default: 10 },
  bankDetails:    { type: mongoose.Schema.Types.Mixed, default: null },
  wishlist:     [String],
  notifPrefs:   { type: mongoose.Schema.Types.Mixed, default: {} },
  approved:     { type: Boolean, default: false },
  avatar:       String,
  createdAt:    { type: Date, default: Date.now },
  lastLoginAt:  Date,
}, { timestamps: false });

// ── PRODUCT ───────────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  id:            { type: String, unique: true },
  name:          { type: String, required: true },
  brand:         String,
  category:      String,
  price:         { type: Number, required: true },
  originalPrice: Number,
  stock:         { type: Number, default: 0 },
  eco:           { type: Boolean, default: false },
  badge:         String,
  icon:          String,
  image:         String,
  rating:        { type: Number, default: 0 },
  reviews:       { type: Number, default: 0 },
  sellerId:      String,
  active:        { type: Boolean, default: true },
  listed:        { type: Boolean, default: true },
  sizes:         [String],
  colors:        [String],
  description:   String,
  createdAt:     { type: Date, default: Date.now },
}, { timestamps: false });

// ── ORDER ─────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  id:               { type: String, unique: true },
  orderId:          { type: String, unique: true },
  userId:           String,
  items:            [{ type: mongoose.Schema.Types.Mixed }],
  address:          { type: mongoose.Schema.Types.Mixed },
  subtotal:         Number,
  discount:         Number,
  couponDiscount:   Number,
  couponCode:       String,
  deliveryFee:      Number,
  giftWrap:         Number,
  total:            Number,
  status:           { type: String, default: 'processing' },
  paymentMethod:    String,
  paymentStatus:    String,
  paymentId:        String,
  paidAmount:       mongoose.Schema.Types.Mixed,
  paidAt:           Date,
  note:             String,
  estimatedDelivery:String,
  trackingNumber:   String,
  courierName:      String,
  pickupAddress:    { type: mongoose.Schema.Types.Mixed },
  timeline:         [{ type: mongoose.Schema.Types.Mixed }],
  cancelledAt:      Date,
  cancelReason:     String,
  shippedAt:        Date,
  deliveredAt:      Date,
  createdAt:        { type: Date, default: Date.now },
}, { timestamps: false, strict: false });

// ── RETURN ────────────────────────────────────────────────────────
const returnSchema = new mongoose.Schema({
  id:          { type: String, unique: true },
  orderId:     String,
  userId:      String,
  items:       [{ type: mongoose.Schema.Types.Mixed }],
  reason:      String,
  status:      { type: String, default: 'pending' },
  refundAmt:   Number,
  createdAt:   { type: Date, default: Date.now },
}, { timestamps: false });

const User    = mongoose.models.User    || mongoose.model('User',    userSchema);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Order   = mongoose.models.Order   || mongoose.model('Order',   orderSchema);
const Return  = mongoose.models.Return  || mongoose.model('Return',  returnSchema);

module.exports = { User, Product, Order, Return };
