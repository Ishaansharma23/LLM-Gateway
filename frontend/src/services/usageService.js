import { apiClient } from './api';

export const usageService = {
  async getOverallUsage(limit = 50) {
    const res = await apiClient.get('/admin/usage', {
      params: { limit }
    });
    return res.data;
  },

  async getKeyUsage(keyId, limit = 50) {
    const res = await apiClient.get(`/admin/usage/${keyId}`, {
      params: { limit }
    });
    return res.data;
  }
};
