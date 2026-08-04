const dba = require('./backend/dbAdapter');

const products = [
  { id: 'p1', name: 'Eco Cotton T-Shirt', price: 499, category: 'Fashion', stock: 50, image: 'https://via.placeholder.com/300?text=T-Shirt', description: '100% Organic Cotton' },
  { id: 'p2', name: 'Bamboo Water Bottle', price: 299, category: 'Home', stock: 100, image: 'https://via.placeholder.com/300?text=Bottle', description: 'Eco-friendly Bamboo' },
  { id: 'p3', name: 'Handmade Jute Bag', price: 199, category: 'Fashion', stock: 75, image: 'https://via.placeholder.com/300?text=Jute+Bag', description: 'Handwoven Jute' },
  { id: 'p4', name: 'Organic Face Cream', price: 349, category: 'Beauty', stock: 30, image: 'https://via.placeholder.com/300?text=Cream', description: 'Chemical Free' },
  { id: 'p5', name: 'Recycled Notebook', price: 99, category: 'Stationery', stock: 200, image: 'https://via.placeholder.com/300?text=Notebook', description: '100% Recycled Paper' }
];

async function seed() {
  try {
    console.log('🌱 Connecting to DB...');
    await dba.connect(); // Ensure connection
    
    let count = 0;
    for (const p of products) {
      // Try to create, ignore if exists
      try {
        await dba.createProduct(p);
        count++;
        console.log(`✅ Added: ${p.name}`);
      } catch (e) {
        console.log(`⚠️  Skipped (exists): ${p.name}`);
      }
    }
    console.log(`\n🎉 Done! ${count} new products added.`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}

seed();
