import React, { useState } from 'react';
import { 
  Box, Typography, Grid, Paper, TextField, Button, Chip, Stack, Card, CardContent, 
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, 
  Select, MenuItem, Stepper, Step, StepLabel, Divider, Tooltip, Zoom
} from '@mui/material';
import { 
  Search as SearchIcon, 
  LocalDrink, 
  ElectricalServices, 
  AddRoad, 
  DeleteSweep, 
  HealthAndSafety, 
  DirectionsBus, 
  School, 
  LightMode, 
  Payment, 
  Assignment, 
  HeadsetMic, 
  CheckCircle, 
  Warning, 
  AccessTime, 
  Announcement, 
  Launch, 
  LocationOn,
  TrendingUp,
  PrivacyTip,
  FlashOn,
  ThumbUp
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { complaintService } from '../services/complaintService';
import { useNavigate } from 'react-router-dom';

const EXPLORE_SERVICES = [
  { label: 'Roads & Potholes', icon: <AddRoad />, category: 'Roads / Potholes', color: '#B91C1C' },
  { label: 'Water & Sewage', icon: <LocalDrink />, category: 'Water Leakage / Shortage', color: '#1D4ED8' },
  { label: 'Garbage Disposal', icon: <DeleteSweep />, category: 'Garbage / Waste Pile', color: '#047857' },
  { label: 'Power & Streetlights', icon: <ElectricalServices />, category: 'Streetlight / Power Outage', color: '#D97706' },
  { label: 'Public Safety', icon: <HealthAndSafety />, category: 'Public Nuisance / Safety', color: '#6B21A8' },
  { label: 'Public Health', icon: <HealthAndSafety />, category: 'Other', color: '#059669' },
  { label: 'Schools & Edu', icon: <School />, category: 'Other', color: '#B45309' },
  { label: 'Transport / Bus', icon: <DirectionsBus />, category: 'Other', color: '#0369A1' },
];

const DELHI_DISTRICTS = [
  'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

export default function Landing() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Search Hero State
  const [searchQuery, setSearchQuery] = useState('');

  // Lodge Grievance Dialog State
  const [lodgeOpen, setLodgeOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    category: 'Roads / Potholes',
    severity: 'medium',
    district: 'New Delhi',
    latitude: '28.6139',
    longitude: '77.2090',
  });
  const [submitting, setSubmitting] = useState(false);

  // Tracking State
  const [trackNumber, setTrackNumber] = useState('');
  const [trackedData, setTrackedData] = useState(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // E-payments Dialog State
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [billType, setBillType] = useState('Water');
  const [consumerNo, setConsumerNo] = useState('');
  const [fetchedBill, setFetchedBill] = useState(null);
  const [paying, setPaying] = useState(false);

  // Quick chips search trigger
  const handleChipClick = (label, category) => {
    setSearchQuery(label);
    openLodgeForm(category);
  };

  const openLodgeForm = (categoryVal) => {
    setComplaintForm(prev => ({
      ...prev,
      category: categoryVal || 'Roads / Potholes'
    }));
    setLodgeOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setComplaintForm(prev => ({ ...prev, [name]: value }));
  };

  const submitGrievance = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await complaintService.createComplaint(complaintForm, user);
      if (res && res.tracking_no) {
        showNotification(`Grievance submitted successfully! Tracking Number: ${res.tracking_no}`, 'success');
        setLodgeOpen(false);
        // Reset form
        setComplaintForm({
          title: '',
          description: '',
          category: 'Roads / Potholes',
          severity: 'medium',
          district: 'New Delhi',
          latitude: '28.6139',
          longitude: '77.2090',
        });
        // Automatically open tracker for their new complaint
        setTrackNumber(res.tracking_no);
        handleTrack(res.tracking_no);
      } else {
        showNotification('Failed to generate tracking number.', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Error submitting grievance.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackNumber) {
      showNotification('Please enter a tracking number', 'warning');
      return;
    }
    handleTrack(trackNumber);
  };

  const handleTrack = async (num) => {
    setTrackingLoading(true);
    setTrackedData(null);
    try {
      const res = await complaintService.trackComplaintByNo(num);
      if (res) {
        setTrackedData(res);
        setTrackingOpen(true);
      } else {
        showNotification('No grievance found with this tracking number.', 'error');
      }
    } catch (err) {
      showNotification('Failed to load tracking status.', 'error');
    } finally {
      setTrackingLoading(false);
    }
  };

  // e-Payments Mock
  const fetchMockBill = (e) => {
    e.preventDefault();
    if (!consumerNo) {
      showNotification('Please input a Consumer Number', 'warning');
      return;
    }
    setFetchedBill({
      consumerNo,
      name: user ? user.full_name : 'Valued Consumer',
      billCycle: 'June 2026',
      amount: (Math.random() * 2000 + 400).toFixed(2),
      dueDate: '2026-07-10'
    });
  };

  const executeMockPayment = () => {
    setPaying(true);
    setTimeout(() => {
      showNotification(`Payment of ₹${fetchedBill.amount} completed successfully for ${billType} Consumer #${consumerNo}!`, 'success');
      setPaying(false);
      setPaymentOpen(false);
      setConsumerNo('');
      setFetchedBill(null);
    }, 1500);
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'submitted': return 0;
      case 'assigned': return 1;
      case 'in_progress': return 2;
      case 'resolved': return 3;
      default: return 0;
    }
  };

  return (
    <Box className="fade-in" sx={{ px: { xs: 0.5, md: 1 } }}>
      {/* 1. Hero Search Card */}
      <Paper 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          mb: 4, 
          borderRadius: 4,
          background: (theme) => theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #09172B 0%, #112A4F 100%)'
            : 'linear-gradient(135deg, #0A2540 0%, #1A3E66 100%)',
          color: '#fff',
          boxShadow: 4,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'absolute', right: -50, bottom: -50, opacity: 0.05 }}>
          <SearchIcon sx={{ fontSize: 240 }} />
        </Box>
        
        <Typography 
          variant="h3" 
          component="h1"
          sx={{ 
            fontFamily: '"Outfit", sans-serif', 
            fontWeight: 800, 
            mb: 1.5,
            fontSize: { xs: '1.8rem', md: '2.8rem' }
          }}
        >
          Hello, Delhi!
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            opacity: 0.9, 
            mb: 3, 
            fontWeight: 500,
            fontSize: { xs: '0.95rem', md: '1.25rem' }
          }}
        >
          How can we serve you today? Report issues, pay bills, and track services instantly.
        </Typography>

        {/* Search Input */}
        <Box 
          component="form" 
          onSubmit={(e) => { e.preventDefault(); openLodgeForm(); }}
          sx={{ 
            maxWidth: 650, 
            mx: 'auto', 
            mb: 3.5, 
            display: 'flex', 
            gap: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            p: 0.8,
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <TextField 
            fullWidth 
            variant="standard" 
            placeholder="Type your issue (e.g., sewage leakage, road damage)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ 
              disableUnderline: true,
              style: { color: '#fff', paddingLeft: 12, fontSize: 15 } 
            }}
          />
          <Button 
            type="submit"
            variant="contained" 
            color="secondary" 
            sx={{ fontWeight: 700, px: 3, borderRadius: 2 }}
          >
            Report
          </Button>
        </Box>

        <Stack 
          direction="row" 
          flexWrap="wrap" 
          justifyContent="center" 
          gap={1.2}
        >
          <Typography variant="body2" sx={{ alignSelf: 'center', opacity: 0.8, mr: 1, fontSize: 13 }}>
            Popular Services:
          </Typography>
          <Chip 
            label="Pothole Damage" 
            onClick={() => handleChipClick('Pothole Damage', 'Roads / Potholes')}
            sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }, cursor: 'pointer' }}
          />
          <WaterLeakChip handleChipClick={handleChipClick} />
          <WasteChip handleChipClick={handleChipClick} />
          <LightChip handleChipClick={handleChipClick} />
        </Stack>
      </Paper>

      {/* Main Grid: Split Services explorer & Widgets */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Left Column: Services & Widgets */}
        <Grid item xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* Explore Services Grid */}
          <Box id="services">
            <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" /> Explore Services
            </Typography>
            <Grid container spacing={2}>
              {EXPLORE_SERVICES.map((serv, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <Card 
                    className="hover-lift"
                    onClick={() => openLodgeForm(serv.category)}
                    sx={{ 
                      textAlign: 'center', 
                      cursor: 'pointer', 
                      p: 1.5,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: `${serv.color}15`,
                        color: serv.color,
                        mb: 1.5
                      }}
                    >
                      {serv.icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                      {serv.label}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Action Widgets Grid */}
          <Grid container spacing={3}>
            {/* Widget 1: Track Application */}
            <Grid item xs={12} sm={6} id="track-widget">
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, color: '#138808' }}>
                  <SearchIcon />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Track Status</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Track standard civic application approvals or search files status.
                </Typography>
                <Box component="form" onSubmit={handleTrackSubmit} sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                  <TextField 
                    size="small" 
                    fullWidth 
                    variant="outlined" 
                    placeholder="Enter Tracking No. (e.g., DL-123)"
                    value={trackNumber}
                    onChange={(e) => setTrackNumber(e.target.value)}
                  />
                  <Button 
                    type="submit"
                    variant="contained" 
                    color="primary"
                    disabled={trackingLoading}
                  >
                    Track
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Widget 2: Lodge Grievance */}
            <Grid item xs={12} sm={6} id="grievance-widget">
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, color: '#FF9933' }}>
                  <Assignment />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Grievance Redressal</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Lodge complaints directly with the Delhi Chief Minister's Cell.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    fullWidth 
                    onClick={() => openLodgeForm('Roads / Potholes')}
                    sx={{ color: '#fff' }}
                  >
                    Lodge Grievance
                  </Button>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    onClick={() => navigate('/track')}
                  >
                    Dashboard View
                  </Button>
                </Stack>
              </Paper>
            </Grid>

            {/* Widget 3: e-Payments */}
            <Grid item xs={12} sm={6} id="payments-widget">
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, color: '#138808' }}>
                  <Payment />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>e-Payments</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Pay Delhi Jal Board water bills, DISCOM power bills, or municipal taxes.
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => setPaymentOpen(true)}
                  sx={{ mt: 'auto' }}
                >
                  Pay Bills Online
                </Button>
              </Paper>
            </Grid>

            {/* Widget 4: Need Help (NO AI) */}
            <Grid item xs={12} sm={6} id="help-widget">
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, color: '#0A2540' }}>
                  <HeadsetMic />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Need Help?</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Get assistance via direct citizens channels. Reach us anytime:
                </Typography>
                <Box sx={{ mt: 'auto' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    CM Helpline: <span style={{ color: '#FF9933' }}>1031</span> (24x7)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Call toll-free for grievances registration and file track updates.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Column: Schemes, News and Monument Badge */}
        <Grid item xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* What's New Panel */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Announcement color="secondary" /> What's New
            </Typography>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: 'primary.main', fontSize: 13 }}>
                  • CM Pothole-Free Delhi Mission
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                  PWD ordered to complete inspections of major roads before monsoon starts.
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: 'primary.main', fontSize: 13 }}>
                  • 24x7 Water Supply in East Delhi
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                  DJB commissions water reservoir in Preet Vihar, benefiting 2 lakh citizens.
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 750, color: 'primary.main', fontSize: 13 }}>
                  • Clean Delhi Green Delhi Drive
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                  Register complaints on waste dumping in public spaces for 12-hour resolution.
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Quick Actions Illustration Card */}
          <Paper 
            sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, rgba(19, 136, 8, 0.08) 0%, rgba(255, 153, 51, 0.08) 100%)',
              border: '1px solid rgba(19,136,8,0.12)',
              borderRadius: 3
            }}
          >
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 12 }}>
              Access direct forms for municipal works, building approvals, and certificates.
            </Typography>
            {/* Custom SVG Outline of India Gate */}
            <Box 
              sx={{ 
                height: 120, 
                backgroundColor: 'rgba(255,255,255,0.4)', 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 2,
                border: '1px dashed rgba(0,0,0,0.1)'
              }}
            >
              <svg width="60" height="90" viewBox="0 0 60 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="80" width="50" height="10" rx="1" fill="#FF9933" />
                <rect x="10" y="30" width="40" height="50" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
                <path d="M20 80V50C20 44.4772 24.4772 40 30 40C35.5228 40 40 44.4772 40 50V80H20Z" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
                <rect x="8" y="20" width="44" height="10" fill="#E2E8F0" stroke="#64748B" strokeWidth="2" />
                <circle cx="30" cy="15" r="5" fill="#138808" />
              </svg>
            </Box>
            <Button variant="contained" fullWidth color="primary" sx={{ fontSize: 12 }} endIcon={<Launch sx={{ fontSize: 14 }} />}>
              Service Portal
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* 4. Bottom Quality Badges */}
      <Paper 
        sx={{ 
          p: 2.5, 
          borderRadius: 3, 
          border: '1px solid',
          borderColor: 'divider',
          mb: 4
        }}
      >
        <Grid container spacing={3} justifyContent="center" alignItems="center" textAlign="center">
          <Grid item xs={6} md={3}>
            <Tooltip title="AES-256 standard database and verification" TransitionComponent={Zoom}>
              <Box sx={{ p: 1 }}>
                <PrivacyTip color="primary" sx={{ fontSize: 28, mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Secure & Reliable</Typography>
                <Typography variant="caption" color="text.secondary">Encrypted database</Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={6} md={3}>
            <Tooltip title="Avg. response time under 24 hours" TransitionComponent={Zoom}>
              <Box sx={{ p: 1 }}>
                <FlashOn color="secondary" sx={{ fontSize: 28, mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Quick & Easy</Typography>
                <Typography variant="caption" color="text.secondary">Automated routing</Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={6} md={3}>
            <Tooltip title="Complete step-by-step logs and review records" TransitionComponent={Zoom}>
              <Box sx={{ p: 1 }}>
                <CheckCircle color="success" sx={{ fontSize: 28, mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>100% Transparent</Typography>
                <Typography variant="caption" color="text.secondary">Live tracking feeds</Typography>
              </Box>
            </Tooltip>
          </Grid>
          <Grid item xs={6} md={3}>
            <Tooltip title="Citizen feedback directly affects PWD ratings" TransitionComponent={Zoom}>
              <Box sx={{ p: 1 }}>
                <ThumbUp sx={{ color: '#6B21A8', fontSize: 28, mb: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Citizen First</Typography>
                <Typography variant="caption" color="text.secondary">Verification system</Typography>
              </Box>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Lodge Grievance Intake Form Modal */}
      <Dialog open={lodgeOpen} onClose={() => setLodgeOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: '#fff', fontWeight: 700 }}>
          Lodge New Grievance
        </DialogTitle>
        <Box component="form" onSubmit={submitGrievance}>
          <DialogContent sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <TextField 
                required
                fullWidth
                label="Grievance Title / Headline"
                name="title"
                placeholder="Briefly state the issue (e.g., Water leakage in sector 3)"
                value={complaintForm.title}
                onChange={handleFormChange}
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={complaintForm.category}
                      label="Category"
                      onChange={handleFormChange}
                    >
                      <MenuItem value="Roads / Potholes">Roads / Potholes</MenuItem>
                      <MenuItem value="Water Leakage / Shortage">Water / DJB</MenuItem>
                      <MenuItem value="Garbage / Waste Pile">Garbage Disposal / MCD</MenuItem>
                      <MenuItem value="Streetlight / Power Outage">Power / Streetlight</MenuItem>
                      <MenuItem value="Public Nuisance / Safety">Public Safety</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>District (Delhi)</InputLabel>
                    <Select
                      name="district"
                      value={complaintForm.district}
                      label="District (Delhi)"
                      onChange={handleFormChange}
                    >
                      {DELHI_DISTRICTS.map(d => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority / Severity</InputLabel>
                    <Select
                      name="severity"
                      value={complaintForm.severity}
                      label="Priority / Severity"
                      onChange={handleFormChange}
                    >
                      <MenuItem value="low">Low Priority</MenuItem>
                      <MenuItem value="medium">Medium Priority</MenuItem>
                      <MenuItem value="high">High Priority</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth
                    label="Geo Latitude"
                    name="latitude"
                    value={complaintForm.latitude}
                    onChange={handleFormChange}
                  />
                </Grid>
              </Grid>

              <TextField 
                required
                fullWidth
                multiline
                rows={4}
                label="Detailed Description"
                name="description"
                placeholder="Describe the complaint in detail, including specific landmarks or reference details..."
                value={complaintForm.description}
                onChange={handleFormChange}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setLodgeOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="secondary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'File Grievance'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Tracking / Status Timeline Modal */}
      <Dialog open={trackingOpen} onClose={() => setTrackingOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: '#fff', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          <span>Grievance Tracker</span>
          <Chip label={trackedData?.tracking_no} color="secondary" sx={{ fontWeight: 700, color: '#fff' }} />
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          {trackedData && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Grievance Details</Typography>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Title</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{trackedData.title}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Description</Typography>
                    <Typography variant="body2">{trackedData.description}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Department & Category</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {trackedData.department_name} ({trackedData.category})
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">District</Typography>
                    <Typography variant="body2">{trackedData.district}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Assigned Officer</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {trackedData.assigned_officer_name || 'Pending assignment'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={7}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Progress Timeline</Typography>
                <Stepper activeStep={getStepIndex(trackedData.status)} orientation="vertical">
                  <Step>
                    <StepLabel 
                      optional={<Typography variant="caption">Filed on {new Date(trackedData.created_at).toLocaleDateString()}</Typography>}
                    >
                      Complaint Submitted
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel 
                      optional={
                        trackedData.status !== 'submitted' ? (
                          <Typography variant="caption">Auto-routed to {trackedData.department_code}</Typography>
                        ) : null
                      }
                    >
                      Officer Assigned
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel 
                      optional={
                        ['in_progress', 'resolved'].includes(trackedData.status) ? (
                          <Typography variant="caption">Investigation in progress</Typography>
                        ) : null
                      }
                    >
                      Work Commenced
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel 
                      optional={
                        trackedData.status === 'resolved' ? (
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="success.main" sx={{ display: 'block', fontWeight: 600 }}>
                              Resolved
                            </Typography>
                            {trackedData.resolution_notes && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                                "{trackedData.resolution_notes}"
                              </Typography>
                            )}
                          </Box>
                        ) : null
                      }
                    >
                      Grievance Resolved
                    </StepLabel>
                  </Step>
                </Stepper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setTrackingOpen(false)} variant="contained" color="primary">
            Close Tracker
          </Button>
        </DialogActions>
      </Dialog>

      {/* e-Payments Modal */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: '#fff', fontWeight: 700 }}>
          Delhi Digital e-Payments Desk
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3} sx={{ mt: 1.5 }}>
            <FormControl fullWidth>
              <InputLabel>Select Service</InputLabel>
              <Select
                value={billType}
                label="Select Service"
                onChange={(e) => { setBillType(e.target.value); setFetchedBill(null); }}
              >
                <MenuItem value="Water">Delhi Jal Board (DJB) - Water Bill</MenuItem>
                <MenuItem value="Power">BSES / NDPL - Power Bill</MenuItem>
                <MenuItem value="Property Tax">MCD Property Tax</MenuItem>
              </Select>
            </FormControl>

            <Box component="form" onSubmit={fetchMockBill} sx={{ display: 'flex', gap: 1 }}>
              <TextField 
                required
                fullWidth
                label={`${billType} Consumer Number`}
                placeholder="Enter Consumer ID / K-Number"
                value={consumerNo}
                onChange={(e) => setConsumerNo(e.target.value)}
              />
              <Button type="submit" variant="contained" color="primary">Search</Button>
            </Box>

            {fetchedBill && (
              <Paper variant="outlined" sx={{ p: 2, background: 'rgba(19, 136, 8, 0.02)', borderColor: 'success.light' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'success.main' }}>
                  Bill Details Found
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Consumer Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{fetchedBill.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Bill Cycle</Typography>
                    <Typography variant="body2">{fetchedBill.billCycle}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Due Date</Typography>
                    <Typography variant="body2">{fetchedBill.dueDate}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Outstanding Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#B91C1C' }}>
                      ₹ {fetchedBill.amount}
                    </Typography>
                  </Grid>
                </Grid>
                <Button 
                  variant="contained" 
                  color="success" 
                  fullWidth 
                  onClick={executeMockPayment}
                  disabled={paying}
                  sx={{ mt: 2, color: '#fff', fontWeight: 700 }}
                >
                  {paying ? 'Authorizing Payment...' : `Pay ₹${fetchedBill.amount} Now`}
                </Button>
              </Paper>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setPaymentOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function WaterLeakChip({ handleChipClick }) {
  return (
    <Chip 
      label="Water Leakage" 
      onClick={() => handleChipClick('Water Leakage', 'Water Leakage / Shortage')}
      sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }, cursor: 'pointer' }}
    />
  );
}

function WasteChip({ handleChipClick }) {
  return (
    <Chip 
      label="Waste Dumping" 
      onClick={() => handleChipClick('Waste Dumping', 'Garbage / Waste Pile')}
      sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }, cursor: 'pointer' }}
    />
  );
}

function LightChip({ handleChipClick }) {
  return (
    <Chip 
      label="Broken Streetlight" 
      onClick={() => handleChipClick('Broken Streetlight', 'Streetlight / Power Outage')}
      sx={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' }, cursor: 'pointer' }}
    />
  );
}
