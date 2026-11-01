import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

export const healthService = {
  async checkHealth() {
    const res = await apiClient.get(API_ENDPOINTS.HEALTH);
    return res.data;
  }
};
