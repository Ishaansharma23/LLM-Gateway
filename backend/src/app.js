const express = require("express");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { createRateLimiter } = require("./middleware/rateLimiter");
const adminRoutes = require("./routes/admin.routes");
const gatewayRoutes = require("./routes/gateway.routes");

const app = express();

app.disable("x-powered-by");

// CORS & security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-secret");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Request logging
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "rentok-llm-gateway",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

const adminRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 60,
  message: "Too many admin requests. Rate limit is 60 requests per minute."
});

const gatewayRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 120,
  message: "Too many gateway requests. Rate limit is 120 requests per minute."
});

app.use("/admin", adminRateLimiter, adminRoutes);
app.use("/v1", gatewayRateLimiter, gatewayRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
