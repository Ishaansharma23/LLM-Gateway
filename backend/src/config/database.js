const mongoose = require("mongoose");
const env = require("./env");

let cachedPromise = null;

async function connectDatabase(uri = env.MONGODB_URL) {
  if (!uri) {
    throw new Error("MongoDB connection URI is required");
  }

  // 1. Reuse existing connection if already connected (State: 1 = connected)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. If connection is in progress (State: 2 = connecting), await existing promise
  if (cachedPromise && mongoose.connection.readyState === 2) {
    return cachedPromise;
  }

  // 3. Connect and cache the connection promise to avoid duplicate connections
  cachedPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    })
    .then((m) => {
      console.log("[Database] Connected to MongoDB");
      return m;
    })
    .catch((err) => {
      cachedPromise = null;
      throw err;
    });

  return cachedPromise;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    cachedPromise = null;
    console.log("[Database] Disconnected gracefully");
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase
};
