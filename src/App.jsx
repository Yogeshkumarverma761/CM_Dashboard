import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar, AppBar, Button, Typography, Container } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Import Pages
import Login from './pages/Login';
import CMDashboard from './pages/CMDashboard';
import Analytics from './pages/Analytics';
import Complaints from './pages/Complaints';
import TrackComplaint from './pages/TrackComplaint';
import Departments from './pages/Departments';
import Officers from './pages/Officers';
import VisitLogs from './pages/VisitLogs';

// Import Layout Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Route Guard to verify role-based permissions
const RouteGuard = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // App loading screen

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized, redirect to their default home
    if (user.role === 'officer') return <Navigate to="/complaints" replace />;
    if (user.role === 'citizen') return <Navigate to="/track" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main Layout Wrapper
function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isLoginPage = location.pathname === '/login';
  
  // Public Citizen tracking view without dashboard wrapper
  const isPublicTrackPage = location.pathname === '/track' && !user;

  if (isLoginPage) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </Box>
    );
  }

  if (isPublicTrackPage) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        <CssBaseline />
        {/* Simple Guest Navbar */}
        <AppBar position="static" sx={{ backgroundColor: '#0A2540', boxShadow: 1 }}>
          <Toolbar>
            <Typography variant="h6" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, flexGrow: 1 }}>
              DELHI CM GRIEVANCES
            </Typography>
            <Button color="inherit" onClick={() => navigate('/login')} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Official Login
            </Button>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 2 }}>
          <Routes>
            <Route path="/track" element={<TrackComplaint />} />
          </Routes>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <CssBaseline />
      
      {/* Top Navbar */}
      <Navbar onToggleSidebar={toggleSidebar} />
      
      {/* Left Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Pane */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - 240px)` },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <Toolbar /> {/* Spacer below navbar */}
        
        <Routes>
          <Route 
            path="/dashboard" 
            element={
              <RouteGuard allowedRoles={['cm', 'admin']}>
                <CMDashboard />
              </RouteGuard>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <RouteGuard allowedRoles={['cm', 'admin']}>
                <Analytics />
              </RouteGuard>
            } 
          />
          <Route 
            path="/complaints" 
            element={
              <RouteGuard allowedRoles={['cm', 'admin', 'officer']}>
                <Complaints />
              </RouteGuard>
            } 
          />
          <Route 
            path="/departments" 
            element={
              <RouteGuard allowedRoles={['cm', 'admin']}>
                <Departments />
              </RouteGuard>
            } 
          />
          <Route 
            path="/officers" 
            element={
              <RouteGuard allowedRoles={['cm', 'admin', 'officer']}>
                <Officers />
              </RouteGuard>
            } 
          />
          <Route 
            path="/visits" 
            element={
              <RouteGuard allowedRoles={['cm', 'admin']}>
                <VisitLogs />
              </RouteGuard>
            } 
          />
          <Route 
            path="/track" 
            element={
              <RouteGuard allowedRoles={['citizen', 'cm', 'admin']}>
                <TrackComplaint />
              </RouteGuard>
            } 
          />
          
          {/* Default Route redirects */}
          <Route 
            path="*" 
            element={
              user ? (
                ['cm', 'admin'].includes(user.role) ? (
                  <Navigate to="/dashboard" replace />
                ) : user.role === 'officer' ? (
                  <Navigate to="/complaints" replace />
                ) : (
                  <Navigate to="/track" replace />
                )
              ) : (
                <Navigate to="/track" replace />
              )
            } 
          />
        </Routes>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}
