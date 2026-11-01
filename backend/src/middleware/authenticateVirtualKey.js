
const hashApiKey = require("../utils/hashApiKey");
const VirtualKey = require("../models/VirtualKey");

async function authenticateVirtualKey(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { message: "Missing or invalid Authorization header" }
    });
  }

  const rawKey = authHeader.split(" ")[1];

  if (!rawKey || !rawKey.startsWith("gw_live_")) {
    return res.status(401).json({
      error: { message: "Invalid API key format" }
    });
  }

  try {
    const keyHash = hashApiKey(rawKey);
    const virtualKey = await VirtualKey.findOne({ keyHash });

    if (!virtualKey) {
      return res.status(401).json({
        error: { message: "Invalid API key" }
      });
    }

    if (virtualKey.status !== "active") {
      return res.status(403).json({
        error: { message: "API key is revoked" }
      });
    }

    req.virtualKey = virtualKey;
    next();

  } catch (err) {
    next(err);
  }
}

module.exports = authenticateVirtualKey;
