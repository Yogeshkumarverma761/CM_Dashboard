import { isMock, supabase } from './supabaseClient';
import { complaintService } from './complaintService';

export const analyticsService = {
  getDashboardKPIs: async (filters = {}) => {
    // Make sure db is loaded in mock
    if (isMock) {
      complaintService.initLocalDatabase();
    }
    const complaints = await complaintService.getComplaints(filters);
    
    const total = complaints.length;
    const resolvedObj = complaints.filter(c => c.status === 'resolved');
    const resolved = resolvedObj.length;
    const escalated = complaints.filter(c => c.status === 'escalated').length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const assigned = complaints.filter(c => c.status === 'assigned').length;
    const inProgress = complaints.filter(c => c.status === 'in_progress').length;
    const reopened = complaints.filter(c => c.status === 'reopened').length;

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    // Average resolution time (mock 2.4 days)
    const avgResolutionTime = '2.4 Days';

    return {
      total,
      resolved,
      escalated,
      pending,
      assigned,
      inProgress,
      reopened,
      resolutionRate,
      avgResolutionTime,
      activeUnresolved: total - resolved
    };
  },

  getDistrictMetrics: async (filters = {}) => {
    const complaints = await complaintService.getComplaints(filters);
    const districts = [
      'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
      'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
      'Shahdara', 'Central Delhi'
    ];

    return districts.map(district => {
      const distComps = complaints.filter(c => c.district === district);
      const total = distComps.length;
      const resolved = distComps.filter(c => c.status === 'resolved').length;
      const escalated = distComps.filter(c => c.status === 'escalated').length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      
      return {
        name: district,
        total,
        resolved,
        escalated,
        rate
      };
    }).sort((a, b) => b.total - a.total);
  },

  getDepartmentMetrics: async (filters = {}) => {
    const complaints = await complaintService.getComplaints(filters);
    const departments = [
      { code: 'PWD', name: 'Public Works Department' },
      { code: 'DJB', name: 'Delhi Jal Board' },
      { code: 'MCD', name: 'MCD Sanitation' },
      { code: 'DISCOM', name: 'Power & DISCOMs' },
      { code: 'POLICE', name: 'Delhi Police' }
    ];

    return departments.map(dept => {
      const deptComps = complaints.filter(c => c.department_code === dept.code || c.departments?.code === dept.code);
      const total = deptComps.length;
      const resolved = deptComps.filter(c => c.status === 'resolved').length;
      const escalated = deptComps.filter(c => c.status === 'escalated').length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      // Mock rating depending on department efficiency
      let rating = 4.2;
      if (dept.code === 'PWD') rating = 3.8;
      if (dept.code === 'DJB') rating = 3.2;
      if (dept.code === 'MCD') rating = 3.5;
      if (dept.code === 'DISCOM') rating = 4.5;
      if (dept.code === 'POLICE') rating = 4.1;

      return {
        code: dept.code,
        name: dept.name,
        total,
        resolved,
        escalated,
        rate,
        rating
      };
    }).sort((a,b) => b.total - a.total);
  },

  getTimelineMetrics: async () => {
    // Generate complaints trends for Recharts
    // Returns last 7 days of data
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      
      // Seed realistic wave
      const dayFactor = date.getDay();
      const submitted = Math.floor(10 + Math.sin(dayFactor) * 5 + Math.random() * 4);
      const resolved = Math.floor(8 + Math.cos(dayFactor) * 4 + Math.random() * 3);
      
      data.push({
        name: label,
        Submitted: submitted,
        Resolved: resolved
      });
    }
    return data;
  }
};
