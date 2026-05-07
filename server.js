const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET = 'hubooze_jwt_secret_2025';

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ─── DATABASE ─── */
const DB = {
  users: [
    { id:'u1', name:'Priya Sharma', email:'priya@demo.com', phone:'9999999999',
      password: bcrypt.hashSync('demo123',8), role:'customer', city:'Indore', createdAt:'2024-12-01' },
    { id:'u2', name:'Amit Kumar', email:'amit@demo.com', phone:'8888888888',
      password: bcrypt.hashSync('demo123',8), role:'seller', city:'Pithampur',
      businessName:'AK Textiles', approved:true, createdAt:'2024-12-05' },
    { id:'u3', name:'Admin', email:'admin@hubooze.in', phone:'7777777777',
      password: bcrypt.hashSync('admin123',8), role:'admin', city:'Indore', createdAt:'2024-01-01' }
  ],
  products: [
    { id:'p1', name:'Floral Printed Kurti', brand:'EthniCraft', category:'fashion', price:299, originalPrice:599, stock:50, eco:false, badge:'NEW', images:['👗'], rating:4.8, reviews:1892, sellerId:'u2', active:true, description:'Beautiful floral kurti in premium cotton fabric.', sizes:['S','M','L','XL'], colors:['Red','Blue','Green'] },
    { id:'p2', name:'Wireless Earphones Pro', brand:'TechHub', category:'electronics', price:799, originalPrice:1499, stock:30, eco:false, badge:'BESTSELLER', images:['🎧'], rating:4.5, reviews:2341, sellerId:'u2', active:true, description:'20-hour battery wireless earphones.', sizes:[], colors:['Black','White'] },
    { id:'p3', name:'Recrafted Wall Hanging', brand:'RuralArt', category:'handmade', price:349, originalPrice:800, stock:15, eco:true, badge:'ECO', images:['🪴'], rating:4.9, reviews:654, sellerId:'u2', active:true, description:'Handmade by rural artisans from returned materials.', sizes:[], colors:['Natural'] },
    { id:'p4', name:'Kitchen Knife Set', brand:'HomeMart', category:'home', price:449, originalPrice:899, stock:25, eco:false, badge:null, images:['🔪'], rating:4.3, reviews:987, sellerId:'u2', active:true, description:'5-piece professional kitchen knife set.', sizes:[], colors:['Silver'] },
    { id:'p5', name:'Face Glow Serum', brand:'NaturCare', category:'daily', price:179, originalPrice:349, stock:80, eco:false, badge:'HOT', images:['✨'], rating:4.6, reviews:3210, sellerId:'u2', active:true, description:'Vitamin C face serum for glowing skin.', sizes:['30ml','50ml'], colors:[] },
    { id:'p6', name:'Handloom Jute Bag', brand:'RuralArt', category:'handmade', price:249, originalPrice:550, stock:20, eco:true, badge:'ECO', images:['👜'], rating:4.7, reviews:432, sellerId:'u2', active:true, description:'Eco-friendly handloom jute bag.', sizes:['Small','Large'], colors:['Natural'] },
    { id:'p7', name:'USB-C Fast Charger', brand:'TechHub', category:'electronics', price:299, originalPrice:599, stock:60, eco:false, badge:null, images:['🔌'], rating:4.4, reviews:1567, sellerId:'u2', active:true, description:'65W PD fast charger.', sizes:[], colors:['White','Black'] },
    { id:'p8', name:'Banarasi Saree', brand:'EthniCraft', category:'fashion', price:1299, originalPrice:2999, stock:10, eco:false, badge:'FESTIVE', images:['🥻'], rating:4.8, reviews:432, sellerId:'u2', active:true, description:'Authentic Banarasi silk saree with zari work.', sizes:['Free Size'], colors:['Red','Blue','Green','Pink'] },
    { id:'p9', name:'Recrafted Pottery Vase', brand:'RuralArt', category:'handmade', price:299, originalPrice:700, stock:12, eco:true, badge:'ECO', images:['🏺'], rating:4.9, reviews:321, sellerId:'u2', active:true, description:'Pottery vase crafted by tribal artisans.', sizes:[], colors:['Terracotta','Blue'] },
    { id:'p10', name:'Bluetooth Speaker', brand:'TechHub', category:'electronics', price:699, originalPrice:1299, stock:35, eco:false, badge:'POPULAR', images:['🔊'], rating:4.4, reviews:2134, sellerId:'u2', active:true, description:'360-degree sound, 12-hour playback.', sizes:[], colors:['Black','Blue'] },
    { id:'p11', name:'Cotton Ethnic Shirt', brand:'ManStyle', category:'fashion', price:399, originalPrice:799, stock:45, eco:false, badge:'SALE', images:['👔'], rating:4.5, reviews:876, sellerId:'u2', active:true, description:'Premium cotton ethnic shirt with block print.', sizes:['S','M','L','XL','XXL'], colors:['White','Blue'] },
    { id:'p12', name:'Handwoven Basket Set', brand:'VillageKraft', category:'handmade', price:199, originalPrice:450, stock:18, eco:true, badge:'ECO', images:['🧺'], rating:4.8, reviews:215, sellerId:'u2', active:true, description:'Set of 3 handwoven storage baskets.', sizes:[], colors:['Natural'] }
  ],
  orders: [
    { id:'ORD001', userId:'u1', items:[{ productId:'p1', name:'Floral Printed Kurti', price:299, qty:2, icon:'👗', size:'M', color:'Red' }], total:598, subtotal:598, shipping:0, status:'delivered', address:'123 MG Road, Indore, MP 452001', paymentMethod:'UPI', createdAt:'2024-12-28', deliveredAt:'2025-01-01' },
    { id:'ORD002', userId:'u1', items:[{ productId:'p2', name:'Wireless Earphones Pro', price:799, qty:1, icon:'🎧', size:null, color:'Black' }], total:799, subtotal:799, shipping:0, status:'shipped', address:'123 MG Road, Indore, MP 452001', paymentMethod:'Card', createdAt:'2025-01-02' },
    { id:'ORD003', userId:'u1', items:[{ productId:'p5', name:'Face Glow Serum', price:179, qty:1, icon:'✨', size:'30ml', color:null }], total:228, subtotal:179, shipping:49, status:'processing', address:'123 MG Road, Indore, MP 452001', paymentMethod:'COD', createdAt:'2025-01-05' }
  ],
  returns: [
    { id:'RET001', orderId:'ORD001', userId:'u1', productId:'p1', productName:'Floral Printed Kurti', reason:'Size too large', condition:'Like new', refundAmount:299, refundMethod:'UPI', status:'approved', createdAt:'2025-01-03', resolvedAt:'2025-01-04' }
  ],
  wishlist: [{ userId:'u1', productId:'p3' }, { userId:'u1', productId:'p8' }],
  reviews: [{ id:'rev1', productId:'p1', userId:'u1', userName:'Priya S.', rating:5, comment:'Beautiful kurti! Perfect fit.', verified:true, createdAt:'2025-01-02' }],
  carts: {},
  addresses: [{ id:'addr1', userId:'u1', name:'Priya Sharma', phone:'9999999999', line1:'123 MG Road', city:'Indore', state:'Madhya Pradesh', pincode:'452001', isDefault:true }]
};

/* ─── MIDDLEWARE ─── */
function auth(req, res, next) {
  const token = (req.headers.authorization||'').split(' ')[1];
  if (!token) return res.status(401).json({ error:'Login required' });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error:'Invalid token' }); }
}
function sellerAuth(req,res,next){ auth(req,res,()=>{ if(!['seller','admin'].includes(req.user.role)) return res.status(403).json({error:'Seller access required'}); next(); }); }
function adminAuth(req,res,next){ auth(req,res,()=>{ if(req.user.role!=='admin') return res.status(403).json({error:'Admin access required'}); next(); }); }

/* ─── AUTH ─── */
app.post('/api/auth/register', async (req,res) => {
  const {name,email,password,phone,city,role} = req.body;
  if (!name||!email||!password) return res.status(400).json({error:'name, email, password required'});
  if (DB.users.find(u=>u.email===email)) return res.status(409).json({error:'Email already registered'});
  const user = { id:'u_'+uuidv4().slice(0,8), name, email, phone:phone||'', city:city||'', password:await bcrypt.hash(password,8), role:role==='seller'?'seller':'customer', approved:role!=='seller', createdAt:new Date().toISOString().slice(0,10) };
  DB.users.push(user);
  const {password:_,...safe} = user;
  const token = jwt.sign({id:user.id,email,role:user.role,name},SECRET,{expiresIn:'7d'});
  res.status(201).json({token,user:safe});
});

app.post('/api/auth/login', async (req,res) => {
  const {email,password} = req.body;
  const user = DB.users.find(u=>u.email===email);
  if (!user||!(await bcrypt.compare(password,user.password))) return res.status(401).json({error:'Wrong email or password'});
  const {password:_,...safe} = user;
  const token = jwt.sign({id:user.id,email,role:user.role,name:user.name},SECRET,{expiresIn:'7d'});
  res.json({token,user:safe});
});

app.get('/api/auth/me', auth, (req,res) => {
  const user = DB.users.find(u=>u.id===req.user.id);
  if (!user) return res.status(404).json({error:'User not found'});
  const {password:_,...safe} = user;
  res.json(safe);
});

app.put('/api/auth/profile', auth, (req,res) => {
  const user = DB.users.find(u=>u.id===req.user.id);
  if (!user) return res.status(404).json({error:'User not found'});
  ['name','phone','city'].forEach(k=>{ if(req.body[k]!==undefined) user[k]=req.body[k]; });
  const {password:_,...safe} = user;
  res.json(safe);
});

/* ─── PRODUCTS ─── */
app.get('/api/products', (req,res) => {
  const {category,search,sort,eco,badge,page=1,limit=12} = req.query;
  let prods = DB.products.filter(p=>p.active);
  if (category&&category!=='all') prods = prods.filter(p=>p.category===category);
  if (eco==='true') prods = prods.filter(p=>p.eco);
  if (badge) prods = prods.filter(p=>p.badge===badge.toUpperCase());
  if (search) { const q=search.toLowerCase(); prods=prods.filter(p=>p.name.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)); }
  if (sort==='price_asc') prods.sort((a,b)=>a.price-b.price);
  else if (sort==='price_desc') prods.sort((a,b)=>b.price-a.price);
  else if (sort==='rating') prods.sort((a,b)=>b.rating-a.rating);
  else if (sort==='newest') prods.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  else prods.sort((a,b)=>b.reviews-a.reviews);
  const total=prods.length, skip=(parseInt(page)-1)*parseInt(limit);
  res.json({ products:prods.slice(skip,skip+parseInt(limit)).map(p=>({...p,discount:Math.round((1-p.price/p.originalPrice)*100)})), total, page:parseInt(page), pages:Math.ceil(total/parseInt(limit)) });
});

app.get('/api/products/:id', (req,res) => {
  const p = DB.products.find(p=>p.id===req.params.id);
  if (!p) return res.status(404).json({error:'Product not found'});
  res.json({...p, discount:Math.round((1-p.price/p.originalPrice)*100), productReviews:DB.reviews.filter(r=>r.productId===p.id)});
});

app.post('/api/products', sellerAuth, (req,res) => {
  const {name,brand,category,price,originalPrice,stock,description,sizes,colors,badge} = req.body;
  if (!name||!price||!stock) return res.status(400).json({error:'name, price, stock required'});
  const icons={fashion:'👗',electronics:'📱',home:'🏠',daily:'🧴',handmade:'🏺'};
  const p = { id:'p_'+uuidv4().slice(0,8), name, brand:brand||'My Brand', category:category||'other', price:+price, originalPrice:+(originalPrice||price), stock:+stock, description:description||'', sizes:sizes||[], colors:colors||[], images:[icons[category]||'📦'], badge:badge||null, rating:0, reviews:0, eco:false, sellerId:req.user.id, active:true, createdAt:new Date().toISOString().slice(0,10) };
  DB.products.push(p);
  res.status(201).json(p);
});

app.put('/api/products/:id', sellerAuth, (req,res) => {
  const p = DB.products.find(p=>p.id===req.params.id);
  if (!p) return res.status(404).json({error:'Product not found'});
  if (p.sellerId!==req.user.id&&req.user.role!=='admin') return res.status(403).json({error:'Not your product'});
  ['name','price','originalPrice','stock','description','active','badge'].forEach(k=>{ if(req.body[k]!==undefined) p[k]=req.body[k]; });
  res.json(p);
});

app.delete('/api/products/:id', sellerAuth, (req,res) => {
  const p = DB.products.find(p=>p.id===req.params.id&&(p.sellerId===req.user.id||req.user.role==='admin'));
  if (!p) return res.status(404).json({error:'Not found'});
  p.active=false; res.json({message:'Removed'});
});

/* ─── CART ─── */
app.get('/api/cart', auth, (req,res) => {
  const items=(DB.carts[req.user.id]||[]).map(i=>({...i,product:DB.products.find(p=>p.id===i.productId)})).filter(i=>i.product);
  res.json({ items, total:items.reduce((s,i)=>s+i.product.price*i.qty,0), count:items.reduce((s,i)=>s+i.qty,0) });
});

app.post('/api/cart/add', auth, (req,res) => {
  const {productId,qty=1,size,color} = req.body;
  const prod = DB.products.find(p=>p.id===productId&&p.active);
  if (!prod) return res.status(404).json({error:'Product not found'});
  if (prod.stock<qty) return res.status(400).json({error:'Not enough stock'});
  if (!DB.carts[req.user.id]) DB.carts[req.user.id]=[];
  const ex = DB.carts[req.user.id].find(i=>i.productId===productId&&i.size===size&&i.color===color);
  if (ex) ex.qty+=+qty; else DB.carts[req.user.id].push({productId,qty:+qty,size:size||null,color:color||null});
  res.json({message:'Added',count:DB.carts[req.user.id].reduce((s,i)=>s+i.qty,0)});
});

app.put('/api/cart/:productId', auth, (req,res) => {
  const cart=DB.carts[req.user.id]||[];
  const item=cart.find(i=>i.productId===req.params.productId);
  if (!item) return res.status(404).json({error:'Item not in cart'});
  if (+req.body.qty<=0) DB.carts[req.user.id]=cart.filter(i=>i.productId!==req.params.productId);
  else item.qty=+req.body.qty;
  res.json({message:'Updated'});
});

app.delete('/api/cart/:productId', auth, (req,res) => {
  if (DB.carts[req.user.id]) DB.carts[req.user.id]=DB.carts[req.user.id].filter(i=>i.productId!==req.params.productId);
  res.json({message:'Removed'});
});

app.delete('/api/cart', auth, (req,res) => { DB.carts[req.user.id]=[]; res.json({message:'Cleared'}); });

/* ─── ORDERS ─── */
app.post('/api/orders', auth, (req,res) => {
  const {address,paymentMethod} = req.body;
  if (!address||!paymentMethod) return res.status(400).json({error:'address and paymentMethod required'});
  const cartItems=DB.carts[req.user.id]||[];
  if (!cartItems.length) return res.status(400).json({error:'Cart is empty'});
  const orderItems=[];
  for (const ci of cartItems) {
    const prod=DB.products.find(p=>p.id===ci.productId&&p.active);
    if (!prod) return res.status(400).json({error:`Product ${ci.productId} not available`});
    if (prod.stock<ci.qty) return res.status(400).json({error:`Not enough stock for ${prod.name}`});
    orderItems.push({productId:prod.id,name:prod.name,icon:prod.images[0],price:prod.price,qty:ci.qty,size:ci.size,color:ci.color});
    prod.stock-=ci.qty;
  }
  const subtotal=orderItems.reduce((s,i)=>s+i.price*i.qty,0);
  const shipping=subtotal>=499?0:49;
  const order={id:'ORD'+Date.now(),userId:req.user.id,items:orderItems,subtotal,shipping,total:subtotal+shipping,status:'processing',address,paymentMethod,createdAt:new Date().toISOString().slice(0,10)};
  DB.orders.push(order);
  DB.carts[req.user.id]=[];
  res.status(201).json({order,message:'Order placed!'});
});

app.get('/api/orders', auth, (req,res) => {
  let orders=DB.orders.filter(o=>o.userId===req.user.id);
  if (req.query.status) orders=orders.filter(o=>o.status===req.query.status);
  res.json({orders:orders.slice().reverse()});
});

app.get('/api/orders/:id', auth, (req,res) => {
  const order=DB.orders.find(o=>o.id===req.params.id&&(o.userId===req.user.id||req.user.role==='admin'));
  if (!order) return res.status(404).json({error:'Order not found'});
  res.json(order);
});

app.put('/api/orders/:id/cancel', auth, (req,res) => {
  const order=DB.orders.find(o=>o.id===req.params.id&&o.userId===req.user.id);
  if (!order) return res.status(404).json({error:'Order not found'});
  if (order.status!=='processing') return res.status(400).json({error:'Cannot cancel'});
  order.status='cancelled'; order.cancelledAt=new Date().toISOString().slice(0,10);
  for (const item of order.items) { const prod=DB.products.find(p=>p.id===item.productId); if(prod) prod.stock+=item.qty; }
  res.json({order,message:'Cancelled'});
});

/* ─── RETURNS ─── */
app.post('/api/returns', auth, (req,res) => {
  const {orderId,productId,reason,condition} = req.body;
  if (!orderId||!reason) return res.status(400).json({error:'orderId and reason required'});
  const order=DB.orders.find(o=>o.id===orderId&&o.userId===req.user.id);
  if (!order) return res.status(404).json({error:'Order not found'});
  if (!['delivered','shipped'].includes(order.status)) return res.status(400).json({error:'Only delivered orders can be returned'});
  const daysDiff=Math.floor((Date.now()-new Date(order.createdAt))/86400000);
  if (daysDiff>90) return res.status(400).json({error:'Return window expired (90 days)'});
  const pid=productId||order.items[0]?.productId;
  if (DB.returns.find(r=>r.orderId===orderId&&r.productId===pid)) return res.status(409).json({error:'Return already initiated'});
  const item=order.items.find(i=>i.productId===pid)||order.items[0];
  const ret={id:'RET'+Date.now(),orderId,userId:req.user.id,productId:pid,productName:item.name,reason,condition:condition||'Used',refundAmount:item.price*item.qty,refundMethod:order.paymentMethod==='COD'?'Bank Transfer':order.paymentMethod,status:'initiated',createdAt:new Date().toISOString().slice(0,10)};
  DB.returns.push(ret);
  res.status(201).json({return:ret,message:'Return initiated! Pickup within 24 hours.'});
});

app.get('/api/returns', auth, (req,res) => { res.json({returns:DB.returns.filter(r=>r.userId===req.user.id)}); });

/* ─── WISHLIST ─── */
app.get('/api/wishlist', auth, (req,res) => {
  const ids=DB.wishlist.filter(w=>w.userId===req.user.id).map(w=>w.productId);
  res.json({products:DB.products.filter(p=>ids.includes(p.id)&&p.active)});
});

app.post('/api/wishlist', auth, (req,res) => {
  const {productId}=req.body;
  const ex=DB.wishlist.find(w=>w.userId===req.user.id&&w.productId===productId);
  if (ex) { DB.wishlist.splice(DB.wishlist.indexOf(ex),1); return res.json({added:false}); }
  DB.wishlist.push({userId:req.user.id,productId}); res.json({added:true});
});

/* ─── REVIEWS ─── */
app.post('/api/reviews', auth, (req,res) => {
  const {productId,rating,comment}=req.body;
  if (!productId||!rating) return res.status(400).json({error:'productId and rating required'});
  const bought=DB.orders.some(o=>o.userId===req.user.id&&o.items.some(i=>i.productId===productId)&&o.status==='delivered');
  const review={id:'rev_'+uuidv4().slice(0,6),productId,userId:req.user.id,userName:req.user.name.split(' ')[0]+'.',rating:+rating,comment,verified:bought,createdAt:new Date().toISOString().slice(0,10)};
  DB.reviews.push(review);
  const prod=DB.products.find(p=>p.id===productId);
  if (prod) { const rv=DB.reviews.filter(r=>r.productId===productId); prod.rating=parseFloat((rv.reduce((s,r)=>s+r.rating,0)/rv.length).toFixed(1)); prod.reviews=rv.length; }
  res.status(201).json(review);
});

/* ─── SELLER PANEL ─── */
app.get('/api/seller/dashboard', sellerAuth, (req,res) => {
  const myProds=DB.products.filter(p=>p.sellerId===req.user.id&&p.active);
  const myIds=new Set(myProds.map(p=>p.id));
  const myOrders=DB.orders.filter(o=>o.items.some(i=>myIds.has(i.productId)));
  const myReturns=DB.returns.filter(r=>myIds.has(r.productId));
  const totalRevenue=myOrders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.items.filter(i=>myIds.has(i.productId)).reduce((ss,i)=>ss+i.price*i.qty,0),0);
  res.json({ stats:{ totalProducts:myProds.length, totalOrders:myOrders.length, pendingOrders:myOrders.filter(o=>o.status==='processing').length, totalRevenue, pendingPayout:Math.round(totalRevenue*0.9), totalReturns:myReturns.length }, products:myProds, recentOrders:myOrders.slice().reverse().slice(0,10) });
});

app.put('/api/seller/orders/:id/status', sellerAuth, (req,res) => {
  const order=DB.orders.find(o=>o.id===req.params.id);
  if (!order) return res.status(404).json({error:'Order not found'});
  order.status=req.body.status;
  if (req.body.status==='shipped') order.shippedAt=new Date().toISOString().slice(0,10);
  if (req.body.status==='delivered') order.deliveredAt=new Date().toISOString().slice(0,10);
  res.json(order);
});

app.get('/api/seller/returns', sellerAuth, (req,res) => {
  const myIds=new Set(DB.products.filter(p=>p.sellerId===req.user.id).map(p=>p.id));
  res.json({returns:DB.returns.filter(r=>myIds.has(r.productId))});
});

app.put('/api/seller/returns/:id', sellerAuth, (req,res) => {
  const ret=DB.returns.find(r=>r.id===req.params.id);
  if (!ret) return res.status(404).json({error:'Return not found'});
  Object.assign(ret,req.body);
  if (ret.status==='approved') ret.resolvedAt=new Date().toISOString().slice(0,10);
  res.json(ret);
});

/* ─── ADMIN ─── */
app.get('/api/admin/dashboard', adminAuth, (req,res) => {
  const revenue=DB.orders.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0);
  res.json({ stats:{ users:DB.users.filter(u=>u.role==='customer').length, sellers:DB.users.filter(u=>u.role==='seller').length, products:DB.products.filter(p=>p.active).length, orders:DB.orders.length, revenue, returns:DB.returns.length }, recentOrders:DB.orders.slice().reverse().slice(0,10) });
});

app.get('/api/admin/users', adminAuth, (req,res) => { res.json({users:DB.users.map(u=>{const{password,...s}=u;return s;})}); });
app.put('/api/admin/users/:id/approve', adminAuth, (req,res) => { const u=DB.users.find(u=>u.id===req.params.id); if(!u) return res.status(404).json({error:'Not found'}); u.approved=true; res.json({message:'Approved'}); });
app.get('/api/admin/orders', adminAuth, (req,res) => { res.json({orders:DB.orders.slice().reverse()}); });
app.put('/api/admin/orders/:id/status', adminAuth, (req,res) => { const o=DB.orders.find(o=>o.id===req.params.id); if(!o) return res.status(404).json({error:'Not found'}); o.status=req.body.status; res.json(o); });
app.get('/api/admin/returns', adminAuth, (req,res) => { res.json({returns:DB.returns}); });
app.put('/api/admin/returns/:id', adminAuth, (req,res) => { const r=DB.returns.find(r=>r.id===req.params.id); if(!r) return res.status(404).json({error:'Not found'}); Object.assign(r,req.body); res.json(r); });

/* ─── MISC ─── */
app.get('/api/health', (_,res) => res.json({status:'ok',time:new Date().toISOString()}));
app.use('/api/*', (_,res) => res.status(404).json({error:'Endpoint not found'}));
app.get('*', (_,res) => res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT, () => {
  console.log('\n🚀 Hubooze Backend → http://localhost:'+PORT);
  console.log('📡 API → http://localhost:'+PORT+'/api\n');
  console.log('🔑 Demo Accounts:');
  console.log('   Customer : priya@demo.com  / demo123');
  console.log('   Seller   : amit@demo.com   / demo123');
  console.log('   Admin    : admin@hubooze.in / admin123\n');
});

module.exports = app;
