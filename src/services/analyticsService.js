import { apiClient } from './apiClient';

export const analyticsService = {
  getDashboardKPIs: async (filters = {}) => {
    const params = {};
    if (filters.district && filters.district !== 'All') params.district = filters.district;
    return apiClient.get('/api/analytics/kpis', params);
  },

  getDistrictMetrics: async (filters = {}) => {
    const params = {};
    if (filters.district && filters.district !== 'All') params.district = filters.district;
    return apiClient.get('/api/analytics/districts', params);
  },

  getDepartmentMetrics: async (filters = {}) => {
    const params = {};
    if (filters.district && filters.district !== 'All') params.district = filters.district;
    return apiClient.get('/api/analytics/departments', params);
  },

  getTimelineMetrics: async () => {
    return apiClient.get('/api/analytics/trends');
  }
};
