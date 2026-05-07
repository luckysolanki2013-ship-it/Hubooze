const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  String,
  verified: { type: Boolean, default: false },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  brand:       { type: String, required: true },
  description: { type: String },
  category:    { type: String, required: true, enum: ['fashion','electronics','home','daily','handmade'] },
  subcategory: String,
  price:       { type: Number, required: true, min: 0 },
  originalPrice:{ type: Number, required: true },
  stock:       { type: Number, required: true, min: 0, default: 0 },
  images:      [String],
  icon:        { type: String, default: '📦' },
  sizes:       [String],
  colors:      [String],
  badge:       { type: String, enum: ['NEW','BESTSELLER','HOT','POPULAR','SALE','FESTIVE','ECO',null] },
  eco:         { type: Boolean, default: false },
  seller:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviews:     [reviewSchema],
  rating:      { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
  featured:    { type: Boolean, default: false },
}, { timestamps: true });

// Auto-update rating
productSchema.methods.updateRating = function() {
  if (!this.reviews.length) { this.rating = 0; this.reviewCount = 0; return; }
  this.rating = parseFloat((this.reviews.reduce((s,r) => s + r.rating, 0) / this.reviews.length).toFixed(1));
  this.reviewCount = this.reviews.length;
};

// Virtual: discount %
productSchema.virtual('discount').get(function() {
  return Math.round((1 - this.price / this.originalPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });

productSchema.index({ name: 'text', brand: 'text', description: 'text' });
productSchema.index({ category: 1, active: 1 });
productSchema.index({ seller: 1 });

module.exports = mongoose.model('Product', productSchema);
