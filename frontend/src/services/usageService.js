import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

export const usageService = {
  async getOverallUsage(limit = 50) {
    const res = await apiClient.get(API_ENDPOINTS.ADMIN_USAGE, {
      params: { limit }
    });
    return res.data;
  },

  async getKeyUsage(keyId, limit = 50) {
    const res = await apiClient.get(`${API_ENDPOINTS.ADMIN_USAGE}/${keyId}`, {
      params: { limit }
    });
    return res.data;
  }
};
