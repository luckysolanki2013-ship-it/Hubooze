const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:     { type: String, enum: ['order','return','promo','system','otp'], required: true },
  title:    { type: String, required: true },
  body:     { type: String, required: true },
  channels: [{ type: String, enum: ['wa','email','sms','push'] }],
  data:     { type: mongoose.Schema.Types.Mixed, default: {} },
  read:     { type: Boolean, default: false },
  readAt:   Date,
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
