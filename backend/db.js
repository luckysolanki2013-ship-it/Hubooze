/**
 * IN-MEMORY DATABASE
 * Used when MongoDB is not connected.
 * In production, replace with Mongoose models.
 */
const bcrypt = require('bcryptjs');

const DB = {
  users: [
    { id:'u1', name:'Priya Sharma',  email:'priya@demo.com',     phone:'9999999999', password: bcrypt.hashSync('demo123',8),  role:'customer', city:'Indore',    addresses:[{id:'addr1',name:'Priya Sharma',phone:'9999999999',line1:'123 MG Road',city:'Indore',state:'MP',pincode:'452001',isDefault:true}], wishlist:[], notifPrefs:{}, createdAt:'2024-12-01' },
    { id:'u2', name:'Amit Kumar',    email:'amit@demo.com',      phone:'8888888888', password: bcrypt.hashSync('demo123',8),  role:'seller',   city:'Pithampur', businessName:'AK Textiles', addresses:[], wishlist:[], notifPrefs:{}, approved:true, createdAt:'2024-12-05' },
    { id:'u3', name:'Admin User',    email:'admin@hubooze.in',   phone:'7777777777', password: bcrypt.hashSync('admin123',8), role:'admin',    city:'Indore',    addresses:[], wishlist:[], notifPrefs:{}, createdAt:'2024-01-01' },
  ],
  products: [],
  orders: [
    { id:'ORD2412001', orderId:'ORD2412001', userId:'u1', items:[{productId:'p1',name:'Floral Printed Kurti',icon:'👗',price:299,qty:2,quantity:2,size:'M'}], address:{name:'Priya Sharma',phone:'9999999999',line1:'123 MG Road',city:'Indore',state:'MP',pincode:'452001'}, subtotal:598, discount:600, couponDiscount:0, deliveryFee:0, total:598, status:'delivered', paymentMethod:'UPI', paymentStatus:'paid', estimatedDelivery:'Thursday, 2 January', deliveredAt:'2025-01-02T10:00:00Z', createdAt:'2024-12-28T10:00:00Z' },
    { id:'ORD2501002', orderId:'ORD2501002', userId:'u1', items:[{productId:'p2',name:'Wireless Earphones Pro',icon:'🎧',price:799,qty:1,quantity:1,size:null}], address:{name:'Priya Sharma',phone:'9999999999',line1:'123 MG Road',city:'Indore',state:'MP',pincode:'452001'}, subtotal:799, discount:700, couponDiscount:0, deliveryFee:0, total:799, status:'shipped', paymentMethod:'Card', paymentStatus:'paid', estimatedDelivery:'Friday, 10 January', createdAt:'2025-01-05T14:00:00Z' },
    { id:'ORD2501003', orderId:'ORD2501003', userId:'u1', items:[{productId:'p5',name:'Face Glow Serum',icon:'✨',price:179,qty:1,quantity:1,size:'30ml'},{productId:'p6',name:'Handloom Jute Bag',icon:'👜',price:249,qty:1,quantity:1,size:'S'}], address:{name:'Priya Sharma',phone:'9999999999',line1:'123 MG Road',city:'Indore',state:'MP',pincode:'452001'}, subtotal:428, discount:472, couponDiscount:0, deliveryFee:49, total:477, status:'processing', paymentMethod:'COD', paymentStatus:'pending', estimatedDelivery:'Monday, 13 January', createdAt:'2025-01-08T09:00:00Z' },
  ],
  returns:       [],
  notifications: [],
  otpStore:      {},
};

module.exports = { DB };
