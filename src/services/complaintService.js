import { isMock, supabase } from './supabaseClient';
import { MOCK_USERS } from '../context/AuthContext';

const MOCK_COMPLAINTS_KEY = 'delhi_complaints';
const MOCK_TIMELINE_KEY = 'delhi_complaint_timeline';
const MOCK_RE_INSPECTIONS_KEY = 'delhi_re_inspections';

// Helper to get officers for mock
const getMockOfficers = () => {
  const registered = JSON.parse(localStorage.getItem('delhi_registered_users') || '[]');
  const mockOfficers = MOCK_USERS.filter(u => u.role === 'officer');
  const customOfficers = registered.filter(u => u.role === 'officer');
  return [...mockOfficers, ...customOfficers];
};

const CATEGORY_TO_DEPT_MAPPING = {
  'Roads / Potholes': 'PWD',
  'Water Leakage / Shortage': 'DJB',
  'Garbage / Waste Pile': 'MCD',
  'Streetlight / Power Outage': 'DISCOM',
  'Public Nuisance / Safety': 'POLICE'
};

const INITIAL_COMPLAINTS = [
  {
    id: 'comp-1',
    tracking_no: 'DL-2026-8921',
    title: 'Severe pothole cluster on Ring Road near Lajpat Nagar',
    description: 'A cluster of deep potholes is causing severe traffic congestion and minor accidents. Needs immediate resurfacing.',
    category: 'Roads / Potholes',
    department_code: 'PWD',
    department_name: 'Public Works Department (PWD)',
    status: 'assigned',
    severity: 'high',
    district: 'South East Delhi',
    latitude: 28.5678,
    longitude: 77.2435,
    photo_before: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    photo_after: null,
    citizen_name: 'Amit Verma',
    citizen_id: 'citizen-user-id',
    assigned_officer_id: 'pwd-officer-id',
    assigned_officer_name: 'S.K. Sharma (EE, PWD)',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'comp-2',
    tracking_no: 'DL-2026-4421',
    title: 'Major water pipe burst near Dwarka Mor Metro',
    description: 'Drinking water has been leaking continuously from an underground main line, flooding the main corridor.',
    category: 'Water Leakage / Shortage',
    department_code: 'DJB',
    department_name: 'Delhi Jal Board (DJB)',
    status: 'escalated',
    severity: 'critical',
    district: 'West Delhi',
    latitude: 28.6185,
    longitude: 77.0321,
    photo_before: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    photo_after: null,
    citizen_name: 'Vikram Singh',
    citizen_id: 'temp-citizen',
    assigned_officer_id: 'djb-officer-id',
    assigned_officer_name: 'Meena Das (AE, DJB)',
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 days ago (Escalated!)
    updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'comp-3',
    tracking_no: 'DL-2026-3091',
    title: 'Garbage dump near primary school in Karol Bagh',
    description: 'An unauthorized trash dumping spot has developed directly adjacent to the MCD Primary School, creating severe hygienic risks.',
    category: 'Garbage / Waste Pile',
    department_code: 'MCD',
    department_name: 'MCD Garbage & Sanitation',
    status: 'resolved',
    severity: 'medium',
    district: 'Central Delhi',
    latitude: 28.6445,
    longitude: 77.1912,
    photo_before: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
    photo_after: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80',
    resolution_notes: 'Area cleared of all debris, bleaching powder applied, and warning banners installed.',
    citizen_name: 'Rohan Mehra',
    citizen_id: 'citizen-user-id',
    assigned_officer_id: 'mcd-officer-id',
    assigned_officer_name: 'Rakesh Yadav (SI, MCD)',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'comp-4',
    tracking_no: 'DL-2026-7788',
    title: 'Frequent voltage fluctuations & cable spark in Okhla Phase 3',
    description: 'Transformer overhead lines spark during peak hours, shutting down office blocks.',
    category: 'Streetlight / Power Outage',
    department_code: 'DISCOM',
    department_name: 'Power & Electricity (DISCOMs)',
    status: 'in_progress',
    severity: 'high',
    district: 'South Delhi',
    latitude: 28.5355,
    longitude: 77.2652,
    photo_before: null,
    photo_after: null,
    citizen_name: 'Karan Malhotra',
    citizen_id: 'citizen-user-id',
    assigned_officer_id: 'discom-officer-id',
    assigned_officer_name: 'Anil Gupta (SE, DISCOM)',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'comp-5',
    tracking_no: 'DL-2026-1211',
    title: 'Lack of policing & lighting in Connaught Place outer circle pocket',
    description: 'Multiple streetlights are broken. Anti-social elements gather after dark, making it unsafe for pedestrians.',
    category: 'Public Nuisance / Safety',
    department_code: 'POLICE',
    department_name: 'Delhi Police & Security',
    status: 'pending',
    severity: 'medium',
    district: 'New Delhi',
    latitude: 28.6304,
    longitude: 77.2177,
    photo_before: null,
    photo_after: null,
    citizen_name: 'Sanya Sen',
    citizen_id: 'citizen-user-id',
    assigned_officer_id: 'police-officer-id',
    assigned_officer_name: 'SHO Amit Singh',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago (Escalated!)
    updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_TIMELINE = [
  { id: 't-1', complaint_id: 'comp-1', status: 'pending', description: 'Complaint submitted by Amit Verma.', action_by_name: 'Citizen Portal', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-2', complaint_id: 'comp-1', status: 'assigned', description: 'Assigned automatically to Executive Engineer (PWD) S.K. Sharma.', action_by_name: 'System Auto-Router', created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  
  { id: 't-3', complaint_id: 'comp-2', status: 'pending', description: 'Water main line leak report logged.', action_by_name: 'Citizen Portal', created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-4', complaint_id: 'comp-2', status: 'assigned', description: 'Assigned to Assistant Engineer (DJB) Meena Das.', action_by_name: 'System Auto-Router', created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-5', complaint_id: 'comp-2', status: 'escalated', description: 'Auto-escalated by CM Office. No action taken by department within 7 days.', action_by_name: 'System Monitor', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },

  { id: 't-6', complaint_id: 'comp-3', status: 'pending', description: 'Garbage dump complaint registered.', action_by_name: 'Citizen Portal', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-7', complaint_id: 'comp-3', status: 'assigned', description: 'Assigned to MCD Officer Rakesh Yadav.', action_by_name: 'System Auto-Router', created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 't-8', complaint_id: 'comp-3', status: 'resolved', description: 'Debris removed and sanitation warning boards erected.', action_by_name: 'Rakesh Yadav (SI, MCD)', created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

export const complaintService = {
  // Setup database
  initLocalDatabase: () => {
    if (!localStorage.getItem(MOCK_COMPLAINTS_KEY)) {
      localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(INITIAL_COMPLAINTS));
      localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(INITIAL_TIMELINE));
      localStorage.setItem(MOCK_RE_INSPECTIONS_KEY, JSON.stringify([]));
    }
    // Auto-escalation run
    complaintService.runAutoEscalations();
  },

  runAutoEscalations: () => {
    if (!isMock) return;
    const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
    const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
    let changed = false;

    const updatedComplaints = complaints.map(c => {
      // If pending/assigned/in_progress and older than 7 days
      if (['pending', 'assigned', 'in_progress'].includes(c.status)) {
        const createdDate = new Date(c.created_at);
        const diffDays = (Date.now() - createdDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) {
          c.status = 'escalated';
          c.updated_at = new Date().toISOString();
          changed = true;

          // Add timeline event
          timelines.push({
            id: 't-auto-' + Math.random().toString(36).substr(2, 9),
            complaint_id: c.id,
            status: 'escalated',
            description: 'Complaint auto-escalated to CM Cell. Resolution threshold (7 days) breached.',
            action_by_name: 'System Monitor',
            created_at: new Date().toISOString()
          });
        }
      }
      return c;
    });

    if (changed) {
      localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(updatedComplaints));
      localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(timelines));
    }
  },

  getComplaints: async (filters = {}) => {
    if (isMock) {
      complaintService.initLocalDatabase();
      let complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');

      // Apply Filters
      if (filters.district && filters.district !== 'All') {
        complaints = complaints.filter(c => c.district === filters.district);
      }
      if (filters.status && filters.status !== 'All') {
        complaints = complaints.filter(c => c.status === filters.status);
      }
      if (filters.severity && filters.severity !== 'All') {
        complaints = complaints.filter(c => c.severity === filters.severity);
      }
      if (filters.department && filters.department !== 'All') {
        complaints = complaints.filter(c => c.department_code === filters.department);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        complaints = complaints.filter(c => 
          c.title.toLowerCase().includes(q) || 
          c.tracking_no.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }

      // Sort by newest first
      return complaints.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      let query = supabase.from('complaints').select('*, departments(*)');
      
      if (filters.district && filters.district !== 'All') {
        query = query.eq('district', filters.district);
      }
      if (filters.status && filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }
      if (filters.severity && filters.severity !== 'All') {
        query = query.eq('severity', filters.severity);
      }
      if (filters.department && filters.department !== 'All') {
        query = query.eq('department_id', filters.department);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      // Perform frontend search query matching for client ease
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return data.filter(c => 
          c.title.toLowerCase().includes(q) || 
          c.tracking_no.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return data;
    }
  },

  getComplaintById: async (id) => {
    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      const complaint = complaints.find(c => c.id === id);
      
      if (!complaint) return null;
      
      const history = timelines
        .filter(t => t.complaint_id === id)
        .sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
      
      return { ...complaint, timeline: history };
    } else {
      const { data: complaint, error: compErr } = await supabase
        .from('complaints')
        .select('*, departments(*), users(*)')
        .eq('id', id)
        .single();
      if (compErr) throw compErr;

      const { data: timeline, error: timeErr } = await supabase
        .from('complaint_timeline')
        .select('*')
        .eq('complaint_id', id)
        .order('created_at', { ascending: true });
      if (timeErr) throw timeErr;

      return { ...complaint, timeline };
    }
  },

  trackComplaintByNo: async (trackingNo) => {
    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      const complaint = complaints.find(c => c.tracking_no.trim().toUpperCase() === trackingNo.trim().toUpperCase());
      
      if (!complaint) return null;
      
      const history = timelines
        .filter(t => t.complaint_id === complaint.id)
        .sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
      
      return { ...complaint, timeline: history };
    } else {
      const { data: complaint, error: compErr } = await supabase
        .from('complaints')
        .select('*, departments(*)')
        .eq('tracking_no', trackingNo.trim().toUpperCase())
        .single();
      
      if (compErr || !complaint) return null;

      const { data: timeline } = await supabase
        .from('complaint_timeline')
        .select('*')
        .eq('complaint_id', complaint.id)
        .order('created_at', { ascending: true });

      return { ...complaint, timeline };
    }
  },

  createComplaint: async (complaintData, currentUser = null) => {
    const trackingNo = 'DL-2026-' + Math.floor(1000 + Math.random() * 9000);
    const newRecord = {
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      severity: complaintData.severity || 'medium',
      district: complaintData.district,
      latitude: parseFloat(complaintData.latitude || 28.6139),
      longitude: parseFloat(complaintData.longitude || 77.2090),
      photo_before: complaintData.photo_before || 'https://images.unsplash.com/photo-1599740831464-bf3e970a2569?auto=format&fit=crop&w=600&q=80',
      photo_after: null,
      citizen_id: currentUser?.id || 'citizen-user-id',
      citizen_name: currentUser?.full_name || 'Guest Citizen',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tracking_no: trackingNo
    };

    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      
      // Map category to department
      const deptCode = CATEGORY_TO_DEPT_MAPPING[newRecord.category] || 'PWD';
      newRecord.department_code = deptCode;
      newRecord.department_name = deptCode === 'PWD' ? 'Public Works Department (PWD)' :
                                  deptCode === 'DJB' ? 'Delhi Jal Board (DJB)' :
                                  deptCode === 'MCD' ? 'MCD Garbage & Sanitation' :
                                  deptCode === 'DISCOM' ? 'Power & Electricity (DISCOMs)' :
                                  'Delhi Police & Security';

      // Load officers to find lowest workload officer
      const officers = getMockOfficers().filter(o => o.department_code === deptCode);
      let assignedOfficer = officers[0] || null;

      if (assignedOfficer) {
        newRecord.assigned_officer_id = assignedOfficer.id;
        newRecord.assigned_officer_name = assignedOfficer.full_name;
        newRecord.status = 'assigned';
      } else {
        newRecord.status = 'pending';
      }

      newRecord.id = 'comp-' + Date.now();
      complaints.push(newRecord);
      
      // Save
      localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(complaints));

      // Create Timelines
      const timelineEntries = [
        {
          id: 't-new-' + Date.now(),
          complaint_id: newRecord.id,
          status: 'pending',
          description: `Grievance submitted by ${newRecord.citizen_name} in ${newRecord.district}.`,
          action_by_name: 'Citizen Portal',
          created_at: newRecord.created_at
        }
      ];

      if (assignedOfficer) {
        timelineEntries.push({
          id: 't-new-assign-' + Date.now(),
          complaint_id: newRecord.id,
          status: 'assigned',
          description: `Assigned automatically to ${assignedOfficer.full_name} due to low active workload.`,
          action_by_name: 'System Auto-Router',
          created_at: newRecord.created_at
        });
      }

      const updatedTimelines = [...timelines, ...timelineEntries];
      localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(updatedTimelines));

      return { ...newRecord, timeline: timelineEntries };
    } else {
      // Fetch department by code
      const deptCode = CATEGORY_TO_DEPT_MAPPING[newRecord.category] || 'PWD';
      const { data: dept } = await supabase.from('departments').select('id').eq('code', deptCode).single();
      newRecord.department_id = dept.id;

      const { data, error } = await supabase
        .from('complaints')
        .insert([newRecord])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  updateComplaintStatus: async (complaintId, updates, activeUser) => {
    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      const reInspections = JSON.parse(localStorage.getItem(MOCK_RE_INSPECTIONS_KEY) || '[]');

      const idx = complaints.findIndex(c => c.id === complaintId);
      if (idx === -1) throw new Error('Complaint not found');

      const oldComp = complaints[idx];
      const updatedComp = { 
        ...oldComp, 
        ...updates, 
        updated_at: new Date().toISOString() 
      };

      if (updates.status === 'resolved') {
        updatedComp.resolved_at = new Date().toISOString();
        updatedComp.photo_after = updates.photo_after || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80';
      }

      complaints[idx] = updatedComp;
      localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(complaints));

      // Append Timeline
      let description = `Complaint updated by ${activeUser?.full_name || 'Officer'}.`;
      if (updates.status === 'resolved') {
        description = `Complaint resolved. Proof uploaded with validated GPS coordinates. Notes: ${updates.resolution_notes || ''}`;
      } else if (updates.status === 'in_progress') {
        description = 'Investigation started. Ground personnel dispatched.';
      } else if (updates.status === 'assigned' && updates.assigned_officer_id) {
        description = `Reassigned to ${updates.assigned_officer_name || 'new officer'}.`;
      }

      const timelineId = 't-upd-' + Date.now();
      timelines.push({
        id: timelineId,
        complaint_id: complaintId,
        status: updates.status || oldComp.status,
        description,
        action_by: activeUser?.id,
        action_by_name: activeUser?.full_name || 'Department Officer',
        created_at: new Date().toISOString()
      });

      // Handle 10% random inspection trigger
      if (updates.status === 'resolved' && Math.random() < 0.10) {
        reInspections.push({
          id: 're-' + Date.now(),
          complaint_id: complaintId,
          status: 'pending',
          notes: 'Random 10% quality audit verification.',
          created_at: new Date().toISOString()
        });
        localStorage.setItem(MOCK_RE_INSPECTIONS_KEY, JSON.stringify(reInspections));

        timelines.push({
          id: 't-audit-' + Date.now(),
          complaint_id: complaintId,
          status: 'resolved',
          description: 'Grievance flag marked for random 10% quality audit re-inspection.',
          action_by_name: 'System Audit',
          created_at: new Date().toISOString()
        });
      }

      localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(timelines));
      return updatedComp;
    } else {
      const { data, error } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', complaintId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  submitFeedback: async (complaintId, feedbackData) => {
    if (isMock) {
      complaintService.initLocalDatabase();
      const complaints = JSON.parse(localStorage.getItem(MOCK_COMPLAINTS_KEY) || '[]');
      const timelines = JSON.parse(localStorage.getItem(MOCK_TIMELINE_KEY) || '[]');
      const index = complaints.findIndex(c => c.id === complaintId);

      if (index === -1) throw new Error('Complaint not found');

      const complaint = complaints[index];
      
      // Auto reopen logic
      if (feedbackData.rating < 3) {
        complaint.status = 'reopened';
        complaint.updated_at = new Date().toISOString();
        complaints[index] = complaint;
        localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(complaints));

        // Add to timeline
        timelines.push({
          id: 't-fb-' + Date.now(),
          complaint_id: complaintId,
          status: 'reopened',
          description: `Citizen submitted ${feedbackData.rating}/5 rating. Grievance auto-reopened. Feedback: "${feedbackData.comments || ''}"`,
          action_by_name: 'Citizen Feedback Loop',
          created_at: new Date().toISOString()
        });
      } else {
        timelines.push({
          id: 't-fb-' + Date.now(),
          complaint_id: complaintId,
          status: complaint.status,
          description: `Citizen submitted positive feedback: ${feedbackData.rating}/5. Comment: "${feedbackData.comments || ''}"`,
          action_by_name: 'Citizen Feedback Loop',
          created_at: new Date().toISOString()
        });
      }

      localStorage.setItem(MOCK_TIMELINE_KEY, JSON.stringify(timelines));
      return { success: true };
    } else {
      const { error } = await supabase
        .from('feedback')
        .insert([{ complaint_id: complaintId, ...feedbackData }]);
      
      if (error) throw error;
      return { success: true };
    }
  }
};
