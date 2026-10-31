import { apiClient } from './api';

export const keyService = {
  async listKeys() {
    const res = await apiClient.get('/admin/keys');
    return res.data;
  },

  async createKey({ name, requestLimit }) {
    const res = await apiClient.post('/admin/keys', {
      name: name.trim(),
      requestLimit: Number(requestLimit)
    });
    return res.data;
  },

  async deactivateKey(keyId) {
    const res = await apiClient.patch(`/admin/keys/${keyId}/deactivate`);
    return res.data;
  }
};
