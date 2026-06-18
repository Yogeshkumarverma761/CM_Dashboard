import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, LinearProgress, Stack, Chip, Divider, Rating 
} from '@mui/material';
import { Business as BusinessIcon, People as PeopleIcon } from '@mui/icons-material';
import { departmentService } from '../services/departmentService';
import { analyticsService } from '../services/analyticsService';
import { useNotification } from '../context/NotificationContext';

export default function Departments() {
  const { showNotification } = useNotification();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const details = await departmentService.getDepartments();
      const analyticsList = await analyticsService.getDepartmentMetrics();
      
      // Merge rating data and logs
      const merged = details.map(d => {
        const metric = analyticsList.find(m => m.code === d.code) || {};
        return {
          ...d,
          total: metric.total || 0,
          resolved: metric.resolved || 0,
          rate: metric.rate || 0,
          rating: metric.rating || d.rating || 5.0
        };
      });

      setDepartments(merged);
    } catch (err) {
      showNotification('Error loading departments directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 800, color: '#0A2540' }}>
          Government Departments Scorecard
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Real-time resolution efficiency metrics and citizen rating rankings for active departments.
        </Typography>
      </Box>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          {departments.map((dept) => (
            <Grid item xs={12} sm={6} md={4} key={dept.id}>
              <Card elevation={2} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ p: 1.2, borderRadius: '10px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ color: '#0A2540' }} />
                    </Box>
                    <Chip 
                      label={dept.code} 
                      size="small" 
                      sx={{ fontWeight: 800, backgroundColor: '#FF9933', color: '#fff', fontSize: 10 }} 
                    />
                  </Stack>

                  <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, color: '#0A2540', height: 48, overflow: 'hidden', lineHeight: 1.2, mb: 1 }}>
                    {dept.name}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Rating value={parseFloat(dept.rating)} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                      {parseFloat(dept.rating).toFixed(1)} / 5.0
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>RESOLUTION RATING</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{dept.rate}%</Typography>
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

                  <Grid container spacing={1} sx={{ mt: 2.5 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>TOTAL LOGGED</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{dept.total} Cases</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>RESOLVED</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#138808' }}>{dept.resolved} Cases</Typography>
                    </Grid>
                  </Grid>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2, pt: 2, borderTop: '1px solid #F1F5F9', color: '#64748B' }}>
                    <PeopleIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      Active Staff: <b>{dept.active_officers_count || 1} Officers</b>
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
