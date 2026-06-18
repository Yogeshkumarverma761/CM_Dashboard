import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip 
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import L from 'leaflet';
import { complaintService } from '../services/complaintService';
import { analyticsService } from '../services/analyticsService';
import { useNotification } from '../context/NotificationContext';
import StatusBadge from '../components/common/StatusBadge';

const DISTRICTS = [
  'All', 'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 
  'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 
  'Shahdara', 'Central Delhi'
];

// Helper for dynamic SVG Leaflet markers (fixes Vite path importing issues)
const getMarkerIcon = (status) => {
  let color = '#FF9933'; // Saffron Default
  if (status === 'resolved') color = '#138808'; // Green
  if (status === 'escalated') color = '#B91C1C'; // Red
  if (status === 'in_progress') color = '#D97706'; // Amber
  if (status === 'assigned') color = '#1E40AF'; // Blue

  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="30" height="30">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>`;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-leaflet-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

export default function Analytics() {
  const { showNotification } = useNotification();
  const [district, setDistrict] = useState('All');
  const [complaints, setComplaints] = useState([]);
  const [districtScores, setDistrictScores] = useState([]);
  const [kpis, setKpis] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = { district };
      const list = await complaintService.getComplaints(filters);
      const scores = await analyticsService.getDistrictMetrics(filters);
      const stats = await analyticsService.getDashboardKPIs(filters);
      
      setComplaints(list);
      setDistrictScores(scores);
      setKpis(stats);
    } catch (err) {
      console.error(err);
      showNotification('Error loading mapping data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [district]);

  // Recharts Status Chart Prep
  const pieData = [
    { name: 'Pending Routing', value: kpis.pending || 0, color: '#64748B' },
    { name: 'Assigned', value: kpis.assigned || 0, color: '#1E40AF' },
    { name: 'In Progress', value: kpis.inProgress || 0, color: '#D97706' },
    { name: 'Resolved', value: kpis.resolved || 0, color: '#047857' },
    { name: 'Reopened', value: kpis.reopened || 0, color: '#B91C1C' },
    { name: 'Escalated to CM', value: kpis.escalated || 0, color: '#7F1D1D' }
  ].filter(d => d.value > 0);

  // Recharts District Bar Prep
  const barData = districtScores.slice(0, 6).map(d => ({
    name: d.name,
    Logged: d.total,
    Resolved: d.resolved
  }));

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
          Grievance Mapping & GIS Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Interactive map mapping local complaints with real-time resolving updates and regional ratings.
        </Typography>
      </Box>

      {/* Filter and District Selector */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="map-district-label">Select District</InputLabel>
          <Select
            labelId="map-district-label"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            label="Select District"
          >
            {DISTRICTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
          Mapping {complaints.length} active complaints in {district === 'All' ? 'NCT of Delhi' : district}
        </Typography>
      </Paper>

      {/* Map and Charts Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Leaflet Map Card */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={2} sx={{ p: 2, borderRadius: '14px', border: '1px solid #E2E8F0', height: 480, position: 'relative' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 1 }}>
              Regional Grievance GIS Map
            </Typography>
            <Box sx={{ width: '100%', height: 'calc(100% - 32px)', borderRadius: '10px', overflow: 'hidden' }}>
              <MapContainer 
                center={[28.6139, 77.2090]} 
                zoom={11} 
                scrollWheelZoom={true} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {complaints.map((c) => (
                  <Marker 
                    key={c.id} 
                    position={[c.latitude, c.longitude]} 
                    icon={getMarkerIcon(c.status)}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 180 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 0.5 }}>
                          ID: {c.tracking_no}
                        </Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540', lineHeight: 1.2, mb: 0.5 }}>
                          {c.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1 }}>
                          District: <b>{c.district}</b>
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <StatusBadge status={c.status} />
                          <Chip label={c.severity.toUpperCase()} size="small" color={c.severity === 'critical' ? 'error' : 'default'} sx={{ height: 18, fontSize: 9, fontWeight: 700 }} />
                        </Stack>
                        <Typography variant="caption" sx={{ display: 'block', borderTop: '1px solid #E2E8F0', pt: 0.5, color: '#94A3B8' }}>
                          Reported: {new Date(c.created_at).toLocaleDateString('en-IN')}
                        </Typography>
                      </Box>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Status Breakdown Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0', height: 480, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 1 }}>
              Complaint Status Mix
            </Typography>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pieData.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#64748B' }}>No complaints found</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 11, borderRadius: 8 }} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconSize={10} 
                      iconType="circle"
                      wrapperStyle={{ fontFamily: 'Inter', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
            
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#138808' }}>
                {kpis.resolutionRate || 0}%
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Average Grievance Redressal Rate
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Row 3: District Rankings and District Bar Chart */}
      <Grid container spacing={3}>
        {/* District Chart */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0', height: 350 }}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
              Top Districts (Logged vs Resolved)
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" style={{ fontSize: '9px' }} />
                <YAxis stroke="#94A3B8" style={{ fontSize: '9px' }} />
                <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="Logged" fill="#FF9933" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resolved" fill="#138808" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* District scorecards grid */}
        <Grid item xs={12} lg={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: '14px', border: '1px solid #E2E8F0', height: 350, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', mb: 2 }}>
              District Operations Scorecard
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: '#0A2540' }}>District Name</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: '#0A2540' }}>Logged</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: '#0A2540' }}>Resolved</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: '#0A2540' }}>Escalated</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: '#0A2540' }}>Redressal Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {districtScores.map((row) => (
                    <TableRow key={row.name} hover>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 11 }}>{row.name}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 11 }}>{row.total}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 11 }}>{row.resolved}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 11, color: row.escalated > 0 ? '#B91C1C' : 'inherit', fontWeight: row.escalated > 0 ? 700 : 'normal' }}>
                        {row.escalated}
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${row.rate}%`} 
                          size="small"
                          color={row.rate > 70 ? 'success' : row.rate > 40 ? 'warning' : 'error'}
                          sx={{ fontWeight: 800, height: 18, fontSize: 9 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
