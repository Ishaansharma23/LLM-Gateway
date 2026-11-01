import axios from 'axios';

export const gatewayService = {
  async chatCompletion({ virtualKey, model, messages, temperature, maxTokens }) {
    if (!virtualKey || typeof virtualKey !== 'string' || !virtualKey.trim()) {
      throw {
        status: 401,
        message: 'Virtual API key is required. Provide your key starting with gw_live_',
        type: 'authentication_error'
      };
    }

    const payload = {
      model: model || 'gemini-3.5-flash',
      messages
    };

    if (temperature !== undefined && temperature !== '') {
      payload.temperature = Number(temperature);
    }
    if (maxTokens !== undefined && maxTokens !== '') {
      payload.max_tokens = Number(maxTokens);
    }

    try {
      const startTime = Date.now();
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const res = await axios.post(`${baseUrl}/v1/chat/completions`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${virtualKey.trim()}`
        },
        timeout: 35000
      });
      const durationMs = Date.now() - startTime;

      return {
        ...res.data,
        _clientDurationMs: durationMs
      };
    } catch (err) {
      const errorObj = {
        status: err.response?.status || 500,
        message: err.response?.data?.error?.message || err.message || 'Gateway completion request failed',
        type: err.response?.data?.error?.type || 'gateway_error',
        details: err.response?.data || null
      };
      throw errorObj;
    }
  }
};
