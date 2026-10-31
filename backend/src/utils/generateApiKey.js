const crypto = require("crypto");

function generateApiKey() {
  const entropy = crypto.randomBytes(24).toString("hex");
  return `gw_live_${entropy}`;
}

module.exports = generateApiKey;
