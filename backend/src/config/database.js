const mongoose = require("mongoose");

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
}

module.exports = connectDatabase;
