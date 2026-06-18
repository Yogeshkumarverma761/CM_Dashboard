import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Chip, IconButton, Badge, Menu, MenuItem, Popover, List, ListItem, ListItemText, Divider, Stack } from '@mui/material';
import { Menu as MenuIcon, Notifications, AccountCircle, ExitToApp, Warning as WarningIcon, QueryBuilder as ClockIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Anchor States
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [notifyAnchor, setNotifyAnchor] = useState(null);

  const handleProfileOpen = (event) => setProfileAnchor(event.currentTarget);
  const handleProfileClose = () => setProfileAnchor(null);

  const handleNotifyOpen = (event) => setNotifyAnchor(event.currentTarget);
  const handleNotifyClose = () => setNotifyAnchor(null);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'cm': return 'Hon\'ble CM Cell';
      case 'admin': return 'State Admin';
      case 'officer': return `Officer (${user?.department_code || 'Dept'})`;
      case 'citizen': return 'Citizen';
      default: return 'User';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'cm': return '#FF9933';
      case 'admin': return '#138808';
      case 'officer': return '#007FFF';
      case 'citizen': return '#64748B';
      default: return '#999';
    }
  };

  // Mock Notification alerts based on role
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
        { id: 'no2', title: 'Reopened Ticket Alert', desc: 'Grievance DL-2026-3091 reopened due to low citizen review.', time: '4 hrs ago', type: 'warning' }
      ];
    }
    return [
      { id: 'nc1', title: 'Grievance Status Updated', desc: 'Your pothole complaint is now marked as Resolved.', time: '1 day ago', type: 'success' }
    ];
  };

  const notifications = getNotificationsList();

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#0A2540', boxShadow: 3 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo emblem */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Box sx={{ 
            width: 34, 
            height: 34, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #FF9933 30%, #FFFFFF 50%, #138808 70%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 4px rgba(255,255,255,0.8)',
            border: '2px solid #0A2540'
          }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0A2540', fontSize: 10 }}>DL</Typography>
          </Box>
          <Box>
            <Typography variant="h6" noWrap component="div" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, letterSpacing: 0.5, fontSize: { xs: '1rem', md: '1.25rem' } }}>
              DELHI GOVERNMENT
            </Typography>
            <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', mt: -0.5, fontWeight: 500 }}>
              CM GRIEVANCE REDRESSAL MONITOR
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Chip 
              label={getRoleLabel(user.role)}
              sx={{ 
                backgroundColor: getRoleColor(user.role), 
                color: '#fff', 
                fontWeight: 700, 
                fontSize: 11,
                fontFamily: '"Inter", sans-serif',
                height: 26,
                textTransform: 'uppercase',
                boxShadow: 1
              }} 
            />
            
            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#fff', fontSize: 13, lineHeight: 1.2 }}>
                {user.full_name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                {user.district || 'National Capital Territory'}
              </Typography>
            </Box>

            {/* Notification bell triggers popover */}
            <IconButton color="inherit" size="small" onClick={handleNotifyOpen}>
              <Badge badgeContent={notifications.length} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            <Popover
              open={Boolean(notifyAnchor)}
              anchorEl={notifyAnchor}
              onClose={handleNotifyClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { width: 320, borderRadius: '12px', border: '1px solid #E2E8F0', mt: 1 } }}
            >
              <Box sx={{ p: 2, backgroundColor: '#0A2540', color: '#fff', borderTopLeftRadius: '11px', borderTopRightRadius: '11px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Recent System Notifications
                </Typography>
              </Box>
              <List sx={{ py: 0 }}>
                {notifications.map((n) => (
                  <React.Fragment key={n.id}>
                    <ListItem sx={{ py: 1.5, '&:hover': { backgroundColor: '#F8FAFC' } }}>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.2 }}>
                            {n.type === 'critical' && <WarningIcon sx={{ color: '#B91C1C', fontSize: 16 }} />}
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 12, color: '#1E293B' }}>
                              {n.title}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#64748B', fontSize: 11, mb: 0.5 }}>
                              {n.desc}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 9 }}>
                              {n.time}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Popover>

            {/* Profile Avatar triggers menu */}
            <IconButton color="inherit" size="small" onClick={handleProfileOpen}>
              <AccountCircle />
            </IconButton>

            <Menu
              anchorEl={profileAnchor}
              open={Boolean(profileAnchor)}
              onClose={handleProfileClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { width: 220, borderRadius: '12px', border: '1px solid #E2E8F0', mt: 1 } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0A2540' }}>
                  {user.full_name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block', wordBreak: 'break-all' }}>
                  {user.email}
                </Typography>
                {user.phone && (
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                    Tel: {user.phone}
                  </Typography>
                )}
              </Box>
              <Divider />
              <MenuItem onClick={() => { handleProfileClose(); logout(); }} sx={{ py: 1, color: '#B91C1C', gap: 1 }}>
                <ExitToApp sx={{ fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Log Out</Typography>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
