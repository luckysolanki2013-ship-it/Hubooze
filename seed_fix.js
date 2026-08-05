const dbAdapter = require('./backend/dbAdapter');

async function runSeed() {
  console.log('Initializing DB...');
  await dbAdapter.init();
  
  setTimeout(async () => {
    const products = [
      { id: 'p1', name: 'Eco T-Shirt', price: 499, category: 'Fashion', stock: 50, image: 'https://via.placeholder.com/150?text=T-Shirt', description: 'Cotton' },
      { id: 'p2', name: 'Bamboo Bottle', price: 299, category: 'Home', stock: 100, image: 'https://via.placeholder.com/150?text=Bottle', description: 'Eco' },
      { id: 'p3', name: 'Jute Bag', price: 199, category: 'Fashion', stock: 75, image: 'https://via.placeholder.com/150?text=Bag', description: 'Handmade' },
      { id: 'p4', name: 'Face Cream', price: 349, category: 'Beauty', stock: 30, image: 'https://via.placeholder.com/150?text=Cream', description: 'Organic' },
      { id: 'p5', name: 'Notebook', price: 99, category: 'Stationery', stock: 200, image: 'https://via.placeholder.com/150?text=Book', description: 'Recycled' }
    ];

    let count = 0;
    for (const p of products) {
      try {
        await dbAdapter.createProduct(p);
        count++;
        console.log('Added: ' + p.name);
      } catch (e) {
        console.log('Skipped ' + p.name);
      }
    }
    console.log('Done! Added ' + count + ' products.');
    process.exit(0);
  }, 2000);
}

runSeed().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
