const mongoose = require("mongoose");

let isListenersRegistered = false;
let cachedPromise = null;

// Event listeners should be registered only once on the connection singleton
function registerConnectionListeners() {
  if (isListenersRegistered) return;
  isListenersRegistered = true;

  mongoose.connection.on("connected", () => {
    console.log("[Database] Connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[Database] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[Database] Disconnected");
  });
}

async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("MongoDB connection URI is required");
  }

  registerConnectionListeners();

  // 1. Reuse existing connection if already connected (State: 1 = connected)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. If connection is currently in progress (State: 2 = connecting), await existing promise
  if (cachedPromise && mongoose.connection.readyState === 2) {
    return await cachedPromise;
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    autoIndex: true
  };

  cachedPromise = mongoose.connect(uri, options);

  try {
    const conn = await cachedPromise;
    return conn;
  } catch (err) {
    cachedPromise = null;
    throw err;
  }
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
