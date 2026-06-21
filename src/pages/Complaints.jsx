import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TextField, FormControl, InputLabel, Select, MenuItem, Stack, IconButton, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip, Card, CardMedia, 
  Divider, Stepper, Step, StepLabel, LinearProgress, Tabs, Tab, Box as MuiBox
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Visibility as ViewIcon, 
  Replay as ReassignIcon, 
  CheckCircleOutline as ResolveIcon,
  FilterList,
  AssignmentTurnedIn,
  Engineering,
  StarHalf,
  ChevronRight
} from '@mui/icons-material';
import { complaintService } from '../services/complaintService';
import { departmentService } from '../services/departmentService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useCustomTheme } from '../context/ThemeContext';
import StatusBadge from '../components/common/StatusBadge';

const DISTRICTS = [
  'All', 'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

export default function Complaints() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { darkMode } = useCustomTheme();
  
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  
  // Tab state for Officers (0 = My Caseload, 1 = Department Pool)
  const [officerTab, setOfficerTab] = useState(0);

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
      
      // If user is an officer, filter logically
      if (user && user.role === 'officer') {
        const officerId = user.officer_id || user.id;
        const deptCode = user.department_code || 'PWD';
        
        if (officerTab === 0) {
          // My assigned workload
          list = list.filter(c => c.assigned_officer_id === officerId);
        } else {
          // Entire department workload
          list = list.filter(c => c.department_code === deptCode);
        }
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
  }, [search, status, severity, district, department, officerTab]);

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
      handleOpenDetail(selectedComp.id); // reload details
      loadData(); // reload roster
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
      showNotification('Grievance successfully resolved! Proof submitted.', 'success');
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

  const filteredOfficers = officers.filter(o => o.department_code === reassignDeptCode);
  const officerProfile = user?.role === 'officer' ? officers.find(o => o.id === user.officer_id || o.id === user.id) : null;
  
  // Calculate counts based on current complaints loaded
  const activeCases = complaints.filter(c => c.status !== 'resolved').length;
  const resolvedCases = complaints.filter(c => c.status === 'resolved').length;

  return (
    <Box className="fade-in" sx={{ px: { xs: 0.5, md: 1 } }}>
      {/* Title Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: darkMode ? '#fff' : '#0A2540' }}>
          {user?.role === 'officer' ? "PWD Engineer Board" : "Grievance Operations Desk"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.role === 'officer' 
            ? `Welcome, Engineer ${user.full_name}. Review assigned complaints and log proof of completions.`
            : "Review, assign, investigate, and close public grievance tickets across the state."}
        </Typography>
      </Box>

      {/* Officer Metric Overview cards */}
      {user?.role === 'officer' && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, borderRadius: 3, borderLeft: '5px solid #FF9933' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Caseload
                  </Typography>
                  <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mt: 0.5 }}>
                    {activeCases} / {officerProfile?.max_workload || 15}
                  </Typography>
                </Box>
                <Engineering sx={{ color: '#FF9933', fontSize: 32 }} />
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((activeCases / (officerProfile?.max_workload || 15)) * 100, 100)}
                sx={{ height: 6, borderRadius: 3, mt: 2, backgroundColor: 'divider' }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, borderRadius: 3, borderLeft: '5px solid #138808' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Resolved Grievances
                  </Typography>
                  <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mt: 0.5, color: '#138808' }}>
                    {resolvedCases} Closed
                  </Typography>
                </Box>
                <AssignmentTurnedIn sx={{ color: '#138808', fontSize: 32 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.2 }}>
                Submitted visual proofs to CM audit loop
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2.5, borderRadius: 3, borderLeft: '5px solid #007FFF' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Citizen Rating Avg
                  </Typography>
                  <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mt: 0.5, color: '#007FFF' }}>
                    {officerProfile?.avg_rating || 4.2} ★
                  </Typography>
                </Box>
                <StarHalf sx={{ color: '#007FFF', fontSize: 32 }} />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2.2 }}>
                Average rating from customer reviews
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tabs for Officers */}
      {user?.role === 'officer' && (
        <Paper sx={{ borderRadius: 3, mb: 3 }}>
          <Tabs 
            value={officerTab} 
            onChange={(e, val) => setOfficerTab(val)} 
            indicatorColor="secondary" 
            textColor="secondary"
            variant="fullWidth"
          >
            <Tab label="My Active Caseload" sx={{ fontWeight: 700 }} />
            <Tab label={`Department Pool (${user.department_code || 'PWD'})`} sx={{ fontWeight: 700 }} />
          </Tabs>
        </Paper>
      )}

      {/* Filters Form */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              label="Search tracking ID or keywords"
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
                <MenuItem value="pending">Pending Routing</MenuItem>
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
                <MenuItem value="low">Low Priority</MenuItem>
                <MenuItem value="medium">Medium Priority</MenuItem>
                <MenuItem value="high">High Priority</MenuItem>
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

          {/* Department filter hidden for PWD Officers to prevent confusion */}
          {user?.role !== 'officer' && (
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
          )}
        </Grid>
      </Paper>

      {/* Main Table Grid */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tracking ID</TableCell>
              <TableCell>Grievance Details</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>District</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No complaints found matching current filter parameters.
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 800, color: 'primary.main', fontSize: 13 }}>{c.tracking_no}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>
                      {c.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Logged: {new Date(c.created_at).toLocaleDateString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12.5, fontWeight: 600 }}>{c.department_code || 'Unassigned'}</TableCell>
                  <TableCell sx={{ fontSize: 12.5 }}>{c.district}</TableCell>
                  <TableCell>
                    <Chip 
                      label={c.severity.toUpperCase()} 
                      size="small"
                      color={c.severity === 'critical' ? 'error' : c.severity === 'high' ? 'warning' : 'default'}
                      sx={{ fontWeight: 700, height: 18, fontSize: 9 }}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={() => handleOpenDetail(c.id)}
                      endIcon={<ChevronRight />}
                      sx={{ py: 0.3, textTransform: 'none', fontSize: 11, fontWeight: 700 }}
                    >
                      Inspect
                    </Button>
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
      >
        {selectedComp && (
          <>
            <DialogTitle sx={{ backgroundColor: darkMode ? '#0A182F' : '#0A2540', color: '#fff', py: 2 }}>
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1 }}>
                    Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {selectedComp.description}
                  </Typography>

                  <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>DISTRICT</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedComp.district}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>SEVERITY</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: selectedComp.severity === 'critical' ? '#B91C1C' : 'inherit' }}>
                        {selectedComp.severity.toUpperCase()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>DEPARTMENT</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedComp.department_name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>ASSIGNED ENGINEER</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {selectedComp.assigned_officer_name || 'Pending routing'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Photo comparison if resolved */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1.5 }}>
                    Visual Ground Evidence
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardMedia
                          component="img"
                          height="140"
                          image={selectedComp.photo_before || 'https://images.unsplash.com/photo-1599740831464-bf3e970a2569?auto=format&fit=crop&w=600&q=80'}
                          alt="Before Grievance"
                        />
                        <Box sx={{ p: 1, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>BEFORE INCIDENT</Typography>
                        </Box>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card variant="outlined">
                        <CardMedia
                          component="img"
                          height="140"
                          image={selectedComp.photo_after || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'}
                          alt="After Grievance"
                        />
                        <Box sx={{ p: 1, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: selectedComp.status === 'resolved' ? 'success.main' : 'text.secondary' }}>
                            {selectedComp.status === 'resolved' ? 'COMPLETED PROOF' : 'WAITING RESOLUTION'}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>

                  {selectedComp.resolution_notes && (
                    <Box sx={{ mt: 2.5, p: 2, backgroundColor: 'rgba(19, 136, 8, 0.05)', borderRadius: 2, border: '1px solid rgba(19, 136, 8, 0.1)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 750, color: '#138808', mb: 0.5 }}>
                        Resolution Notes
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'success.dark' }}>
                        {selectedComp.resolution_notes}
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* Timeline History Section */}
                <Grid item xs={12} md={5}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', backgroundColor: 'rgba(0,0,0,0.01)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 2 }}>
                      System Audit Trails
                    </Typography>
                    <Stepper orientation="vertical">
                      {selectedComp.timeline?.map((step, idx) => (
                        <Step key={step.id} active={true}>
                          <StepLabel
                            StepIconProps={{
                              style: { color: step.status === 'resolved' ? '#138808' : step.status === 'escalated' ? '#B91C1C' : '#0A2540' }
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 750, fontSize: 11.5 }}>
                              {step.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: 9.5 }}>
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
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                {/* 1. Officer Actions: Resolve Complaint */}
                {user?.role === 'officer' && (selectedComp.assigned_officer_id === user.officer_id || selectedComp.assigned_officer_id === user.id) && (
                  <Box>
                    {selectedComp.status === 'assigned' && (
                      <Button variant="contained" color="warning" onClick={handleStartWork} sx={{ fontWeight: 700 }}>
                        Mark as "In Progress" & Deploy Field Team
                      </Button>
                    )}
                    {['assigned', 'in_progress', 'reopened'].includes(selectedComp.status) && (
                      <Box component="form" onSubmit={handleResolve} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1 }}>
                          Log Grievance Resolution Proof
                        </Typography>
                        <TextField
                          label="Resolution Action Taken"
                          multiline
                          rows={2}
                          fullWidth
                          required
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="State actions completed on-ground (e.g. road resurfaced, leaks fixed)..."
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          label="After Photo URL Proof"
                          fullWidth
                          value={photoAfter}
                          onChange={(e) => setPhotoAfter(e.target.value)}
                          placeholder="Provide image link proving completion (or leave empty to use template)..."
                          sx={{ mb: 2 }}
                        />
                        <Button 
                          type="submit" 
                          variant="contained" 
                          color="success" 
                          startIcon={<ResolveIcon />}
                          sx={{ fontWeight: 700, color: '#fff' }}
                        >
                          Resolve Grievance
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {/* 2. Admin/CM Actions: Reassignment */}
                {['admin', 'cm'].includes(user?.role || '') && (
                  <Box component="form" onSubmit={handleReassign}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 750, mb: 1 }}>
                      Manually Re-route & Reassign Complaint
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
                          <InputLabel>Assign Engineer (Load)</InputLabel>
                          <Select
                            value={reassignOfficerId}
                            onChange={(e) => setReassignOfficerId(e.target.value)}
                            label="Assign Engineer (Load)"
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
                      sx={{ mt: 2, fontWeight: 700 }}
                    >
                      Update Assignment & Route
                    </Button>
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={handleCloseDetail} variant="outlined" sx={{ fontWeight: 700 }}>
                Close Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
