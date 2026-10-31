const crypto = require("crypto");
const env = require("../config/env");

// Timing safe comparison use karte hain taaki timing attack se secret leak na ho
function authenticateAdmin(req, res, next) {
  let providedSecret = req.headers["x-admin-secret"];

  if (!providedSecret && req.headers["authorization"]) {
    const parts = req.headers["authorization"].split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      providedSecret = parts[1];
    }
  }

  if (!providedSecret || typeof providedSecret !== "string") {
    return res.status(401).json({
      error: {
        message: "Admin authentication required. Provide x-admin-secret header or Bearer token.",
        type: "authentication_error",
        status: 401
      }
    });
  }

  const expectedBuffer = Buffer.from(env.ADMIN_SECRET);
  const providedBuffer = Buffer.from(providedSecret);

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return res.status(401).json({
      error: {
        message: "Invalid admin secret",
        type: "authentication_error",
        status: 401
      }
    });
  }

  next();
}

module.exports = authenticateAdmin;
