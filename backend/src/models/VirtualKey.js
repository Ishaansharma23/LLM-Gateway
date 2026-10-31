const mongoose = require("mongoose");

const virtualKeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    keyPrefix: {
      type: String,
      required: true,
      index: true
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true
    },
    requestLimit: {
      type: Number,
      required: true,
      min: 1
    },
    requestsUsed: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

virtualKeySchema.index({ keyHash: 1, status: 1 });

module.exports = mongoose.model("VirtualKey", virtualKeySchema);
