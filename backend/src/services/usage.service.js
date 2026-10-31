const mongoose = require("mongoose");
const Usage = require("../models/Usage");
const VirtualKey = require("../models/VirtualKey");

// Request complete hone par latency, tokens aur estimated INR cost database me save karte hain
async function logUsage({
  keyId,
  model,
  provider = "gemini",
  inputTokens = 0,
  outputTokens = 0,
  totalTokens = 0,
  estimatedCostInr = null,
  requestStatus,
  httpStatus,
  durationMs,
  errorDetails = null
}) {
  try {
    return await Usage.create({
      keyId,
      model,
      provider,
      inputTokens: Math.max(0, inputTokens || 0),
      outputTokens: Math.max(0, outputTokens || 0),
      totalTokens: Math.max(0, totalTokens || 0),
      estimatedCostInr,
      requestStatus,
      httpStatus,
      durationMs: Math.max(0, durationMs || 0),
      errorDetails
    });
  } catch (err) {
    console.error("[Usage Service] Failed to persist usage record:", err.message);
    return null;
  }
}

// Aggregation pipeline se total requests, tokens aur total spend calculate karte hain
async function getOverallUsageSummary(limit = 50) {
  const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 200);

  const [aggregated] = await Usage.aggregate([
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        successfulRequests: {
          $sum: { $cond: [{ $eq: ["$requestStatus", "success"] }, 1, 0] }
        },
        failedRequests: {
          $sum: { $cond: [{ $eq: ["$requestStatus", "failed"] }, 1, 0] }
        },
        totalInputTokens: { $sum: "$inputTokens" },
        totalOutputTokens: { $sum: "$outputTokens" },
        totalTokens: { $sum: "$totalTokens" },
        estimatedTotalSpendInr: {
          $sum: { $ifNull: ["$estimatedCostInr", 0] }
        }
      }
    }
  ]);

  const summary = aggregated || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    estimatedTotalSpendInr: 0
  };

  summary.estimatedTotalSpendInr = Math.round(summary.estimatedTotalSpendInr * 1000000) / 1000000;

  const recentRequests = await Usage.find()
    .sort({ timestamp: -1 })
    .limit(parsedLimit)
    .populate("keyId", "name keyPrefix")
    .lean();

  return {
    summary,
    recentRequestsCount: recentRequests.length,
    recentRequests
  };
}

async function getKeyUsageSummary(keyId, limit = 50) {
  const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 50), 200);

  const keyDoc = await VirtualKey.findById(keyId, "-keyHash").lean();
  if (!keyDoc) {
    const error = new Error(`Virtual key with ID ${keyId} not found`);
    error.status = 404;
    error.type = "not_found_error";
    error.isOperational = true;
    throw error;
  }

  const [aggregated] = await Usage.aggregate([
    {
      $match: { keyId: new mongoose.Types.ObjectId(keyId) }
    },
    {
      $group: {
        _id: "$keyId",
        totalRequests: { $sum: 1 },
        successfulRequests: {
          $sum: { $cond: [{ $eq: ["$requestStatus", "success"] }, 1, 0] }
        },
        failedRequests: {
          $sum: { $cond: [{ $eq: ["$requestStatus", "failed"] }, 1, 0] }
        },
        totalInputTokens: { $sum: "$inputTokens" },
        totalOutputTokens: { $sum: "$outputTokens" },
        totalTokens: { $sum: "$totalTokens" },
        estimatedTotalSpendInr: {
          $sum: { $ifNull: ["$estimatedCostInr", 0] }
        }
      }
    }
  ]);

  const summary = aggregated || {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    estimatedTotalSpendInr: 0
  };

  summary.estimatedTotalSpendInr = Math.round(summary.estimatedTotalSpendInr * 1000000) / 1000000;

  const recentRequests = await Usage.find({ keyId })
    .sort({ timestamp: -1 })
    .limit(parsedLimit)
    .lean();

  return {
    key: keyDoc,
    summary,
    recentRequestsCount: recentRequests.length,
    recentRequests
  };
}

module.exports = {
  logUsage,
  getOverallUsageSummary,
  getKeyUsageSummary
};
