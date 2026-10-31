const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema(
  {
    keyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VirtualKey",
      required: true,
      index: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    provider: {
      type: String,
      required: true,
      default: "gemini"
    },
    inputTokens: {
      type: Number,
      default: 0
    },
    outputTokens: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    estimatedCostInr: {
      type: Number,
      default: null
    },
    requestStatus: {
      type: String,
      enum: ["success", "failed", "budget_exceeded"],
      required: true,
      index: true
    },
    httpStatus: {
      type: Number,
      required: true
    },
    durationMs: {
      type: Number,
      required: true
    },
    errorDetails: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

usageSchema.index({ keyId: 1, timestamp: -1 });

module.exports = mongoose.model("Usage", usageSchema);
