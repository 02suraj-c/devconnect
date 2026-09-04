/**
 * MongoDB Connection
 *
 * Uses Mongoose to connect to MongoDB Atlas, a local MongoDB instance,
 * or an automatic in-memory MongoDB server (`mongodb-memory-server`)
 * when running in local development mode without external credentials.
 *
 * This ensures the application is 100% runnable out-of-the-box.
 */

const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    mongoUri = mongoUri ? mongoUri.trim().replace(/^["']|["']$/g, '') : '';

    // Check if an in-memory database should be used
    const shouldUseMemory =
      !mongoUri ||
      mongoUri.toLowerCase() === 'memory' ||
      mongoUri.includes('<user>') ||
      mongoUri.includes('cluster0.xxxxx') ||
      (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://'));

    if (shouldUseMemory) {
      console.log('🔄  Starting in-memory MongoDB server (mongodb-memory-server)…');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      mongoUri = mongodInstance.getUri();
      console.log(`⚡  In-memory MongoDB started at: ${mongoUri}`);
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`❌  MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
