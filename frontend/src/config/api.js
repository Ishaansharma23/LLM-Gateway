/**
 * Centralized API configuration for the LLM Gateway frontend.
 * Reads VITE_API_URL from environment variables, falling back to the deployed production backend.
 */

const FALLBACK_API_URL = 'https://llm-gateway-seven.vercel.app';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL?.trim() || FALLBACK_API_URL
).replace(/\/+$/, '');

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/health`,
  CHAT_COMPLETIONS: `${API_BASE_URL}/v1/chat/completions`,
  MODELS: `${API_BASE_URL}/v1/models`,
  ADMIN_KEYS: `${API_BASE_URL}/admin/keys`,
  ADMIN_USAGE: `${API_BASE_URL}/admin/usage`
};

export default {
  API_BASE_URL,
  API_ENDPOINTS
};

