const crypto = require("crypto");
const env = require("../../config/env");

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

// OpenAI messages format ko Gemini ke contents format me translate karte hain
function translateMessages(messages) {
  let systemInstruction = null;
  const contents = [];

  for (const msg of messages) {
    const role = msg.role.toLowerCase();

    if (role === "system") {
      systemInstruction = {
        parts: [{ text: msg.content }]
      };
    } else if (role === "assistant" || role === "model") {
      contents.push({
        role: "model",
        parts: [{ text: msg.content }]
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: msg.content }]
      });
    }
  }

  return { systemInstruction, contents };
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
      if (candidate && candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        candidateText = candidate.content.parts.map((p) => p.text || "").join("");
      }

      const finishReason = candidate && candidate.finishReason ? candidate.finishReason.toLowerCase() : "stop";

      const usageMetadata = responseData.usageMetadata || {};
      const promptTokens = usageMetadata.promptTokenCount || 0;
      const completionTokens = usageMetadata.candidatesTokenCount || 0;
      const totalTokens = usageMetadata.totalTokenCount || (promptTokens + completionTokens);

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
            finish_reason: finishReason === "stop" ? "stop" : finishReason
          }
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens
        }
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
  isTransientError
};
