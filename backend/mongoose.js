/**
 * HUBOOZE — MongoDB Connection via Mongoose
 */
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Lucky:Hubooze@atlascluster.mjgrzvm.mongodb.net/hubooze?retryWrites=true&w=majority&appName=AtlasCluster';

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('✅ MongoDB Atlas connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Running with in-memory DB');
  }
}

module.exports = { connectDB, mongoose };
