#!/bin/bash
echo "🚀 Starting Hubooze Server..."
nohup node backend/server.js > server.log 2>&1 &
sleep 4 # Wait for server to initialize DB

echo "🌱 Seeding Products..."
node -e "
const dba = require('./backend/dbAdapter');
dba.init().then(() => {
  setTimeout(async () => {
    const products = [
      { id: 'p1', name: 'Eco T-Shirt', price: 499, category: 'Fashion', stock: 50, image: 'https://via.placeholder.com/150?text=T-Shirt' },
      { id: 'p2', name: 'Bamboo Bottle', price: 299, category: 'Home', stock: 100, image: 'https://via.placeholder.com/150?text=Bottle' },
      { id: 'p3', name: 'Jute Bag', price: 199, category: 'Fashion', stock: 75, image: 'https://via.placeholder.com/150?text=Bag' },
      { id: 'p4', name: 'Face Cream', price: 349, category: 'Beauty', stock: 30, image: 'https://via.placeholder.com/150?text=Cream' },
      { id: 'p5', name: 'Notebook', price: 99, category: 'Stationery', stock: 200, image: 'https://via.placeholder.com/150?text=Book' }
    ];
    let count = 0;
    for (const p of products) {
      try { await dba.createProduct(p); count++; console.log('Added: ' + p.name); } catch(e) {}
    }
    console.log('Seeded ' + count + ' products.');
    process.exit(0);
  }, 2000);
});
"
echo "✅ Done! Check server.log for details."
