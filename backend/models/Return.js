const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  returnId:     { type: String, unique: true },
  order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:  String,
  reason:       { type: String, required: true },
  condition:    { type: String, enum: ['Like new','Slightly used','Used','Damaged'] },
  refundAmount: Number,
  refundMethod: String,
  status: {
    type: String,
    enum: ['initiated','pickup_scheduled','picked_up','processing','approved','rejected','refunded'],
    default: 'initiated',
  },
  pickupDate:   String,
  resolvedAt:   Date,
  recycled:     { type: Boolean, default: false },
  adminNote:    String,
}, { timestamps: true });

returnSchema.pre('save', function(next) {
  if (!this.returnId) this.returnId = 'RET' + Date.now();
  next();
});

module.exports = mongoose.model('Return', returnSchema);
