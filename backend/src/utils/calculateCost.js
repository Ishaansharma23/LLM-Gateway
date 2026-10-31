const { MODEL_PRICING, USD_TO_INR_RATE } = require("../config/pricing");

function calculateCost(model, inputTokens = 0, outputTokens = 0) {
  if (!model || typeof model !== "string") {
    return null;
  }

  const pricing = MODEL_PRICING[model.toLowerCase().trim()];
  if (!pricing) {
    return null;
  }

  const safeInput = Math.max(0, Number(inputTokens) || 0);
  const safeOutput = Math.max(0, Number(outputTokens) || 0);

  const inputCostUsd = (safeInput / 1000000) * pricing.inputPerMillionUsd;
  const outputCostUsd = (safeOutput / 1000000) * pricing.outputPerMillionUsd;
  const totalCostInr = (inputCostUsd + outputCostUsd) * USD_TO_INR_RATE;

  return Math.round(totalCostInr * 1000000) / 1000000;
}

module.exports = calculateCost;
