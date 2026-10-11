const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the connection string in process.env.MONGO_URI.
 * Called once from server.js on boot. If the connection fails we exit the
 * process immediately — there is no point serving requests without a DB.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
