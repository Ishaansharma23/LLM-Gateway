const mongoose = require("mongoose");
const apiKeyService = require("../services/apiKey.service");
const usageService = require("../services/usage.service");

// Nayi virtual key create karte hain aur raw key sirf ek baar return karte hain
async function createKey(req, res, next) {
  try {
    const { name, requestLimit } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        error: {
          message: "Field 'name' is required and must be a non-empty string",
          type: "invalid_request_error",
          status: 400
        }
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        error: {
          message: "Field 'name' must not exceed 100 characters",
          type: "invalid_request_error",
          status: 400
        }
      });
    }

    const parsedLimit = Number(requestLimit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        error: {
          message: "Field 'requestLimit' is required and must be a positive integer greater than 0",
          type: "invalid_request_error",
          status: 400
        }
      });
    }

    const result = await apiKeyService.createVirtualKey({
      name: name.trim(),
      requestLimit: parsedLimit
    });

    return res.status(201).json({
      message: "Virtual API key created successfully. Save this raw key; it cannot be retrieved again.",
      apiKey: result.rawKey,
      key: result.key
    });
  } catch (err) {
    next(err);
  }
}

async function listKeys(req, res, next) {
  try {
    const keys = await apiKeyService.listVirtualKeys();
    return res.status(200).json({
      count: keys.length,
      keys
    });
  } catch (err) {
    next(err);
  }
}

// Virtual key ko revoke/deactivate karne ka controller
async function deactivateKey(req, res, next) {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: {
          message: "Valid MongoDB ObjectId is required for key ID parameter",
          type: "invalid_request_error",
          status: 400
        }
      });
    }

    const updatedKey = await apiKeyService.deactivateVirtualKey(id);

    return res.status(200).json({
      message: "Virtual API key deactivated successfully",
      key: updatedKey
    });
  } catch (err) {
    next(err);
  }
}

async function getUsage(req, res, next) {
  try {
    const limit = req.query.limit || 50;
    const usageData = await usageService.getOverallUsageSummary(limit);
    return res.status(200).json(usageData);
  } catch (err) {
    next(err);
  }
}

async function getKeyUsage(req, res, next) {
  try {
    const { keyId } = req.params;

    if (!keyId || !mongoose.Types.ObjectId.isValid(keyId)) {
      return res.status(400).json({
        error: {
          message: "Valid MongoDB ObjectId is required for keyId parameter",
          type: "invalid_request_error",
          status: 400
        }
      });
    }

    const limit = req.query.limit || 50;
    const keyUsageData = await usageService.getKeyUsageSummary(keyId, limit);
    return res.status(200).json(keyUsageData);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createKey,
  listKeys,
  deactivateKey,
  getUsage,
  getKeyUsage
};
