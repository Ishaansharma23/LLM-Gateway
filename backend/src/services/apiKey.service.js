const VirtualKey = require("../models/VirtualKey");
const generateApiKey = require("../utils/generateApiKey");
const hashApiKey = require("../utils/hashApiKey");

// CSPRNG se random key generate karke uska SHA-256 hash database me store karte hain
async function createVirtualKey({ name, requestLimit }) {
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.substring(0, 16);

  const virtualKey = await VirtualKey.create({
    name,
    keyPrefix,
    keyHash,
    status: "active",
    requestLimit,
    requestsUsed: 0
  });

  return {
    rawKey,
    key: {
      _id: virtualKey._id,
      name: virtualKey.name,
      keyPrefix: virtualKey.keyPrefix,
      status: virtualKey.status,
      requestLimit: virtualKey.requestLimit,
      requestsUsed: virtualKey.requestsUsed,
      createdAt: virtualKey.createdAt,
      updatedAt: virtualKey.updatedAt
    }
  };
}

async function listVirtualKeys() {
  return await VirtualKey.find({}, "-keyHash")
    .sort({ createdAt: -1 })
    .lean();
}

// Key ko revoke/deactivate karte hain taaki future requests block ho jayein
async function deactivateVirtualKey(keyId) {
  const updatedKey = await VirtualKey.findByIdAndUpdate(
    keyId,
    { status: "revoked" },
    { new: true }
  );

  if (!updatedKey) {
    throw new Error("Virtual key not found");
  }

  return updatedKey;
}

module.exports = {
  createVirtualKey,
  listVirtualKeys,
  deactivateVirtualKey
};
