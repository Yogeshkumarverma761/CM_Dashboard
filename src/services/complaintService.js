import { apiClient } from './apiClient';

export const complaintService = {
  // ─── Get all complaints (with optional filters) ─────────────
  getComplaints: async (filters = {}) => {
    const params = {};
    if (filters.district && filters.district !== 'All') params.district = filters.district;
    if (filters.status && filters.status !== 'All') params.status = filters.status;
    if (filters.severity && filters.severity !== 'All') params.severity = filters.severity;
    if (filters.department && filters.department !== 'All') params.department = filters.department;
    if (filters.search) params.search = filters.search;
    if (filters.officer_id) params.officer_id = filters.officer_id;
    return apiClient.get('/api/complaints', params);
  },

  // ─── Get a single complaint by internal ID ──────────────────
  getComplaintById: async (id) => {
    return apiClient.get(`/api/complaints/${id}`);
  },

  // ─── Track complaint by tracking number (public) ────────────
  trackComplaintByNo: async (trackingNo) => {
    return apiClient.get(`/api/complaints/track/${encodeURIComponent(trackingNo.trim().toUpperCase())}`);
  },

  // ─── Create new complaint ───────────────────────────────────
  createComplaint: async (complaintData, currentUser = null) => {
    return apiClient.post('/api/complaints', {
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      severity: complaintData.severity || 'medium',
      district: complaintData.district,
      latitude: parseFloat(complaintData.latitude) || 28.6139,
      longitude: parseFloat(complaintData.longitude) || 77.2090,
      photo_before: complaintData.photo_before || null,
      citizen_id: currentUser?.id || null
    });
  },

  // ─── Update complaint status / resolve / reassign ───────────
  updateComplaintStatus: async (complaintId, updates, activeUser) => {
    return apiClient.patch(`/api/complaints/${complaintId}`, {
      ...updates,
      action_by_name: activeUser?.full_name || 'Officer'
    });
  },

  // ─── Submit citizen feedback ────────────────────────────────
  submitFeedback: async (complaintId, feedbackData) => {
    return apiClient.post(`/api/complaints/${complaintId}/feedback`, {
      rating: feedbackData.rating,
      comments: feedbackData.comments || null
    });
  },

  // Kept for backward compatibility with components that call initLocalDatabase
  initLocalDatabase: () => {},
  runAutoEscalations: () => {}
};
