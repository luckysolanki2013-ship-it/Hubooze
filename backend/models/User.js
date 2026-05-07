const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  name: String, phone: String,
  line1: String, line2: String,
  city: String, state: String, pincode: String,
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:        { type: String, trim: true },
  password:     { type: String, required: true, minlength: 6, select: false },
  role:         { type: String, enum: ['customer','seller','admin'], default: 'customer' },
  city:         { type: String },
  avatar:       { type: String },
  // Seller fields
  businessName: { type: String },
  gstNo:        { type: String },
  bankAccount:  { type: String },
  ifscCode:     { type: String },
  approved:     { type: Boolean, default: true },
  // Preferences
  notifPrefs: {
    order_placed_wa:      { type: Boolean, default: true },
    order_placed_email:   { type: Boolean, default: true },
    order_shipped_wa:     { type: Boolean, default: true },
    return_approved_wa:   { type: Boolean, default: true },
    return_approved_email:{ type: Boolean, default: true },
    promo_email:          { type: Boolean, default: true },
  },
  addresses:    [addressSchema],
  wishlist:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  otp:          { code: String, expiresAt: Date },
  lastLoginAt:  Date,
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
