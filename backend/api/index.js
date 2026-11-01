const app = require("../src/app");
const { connectDatabase } = require("../src/config/database");
const env = require("../src/config/env");

module.exports = async (req, res) => {
  await connectDatabase(env.MONGODB_URL);
  return app(req, res);
};

