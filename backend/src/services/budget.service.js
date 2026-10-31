const VirtualKey = require("../models/VirtualKey");

// Atomic update se race conditions rokte hain - requestsUsed < requestLimit par hi 1 increment hota hai
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
      returnDocument: "after"
    }
  );

  if (updatedKey) {
    return updatedKey;
  }

  const existingKey = await VirtualKey.findById(keyId).lean();

  if (!existingKey) {
    const error = new Error("Virtual API key not found");
    error.status = 401;
    error.type = "authentication_error";
    error.isOperational = true;
    throw error;
  }

  if (existingKey.status !== "active") {
    const error = new Error("Virtual API key is deactivated/revoked");
    error.status = 403;
    error.type = "authentication_error";
    error.isOperational = true;
    throw error;
  }

  if (existingKey.requestsUsed >= existingKey.requestLimit) {
    const error = new Error(
      `Budget exceeded. Request limit of ${existingKey.requestLimit} has been reached (${existingKey.requestsUsed}/${existingKey.requestLimit} requests used).`
    );
    error.status = 429;
    error.type = "budget_exceeded_error";
    error.isOperational = true;
    error.meta = {
      requestLimit: existingKey.requestLimit,
      requestsUsed: existingKey.requestsUsed
    };
    throw error;
  }

  const error = new Error("Unable to reserve request quota");
  error.status = 500;
  error.isOperational = true;
  throw error;
}

// Provider error (5xx ya timeout) hone par user ka quota wapas refund karte hain
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
        returnDocument: "after"
      }
    );
  } catch (err) {
    console.error(`[Budget Service] Failed to refund quota for key ${keyId}:`, err.message);
    return null;
  }
}

module.exports = {
  reserveRequestQuota,
  refundRequestQuota
};
