import api from './api';
import { DashboardStats } from '@/types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  },

  async getRecentActivity(): Promise<any[]> {
    const response = await api.get('/dashboard/recent-activity/');
    return response.data;
  },
};
