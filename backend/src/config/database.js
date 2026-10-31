const mongoose = require("mongoose");

async function connectDatabase(uri) {
  if (!uri) {
    throw new Error("MongoDB connection URI is required");
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    autoIndex: true
  };

  mongoose.connection.on("connected", () => {
    console.log("[Database] Connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[Database] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[Database] Disconnected");
  });

  return await mongoose.connect(uri, options);
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("[Database] Disconnected gracefully");
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase
};
