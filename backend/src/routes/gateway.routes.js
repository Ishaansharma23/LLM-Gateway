const express = require("express");
const authenticateVirtualKey = require("../middleware/authenticateVirtualKey");
const validateGatewayRequest = require("../middleware/validateGatewayRequest");
const gatewayController = require("../controllers/gateway.controller");

const router = express.Router();

// Optional virtual key check for model discovery (authenticates if provided, permits public discovery if omitted)
async function optionalAuthenticateVirtualKey(req, res, next) {
  if (req.headers["authorization"]) {
    return authenticateVirtualKey(req, res, next);
  }
  next();
}

router.get("/models", optionalAuthenticateVirtualKey, gatewayController.listModels);
router.get("/models/:modelId", optionalAuthenticateVirtualKey, gatewayController.getModel);

router.post(
  "/chat/completions",
  authenticateVirtualKey,
  validateGatewayRequest,
  gatewayController.chatCompletions
);

module.exports = router;
