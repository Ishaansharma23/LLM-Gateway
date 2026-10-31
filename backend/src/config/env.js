const path = require("path");
const dotenv = require("dotenv");

// backend/.env file se environment variables load karte hain
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

function validateEnv() {
  const errors = [];

  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/rentok-llm-gateway";
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const PORT = parseInt(process.env.PORT || "3000", 10);
  const NODE_ENV = process.env.NODE_ENV || "development";

  if (!ADMIN_SECRET || typeof ADMIN_SECRET !== "string" || ADMIN_SECRET.trim().length === 0) {
    errors.push("ADMIN_SECRET is required");
  } else if (ADMIN_SECRET.length < 8) {
    errors.push("ADMIN_SECRET must be at least 8 characters");
  }

  if (!GEMINI_API_KEY || typeof GEMINI_API_KEY !== "string" || GEMINI_API_KEY.trim().length === 0) {
    errors.push("GEMINI_API_KEY is required");
  }

  if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
    errors.push("PORT must be a valid port number");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join("\n- ")}`);
  }

  return Object.freeze({
    PORT,
    NODE_ENV,
    MONGODB_URI,
    ADMIN_SECRET: ADMIN_SECRET.trim(),
    GEMINI_API_KEY: GEMINI_API_KEY.trim()
  });
}

module.exports = validateEnv();
