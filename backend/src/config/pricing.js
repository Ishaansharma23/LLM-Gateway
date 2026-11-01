// Google AI Studio pricing ke hisab se models ki token cost aur INR rate define kiya hai
const USD_TO_INR_RATE = 83.50;

const MODEL_PRICING = {
  "gemini-3.5-flash": { inputPerMillionUsd: 0.075, outputPerMillionUsd: 0.30 },
  "gemini-flash-lite-latest": { inputPerMillionUsd: 0.0375, outputPerMillionUsd: 0.15 },
  "gemini-3.8-flash": { inputPerMillionUsd: 0.075, outputPerMillionUsd: 0.30 },
  "gemini-2.5-flash": { inputPerMillionUsd: 0.075, outputPerMillionUsd: 0.30 },
  "gemini-2.0-flash": { inputPerMillionUsd: 0.075, outputPerMillionUsd: 0.30 },
  "gemini-1.5-flash": { inputPerMillionUsd: 0.075, outputPerMillionUsd: 0.30 },
  "gemini-1.5-pro": { inputPerMillionUsd: 1.25, outputPerMillionUsd: 5.00 }
};

module.exports = {
  USD_TO_INR_RATE,
  MODEL_PRICING
};
