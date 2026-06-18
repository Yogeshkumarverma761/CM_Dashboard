import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, Card, CardContent, Stack, Divider, Chip 
} from '@mui/material';
import { FlightTakeoff as FlightIcon, Add as AddIcon, Warning } from '@mui/icons-material';
import { complaintService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const DISTRICTS = [
  'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

const INITIAL_VISITS = [
  { id: 'v-1', district: 'North Delhi', visit_date: '2026-06-25', purpose: 'Surprise inspection of model school and public health dispensary', notes: 'Check sewage overflow complaints registered near Model Town.', complaint_count: 3 },
  { id: 'v-2', district: 'West Delhi', visit_date: '2026-06-12', purpose: 'Review meeting of Dwarka water line project', notes: 'Discuss pipeline burst issues with DJB local body representatives.', complaint_count: 5 }
];

const MOCK_VISITS_KEY = 'delhi_cm_visits';

export default function VisitLogs() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [visits, setVisits] = useState([]);
  const [complaints, setComplaints] = useState([]);
  
  // Form State
  const [district, setDistrict] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const allComps = await complaintService.getComplaints();
      setComplaints(allComps);

      let stored = localStorage.getItem(MOCK_VISITS_KEY);
      if (!stored) {
        localStorage.setItem(MOCK_VISITS_KEY, JSON.stringify(INITIAL_VISITS));
        stored = JSON.stringify(INITIAL_VISITS);
      }
      const visitsList = JSON.parse(stored);

      // Recalculate complaint count dynamically
      const updatedVisits = visitsList.map(v => {
        const count = allComps.filter(c => c.district === v.district && c.status !== 'resolved').length;
        return { ...v, complaint_count: count };
      });

      setVisits(updatedVisits.sort((a,b) => new Date(a.visit_date) - new Date(b.visit_date)));
    } catch (err) {
      showNotification('Error loading visits data.', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVisit = (e) => {
    e.preventDefault();
    try {
      const activeCount = complaints.filter(c => c.district === district && c.status !== 'resolved').length;
      
      const newVisit = {
        id: 'v-' + Date.now(),
        district,
        visit_date: visitDate,
        purpose,
        notes,
        complaint_count: activeCount
      };

      const updated = [...visits, newVisit];
      localStorage.setItem(MOCK_VISITS_KEY, JSON.stringify(updated));
      setVisits(updated.sort((a,b) => new Date(a.visit_date) - new Date(b.visit_date)));
      
      showNotification(`District visit to ${district} scheduled!`, 'success');
      
      // Reset Form
      setDistrict('');
      setVisitDate('');
      setPurpose('');
      setNotes('');
    } catch (err) {
      showNotification('Failed to schedule CM visit.', 'error');
    }
  };

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
          CM District Tour & Visit Planner
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Schedule official tours and cross-reference unresolved local grievances in inspection areas.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side: Schedule Form (Admins / CM only) */}
        {['admin', 'cm'].includes(user?.role || '') && (
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
                Schedule Inspection Visit
              </Typography>
              <Box component="form" onSubmit={handleAddVisit}>
                <FormControl fullWidth required sx={{ mb: 2 }}>
                  <InputLabel>Delhi District</InputLabel>
                  <Select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    label="Delhi District"
                  >
                    {DISTRICTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Visit Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Purpose of Visit"
                  multiline
                  rows={2}
                  fullWidth
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Inspect water plant operations..."
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Briefing Notes"
                  multiline
                  rows={2}
                  fullWidth
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional inspection checkpoints..."
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  sx={{ backgroundColor: '#0A2540', fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
                >
                  Schedule Tour
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Right Side: Log Directory */}
        <Grid item xs={12} md={['admin', 'cm'].includes(user?.role || '') ? 8 : 12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
              Scheduled Tour Itinerary
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>District</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>Purpose & Notes</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0A2540' }}>Local Grievances</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#64748B' }}>
                        No upcoming tours scheduled at this time.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visits.map((visit) => (
                      <TableRow key={visit.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: '#0A2540' }}>{visit.district}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                          {new Date(visit.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 12, color: '#1E293B' }}>
                            {visit.purpose}
                          </Typography>
                          {visit.notes && (
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                              Notes: {visit.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${visit.complaint_count} Active`}
                            color={visit.complaint_count > 4 ? 'error' : visit.complaint_count > 0 ? 'warning' : 'success'}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: 10, height: 20 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {visits.some(v => v.complaint_count > 3) && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '8px', display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Warning sx={{ color: '#D97706' }} />
                <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 600 }}>
                  WARNING: Certain scheduled tour districts have high concentrations of open grievances. Briefing notes have been dispatched to engineers.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
