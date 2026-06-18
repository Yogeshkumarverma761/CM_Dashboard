import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, LinearProgress, Stack, Chip, Divider, Rating, Avatar 
} from '@mui/material';
import { useNotification } from '../context/NotificationContext';
import { departmentService } from '../services/departmentService';

export default function Officers() {
  const { showNotification } = useNotification();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const roster = await departmentService.getOfficers();
      setOfficers(roster);
    } catch (err) {
      showNotification('Error loading officers directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getLoadColor = (current, max) => {
    const pct = (current / max) * 100;
    if (pct > 80) return '#B91C1C'; // Red overloaded
    if (pct > 50) return '#FF9933'; // Orange warning
    return '#138808'; // Green safe
  };

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
          Department Officers Directory
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Monitor officer workloads, response efficiency ratings, and contact details.
        </Typography>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {officers.map((officer) => {
            const isOverloaded = officer.workload_count >= officer.max_workload;
            return (
              <Grid item xs={12} sm={6} md={4} key={officer.id}>
                <Card elevation={2} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', position: 'relative' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#0A2540', fontWeight: 700, width: 44, height: 44 }}>
                        {officer.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0A2540', lineHeight: 1.2 }}>
                          {officer.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {officer.department_name}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ mb: 2 }}>
                      <Rating value={parseFloat(officer.avg_rating)} precision={0.1} readOnly size="small" />
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.2 }}>
                        Average rating based on citizen feedback
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Workload Indicator */}
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>ACTIVE WORKLOAD</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {officer.workload_count} / {officer.max_workload} Cases
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={(officer.workload_count / officer.max_workload) * 100} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3, 
                          backgroundColor: '#F1F5F9',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getLoadColor(officer.workload_count, officer.max_workload)
                          }
                        }} 
                      />
                    </Box>

                    <Grid container spacing={1} sx={{ mt: 1.5 }}>
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>OFFICIAL EMAIL</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155', wordBreak: 'break-all' }}>
                          {officer.email}
                        </Typography>
                      </Grid>
                    </Grid>

                    {isOverloaded && (
                      <Chip 
                        label="OVERLOADED" 
                        color="error" 
                        size="small" 
                        sx={{ 
                          position: 'absolute', 
                          top: 16, 
                          right: 16, 
                          fontWeight: 800, 
                          fontSize: 9,
                          height: 20
                        }} 
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
