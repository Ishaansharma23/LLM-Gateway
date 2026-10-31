const express = require("express");
const authenticateVirtualKey = require("../middleware/authenticateVirtualKey");
const validateGatewayRequest = require("../middleware/validateGatewayRequest");
const gatewayController = require("../controllers/gateway.controller");

const router = express.Router();

router.post(
  "/chat/completions",
  authenticateVirtualKey,
  validateGatewayRequest,
  gatewayController.chatCompletions
);

module.exports = router;
