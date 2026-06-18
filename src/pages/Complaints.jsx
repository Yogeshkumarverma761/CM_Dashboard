import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, FormControl, InputLabel, Select, MenuItem, Stack, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, Card, CardMedia, Divider, Stepper, Step, StepLabel, LinearProgress
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Visibility as ViewIcon, 
  Replay as ReassignIcon, 
  CheckCircleOutline as ResolveIcon 
} from '@mui/icons-material';
import { complaintService } from '../services/complaintService';
import { departmentService } from '../services/departmentService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import StatusBadge from '../components/common/StatusBadge';

const DISTRICTS = [
  'All', 'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

export default function Complaints() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [district, setDistrict] = useState('All');
  const [department, setDepartment] = useState('All');

  // Detail Modal state
  const [selectedComp, setSelectedComp] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  // Action form state
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [photoAfter, setPhotoAfter] = useState('');
  const [reassignDeptCode, setReassignDeptCode] = useState('');
  const [reassignOfficerId, setReassignOfficerId] = useState('');

  const loadData = async () => {
    try {
      const filters = { search, status, severity, district, department };
      let list = await complaintService.getComplaints(filters);
      
      if (user && user.role === 'officer') {
        const officerId = user.officer_id || user.id;
        list = list.filter(c => c.assigned_officer_id === officerId);
      }
      
      setComplaints(list);

      const deptsList = await departmentService.getDepartments();
      setDepartments(deptsList);

      const officersList = await departmentService.getOfficers();
      setOfficers(officersList);
    } catch (err) {
      showNotification('Error loading complaints roster.', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [search, status, severity, district, department]);

  const handleOpenDetail = async (id) => {
    try {
      const detail = await complaintService.getComplaintById(id);
      setSelectedComp(detail);
      setResolutionNotes(detail.resolution_notes || '');
      setPhotoAfter(detail.photo_after || '');
      setReassignDeptCode(detail.department_code || '');
      setReassignOfficerId(detail.assigned_officer_id || '');
      setDetailOpen(true);
    } catch (err) {
      showNotification('Error loading complaint details.', 'error');
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedComp(null);
  };

  const handleStartWork = async () => {
    if (!selectedComp) return;
    try {
      await complaintService.updateComplaintStatus(selectedComp.id, { status: 'in_progress' }, user);
      showNotification('Grievance marked as In-Progress.', 'success');
      handleOpenDetail(selectedComp.id); // reload
      loadData(); // reload table
    } catch (err) {
      showNotification('Error starting investigation.', 'error');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedComp) return;
    try {
      const updates = {
        status: 'resolved',
        resolution_notes: resolutionNotes,
        photo_after: photoAfter || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'
      };
      await complaintService.updateComplaintStatus(selectedComp.id, updates, user);
      showNotification('Grievance successfully resolved! Quality verification is pending.', 'success');
      handleCloseDetail();
      loadData();
    } catch (err) {
      showNotification('Failed to submit resolution.', 'error');
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedComp) return;
    try {
      const matchedOfficer = officers.find(o => o.id === reassignOfficerId);
      const updates = {
        assigned_officer_id: reassignOfficerId,
        assigned_officer_name: matchedOfficer?.name || 'Assigned Officer',
        status: 'assigned',
        department_code: matchedOfficer?.department_code || selectedComp.department_code,
        department_name: matchedOfficer?.department_name || selectedComp.department_name
      };

      await complaintService.updateComplaintStatus(selectedComp.id, updates, user);
      showNotification('Grievance successfully reassigned.', 'success');
      handleCloseDetail();
      loadData();
    } catch (err) {
      showNotification('Failed to reassign officer.', 'error');
    }
  };

  // Filter officers based on selected reassignment department
  const filteredOfficers = officers.filter(o => o.department_code === reassignDeptCode);

  const officerProfile = user?.role === 'officer' ? officers.find(o => o.id === user.id) : null;
  const activeCases = complaints.filter(c => c.status !== 'resolved').length;
  const resolvedCases = complaints.filter(c => c.status === 'resolved').length;

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
          {user?.role === 'officer' ? "Officer Caseload Dashboard" : "Grievance Operations Center"}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          {user?.role === 'officer' 
            ? `Welcome Engineer ${user.full_name}. Monitor and resolve complaints assigned to your jurisdiction.`
            : "Evaluate, assign, investigate, and close public grievance tickets across the state."}
        </Typography>
      </Box>

      {user?.role === 'officer' && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: '12px', borderLeft: '5px solid #FF9933' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Case Load
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540', mt: 0.5 }}>
                {activeCases} / {officerProfile?.max_workload || 15} Cases
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(activeCases / (officerProfile?.max_workload || 15)) * 100}
                sx={{ height: 6, borderRadius: 3, mt: 1.5, backgroundColor: '#F1F5F9', '& .MuiLinearProgress-bar': { backgroundColor: '#FF9933' } }}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: '12px', borderLeft: '5px solid #138808' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Resolved Grievances
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#138808', mt: 0.5 }}>
                {resolvedCases} Closed
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 1 }}>
                Submitted image resolution proofs to CM audit cell
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper elevation={2} sx={{ p: 2.5, borderRadius: '12px', borderLeft: '5px solid #007FFF' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Performance Rating
              </Typography>
              <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#007FFF', mt: 0.5 }}>
                {officerProfile?.avg_rating || 4.2} ★
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 1 }}>
                Average rating from citizen feedback reviews
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Filters Form */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              label="Search tracking ID or keyword"
              variant="outlined"
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
          </Grid>

          <Grid item xs={6} sm={2} md={2.2}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="reopened">Reopened</MenuItem>
                <MenuItem value="escalated">Escalated</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={2} md={2.2}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select value={severity} onChange={(e) => setSeverity(e.target.value)} label="Severity">
                <MenuItem value="All">All Severities</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={2} md={2.2}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>District</InputLabel>
              <Select value={district} onChange={(e) => setDistrict(e.target.value)} label="District">
                {DISTRICTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={2} md={2.4}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} label="Department">
                <MenuItem value="All">All Departments</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept.code} value={dept.code}>{dept.code}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Table Grid */}
      <TableContainer component={Paper} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Tracking ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Grievance Details</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>District</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#0A2540' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: '#64748B' }}>
                  No complaints found matching current filter values.
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: '#0A2540', fontSize: 13 }}>{c.tracking_no}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      {c.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Logged on: {new Date(c.created_at).toLocaleDateString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{c.department_code || 'Unassigned'}</TableCell>
                  <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{c.district}</TableCell>
                  <TableCell>
                    <Chip 
                      label={c.severity.toUpperCase()} 
                      size="small"
                      color={c.severity === 'critical' ? 'error' : c.severity === 'high' ? 'warning' : 'default'}
                      sx={{ fontWeight: 700, height: 20, fontSize: 9 }}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenDetail(c.id)} size="small">
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Complaint Detail Dialog Modal */}
      <Dialog 
        open={detailOpen} 
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        {selectedComp && (
          <>
            <DialogTitle sx={{ backgroundColor: '#0A2540', color: '#fff', py: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                    TRACKING ID: {selectedComp.tracking_no}
                  </Typography>
                  <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700 }}>
                    {selectedComp.title}
                  </Typography>
                </Box>
                <StatusBadge status={selectedComp.status} />
              </Stack>
            </DialogTitle>

            <DialogContent dividers sx={{ py: 3 }}>
              <Grid container spacing={3}>
                {/* Details Section */}
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 3, lineHeight: 1.6 }}>
                    {selectedComp.description}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>DISTRICT</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedComp.district}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>SEVERITY</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: selectedComp.severity === 'critical' ? '#B91C1C' : 'inherit' }}>
                        {selectedComp.severity.toUpperCase()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>DEPARTMENT</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedComp.department_name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>ASSIGNED OFFICER</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {selectedComp.assigned_officer_name || 'Not Assigned'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Photo comparison if resolved */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', mb: 1.5 }}>
                    Photo Proofs
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Card variant="outlined" sx={{ borderRadius: '8px' }}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={selectedComp.photo_before || 'https://images.unsplash.com/photo-1599740831464-bf3e970a2569?auto=format&fit=crop&w=600&q=80'}
                          alt="Before Grievance"
                        />
                        <Box sx={{ p: 1, textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>BEFORE PHOTO</Typography>
                        </Box>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined" sx={{ borderRadius: '8px' }}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={selectedComp.photo_after || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'}
                          alt="After Grievance"
                        />
                        <Box sx={{ p: 1, textAlign: 'center', backgroundColor: '#F8FAFC' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#138808' }}>
                            {selectedComp.status === 'resolved' ? 'AFTER PHOTO' : 'NO AFTER PHOTO YET'}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>

                  {selectedComp.resolution_notes && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#065F46', mb: 0.5 }}>
                        Resolution Notes
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#047857' }}>
                        {selectedComp.resolution_notes}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Timeline History Section */}
                <Grid item xs={12} md={5}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', height: '100%', backgroundColor: '#F8FAFC' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', mb: 2 }}>
                      Audit Timeline History
                    </Typography>
                    <Stepper orientation="vertical" size="small">
                      {selectedComp.timeline?.map((step, idx) => (
                        <Step key={step.id} active={true}>
                          <StepLabel
                            StepIconProps={{
                              style: { color: step.status === 'resolved' ? '#138808' : step.status === 'escalated' ? '#B91C1C' : '#0A2540' }
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 12, color: '#1E293B' }}>
                              {step.description}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: 10 }}>
                              By: {step.action_by_name} | {new Date(step.created_at).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </Paper>
                </Grid>
              </Grid>

              {/* ACTION LAYERS DEPENDING ON USER ROLE */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0' }}>
                {/* 1. Officer Actions: Resolve Complaint */}
                {user?.role === 'officer' && (selectedComp.assigned_officer_id === user.officer_id || selectedComp.assigned_officer_id === user.id) && (
                  <Box>
                    {selectedComp.status === 'assigned' && (
                      <Button variant="contained" color="warning" onClick={handleStartWork} sx={{ textTransform: 'none' }}>
                        Mark as "In Progress" & Deploy Team
                      </Button>
                    )}
                    {['assigned', 'in_progress', 'reopened'].includes(selectedComp.status) && (
                      <Box component="form" onSubmit={handleResolve} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', mb: 1 }}>
                          Submit Grievance Resolution Proof
                        </Typography>
                        <TextField
                          label="Resolution Notes"
                          multiline
                          rows={2}
                          fullWidth
                          required
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Describe the actions taken on-ground to resolve this issue..."
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          label="After Photo URL (Optional)"
                          fullWidth
                          value={photoAfter}
                          onChange={(e) => setPhotoAfter(e.target.value)}
                          placeholder="Link to image proof showing fixed location..."
                          sx={{ mb: 2 }}
                        />
                        <Button 
                          type="submit" 
                          variant="contained" 
                          color="success" 
                          startIcon={<ResolveIcon />}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Resolve & Submit Proof
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {/* 2. Admin/CM Actions: Reassignment */}
                {['admin', 'cm'].includes(user?.role || '') && (
                  <Box component="form" onSubmit={handleReassign}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', mb: 1 }}>
                      Manually Reassign/Route Grievance
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <FormControl variant="outlined" size="small" fullWidth>
                          <InputLabel>Department</InputLabel>
                          <Select
                            value={reassignDeptCode}
                            onChange={(e) => {
                              setReassignDeptCode(e.target.value);
                              setReassignOfficerId('');
                            }}
                            label="Department"
                          >
                            {departments.map(d => (
                              <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6}>
                        <FormControl variant="outlined" size="small" fullWidth disabled={!reassignDeptCode}>
                          <InputLabel>Officer (Workload)</InputLabel>
                          <Select
                            value={reassignOfficerId}
                            onChange={(e) => setReassignOfficerId(e.target.value)}
                            label="Officer (Workload)"
                            required
                          >
                            {filteredOfficers.map(o => (
                              <MenuItem key={o.id} value={o.id}>
                                {o.name} (Load: {o.workload_count}/{o.max_workload})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      startIcon={<ReassignIcon />}
                      disabled={!reassignOfficerId}
                      sx={{ mt: 2, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                    >
                      Update Assignment & Route
                    </Button>
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseDetail} variant="outlined" sx={{ textTransform: 'none', borderRadius: '8px' }}>
                Close Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
