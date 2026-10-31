const geminiProvider = require("./gemini.provider");

const PROVIDERS = {
  gemini: geminiProvider
};

function resolveProvider(model) {
  return { name: "gemini", provider: PROVIDERS.gemini };
}

async function generateChatCompletion({ model, messages, temperature, maxTokens }) {
  const { name, provider } = resolveProvider(model);

  if (!provider || typeof provider.chatCompletion !== "function") {
    const error = new Error(`No provider registered for model '${model}'`);
    error.status = 400;
    error.type = "invalid_request_error";
    error.isOperational = true;
    throw error;
  }

  const response = await provider.chatCompletion({
    model,
    messages,
    temperature,
    maxTokens
  });

  return {
    provider: name,
    response
  };
}

module.exports = {
  generateChatCompletion,
  resolveProvider,
  PROVIDERS
};
