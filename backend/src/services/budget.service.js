
const VirtualKey = require("../models/VirtualKey");

async function reserveRequestQuota(keyId) {
  const updatedKey = await VirtualKey.findOneAndUpdate(
    {
      _id: keyId,
      status: "active",
      $expr: { $lt: ["$requestsUsed", "$requestLimit"] }
    },
    {
      $inc: { requestsUsed: 1 }
    },
    {
      new: true
    }
  );

  if (updatedKey) {
    return updatedKey;
  }

  const existingKey = await VirtualKey.findById(keyId).lean();

  if (!existingKey) {
    const error = new Error("API key not found");
    error.status = 401;
    throw error;
  }

  if (existingKey.status !== "active") {
    const error = new Error("API key is revoked");
    error.status = 403;
    throw error;
  }

  if (existingKey.requestsUsed >= existingKey.requestLimit) {
    const error = new Error("Request limit exceeded");
    error.status = 429;
    throw error;
  }

  const error = new Error("Unable to reserve quota");
  error.status = 500;
  throw error;
}

async function refundRequestQuota(keyId) {
  try {
    return await VirtualKey.findOneAndUpdate(
      {
        _id: keyId,
        requestsUsed: { $gt: 0 }
      },
      {
        $inc: { requestsUsed: -1 }
      },
      {
        new: true
      }
    );
  } catch (err) {
    console.error("Quota refund failed:", err.message);
    return null;
  }
}

module.exports = {
  reserveRequestQuota,
  refundRequestQuota
};
