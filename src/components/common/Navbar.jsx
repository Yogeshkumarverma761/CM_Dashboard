import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Chip, IconButton, Badge, Menu, MenuItem, Popover, List, ListItem, ListItemText, Divider, Stack } from '@mui/material';
import { Menu as MenuIcon, Notifications, AccountCircle, ExitToApp, Warning as WarningIcon, LightMode, DarkMode, Language, FormatSize, WbSunny, Cloud } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useCustomTheme } from '../../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Anchor States
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notifyAnchor, setNotifyAnchor] = useState(null);
  const [lang, setLang] = useState('EN');

  const handleProfileOpen = (event) => setProfileAnchor(event.currentTarget);
  const handleProfileClose = () => setProfileAnchor(null);

  const handleNotifyOpen = (event) => setNotifyAnchor(event.currentTarget);
  const handleNotifyClose = () => setNotifyAnchor(null);

  const toggleLanguage = () => {
    setLang(prev => prev === 'EN' ? 'हि' : 'EN');
  };

  const getNotificationsList = () => {
    if (!user) return [];
    if (user.role === 'cm' || user.role === 'admin') {
      return [
        { id: 'n1', title: 'Critical SLA Breached', desc: 'Water pipe burst at Dwarka Mor has exceeded 7 days.', time: '10 mins ago', type: 'critical' },
        { id: 'n2', title: 'New Low Citizen Rating', desc: 'Garbage dump clearance in Karol Bagh rated 1 star.', time: '1 hr ago', type: 'warning' },
        { id: 'n3', title: 'CM Tour Scheduled', desc: 'Visit scheduled in West Delhi on June 25th.', time: '2 hrs ago', type: 'info' }
      ];
    }
    if (user.role === 'officer') {
      return [
        { id: 'no1', title: 'New Ticket Assigned', desc: 'A new grievance has been auto-routed to your board.', time: '5 mins ago', type: 'info' },
        { id: 'no2', title: 'Reopened Ticket Alert', desc: 'Grievance DL-2026-3091 reopened due to low review.', time: '4 hrs ago', type: 'warning' }
      ];
    }
    return [
      { id: 'nc1', title: 'Grievance Resolved', desc: 'Your complaint regarding pothole has been marked as Resolved.', time: '1 day ago', type: 'success' }
    ];
  };

  const notifications = getNotificationsList();

  // Determine navbar mode
  // Roles: 'cm', 'admin', 'officer', 'citizen', or guest (no user)
  const isGuest = !user;
  const isCitizen = user?.role === 'citizen';
  const isCM = user?.role === 'cm';
  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';

  return (
    <Box>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1, 
          backgroundColor: darkMode ? '#0A182F' : '#0A2540',
          boxShadow: 3,
          borderBottom: darkMode ? '1px solid rgba(255,255,255,0.08)' : 'none'
        }}
      >
        {/* Tricolor top wave border for CM, citizen, and admin */}
        <Box className="tricolor-wave" />

        <Toolbar sx={{ minHeight: 64, px: { xs: 1.5, md: 3 } }}>
          {/* Menu button for drawers (only shown when sidebar is applicable) */}
          {user && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onToggleSidebar}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo & Emblems based on Role */}
          <Box 
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} 
            onClick={() => navigate(user ? (['cm', 'admin'].includes(user.role) ? '/dashboard' : isOfficer ? '/complaints' : '/') : '/')}
          >
            {/* Custom SVG Indian Emblem representation */}
            <Box 
              sx={{ 
                width: 38, 
                height: 38, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.6)',
                border: '2px solid #0A2540',
                position: 'relative'
              }}
            >
              {/* Ashoka Chakra Center Hub */}
              <Box 
                sx={{ 
                  width: 14, 
                  height: 14, 
                  border: '1.5px dashed #000080', 
                  borderRadius: '50%',
                  animation: 'spin 15s linear infinite',
                  '@keyframes spin': {
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} 
              />
            </Box>

            <Box>
              {isGuest || isCitizen ? (
                <>
                  <Typography 
                    variant="h6" 
                    noWrap 
                    sx={{ 
                      fontFamily: '"Outfit", sans-serif', 
                      fontWeight: 700, 
                      fontSize: { xs: '1rem', md: '1.2rem' }, 
                      letterSpacing: 0.5,
                      background: 'linear-gradient(90deg, #FFFFFF 0%, #E2E8F0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    DELHI CITIZEN PORTAL
                  </Typography>
                  <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 10, letterSpacing: 0.5, color: '#FF9933', mt: -0.5, fontWeight: 700 }}>
                    Aapki Sarkar, Aapke Dwar • आपकी सरकार, आपके द्वार
                  </Typography>
                </>
              ) : isCM ? (
                <>
                  <Typography 
                    variant="h6" 
                    noWrap 
                    sx={{ 
                      fontFamily: '"Outfit", sans-serif', 
                      fontWeight: 700, 
                      fontSize: { xs: '1rem', md: '1.25rem' }, 
                      letterSpacing: 0.5 
                    }}
                  >
                    DELHI CM DASHBOARD
                  </Typography>
                  <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', mt: -0.5, fontWeight: 600 }}>
                    EXECUTIVE GRIEVANCE & DECISION MONITOR
                  </Typography>
                </>
              ) : isAdmin ? (
                <>
                  <Typography 
                    variant="h6" 
                    noWrap 
                    sx={{ 
                      fontFamily: '"Outfit", sans-serif', 
                      fontWeight: 700, 
                      fontSize: { xs: '1.1rem', md: '1.3rem' }, 
                      letterSpacing: 0.5 
                    }}
                  >
                    STATE ADMINISTRATOR PORTAL
                  </Typography>
                  <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 11, letterSpacing: 0.5, color: '#138808', mt: -0.5, fontWeight: 700 }}>
                    GOVERNMENT OF NATIONAL CAPITAL TERRITORY
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" noWrap sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    PWD EXECUTIVE MONITOR
                  </Typography>
                  <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 10, color: 'rgba(255,255,255,0.7)', mt: -0.5 }}>
                    DEPARTMENT PERFORMANCE & COMPLAINT TRACKER
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Sanskrit slogan for State Administrator view in center on desktop */}
          {isAdmin && (
            <Box sx={{ display: { xs: 'none', lg: 'block' }, mx: 'auto', textAlign: 'center' }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontStyle: 'italic', 
                  color: '#FF9933', 
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: 0.5,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                " सर्वे भवन्तु सुखिनः, सर्वे सन्तु निरामयाः "
              </Typography>
            </Box>
          )}

          {/* Right Action Icons & Badges */}
          <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, md: 1.5 }}>
            
            {/* Citizen/Guest specific: Language selector */}
            {(isGuest || isCitizen) && (
              <IconButton color="inherit" onClick={toggleLanguage} size="small" title="Switch Language">
                <Badge badgeContent={lang} color="secondary" sx={{ '& .MuiBadge-badge': { fontSize: 8, height: 14, minWidth: 14 } }}>
                  <Language sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            )}

            {/* Weather widget for CM and Officer dashboards */}
            {(isCM || isOfficer) && (
              <Box 
                sx={{ 
                  display: { xs: 'none', sm: 'flex' }, 
                  alignItems: 'center', 
                  gap: 0.8, 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  px: 1.5, 
                  py: 0.5, 
                  borderRadius: 1.5,
                  border: '1px solid rgba(255,255,255,0.15)'
                }}
              >
                <Cloud sx={{ color: '#E2E8F0', fontSize: 16 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>
                  32°C New Delhi
                </Typography>
              </Box>
            )}

            {/* Dark/Light mode toggle */}
            <IconButton color="inherit" onClick={toggleTheme} size="small" title="Toggle Theme">
              {darkMode ? <LightMode sx={{ color: '#FF9933', fontSize: 20 }} /> : <DarkMode sx={{ fontSize: 20 }} />}
            </IconButton>

            {/* Login button for guest users */}
            {isGuest && location.pathname !== '/login' && (
              <Button 
                variant="contained" 
                color="secondary" 
                size="small"
                onClick={() => navigate('/login')}
                sx={{ 
                  fontWeight: 700, 
                  px: 2, 
                  py: 0.5, 
                  fontSize: 12,
                  boxShadow: 2 
                }}
              >
                Official Login
              </Button>
            )}

            {/* User authenticated block */}
            {user && (
              <>
                {/* Role Chip indicator */}
                <Chip 
                  label={user.role === 'cm' ? "Hon'ble CM" : user.role === 'admin' ? "State Admin" : user.role === 'officer' ? `PWD Officer` : "Citizen"}
                  sx={{ 
                    display: { xs: 'none', sm: 'inline-flex' },
                    backgroundColor: user.role === 'cm' ? '#FF9933' : user.role === 'admin' ? '#138808' : user.role === 'officer' ? '#007FFF' : '#64748B', 
                    color: '#fff', 
                    fontWeight: 800, 
                    fontSize: 10,
                    height: 24,
                    textTransform: 'uppercase',
                    boxShadow: 1
                  }} 
                />

                {/* Notifications Bell */}
                <IconButton color="inherit" size="small" onClick={handleNotifyOpen}>
                  <Badge badgeContent={notifications.length} color="error">
                    <Notifications sx={{ fontSize: 20 }} />
                  </Badge>
                </IconButton>

                <Popover
                  open={Boolean(notifyAnchor)}
                  anchorEl={notifyAnchor}
                  onClose={handleNotifyClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{ sx: { width: 320, borderRadius: '12px', mt: 1.5 } }}
                >
                  <Box sx={{ p: 2, backgroundColor: darkMode ? '#14253F' : '#0A2540', color: '#fff', borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      System Alerts & Updates
                    </Typography>
                  </Box>
                  <List sx={{ py: 0 }}>
                    {notifications.length === 0 ? (
                      <ListItem sx={{ py: 2 }}>
                        <ListItemText primary={<Typography variant="body2" align="center" color="textSecondary">No new alerts</Typography>} />
                      </ListItem>
                    ) : (
                      notifications.map((n) => (
                        <React.Fragment key={n.id}>
                          <ListItem sx={{ py: 1.5, '&:hover': { backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : '#F8FAFC' } }}>
                            <ListItemText
                              primary={
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.2 }}>
                                  {n.type === 'critical' && <WarningIcon sx={{ color: '#D32F2F', fontSize: 16 }} />}
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 12 }}>
                                    {n.title}
                                  </Typography>
                                </Stack>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 11, mb: 0.5 }}>
                                    {n.desc}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 9 }}>
                                    {n.time}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </Popover>

                {/* Profile menu */}
                <IconButton color="inherit" size="small" onClick={handleProfileOpen}>
                  <AccountCircle sx={{ fontSize: 24 }} />
                </IconButton>

                <Menu
                  anchorEl={profileAnchor}
                  open={Boolean(profileAnchor)}
                  onClose={handleProfileClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{ sx: { width: 220, mt: 1.5 } }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {user.full_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', wordBreak: 'break-all' }}>
                      {user.email}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={() => { handleProfileClose(); logout(); navigate('/'); }} sx={{ py: 1, color: '#D32F2F', gap: 1 }}>
                    <ExitToApp sx={{ fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Log Out</Typography>
                  </MenuItem>
                </Menu>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
      {/* Spacer to slide content under navigation */}
      <Toolbar />
    </Box>
  );
}
