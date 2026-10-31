const crypto = require("crypto");

function hashApiKey(rawKey) {
  if (!rawKey || typeof rawKey !== "string") {
    throw new TypeError("API key must be a non-empty string");
  }
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

module.exports = hashApiKey;
