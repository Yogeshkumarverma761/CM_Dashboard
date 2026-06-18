import React, { useState } from 'react';
import { 
  Container, Paper, Box, Typography, TextField, Button, Grid, Divider, Card, CardActionArea, MenuItem, FormControl, InputLabel, Select, Stack, Chip 
} from '@mui/material';
import { 
  Security as SecurityIcon, 
  Dashboard as DashboardIcon, 
  AssignmentInd as AssignmentIndIcon, 
  Person as PersonIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

const DISTRICTS = [
  'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

const DEPARTMENTS = [
  { code: 'PWD', name: 'Public Works Department (PWD)' },
  { code: 'DJB', name: 'Delhi Jal Board (DJB)' },
  { code: 'MCD', name: 'MCD Garbage & Sanitation' },
  { code: 'DISCOM', name: 'Power & Electricity (DISCOMs)' },
  { code: 'POLICE', name: 'Delhi Police & Security' }
];

export default function Login() {
  const { login, register, isMock } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('New Delhi');
  const [role, setRole] = useState('citizen');
  const [departmentCode, setDepartmentCode] = useState('');

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegisterMode) {
        // Validation for Officer department
        if (role === 'officer' && !departmentCode) {
          showNotification('Please select a department for the Officer role.', 'warning');
          setLoading(false);
          return;
        }

        const payload = {
          email,
          password,
          fullName,
          role,
          phone,
          district,
          departmentCode: role === 'officer' ? departmentCode : null
        };
        const res = await register(payload);
        if (res.success && res.user) {
          showNotification('Account created successfully!', 'success');
          redirectUserByRole(res.user.role);
        }
      } else {
        const res = await login(email, password);
        if (res.success && res.user) {
          showNotification('Successfully logged in!', 'success');
          redirectUserByRole(res.user.role);
        }
      }
    } catch (err) {
      showNotification(err.message || 'Authentication failed. Please verify your entries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const redirectUserByRole = (userRole) => {
    if (userRole === 'citizen') {
      navigate('/track');
    } else if (userRole === 'officer') {
      navigate('/complaints');
    } else {
      navigate('/dashboard');
    }
  };

  const handleQuickLogin = async (profile) => {
    setLoading(true);
    try {
      await login(profile.email, 'password', profile.role);
      showNotification(`Logged in as ${profile.full_name}`, 'success');
      redirectUserByRole(profile.role);
    } catch (err) {
      showNotification('Quick login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickProfiles = [
    { name: 'Chief Minister', role: 'cm', email: 'cm@delhi.gov.in', icon: <DashboardIcon sx={{ color: '#FF9933' }} />, desc: 'CM cell oversight view' },
    { name: 'State Administrator', role: 'admin', email: 'admin@delhi.gov.in', icon: <SecurityIcon sx={{ color: '#138808' }} />, desc: 'System control & reassignments' },
    { name: 'PWD Executive Officer', role: 'officer', email: 'pwd.officer@delhi.gov.in', icon: <AssignmentIndIcon sx={{ color: '#007FFF' }} />, desc: 'Resolve potholes, before/after check' },
    { name: 'Citizen Portal', role: 'citizen', email: 'priya@gmail.com', icon: <PersonIcon sx={{ color: '#64748B' }} />, desc: 'Register grievances & submit ratings' }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      py: 6,
      background: 'linear-gradient(135deg, #0A2540 0%, #1E293B 40%, #0F172A 100%)',
      px: 2
    }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left Side Branding */}
          <Grid item xs={12} md={5}>
            <Box sx={{ pr: { md: 4 }, color: '#fff' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  width: 54, 
                  height: 54, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #FF9933 30%, #FFFFFF 50%, #138808 70%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 16px rgba(255, 153, 51, 0.4)',
                  border: '3px solid #0A2540'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0A2540' }}>DL</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, letterSpacing: 0.5 }}>
                    DELHI GOVERNMENT
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#FF9933', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontSize: 10 }}>
                    CM Grievance Redressal Desk
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h3" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, mb: 2, fontSize: { xs: '2rem', md: '2.5rem' }, lineHeight: 1.2 }}>
                Public Grievance Resolution Portal
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4, lineHeight: 1.6, fontSize: '0.95rem' }}>
                A unified grievance reporting and status tracking channel for the citizens of Delhi. Connects issues directly to responsible agency engineers.
              </Typography>

              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                <Chip label="Auto Routing" sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600 }} />
                <Chip label="Audit Timelines" sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600 }} />
                <Chip label="10% Random Audits" sx={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600 }} />
              </Stack>
            </Box>
          </Grid>

          {/* Right Side Form Card */}
          <Grid item xs={12} md={7}>
            <Paper elevation={8} sx={{ 
              p: 4, 
              borderRadius: '20px', 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540', mb: 0.5 }}>
                {isRegisterMode ? 'Create State Account' : 'Welcome Back'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 3 }}>
                {isMock ? 'Demo Sandbox Mode Active. Credentials saved locally.' : 'Live Supabase DB connection active.'}
              </Typography>

              <Box component="form" onSubmit={handleAuthAction}>
                <Grid container spacing={2}>
                  {/* Common fields */}
                  {isRegisterMode && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Full Name"
                          variant="outlined"
                          size="small"
                          fullWidth
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Phone Number"
                          variant="outlined"
                          size="small"
                          fullWidth
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                        />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12} sm={isRegisterMode ? 6 : 12}>
                    <TextField
                      label="Email Address"
                      type="email"
                      variant="outlined"
                      size="small"
                      fullWidth
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. citizen@gmail.com"
                    />
                  </Grid>

                  <Grid item xs={12} sm={isRegisterMode ? 6 : 12}>
                    <TextField
                      label="Password"
                      type="password"
                      variant="outlined"
                      size="small"
                      fullWidth
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Grid>

                  {/* Register-only role selections */}
                  {isRegisterMode && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <FormControl variant="outlined" size="small" fullWidth required>
                          <InputLabel>Account Role</InputLabel>
                          <Select
                            value={role}
                            onChange={(e) => {
                              setRole(e.target.value);
                              if (e.target.value !== 'officer') setDepartmentCode('');
                            }}
                            label="Account Role"
                          >
                            <MenuItem value="citizen">Citizen User</MenuItem>
                            <MenuItem value="officer">Department Officer</MenuItem>
                            <MenuItem value="admin">State Admin</MenuItem>
                            <MenuItem value="cm">Chief Minister Cell</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <FormControl variant="outlined" size="small" fullWidth required>
                          <InputLabel>District Location</InputLabel>
                          <Select
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            label="District Location"
                          >
                            {DISTRICTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>

                      {role === 'officer' && (
                        <Grid item xs={12}>
                          <FormControl variant="outlined" size="small" fullWidth required>
                            <InputLabel>Department Organization</InputLabel>
                            <Select
                              value={departmentCode}
                              onChange={(e) => setDepartmentCode(e.target.value)}
                              label="Department Organization"
                            >
                              {DEPARTMENTS.map(dept => (
                                <MenuItem key={dept.code} value={dept.code}>{dept.name}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  startIcon={isRegisterMode ? <PersonAddIcon /> : <LoginIcon />}
                  sx={{
                    py: 1.2,
                    mt: 3,
                    mb: 2,
                    fontSize: 15,
                    fontWeight: 700,
                    backgroundColor: '#0A2540',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontFamily: '"Inter", sans-serif',
                    '&:hover': { backgroundColor: '#1E40AF' }
                  }}
                >
                  {loading ? 'Authenticating...' : isRegisterMode ? 'Create Account' : 'Sign In'}
                </Button>
              </Box>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#FF9933' }}
                >
                  {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                </Button>
              </Box>

              {!isRegisterMode && (
                <>
                  <Divider sx={{ my: 2 }}>
                    <Chip label="QUICK DEMO LOGINS" sx={{ fontSize: 9, fontWeight: 700, color: '#94A3B8' }} />
                  </Divider>

                  <Grid container spacing={1.5}>
                    {quickProfiles.map((p) => (
                      <Grid item xs={6} key={p.role}>
                        <Card variant="outlined" sx={{ 
                          borderRadius: '8px', 
                          borderColor: '#E2E8F0',
                          backgroundColor: '#F8FAFC',
                          '&:hover': { borderColor: '#FF9933', boxShadow: 1 } 
                        }}>
                          <CardActionArea onClick={() => handleQuickLogin(p)} sx={{ p: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {p.icon}
                              <Typography variant="subtitle2" sx={{ fontSize: 11, fontWeight: 700, color: '#1E293B' }}>
                                {p.name}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: 9, mt: 0.5 }}>
                              {p.desc}
                            </Typography>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
