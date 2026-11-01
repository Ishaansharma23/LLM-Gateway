import axios from 'axios';
import { API_BASE_URL } from '../config/api';

let inMemoryAdminSecret = '';

export function setApiAdminSecret(secret) {
  inMemoryAdminSecret = secret ? secret.trim() : '';
}

export function getApiAdminSecret() {
  return inMemoryAdminSecret;
}

export function clearApiAdminSecret() {
  inMemoryAdminSecret = '';
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

apiClient.interceptors.request.use((config) => {
  const isTargetingAdmin =
    config.url?.startsWith('/admin') ||
    config.url?.includes('/admin') ||
    (config.baseURL && config.baseURL.includes('/admin'));

  if (isTargetingAdmin && inMemoryAdminSecret) {
    config.headers['x-admin-secret'] = inMemoryAdminSecret;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.error?.message || error.message || 'Request failed',
      status: error.response?.status || 500,
      type: error.response?.data?.error?.type || 'network_error'
    };
    return Promise.reject(customError);
  }
);
