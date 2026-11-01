const { MODEL_PRICING } = require("../config/pricing");
const budgetService = require("../services/budget.service");
const geminiProvider = require("../services/llm/gemini.provider");
const usageService = require("../services/usage.service");
const calculateCost = require("../utils/calculateCost");

async function chatCompletions(req, res, next) {
  const { model, messages, temperature, max_tokens } = req.body;
  const virtualKey = req.virtualKey;

  // Pehle atomic quota reserve karte hain - limit exhaust hone par yahi se 429 throw hota hai
  await budgetService.reserveRequestQuota(virtualKey._id);

  const startTime = Date.now();

  try {
    const response = await geminiProvider.chatCompletion({
      model,
      messages,
      temperature,
      maxTokens: max_tokens
    });

    const durationMs = Date.now() - startTime;
    const usage = response.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };

    const estimatedCostInr = calculateCost(
      model,
      usage.prompt_tokens,
      usage.completion_tokens
    );

    // Completion successful hone par usage metrics database me store karte hain
    await usageService.logUsage({
      keyId: virtualKey._id,
      model,
      provider: "gemini",
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      estimatedCostInr,
      requestStatus: "success",
      httpStatus: 200,
      durationMs
    });

    return res.status(200).json(response);
  } catch (err) {
    const durationMs = Date.now() - startTime;

    // Upstream transient error (5xx ya timeout) aane par user ka quota wapas refund karte hain
    if (err.isTransient) {
      console.warn(`[Gateway] Provider transient failure (${err.status}). Refunding quota for: ${virtualKey.keyPrefix}`);
      await budgetService.refundRequestQuota(virtualKey._id);
    }

    await usageService.logUsage({
      keyId: virtualKey._id,
      model,
      provider: "gemini",
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCostInr: null,
      requestStatus: "failed",
      httpStatus: err.status || 502,
      durationMs,
      errorDetails: err.message
    });

    return next(err);
  }
}

async function listModels(req, res, next) {
  try {
    const models = Object.keys(MODEL_PRICING).map((modelId) => ({
      id: modelId,
      object: "model",
      created: 1730419200,
      owned_by: "google"
    }));

    return res.status(200).json({
      object: "list",
      data: models
    });
  } catch (err) {
    next(err);
  }
}

async function getModel(req, res, next) {
  try {
    const { modelId } = req.params;
    const normalizedId = (modelId || "").toLowerCase().trim();

    if (!MODEL_PRICING[normalizedId]) {
      return res.status(404).json({
        error: {
          message: `Model '${modelId}' not found`,
          type: "invalid_request_error",
          status: 404
        }
      });
    }

    return res.status(200).json({
      id: normalizedId,
      object: "model",
      created: 1730419200,
      owned_by: "google"
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  chatCompletions,
  listModels,
  getModel
};
