import { isMock, supabase } from './supabaseClient';
import { MOCK_USERS } from '../context/AuthContext';
import { complaintService } from './complaintService';

export const departmentService = {
  getDepartments: async () => {
    if (isMock) {
      return [
        { id: 'dept-pwd', name: 'Public Works Department (PWD)', code: 'PWD', rating: 3.8, active_officers_count: 1 },
        { id: 'dept-djb', name: 'Delhi Jal Board (DJB)', code: 'DJB', rating: 3.2, active_officers_count: 1 },
        { id: 'dept-mcd', name: 'MCD Garbage & Sanitation', code: 'MCD', rating: 3.5, active_officers_count: 1 },
        { id: 'dept-discom', name: 'Power & Electricity (DISCOMs)', code: 'DISCOM', rating: 4.5, active_officers_count: 1 },
        { id: 'dept-police', name: 'Delhi Police & Security', code: 'POLICE', rating: 4.1, active_officers_count: 1 }
      ];
    } else {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    }
  },

  getOfficers: async () => {
    if (isMock) {
      const complaints = JSON.parse(localStorage.getItem('delhi_complaints') || '[]');
      const registered = JSON.parse(localStorage.getItem('delhi_registered_users') || '[]');
      const mockOfficers = MOCK_USERS.filter(u => u.role === 'officer');
      const customOfficers = registered.filter(u => u.role === 'officer');
      const officers = [...mockOfficers, ...customOfficers];
      
      return officers.map(o => {
        // Recalculate workload count in local storage
        const activeCount = complaints.filter(c => c.assigned_officer_id === o.id && c.status !== 'resolved').length;
        
        let avgRating = 4.2;
        if (o.department_code === 'PWD') avgRating = 3.8;
        if (o.department_code === 'DJB') avgRating = 3.2;
        if (o.department_code === 'MCD') avgRating = 3.5;
        if (o.department_code === 'DISCOM') avgRating = 4.5;
        if (o.department_code === 'POLICE') avgRating = 4.1;

        return {
          id: o.id,
          name: o.full_name,
          email: o.email,
          department_name: o.department_name,
          department_code: o.department_code,
          workload_count: activeCount,
          max_workload: 15,
          avg_rating: avgRating,
          is_active: true
        };
      });
    } else {
      const { data, error } = await supabase
        .from('officers')
        .select('*, users(*), departments(*)');
      if (error) throw error;
      return data.map(o => ({
        id: o.id,
        name: o.users?.full_name,
        email: o.users?.email,
        department_name: o.departments?.name,
        department_code: o.departments?.code,
        workload_count: o.workload_count,
        max_workload: o.max_workload,
        avg_rating: o.avg_rating,
        is_active: o.is_active
      }));
    }
  }
};
