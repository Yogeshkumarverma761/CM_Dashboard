import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Divider, Typography, Paper, Link, Stack } from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Map as MapIcon, 
  Assignment as AssignmentIcon, 
  Business as BusinessIcon, 
  People as PeopleIcon, 
  FlightTakeoff as FlightIcon,
  Search as SearchIcon,
  Home as HomeIcon,
  HelpOutline as HelpIcon,
  Payment as PaymentIcon,
  Description as FormIcon,
  Star as StarIcon,
  LocationCity,
  AccountBalance,
  CompassCalibration
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCustomTheme } from '../../context/ThemeContext';

const drawerWidth = 240;

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const { darkMode } = useCustomTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll helper for Landing page anchors
  const handleAnchorScroll = (anchorId) => {
    if (location.pathname !== '/') {
      navigate('/' + anchorId);
    } else {
      const el = document.getElementById(anchorId.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    if (onClose) onClose();
  };

  const getMenuItems = () => {
    if (!user || user.role === 'citizen') {
      // Citizen / Guest Menu
      return [
        { text: 'Home', icon: <HomeIcon />, onClick: () => { navigate('/'); if (onClose) onClose(); } },
        { text: 'Explore Services', icon: <BusinessIcon />, onClick: () => handleAnchorScroll('#services') },
        { text: 'Track Application', icon: <SearchIcon />, onClick: () => handleAnchorScroll('#track-widget') },
        { text: 'Lodge Grievance', icon: <AssignmentIcon />, onClick: () => handleAnchorScroll('#grievance-widget') },
        { text: 'e-Payments', icon: <PaymentIcon />, onClick: () => handleAnchorScroll('#payments-widget') },
        { text: 'Need Help?', icon: <HelpIcon />, onClick: () => handleAnchorScroll('#help-widget') }
      ];
    }

    if (user.role === 'cm') {
      return [
        { text: 'CM Summary', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Analytics & Maps', icon: <MapIcon />, path: '/analytics' },
        { text: 'Active Grievances', icon: <AssignmentIcon />, path: '/complaints' },
        { text: 'Departments', icon: <BusinessIcon />, path: '/departments' },
        { text: 'Officer Directory', icon: <PeopleIcon />, path: '/officers' },
        { text: 'CM District Visits', icon: <FlightIcon />, path: '/visits' }
      ];
    }

    if (user.role === 'admin') {
      return [
        { text: 'Admin Summary', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Analytics & Maps', icon: <MapIcon />, path: '/analytics' },
        { text: 'Active Grievances', icon: <AssignmentIcon />, path: '/complaints' },
        { text: 'Departments', icon: <BusinessIcon />, path: '/departments' },
        { text: 'Officer Directory', icon: <PeopleIcon />, path: '/officers' },
        { text: 'CM District Visits', icon: <FlightIcon />, path: '/visits' }
      ];
    }

    if (user.role === 'officer') {
      return [
        { text: 'Active Grievances', icon: <AssignmentIcon />, path: '/complaints' },
        { text: 'Officer Directory', icon: <PeopleIcon />, path: '/officers' }
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();
  const isCitizenSidebar = !user || user.role === 'citizen';

  const renderBottomCard = () => {
    if (isCitizenSidebar) {
      return (
        <Paper 
          elevation={0}
          sx={{ 
            mx: 2, 
            mb: 3, 
            p: 2, 
            background: 'linear-gradient(135deg, rgba(255, 153, 51, 0.1) 0%, rgba(19, 136, 8, 0.1) 100%)',
            border: '1px solid rgba(255, 153, 51, 0.2)',
            borderRadius: '12px',
            textAlign: 'center'
          }}
        >
          {/* Delhi Monument Vector Placeholder */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, color: '#FF9933' }}>
            <LocationCity sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 13 }}>
            Delhi Monuments
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5, fontSize: 11 }}>
            Explore historical sights and local municipal services online.
          </Typography>
          {/* Mock App store badges */}
          <Stack spacing={0.8}>
            <Box 
              sx={{ 
                fontSize: 10, 
                fontWeight: 700, 
                py: 0.5, 
                px: 1, 
                border: '1px solid rgba(0,0,0,0.15)',
                borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                borderRadius: 1.5, 
                backgroundColor: darkMode ? '#14253F' : '#0A2540',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Get it on <b>Google Play</b>
            </Box>
            <Box 
              sx={{ 
                fontSize: 10, 
                fontWeight: 700, 
                py: 0.5, 
                px: 1, 
                border: '1px solid rgba(0,0,0,0.15)',
                borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
                borderRadius: 1.5, 
                backgroundColor: darkMode ? '#14253F' : '#0A2540',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Download on <b>App Store</b>
            </Box>
          </Stack>
        </Paper>
      );
    }

    if (user?.role === 'cm') {
      return (
        <Paper 
          elevation={0}
          sx={{ 
            mx: 2, 
            mb: 3, 
            p: 2, 
            background: 'linear-gradient(135deg, #0A2540 0%, #1A365D 100%)',
            color: '#fff',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Absolute decorative flag emblem */}
          <Box sx={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.15, color: '#fff' }}>
            <CompassCalibration sx={{ fontSize: 80 }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FF9933', mb: 0.5 }}>
            Viksit Delhi 2047
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block', fontSize: 11 }}>
            Building a smart, highly responsive digital capital governance model.
          </Typography>
        </Paper>
      );
    }

    if (user?.role === 'admin') {
      return (
        <Paper 
          elevation={0}
          sx={{ 
            mx: 2, 
            mb: 3, 
            p: 2, 
            background: 'linear-gradient(135deg, #138808 0%, #0F6605 100%)',
            color: '#fff',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.15, color: '#fff' }}>
            <AccountBalance sx={{ fontSize: 80 }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FFFFFF', mb: 0.5 }}>
            Parliament Desk
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block', fontSize: 11 }}>
            National Capital Integration & Inter-State Welfare Monitor.
          </Typography>
        </Paper>
      );
    }

    return null;
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ overflow: 'auto', mt: 1, flexGrow: 1 }}>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const isSelected = item.path ? location.pathname === item.path : false;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={item.onClick || (() => {
                    navigate(item.path);
                    if (onClose) onClose();
                  })}
                  className={isSelected ? 'sidebar-active-item' : ''}
                  sx={{
                    borderRadius: '8px',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(10, 37, 64, 0.04)'
                    }
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: isSelected 
                        ? '#FF9933' 
                        : (darkMode ? '#94A3B8' : '#64748B'), 
                      minWidth: 40 
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontSize: 13.5,
                      fontWeight: isSelected ? 750 : 550,
                      color: isSelected 
                        ? (darkMode ? '#FFAE58' : '#0A2540') 
                        : (darkMode ? '#F1F5F9' : '#334155'),
                      fontFamily: '"Inter", sans-serif'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {renderBottomCard()}

      <Divider sx={{ my: 1, mx: 2 }} />
      <Box sx={{ px: 3, py: 1.5, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650, display: 'block', fontSize: 10, letterSpacing: 0.5 }}>
          Gov. NCT of Delhi © 2026
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Sidebar Drawer for Desktop */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
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
            backgroundColor: 'background.paper'
          },
        }}
      >
        <Toolbar />
        {drawerContent}
      </Drawer>
    </>
  );
}
