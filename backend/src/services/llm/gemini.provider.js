const crypto = require("crypto");
const env = require("../../config/env");

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

// OpenAI messages format ko Gemini ke contents format me translate karte hain
function translateMessages(messages) {
  const systemParts = [];
  const contents = [];

  for (const msg of messages) {
    const role = (msg.role || "").toLowerCase().trim();
    const content = typeof msg.content === "string" ? msg.content : "";

    if (role === "system") {
      if (content) {
        systemParts.push({ text: content });
      }
    } else if (role === "assistant" || role === "model") {
      contents.push({
        role: "model",
        parts: [{ text: content }]
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: content }]
      });
    }
  }

  const systemInstruction = systemParts.length > 0 ? { parts: systemParts } : null;
  return { systemInstruction, contents };
}

// Maps Gemini finishReason to OpenAI-compatible finish_reason field
function mapFinishReason(geminiReason) {
  if (!geminiReason) return "stop";
  switch (geminiReason.toUpperCase()) {
    case "STOP":
      return "stop";
    case "MAX_TOKENS":
      return "length";
    case "SAFETY":
    case "RECITATION":
    case "BLOCKLIST":
    case "PROHIBITED_CONTENT":
    case "SPII":
      return "content_filter";
    default:
      return "stop";
  }
}

// Checks if model supports thinkingConfig (e.g. Gemini 2.5 / 3.x Flash & Pro models)
function supportsThinkingConfig(modelName) {
  const normalized = (modelName || "").toLowerCase();
  return (
    (normalized.includes("2.5") || normalized.includes("3.")) &&
    !normalized.includes("lite")
  );
}

// Transient error check karte hain taaki retry kiya ja sake (5xx, 429, timeout)
function isTransientError(status, error) {
  if (status === 429 || status === 500 || status === 503 || status === 504) {
    return true;
  }
  if (error && (error.name === "TimeoutError" || error.name === "AbortError" || error.code === "ECONNRESET")) {
    return true;
  }
  return false;
}

// Gemini API call karte hain timeout aur bounded retries ke sath
async function chatCompletion({ model, messages, temperature, maxTokens }) {
  const { systemInstruction, contents } = translateMessages(messages);

  const requestBody = { contents };
  if (systemInstruction) {
    requestBody.systemInstruction = systemInstruction;
  }

  const generationConfig = {};
  if (temperature !== undefined) generationConfig.temperature = Number(temperature);
  if (maxTokens !== undefined) generationConfig.maxOutputTokens = Number(maxTokens);

  // Disable thinking budget on reasoning models so maxOutputTokens is fully dedicated to user-facing output
  if (supportsThinkingConfig(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  if (Object.keys(generationConfig).length > 0) requestBody.generationConfig = generationConfig;

  const endpointUrl = `${GEMINI_API_BASE_URL}/${encodeURIComponent(model)}:generateContent?key=${env.GEMINI_API_KEY}`;

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
      });

      const responseData = await response.json();

      if (!response.ok) {
        const upstreamError = responseData.error || {};
        const errorMessage = upstreamError.message || `Gemini API returned status ${response.status}`;

        // If the model rejected thinkingConfig, remove it and retry without it
        if (response.status === 400 && requestBody.generationConfig?.thinkingConfig) {
          delete requestBody.generationConfig.thinkingConfig;
          continue;
        }

        const transient = isTransientError(response.status, null);

        const error = new Error(`Provider Error: ${errorMessage}`);
        error.status = response.status >= 500 ? 502 : response.status;
        error.isTransient = transient;
        error.type = "provider_error";
        error.details = upstreamError;

        if (!transient) {
          throw error;
        }

        lastError = error;
        continue;
      }

      const candidate = responseData.candidates && responseData.candidates[0];
      let candidateText = "";
      if (candidate && candidate.content && Array.isArray(candidate.content.parts)) {
        // Filter out internal thinking parts to ensure only assistant response is returned
        candidateText = candidate.content.parts
          .filter((p) => !p.thought)
          .map((p) => p.text || "")
          .join("");
      }

      const finishReason = mapFinishReason(candidate && candidate.finishReason);

      const usageMetadata = responseData.usageMetadata || {};
      const promptTokens = usageMetadata.promptTokenCount || 0;
      const candidateTokens = usageMetadata.candidatesTokenCount || 0;
      const thoughtsTokens = usageMetadata.thoughtsTokenCount || 0;

      // In OpenAI format, completion_tokens covers all generated tokens so prompt_tokens + completion_tokens === total_tokens
      const completionTokens = candidateTokens + thoughtsTokens;
      const totalTokens = promptTokens + completionTokens;

      const usage = {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens
      };

      if (thoughtsTokens > 0) {
        usage.completion_tokens_details = {
          reasoning_tokens: thoughtsTokens
        };
      }

      return {
        id: `chatcmpl-${crypto.randomUUID()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: candidateText
            },
            finish_reason: finishReason
          }
        ],
        usage
      };
    } catch (err) {
      const isTimeout = err.name === "TimeoutError" || err.name === "AbortError";
      const transient = isTimeout || isTransientError(err.status, err);

      const normalizedError = new Error(
        isTimeout ? `Provider request timed out after ${DEFAULT_TIMEOUT_MS / 1000} seconds` : err.message
      );
      normalizedError.status = isTimeout ? 504 : (err.status || 502);
      normalizedError.isTransient = transient;
      normalizedError.type = "provider_error";

      if (!transient || attempt === MAX_RETRIES) {
        throw normalizedError;
      }

      lastError = normalizedError;
    }
  }

  throw lastError || new Error("Failed to receive response from LLM provider");
}

module.exports = {
  chatCompletion,
  translateMessages,
  mapFinishReason,
  supportsThinkingConfig,
  isTransientError
};
