import React, { useState } from 'react';
import { 
  Box, Container, Typography, Tab, Tabs, Paper, TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem, Card, CardContent, Divider, Rating, Alert, Stack 
} from '@mui/material';
import { 
  Send as SendIcon, 
  Search as SearchIcon, 
  CheckCircle as SuccessIcon, 
  Timeline as TimelineIcon 
} from '@mui/icons-material';
import { complaintService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import StatusBadge from '../components/common/StatusBadge';
import SocialShare from '../components/common/SocialShare';

const DISTRICTS = [
  'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

const CATEGORIES = [
  'Roads / Potholes',
  'Water Leakage / Shortage',
  'Garbage / Waste Pile',
  'Streetlight / Power Outage',
  'Public Nuisance / Safety'
];

export default function TrackComplaint() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [tabValue, setTabValue] = useState(0);

  // Intake state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [district, setDistrict] = useState('');
  const [photoBefore, setPhotoBefore] = useState('');
  const [lat, setLat] = useState('28.6139');
  const [lng, setLng] = useState('77.2090');
  const [submittedId, setSubmittedId] = useState(null);

  // Tracking State
  const [trackNo, setTrackNo] = useState('');
  const [trackedComp, setTrackedComp] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Feedback State
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSubmittedId(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        description,
        category,
        district,
        photo_before: photoBefore,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      };

      const result = await complaintService.createComplaint(payload, user);
      setSubmittedId(result.tracking_no);
      showNotification(`Grievance submitted successfully! Tracking No: ${result.tracking_no}`, 'success');
      loadMyComplaints();
      
      // Reset form fields
      setTitle('');
      setDescription('');
      setCategory('');
      setDistrict('');
      setPhotoBefore('');
    } catch (err) {
      showNotification('Error creating complaint. Please verify your fields.', 'error');
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    try {
      const result = await complaintService.trackComplaintByNo(trackNo);
      setTrackedComp(result);
      setFeedbackSubmitted(false);
      if (result) {
        showNotification('Grievance details loaded.', 'info');
      } else {
        showNotification('No matching tracking number found.', 'warning');
      }
    } catch (err) {
      showNotification('Error tracking grievance.', 'error');
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!trackedComp) return;
    try {
      await complaintService.submitFeedback(trackedComp.id, { rating, comments });
      setFeedbackSubmitted(true);
      showNotification('Thank you! Your feedback has been registered.', 'success');
      
      // Reload tracked complaint to see reopened status if rating < 3
      const updated = await complaintService.trackComplaintByNo(trackedComp.tracking_no);
      setTrackedComp(updated);
      loadMyComplaints();
    } catch (err) {
      showNotification('Failed to submit feedback.', 'error');
    }
  };

  const [myComplaints, setMyComplaints] = useState([]);

  const loadMyComplaints = async () => {
    if (!user) return;
    try {
      const all = await complaintService.getComplaints();
      const filtered = all.filter(c => c.citizen_id === user.id || c.citizen_name === user.full_name);
      setMyComplaints(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (user && user.role === 'citizen') {
      loadMyComplaints();
    }
  }, [user]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }} className="fade-in">
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
          Citizen Redressal Desk
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
          File a new civic issue or track the resolution lifecycle of a previously filed complaint.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', mb: 4, borderRadius: '14px', overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          centered
          sx={{
            backgroundColor: '#0A2540',
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontFamily: 'Inter' },
            '& .Mui-selected': { color: '#fff !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#FF9933', height: 3 }
          }}
        >
          <Tab label="Submit New Grievance" />
          <Tab label="Track Status & Feedback" />
          {user && user.role === 'citizen' && <Tab label="My Filed Grievances" />}
        </Tabs>

        <Box sx={{ p: 4 }}>
          {/* TAB 0: Intake Form */}
          {tabValue === 0 && (
            <Box>
              {submittedId ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SuccessIcon sx={{ fontSize: 60, color: '#138808', mb: 2 }} />
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#0A2540', mb: 1 }}>
                    Grievance Registered Successfully
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#475569', mb: 3 }}>
                    Your tracking reference ID is: <b style={{ color: '#FF9933', fontSize: 20 }}>{submittedId}</b>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                    The issue has been auto-routed to the department engineer with the lowest active workload count. Copy this ID to track live updates.
                  </Typography>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button 
                      variant="contained" 
                      onClick={() => setSubmittedId(null)}
                      sx={{ textTransform: 'none', backgroundColor: '#0A2540' }}
                    >
                      File Another Grievance
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        setTrackNo(submittedId);
                        setTabValue(1);
                        setTimeout(() => {
                          const fakeEvent = { preventDefault: () => {} };
                          handleTrack(fakeEvent);
                        }, 50);
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      Track Progress
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleCreate}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        label="Grievance Title / Short Summary"
                        fullWidth
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Broken water pipe leaking on Main Marg"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        label="Detailed Description"
                        multiline
                        rows={4}
                        fullWidth
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide exact landmark details, when it occurred, and specific requests..."
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Category / Service Area</InputLabel>
                        <Select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          label="Category / Service Area"
                        >
                          {CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Delhi District Location</InputLabel>
                        <Select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          label="Delhi District Location"
                        >
                          {DISTRICTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="GPS Latitude"
                        fullWidth
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="GPS Longitude"
                        fullWidth
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Upload Photo URL (Proof of Issue)"
                        fullWidth
                        value={photoBefore}
                        onChange={(e) => setPhotoBefore(e.target.value)}
                        placeholder="Enter image URL showing the damaged pothole/leak..."
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        startIcon={<SendIcon />}
                        sx={{
                          py: 1.5,
                          backgroundColor: '#0A2540',
                          fontWeight: 700,
                          fontSize: 16,
                          borderRadius: '10px',
                          textTransform: 'none',
                          '&:hover': { backgroundColor: '#1E40AF' }
                        }}
                      >
                        Submit Grievance
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}

          {/* TAB 1: Tracking / Feedback */}
          {tabValue === 1 && (
            <Box>
              <Box component="form" onSubmit={handleTrack} sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <TextField
                  label="Enter Tracking Reference (e.g. DL-2026-8921)"
                  variant="outlined"
                  fullWidth
                  required
                  value={trackNo}
                  onChange={(e) => setTrackNo(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  startIcon={<SearchIcon />}
                  sx={{ backgroundColor: '#0A2540', textTransform: 'none', px: 4 }}
                >
                  Search
                </Button>
              </Box>

              {hasSearched && !trackedComp && (
                <Alert severity="error">No record found matching the reference number provided.</Alert>
              )}

              {trackedComp && (
                <Box className="fade-in">
                  {/* Status Banner */}
                  <Card variant="outlined" sx={{ mb: 4, borderRadius: '10px', borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <CardContent>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                            GRIEVANCE ID: {trackedComp.tracking_no}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0A2540' }}>
                            {trackedComp.title}
                          </Typography>
                        </Box>
                        <Box sx={{ alignSelf: { xs: 'start', sm: 'center' } }}>
                          <StatusBadge status={trackedComp.status} />
                        </Box>
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>DEPARTMENT</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{trackedComp.department_name}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>DISTRICT</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{trackedComp.district}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>REPORTED DATE</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {new Date(trackedComp.created_at).toLocaleDateString('en-IN')}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>SEVERITY</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#B91C1C' }}>
                            {trackedComp.severity.toUpperCase()}
                          </Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />
                      
                      {/* Social sharing links */}
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>SHARE PUBLIC LINK:</Typography>
                        <SocialShare trackingNo={trackedComp.tracking_no} title={trackedComp.title} status={trackedComp.status} />
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Audit Logs / Timeline */}
                  <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon /> Progress Logs
                  </Typography>

                  <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: '10px' }}>
                    <Grid container spacing={3}>
                      {trackedComp.timeline?.map((entry) => (
                        <Grid item xs={12} key={entry.id}>
                          <Box sx={{ pl: 2, borderLeft: '4px solid #0A2540' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {entry.description}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              Logged: {new Date(entry.created_at).toLocaleString('en-IN')} | By: {entry.action_by_name}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>

                  {/* Feedback Form (Visible if status = resolved) */}
                  {trackedComp.status === 'resolved' && !feedbackSubmitted && (
                    <Paper elevation={3} sx={{ p: 4, borderRadius: '12px', border: '1px solid #A7F3D0', backgroundColor: '#F0FDF4' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#065F46', mb: 1 }}>
                        Rate Your Grievance Resolution
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#047857', mb: 3 }}>
                        Please evaluate the engineer\'s performance. Ratings under 3 stars auto-reopen this grievance.
                      </Typography>

                      <Box component="form" onSubmit={handleFeedback}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: '#065F46' }}>Rating:</Typography>
                          <Rating 
                            name="resolution-rating" 
                            value={rating} 
                            onChange={(event, newValue) => setRating(newValue || 5)} 
                          />
                        </Box>
                        <TextField
                          label="Your Comments / Issues"
                          multiline
                          rows={2}
                          fullWidth
                          required={rating < 3}
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Provide details about why this was not fixed fully (required for ratings < 3)..."
                          sx={{ mb: 2, backgroundColor: '#fff' }}
                        />
                        <Button 
                          type="submit" 
                          variant="contained" 
                          color="success"
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Submit Review
                        </Button>
                      </Box>
                    </Paper>
                  )}

                  {feedbackSubmitted && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Feedback logged. Thank you for verifying resolution standards in the state.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* TAB 2: My Filed Grievances */}
          {tabValue === 2 && user && user.role === 'citizen' && (
            <Box>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
                My Registered Grievance History
              </Typography>
              {myComplaints.length === 0 ? (
                <Alert severity="info">You have not submitted any grievances yet.</Alert>
              ) : (
                <Grid container spacing={2}>
                  {myComplaints.map((c) => (
                    <Grid item xs={12} key={c.id}>
                      <Card variant="outlined" sx={{ borderRadius: '10px', '&:hover': { borderColor: '#FF9933', boxShadow: 1 } }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540' }}>
                              ID: {c.tracking_no} | {c.title}
                            </Typography>
                            <StatusBadge status={c.status} />
                          </Stack>
                          <Typography variant="body2" sx={{ color: '#64748B', mb: 1.5, fontSize: 13 }}>
                            {c.description.length > 120 ? c.description.substring(0, 117) + '...' : c.description}
                          </Typography>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              District: <b>{c.district}</b> | Category: <b>{c.category}</b>
                            </Typography>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => {
                                setTrackNo(c.tracking_no);
                                setTabValue(1);
                                setTimeout(() => {
                                  const fakeEvent = { preventDefault: () => {} };
                                  handleTrack(fakeEvent);
                                }, 50);
                              }}
                              sx={{ textTransform: 'none', py: 0.2, fontSize: 11 }}
                            >
                              Track & Review
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
