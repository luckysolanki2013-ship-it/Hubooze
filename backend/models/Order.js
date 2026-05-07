const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:     String,
  icon:     String,
  price:    Number,
  quantity: Number,
  size:     String,
  color:    String,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId:       { type: String, unique: true },
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:         [orderItemSchema],
  address: {
    name: String, phone: String,
    line1: String, line2: String,
    city: String, state: String, pincode: String,
  },
  subtotal:      Number,
  discount:      { type: Number, default: 0 },
  couponCode:    String,
  couponDiscount:{ type: Number, default: 0 },
  deliveryFee:   { type: Number, default: 0 },
  giftWrap:      { type: Number, default: 0 },
  total:         Number,
  status: {
    type: String,
    enum: ['processing','confirmed','shipped','out_for_delivery','delivered','cancelled','returned'],
    default: 'processing',
  },
  paymentMethod: { type: String, enum: ['UPI','Card','NB','COD','Wallet'] },
  paymentId:     String,
  paymentStatus: { type: String, enum: ['pending','paid','refunded'], default: 'pending' },
  note:          String,
  trackingId:    String,
  estimatedDelivery: String,
  shippedAt:     Date,
  deliveredAt:   Date,
  cancelledAt:   Date,
  cancelReason:  String,
}, { timestamps: true });

// Auto-generate orderId
orderSchema.pre('save', function(next) {
  if (!this.orderId) this.orderId = 'ORD' + Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
