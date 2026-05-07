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
  products: [
    { id:'p1',  name:'Floral Printed Kurti',      brand:'EthniCraft',  category:'fashion',     price:299,  originalPrice:599,  stock:50, eco:false, badge:'NEW',       icon:'👗',  rating:4.8, reviews:1892, sellerId:'u2', active:true, sizes:['S','M','L','XL'], colors:['Red','Blue'], description:'Beautiful floral kurti in premium cotton.', createdAt:'2024-12-01' },
    { id:'p2',  name:'Wireless Earphones Pro',    brand:'TechHub',     category:'electronics', price:799,  originalPrice:1499, stock:30, eco:false, badge:'BESTSELLER', icon:'🎧', rating:4.5, reviews:2341, sellerId:'u2', active:true, sizes:[], colors:['Black','White'], description:'20-hour battery wireless earphones.', createdAt:'2024-12-02' },
    { id:'p3',  name:'Recrafted Wall Hanging',     brand:'RuralArt',    category:'handmade',    price:349,  originalPrice:800,  stock:15, eco:true,  badge:'ECO',        icon:'🪴', rating:4.9, reviews:654,  sellerId:'u2', active:true, sizes:[], colors:['Natural'], description:'Handmade by rural artisans from returned materials.', createdAt:'2024-12-03' },
    { id:'p4',  name:'Kitchen Knife Set',          brand:'HomeMart',    category:'home',        price:449,  originalPrice:899,  stock:25, eco:false, badge:null,         icon:'🔪', rating:4.3, reviews:987,  sellerId:'u2', active:true, sizes:[], colors:['Silver'], description:'5-piece professional kitchen knife set.', createdAt:'2024-12-04' },
    { id:'p5',  name:'Face Glow Serum',            brand:'NaturCare',   category:'daily',       price:179,  originalPrice:349,  stock:80, eco:false, badge:'HOT',        icon:'✨', rating:4.6, reviews:3210, sellerId:'u2', active:true, sizes:['30ml','50ml'], colors:[], description:'Vitamin C face serum for glowing skin.', createdAt:'2024-12-05' },
    { id:'p6',  name:'Handloom Jute Bag',          brand:'RuralArt',    category:'handmade',    price:249,  originalPrice:550,  stock:20, eco:true,  badge:'ECO',        icon:'👜', rating:4.7, reviews:432,  sellerId:'u2', active:true, sizes:['S','L'], colors:['Natural'], description:'Eco-friendly handwoven jute bag.', createdAt:'2024-12-06' },
    { id:'p7',  name:'USB-C Fast Charger',         brand:'TechHub',     category:'electronics', price:299,  originalPrice:599,  stock:60, eco:false, badge:null,         icon:'🔌', rating:4.4, reviews:1567, sellerId:'u2', active:true, sizes:[], colors:['White','Black'], description:'65W PD fast charger.', createdAt:'2024-12-07' },
    { id:'p8',  name:'Banarasi Saree',             brand:'EthniCraft',  category:'fashion',     price:1299, originalPrice:2999, stock:10, eco:false, badge:'FESTIVE',    icon:'🥻', rating:4.8, reviews:432,  sellerId:'u2', active:true, sizes:['Free Size'], colors:['Red','Blue','Green'], description:'Authentic Banarasi silk saree with zari work.', createdAt:'2024-12-08' },
    { id:'p9',  name:'Recrafted Pottery Vase',     brand:'RuralArt',    category:'handmade',    price:299,  originalPrice:700,  stock:12, eco:true,  badge:'ECO',        icon:'🏺', rating:4.9, reviews:321,  sellerId:'u2', active:true, sizes:[], colors:['Terracotta'], description:'Pottery vase crafted by tribal artisans.', createdAt:'2024-12-09' },
    { id:'p10', name:'Bluetooth Speaker',          brand:'TechHub',     category:'electronics', price:699,  originalPrice:1299, stock:35, eco:false, badge:'POPULAR',    icon:'🔊', rating:4.4, reviews:2134, sellerId:'u2', active:true, sizes:[], colors:['Black','Blue'], description:'360-degree sound, 12-hour playback.', createdAt:'2024-12-10' },
    { id:'p11', name:'Cotton Ethnic Shirt',        brand:'ManStyle',    category:'fashion',     price:399,  originalPrice:799,  stock:45, eco:false, badge:'SALE',       icon:'👔', rating:4.5, reviews:876,  sellerId:'u2', active:true, sizes:['S','M','L','XL','XXL'], colors:['White','Blue'], description:'Premium cotton ethnic shirt.', createdAt:'2024-12-11' },
    { id:'p12', name:'Handwoven Basket Set',       brand:'VillageKraft',category:'handmade',    price:199,  originalPrice:450,  stock:18, eco:true,  badge:'ECO',        icon:'🧺', rating:4.8, reviews:215,  sellerId:'u2', active:true, sizes:[], colors:['Natural'], description:'Set of 3 handwoven storage baskets.', createdAt:'2024-12-12' },
    { id:'p13', name:'LED Desk Lamp',              brand:'BrightTech',  category:'electronics', price:549,  originalPrice:999,  stock:22, eco:false, badge:'NEW',        icon:'💡', rating:4.5, reviews:876,  sellerId:'u2', active:true, sizes:[], colors:['White','Black'], description:'Energy-efficient LED desk lamp.', createdAt:'2024-12-13' },
    { id:'p14', name:'Slim Fit Jeans',             brand:'ManStyle',    category:'fashion',     price:699,  originalPrice:1499, stock:38, eco:false, badge:'NEW',        icon:'👖', rating:4.5, reviews:1234, sellerId:'u2', active:true, sizes:['28','30','32','34','36'], colors:['Blue','Black'], description:'Slim fit stretch denim jeans.', createdAt:'2024-12-14' },
    { id:'p15', name:'Anarkali Suit',              brand:'EthniCraft',  category:'fashion',     price:899,  originalPrice:1999, stock:16, eco:false, badge:'POPULAR',    icon:'👘', rating:4.7, reviews:765,  sellerId:'u2', active:true, sizes:['S','M','L','XL'], colors:['Red','Purple','Green'], description:'Beautiful Anarkali suit with embroidery.', createdAt:'2024-12-15' },
  ],
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
