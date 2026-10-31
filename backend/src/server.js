const env = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/database");
const app = require("./app");

let server;

async function startServer() {
  try {
    console.log("[Bootstrap] Connecting to database...");
    await connectDatabase(env.MONGODB_URI);

    server = app.listen(env.PORT, () => {
      console.log(`[Server] Minimal LLM Gateway listening on port ${env.PORT} (${env.NODE_ENV})`);
      console.log(`[Server] Health check available at http://localhost:${env.PORT}/health`);
    });
  } catch (err) {
    console.error("[Bootstrap Error] Failed to start server:", err.message);
    process.exit(1);
  }
}

async function gracefulShutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}. Closing HTTP server gracefully...`);
  if (server) {
    server.close(async () => {
      console.log("[Shutdown] HTTP server closed.");
      try {
        await disconnectDatabase();
        console.log("[Shutdown] Process exiting cleanly.");
        process.exit(0);
      } catch (err) {
        console.error("[Shutdown Error] Error during database disconnect:", err.message);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error("[Shutdown] Forced shutdown after timeout.");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception]:", err);
  process.exit(1);
});

startServer();
