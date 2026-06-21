import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, FormControl, Select, MenuItem, 
  InputLabel, Button, Alert, List, ListItem, ListItemText, LinearProgress, Stack, 
  Chip, Divider, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Tooltip as MuiTooltip
} from '@mui/material';
import { 
  Assignment as TotalIcon, 
  CheckCircle as ResolvedIcon, 
  Warning as EscalatedIcon, 
  HourglassEmpty as PendingIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Speed,
  TrendingUp,
  Map as MapIcon,
  CalendarMonth,
  NotificationsActive,
  MonetizationOn,
  Security as AdminIcon,
  People,
  Assessment,
  Timeline
} from '@mui/icons-material';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { complaintService } from '../services/complaintService';
import { reportService } from '../services/reportService';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useCustomTheme } from '../context/ThemeContext';
import StatusBadge from '../components/common/StatusBadge';

const DISTRICTS = [
  'All', 'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

// District SVG paths (Stylized polygons to represent Delhi districts)
const DISTRICT_SVG_DATA = [
  { name: 'North West Delhi', path: 'M 10,20 L 40,10 L 45,35 L 20,50 Z', color: '#FF9933' },
  { name: 'North Delhi', path: 'M 40,10 L 60,15 L 55,30 L 45,35 Z', color: '#138808' },
  { name: 'North East Delhi', path: 'M 60,15 L 85,18 L 80,32 L 65,30 Z', color: '#0A2540' },
  { name: 'West Delhi', path: 'M 20,50 L 45,35 L 40,65 L 15,60 Z', color: '#007FFF' },
  { name: 'Central Delhi', path: 'M 45,35 L 55,30 L 60,45 L 40,50 Z', color: '#9C27B0' },
  { name: 'East Delhi', path: 'M 65,30 L 80,32 L 90,50 L 70,55 Z', color: '#E91E63' },
  { name: 'Shahdara', path: 'M 80,10 L 95,12 L 90,30 L 80,25 Z', color: '#FF5722' },
  { name: 'South West Delhi', path: 'M 15,60 L 40,65 L 35,90 L 10,85 Z', color: '#009688' },
  { name: 'New Delhi', path: 'M 40,50 L 60,45 L 55,65 L 35,70 Z', color: '#FFEB3B' },
  { name: 'South East Delhi', path: 'M 60,45 L 70,55 L 75,80 L 55,75 Z', color: '#795548' },
  { name: 'South Delhi', path: 'M 35,70 L 55,65 L 50,90 L 30,85 Z', color: '#607D8B' }
];

export default function CMDashboard() {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const { darkMode } = useCustomTheme();
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

  // CM view sub-states
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = { district };
      const fetchedKPIs = await analyticsService.getDashboardKPIs(filters);
      const fetchedTrends = await analyticsService.getTimelineMetrics();
      const fetchedDepts = await analyticsService.getDepartmentMetrics(filters);
      const complaintsList = await complaintService.getComplaints(filters);

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

  // Pie chart calculation
  const getStatusPieData = () => {
    return [
      { name: 'Resolved', value: kpis.resolved, color: '#138808' },
      { name: 'Escalated', value: kpis.escalated, color: '#B91C1C' },
      { name: 'Pending', value: kpis.pending, color: '#64748B' },
      { name: 'In Progress', value: kpis.inProgress, color: '#FF9933' },
      { name: 'Assigned', value: kpis.assigned, color: '#007FFF' }
    ].filter(item => item.value > 0);
  };

  const getProjectsPieData = () => {
    return [
      { name: 'Completed', value: 45, color: '#138808' },
      { name: 'In Progress', value: 35, color: '#007FFF' },
      { name: 'Delayed', value: 12, color: '#B91C1C' },
      { name: 'On Hold', value: 8, color: '#FF9933' }
    ];
  };

  // Bar Chart calculations for categories
  const getCategoryBarData = () => {
    const counts = {
      'Roads': 0,
      'Water': 0,
      'Garbage': 0,
      'Power': 0,
      'Safety': 0
    };
    rawComplaints.forEach(c => {
      if (c.category.includes('Roads')) counts['Roads']++;
      else if (c.category.includes('Water')) counts['Water']++;
      else if (c.category.includes('Garbage')) counts['Garbage']++;
      else if (c.category.includes('Streetlight')) counts['Power']++;
      else if (c.category.includes('Safety')) counts['Safety']++;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      Count: counts[key]
    }));
  };

  const isCM = user?.role === 'cm';
  const isAdmin = user?.role === 'admin';

  // ───────────────────────────────────────────────────────────────────────────
  // Sub-view A: CM DASHBOARD VIEW
  // ───────────────────────────────────────────────────────────────────────────
  const renderCMView = () => {
    const statusData = getStatusPieData();
    const projectsData = getProjectsPieData();
    const categoryData = getCategoryBarData();

    return (
      <Box>
        {/* District selection & map row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* SVG Map of Delhi */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', minHeight: 380, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <MapIcon color="primary" /> Delhi District GIS Planner
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                Click on any district region to query local grievance caseloads. Hover to see AQI levels.
              </Typography>
              
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 250 }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', maxHeight: 280 }}>
                  {DISTRICT_SVG_DATA.map((d, index) => {
                    const isSelected = district === d.name;
                    return (
                      <path
                        key={index}
                        d={d.path}
                        className="delhi-district-path"
                        style={{
                          fill: isSelected ? 'rgba(255, 153, 51, 0.45)' : undefined,
                          stroke: isSelected ? '#FF9933' : undefined,
                          strokeWidth: isSelected ? '2' : undefined
                        }}
                        onMouseEnter={() => setHoveredDistrict(d.name)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        onClick={() => setDistrict(isSelected ? 'All' : d.name)}
                      />
                    );
                  })}
                </svg>

                {/* Floating Map Tooltip */}
                {hoveredDistrict && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      bottom: 10, 
                      left: 10, 
                      backgroundColor: 'rgba(10,37,64,0.9)', 
                      color: '#fff', 
                      p: 1.5, 
                      borderRadius: 1.5,
                      boxShadow: 3
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                      {hoveredDistrict}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: 9 }}>
                      Air Index: <b>142 AQI (Moderate)</b><br />
                      Traffic Speed: <b>38 km/h</b>
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right: Events Calendar & Alerts Feed */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Alerts Panel */}
            <Paper sx={{ p: 2.5, flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsActive color="error" /> Real-time System Alerts
              </Typography>
              <Stack spacing={1.5}>
                <Alert severity="error" variant="outlined" sx={{ py: 0.5 }}>
                  DJB Water shortage reported at Janakpuri sector C (SLA Overdue)
                </Alert>
                <Alert severity="warning" variant="outlined" sx={{ py: 0.5 }}>
                  Critical PWD Pothole review in Shahdara rated 1-star by citizen
                </Alert>
                <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
                  Garbage pile reported at Karol Bagh resolved within 4 hours
                </Alert>
              </Stack>
            </Paper>

            {/* Events Calendar */}
            <Paper sx={{ p: 2.5, flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth color="primary" /> Hon'ble CM Schedule & Tours
              </Typography>
              <List dense sx={{ py: 0 }}>
                <ListItem sx={{ px: 0, py: 0.8 }}>
                  <ListItemText 
                    primary={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>June 25: West Delhi Ward Inspections</Typography>}
                    secondary="Audit resolved potholes files and meet local PWD engineer logs"
                  />
                  <Chip label="SLA Audit" size="small" color="secondary" sx={{ height: 18, fontSize: 8, fontWeight: 700 }} />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 0.8 }}>
                  <ListItemText 
                    primary={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>June 29: Delhi Jal Board Review</Typography>}
                    secondary="Monsoon preparedness and sewage system updates"
                  />
                  <Chip label="CM Review" size="small" color="primary" sx={{ height: 18, fontSize: 8, fontWeight: 700 }} />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* 6 CM KPI Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            { label: 'Total Complaints', val: kpis.total, icon: <TotalIcon sx={{ color: '#0A2540' }} />, bg: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)' },
            { label: 'Resolved (Closed)', val: kpis.resolved, icon: <ResolvedIcon sx={{ color: '#138808' }} />, bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' },
            { label: 'Active Investigation', val: kpis.inProgress + kpis.assigned + kpis.pending, icon: <PendingIcon sx={{ color: '#FF9933' }} />, bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' },
            { label: 'Escalated to CM', val: kpis.escalated, icon: <EscalatedIcon sx={{ color: '#B91C1C' }} />, bg: 'linear-gradient(135deg, #FEE2E2 0%, #FCA5A5 100%)' },
            { label: 'Avg. Resolution Time', val: kpis.avgResolutionTime, icon: <Speed sx={{ color: '#007FFF' }} />, bg: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)' },
            { label: 'SLA Success Rate', val: `${kpis.resolutionRate}%`, icon: <TrendingUp sx={{ color: '#138808' }} />, bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' }
          ].map((item, index) => (
            <Grid item xs={6} sm={4} md={2} key={index}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  borderRadius: 3, 
                  background: item.bg,
                  color: '#0A2540',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Box sx={{ p: 1, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', display: 'flex', mb: 1 }}>
                  {item.icon}
                </Box>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, fontSize: 10, opacity: 0.8, textTransform: 'uppercase' }}>
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 850, mt: 0.5, fontFamily: '"Outfit", sans-serif' }}>
                  {loading ? '...' : item.val}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Status Donut & Projects Donut */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 3 }}>
                Grievance & Project Allocations
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} textAlign="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Grievances Status</Typography>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {statusData.map((d, i) => (
                    <Box key={i} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mr: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color }} />
                      <Typography variant="caption" sx={{ fontSize: 9, fontWeight: 700 }}>
                        {d.name} ({d.value})
                      </Typography>
                    </Box>
                  ))}
                </Grid>

                <Grid item xs={6} textAlign="center">
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>PWD Projects Status</Typography>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={projectsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {projectsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {projectsData.map((d, i) => (
                    <Box key={i} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mr: 1.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color }} />
                      <Typography variant="caption" sx={{ fontSize: 9, fontWeight: 700 }}>
                        {d.name} ({d.value}%)
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Bar Chart: Categories Distribution */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 2 }}>
                Top Grievance Categories Count
              </Typography>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" style={{ fontSize: 10 }} />
                  <YAxis style={{ fontSize: 10 }} />
                  <ChartTooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="Count" fill="#FF9933" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#FF9933' : '#138808'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Financial Overview */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MonetizationOn color="secondary" /> Delhi Budget allocations & Expenditure (FY 2026)
          </Typography>
          <Grid container spacing={3}>
            {[
              { label: 'PWD Infrastructure', budget: '₹14,500 Cr', spent: '82%', color: '#FF9933' },
              { label: 'Delhi Jal Board Water', budget: '₹9,800 Cr', spent: '68%', color: '#007FFF' },
              { label: 'Clean Air Mission', budget: '₹4,200 Cr', spent: '45%', color: '#138808' },
              { label: 'Public Health Care', budget: '₹11,300 Cr', spent: '91%', color: '#E91E63' }
            ].map((fin, idx) => (
              <Grid item xs={12} sm={3} key={idx}>
                <Paper variant="outlined" sx={{ p: 2, borderLeft: `4px solid ${fin.color}`, backgroundColor: 'rgba(0,0,0,0.01)' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{fin.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: fin.color }}>{fin.budget}</Typography>
                  <Box sx={{ mt: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Spent Progress</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>{fin.spent}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={parseFloat(fin.spent)} sx={{ height: 4, borderRadius: 2 }} />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Quote Footer in Hindi */}
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: '"Outfit", sans-serif', 
              fontWeight: 700, 
              color: '#FF9933',
              fontStyle: 'italic',
              letterSpacing: 0.5
            }}
          >
            " जन सेवा ही हमारा संकल्प - दिल्ली सरकार "
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Public Service is Our Sole Resolution • AAP Govt NCT Delhi
          </Typography>
        </Box>
      </Box>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Sub-view B: STATE ADMINISTRATOR VIEW
  // ───────────────────────────────────────────────────────────────────────────
  const renderAdminView = () => {
    const budgetData = [
      { name: 'PWD Infrastructure', value: 35, color: '#FF9933' },
      { name: 'Water & Sewage', value: 25, color: '#007FFF' },
      { name: 'Public Health', value: 15, color: '#E91E63' },
      { name: 'Education Sector', value: 15, color: '#138808' },
      { name: 'Social Welfare', value: 10, color: '#9C27B0' }
    ];

    return (
      <Box>
        {/* Top India map highlight block */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* India SVG map representation with Delhi highlighted */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', minHeight: 380, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminIcon color="success" /> National Integration Map
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
                Delhi NCT region is highlighted inside the Northern Central grid. Click to target local nodes.
              </Typography>

              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 250 }}>
                {/* Styled Abstract India outline map */}
                <svg viewBox="0 0 100 100" style={{ width: '100%', maxHeight: 260 }}>
                  {/* Stylized bounding paths for India blocks */}
                  <path d="M 50,5 L 60,10 L 70,5 L 75,15 L 70,30 L 80,35 L 90,45 L 85,55 L 70,60 L 65,80 L 50,95 L 48,95 L 35,80 L 40,65 L 25,60 L 15,50 L 10,40 L 5,30 L 25,30 L 35,20 L 40,25 Z" className="india-state-path" />
                  {/* Delhi NCT Highlight dot (Large Pulsing red circle + text tag) */}
                  <circle cx="50" cy="27" r="3.5" fill="#FF9933" className="india-state-path delhi-highlight" style={{ cursor: 'pointer' }} onClick={() => setDistrict('New Delhi')} />
                  <text x="55" y="29" fill={darkMode ? '#fff' : '#0A2540'} style={{ fontSize: '3px', fontWeight: 800 }}>Delhi NCT (Active)</text>
                </svg>
              </Box>
            </Paper>
          </Grid>

          {/* Budget utilization donut pie */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 2 }}>
                State Budget Allocation Distribution
              </Typography>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={budgetData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {budgetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <Grid container spacing={1} sx={{ mt: 2 }}>
                  {budgetData.map((d, i) => (
                    <Grid item xs={6} sm={4} key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 10 }}>
                        {d.name} ({d.value}%)
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* 4 Macro KPIs */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: 'Delhi Population Served', val: '3.2 Cr', icon: <People sx={{ color: '#138808' }} />, bg: 'rgba(19, 136, 8, 0.05)', border: '1px solid rgba(19,136,8,0.15)' },
            { label: 'Annual Capital Outlay', val: '₹68,500 Cr', icon: <MonetizationOn sx={{ color: '#FF9933' }} />, bg: 'rgba(255, 153, 51, 0.05)', border: '1px solid rgba(255,153,51,0.15)' },
            { label: 'Active Welfare Programs', val: '42 Schemes', icon: <Assessment sx={{ color: '#007FFF' }} />, bg: 'rgba(0,127,255,0.05)', border: '1px solid rgba(0,127,255,0.15)' },
            { label: 'Public Safety Index', val: '85 / 100', icon: <AdminIcon sx={{ color: '#9C27B0' }} />, bg: 'rgba(156,39,176,0.05)', border: '1px solid rgba(156,39,176,0.15)' }
          ].map((card, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper sx={{ p: 2.5, borderRadius: 3, background: card.bg, border: card.border }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{card.label}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, fontFamily: '"Outfit", sans-serif' }}>{card.val}</Typography>
                  </Box>
                  <Box sx={{ p: 1, backgroundColor: 'background.paper', borderRadius: '50%', display: 'flex' }}>
                    {card.icon}
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Sector-wise Target vs Achieved Progress */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Sector progress bars */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 3 }}>
                Infrastructure Development Targets
              </Typography>
              <Stack spacing={2.5}>
                {[
                  { sector: 'Clean Drinking Water pipelines', target: '90%', current: 70 },
                  { sector: 'PWD Road Repaving / Drainage works', target: '95%', current: 85 },
                  { sector: 'Municipal Waste Treatment plants', target: '80%', current: 60 },
                  { sector: 'Smart Streetlights coverage', target: '100%', current: 90 }
                ].map((sec, idx) => (
                  <Box key={idx}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.8 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>{sec.sector}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                        {sec.current}% / Target: {sec.target}
                      </Typography>
                    </Stack>
                    <LinearProgress 
                      variant="determinate" 
                      value={sec.current} 
                      sx={{ 
                        height: 7, 
                        borderRadius: 3.5, 
                        backgroundColor: darkMode ? '#14253F' : '#E2E8F0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#138808'
                        }
                      }} 
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Today's Updates Timeline */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline color="success" /> System Audit Timeline
              </Typography>
              <List dense>
                {[
                  { title: '10% SLA Audit trigger', time: '10:30 AM', text: '10% of resolved tickets selected for random verification calls.' },
                  { title: 'CM Tour logged', time: '09:15 AM', text: 'West Delhi district tour logged inside visit calendar.' },
                  { title: 'Express 5 route escalation', time: '02:00 AM', text: 'Cron completed 24h checks. 3 tickets auto-escalated to CM Cell.' }
                ].map((item, idx) => (
                  <ListItem key={idx} sx={{ px: 0, alignItems: 'start', pb: 2 }}>
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#138808' }} />
                    </Box>
                    <ListItemText 
                      primary={
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="subtitle2" sx={{ fontWeight: 750 }}>{item.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                        </Stack>
                      }
                      secondary={item.text}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box className="fade-in" sx={{ p: { xs: 0.5, md: 1 } }}>
      {/* Header and Actions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: darkMode ? '#fff' : '#0A2540' }}>
            {isCM ? 'Chief Minister oversight Summary' : 'State Executive Overview'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {isCM 
              ? 'Monitoring dashboard for NCT Delhi grievances, public works, and CM scheduled activities.' 
              : 'Welfare outlines, budget allocations, and inter-departmental target parameters.'
            }
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<PdfIcon />} 
            onClick={handleExportPDF}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            PDF Report
          </Button>
          <Button 
            variant="outlined" 
            color="success" 
            startIcon={<ExcelIcon />} 
            onClick={handleExportExcel}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Export Excel
          </Button>
        </Stack>
      </Stack>

      {/* District Filter Selector */}
      {isCM && (
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
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>
            Showing stats for {district === 'All' ? 'all 11 Delhi Districts' : `${district} District`}
          </Typography>
        </Paper>
      )}

      {/* Admin Quick Shortcuts Control Panel */}
      {isAdmin && (
        <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: '14px', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 750, color: 'text.primary', mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            State Administrator Operations Shortcuts
          </Typography>
          <Grid container spacing={2}>
            {[
              { label: 'Active Grievances', path: '/complaints', desc: 'Audit, Reassign & Route' },
              { label: 'Analytics & Maps', path: '/analytics', desc: 'Inspect regional issues' },
              { label: 'Department Rankings', path: '/departments', desc: 'View efficiency scores' },
              { label: 'Officer Directory', path: '/officers', desc: 'Monitor engineer loads' },
              { label: 'District Visits Planner', path: '/visits', desc: 'Link tours to files logs' }
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
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: '#FF9933',
                      backgroundColor: 'rgba(255, 153, 51, 0.04)'
                    }
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 750, fontSize: 12, display: 'block' }}>
                    {shortcut.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: 10, mt: 0.5 }}>
                    {shortcut.desc}
                  </Typography>
                </Button>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Primary view content render */}
      {isCM ? renderCMView() : renderAdminView()}
    </Box>
  );
}
