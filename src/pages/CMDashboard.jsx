import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, FormControl, Select, MenuItem, InputLabel, Button, Alert, List, ListItem, ListItemText, LinearProgress, Stack, Chip 
} from '@mui/material';
import { 
  Assignment as TotalIcon, 
  CheckCircle as ResolvedIcon, 
  Warning as EscalatedIcon, 
  HourglassEmpty as PendingIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { complaintService } from '../services/complaintService';
import { reportService } from '../services/reportService';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

const DISTRICTS = [
  'All', 'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

export default function CMDashboard() {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [district, setDistrict] = useState('All');
  const [kpis, setKpis] = useState({
    total: 0, resolved: 0, escalated: 0, pending: 0, assigned: 0, inProgress: 0, reopened: 0, resolutionRate: 0, avgResolutionTime: '0 Days'
  });
  const [trends, setTrends] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [criticalComplaints, setCriticalComplaints] = useState([]);
  const [rawComplaints, setRawComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = { district };
      const fetchedKPIs = await analyticsService.getDashboardKPIs(filters);
      const fetchedTrends = await analyticsService.getTimelineMetrics();
      const fetchedDepts = await analyticsService.getDepartmentMetrics(filters);
      const complaintsList = await complaintService.getComplaints(filters);

      // Load critical escalated items
      const criticals = complaintsList.filter(c => c.status === 'escalated' || c.severity === 'critical');
      
      setKpis(fetchedKPIs);
      setTrends(fetchedTrends);
      setDepartmentStats(fetchedDepts);
      setCriticalComplaints(criticals.slice(0, 4));
      setRawComplaints(complaintsList);
    } catch (err) {
      console.error(err);
      showNotification('Error loading dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [district]);

  const handleExportPDF = () => {
    try {
      reportService.exportToPDF(rawComplaints, kpis);
      showNotification('Executive PDF Report downloaded successfully.', 'success');
    } catch (err) {
      showNotification('Error generating PDF report.', 'error');
    }
  };

  const handleExportExcel = () => {
    try {
      reportService.exportToExcel(rawComplaints);
      showNotification('Grievance Excel file exported successfully.', 'success');
    } catch (err) {
      showNotification('Error generating Excel spreadsheet.', 'error');
    }
  };

  const kpiCards = [
    { title: 'Total Grievances', val: kpis.total, icon: <TotalIcon sx={{ fontSize: 36, color: '#0A2540' }} />, bg: '#E0F2FE' },
    { title: 'Resolved Cases', val: kpis.resolved, icon: <ResolvedIcon sx={{ fontSize: 36, color: '#138808' }} />, bg: '#D1FAE5' },
    { title: 'Pending Routing', val: kpis.pending + kpis.assigned + kpis.inProgress, icon: <PendingIcon sx={{ fontSize: 36, color: '#64748B' }} />, bg: '#F1F5F9' },
    { title: 'Escalated to CM', val: kpis.escalated, icon: <EscalatedIcon sx={{ fontSize: 36, color: '#B91C1C' }} />, bg: '#FEE2E2' }
  ];

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header and Actions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
            State Executive Summary
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            CM monitoring dashboard for Delhi government public works and civic issues.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<PdfIcon />} 
            onClick={handleExportPDF}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            PDF Report
          </Button>
          <Button 
            variant="outlined" 
            color="success" 
            startIcon={<ExcelIcon />} 
            onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
          >
            Export Excel
          </Button>
        </Stack>
      </Stack>

      {/* District Filter Selector */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="district-filter-label">Filter District</InputLabel>
          <Select
            labelId="district-filter-label"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            label="Filter District"
          >
            {DISTRICTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
          Showing stats for {district === 'All' ? 'all 11 Delhi Districts' : `${district} District`}
        </Typography>
      </Paper>

      {/* Admin Quick Shortcuts Control Panel */}
      {user?.role === 'admin' && (
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: '14px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            State Administrator Control Shortcuts
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Active Grievances', path: '/complaints', desc: 'Audit, Re-assign & Route' },
              { label: 'GIS Mapping & Heatmaps', path: '/analytics', desc: 'Inspect regional issues' },
              { label: 'Department Rankings', path: '/departments', desc: 'View efficiency scores' },
              { label: 'Officer Caseloads Directory', path: '/officers', desc: 'Monitor engineer loads' },
              { label: 'CM Tour Schedule Planner', path: '/visits', desc: 'Link tours to grievances' }
            ].map((shortcut) => (
              <Grid item xs={12} sm={6} md={2.4} key={shortcut.path}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(shortcut.path)}
                  sx={{
                    p: 2,
                    textAlign: 'left',
                    display: 'block',
                    textTransform: 'none',
                    borderRadius: '10px',
                    borderColor: '#E2E8F0',
                    color: '#0A2540',
                    backgroundColor: '#fff',
                    '&:hover': {
                      borderColor: '#FF9933',
                      backgroundColor: 'rgba(255, 153, 51, 0.04)'
                    }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', fontSize: 12, display: 'block' }}>
                    {shortcut.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: 10, mt: 0.5 }}>
                    {shortcut.desc}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* KPI Cards Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpiCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card elevation={2} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', height: '100%' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h3" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540', mt: 0.5 }}>
                    {loading ? '...' : card.val}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, borderRadius: '12px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts and Middle Row Content */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Recharts Area Chart */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0', height: '100%', minHeight: 380 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
              Redressal Operations Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF9933" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#FF9933" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#138808" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#138808" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: '10px' }} />
                <YAxis stroke="#94A3B8" style={{ fontSize: '10px' }} />
                <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="Submitted" stroke="#FF9933" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSubmit)" />
                <Area type="monotone" dataKey="Resolved" stroke="#138808" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Department Rankings */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0', height: '100%', minHeight: 380 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
              Department Rating & Load
            </Typography>
            <List>
              {departmentStats.map((dept, idx) => (
                <Box key={dept.code} sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      {dept.name}
                    </Typography>
                    <Chip 
                      label={`${dept.rating} ★`} 
                      size="small" 
                      color={dept.rating >= 4.0 ? 'success' : dept.rating >= 3.5 ? 'warning' : 'error'}
                      sx={{ fontWeight: 800, height: 20, fontSize: 10 }} 
                    />
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={dept.rate} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3, 
                      backgroundColor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: dept.rate > 70 ? '#138808' : '#FF9933'
                      }
                    }} 
                  />
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Resolved: {dept.resolved}/{dept.total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      Rate: {dept.rate}%
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Critical Escalations Panel */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0' }}>
        <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
          Critical & Escalated Cases (Action Required)
        </Typography>
        {criticalComplaints.length === 0 ? (
          <Alert severity="success">No critical or escalated complaints require immediate CM review in this district.</Alert>
        ) : (
          <Grid container spacing={2}>
            {criticalComplaints.map((c) => (
              <Grid item xs={12} md={6} key={c.id}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', borderLeft: '5px solid #B91C1C', backgroundColor: '#FFFDFD' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {c.tracking_no}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mt: 0.2 }}>
                        {c.title}
                      </Typography>
                    </Box>
                    <StatusBadge status={c.status} />
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
                    District: <b>{c.district}</b> | Category: <b>{c.category}</b>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mb: 1, height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.description}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Logged on: {new Date(c.created_at).toLocaleDateString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#B91C1C' }}>
                      SEVERITY: {c.severity.toUpperCase()}
                    </Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
}
