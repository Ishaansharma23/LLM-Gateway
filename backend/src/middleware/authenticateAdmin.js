
const env = require("../config/env");

function authenticateAdmin(req, res, next) {
  let providedSecret = req.headers["x-admin-secret"];

  // Bearer token bhi accept karo
  if (!providedSecret && req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");

    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      providedSecret = parts[1];
    }
  }

  if (!providedSecret || providedSecret !== env.ADMIN_SECRET) {
    return res.status(401).json({
      error: { message: "Invalid admin secret" }
    });
  }

  next();
}

module.exports = authenticateAdmin;
