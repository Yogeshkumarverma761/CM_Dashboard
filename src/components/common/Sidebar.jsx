import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider, Typography } from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Map as MapIcon, 
  Assignment as AssignmentIcon, 
  Business as BusinessIcon, 
  People as PeopleIcon, 
  FlightTakeoff as FlightIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  // Define menu items and accessibility mapping
  const menuItems = [
    { text: 'CM Summary', icon: <DashboardIcon />, path: '/dashboard', roles: ['cm', 'admin'] },
    { text: 'Analytics & Maps', icon: <MapIcon />, path: '/analytics', roles: ['cm', 'admin'] },
    { text: 'Active Grievances', icon: <AssignmentIcon />, path: '/complaints', roles: ['cm', 'admin', 'officer'] },
    { text: 'Departments', icon: <BusinessIcon />, path: '/departments', roles: ['cm', 'admin'] },
    { text: 'Officer Directory', icon: <PeopleIcon />, path: '/officers', roles: ['cm', 'admin', 'officer'] },
    { text: 'CM District Visits', icon: <FlightIcon />, path: '/visits', roles: ['cm', 'admin'] },
    { text: 'Submit / Track', icon: <SearchIcon />, path: '/track', roles: ['citizen', 'cm', 'admin'] }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

  const drawerContent = (
    <Box sx={{ overflow: 'auto', mt: 1 }}>
      <List sx={{ px: 1 }}>
        {filteredItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (onClose) onClose(); // close on mobile
                }}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'rgba(10, 37, 64, 0.08)' : 'transparent',
                  borderLeft: isSelected ? '4px solid #FF9933' : '4px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(10, 37, 64, 0.04)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <ListItemIcon sx={{ color: isSelected ? '#0A2540' : '#64748B', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0A2540' : '#475569',
                    fontFamily: '"Inter", sans-serif'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ my: 2, mx: 2 }} />
      <Box sx={{ px: 3, py: 1, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block', fontSize: 10, letterSpacing: 1 }}>
          NCT DELHI PORTAL v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.01)'
          },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            backgroundColor: '#F8FAFC'
          },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>
    </>
  );
}
