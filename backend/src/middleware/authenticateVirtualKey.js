const hashApiKey = require("../utils/hashApiKey");
const VirtualKey = require("../models/VirtualKey");

// Bearer token se virtual key nikalte hain aur SHA-256 hash se active key verify karte hain
async function authenticateVirtualKey(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({
      error: {
        message: "Missing Authorization header. Provide virtual key as: Bearer gw_live_...",
        type: "authentication_error",
        status: 401
      }
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      error: {
        message: "Malformed Authorization header. Format must be 'Bearer <virtual_key>'",
        type: "authentication_error",
        status: 401
      }
    });
  }

  const rawKey = parts[1].trim();

  if (!rawKey.startsWith("gw_live_")) {
    return res.status(401).json({
      error: {
        message: "Invalid virtual API key format. Keys must start with 'gw_live_'",
        type: "authentication_error",
        status: 401
      }
    });
  }

  try {
    const keyHash = hashApiKey(rawKey);
    const virtualKey = await VirtualKey.findOne({ keyHash });

    if (!virtualKey) {
      return res.status(401).json({
        error: {
          message: "Invalid virtual API key. Key does not exist.",
          type: "authentication_error",
          status: 401
        }
      });
    }

    if (virtualKey.status !== "active") {
      return res.status(403).json({
        error: {
          message: "Virtual API key has been revoked/deactivated.",
          type: "authentication_error",
          status: 403
        }
      });
    }

    req.virtualKey = virtualKey;
    req.keyHash = keyHash;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticateVirtualKey;
