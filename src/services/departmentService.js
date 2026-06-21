import { apiClient } from './apiClient';

export const departmentService = {
  getDepartments: async () => {
    return apiClient.get('/api/departments');
  },

  getOfficers: async () => {
    return apiClient.get('/api/departments/officers');
  },

  getVisitLogs: async () => {
    return apiClient.get('/api/departments/visit-logs');
  },

  createVisitLog: async (logData) => {
    return apiClient.post('/api/departments/visit-logs', logData);
  }
};
