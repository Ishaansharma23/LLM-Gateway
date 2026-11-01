import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

export const keyService = {
  async listKeys() {
    const res = await apiClient.get(API_ENDPOINTS.ADMIN_KEYS);
    return res.data;
  },

  async createKey({ name, requestLimit }) {
    const res = await apiClient.post(API_ENDPOINTS.ADMIN_KEYS, {
      name: name.trim(),
      requestLimit: Number(requestLimit)
    });
    return res.data;
  },

  async deactivateKey(keyId) {
    const res = await apiClient.patch(`${API_ENDPOINTS.ADMIN_KEYS}/${keyId}/deactivate`);
    return res.data;
  }
};
