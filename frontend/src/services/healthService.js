import { apiClient } from './api';

export const healthService = {
  async checkHealth() {
    const res = await apiClient.get('/health');
    return res.data;
  }
};
