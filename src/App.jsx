import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CustomThemeProvider } from './context/ThemeContext';

// Import Pages
import Landing from './pages/Landing';
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
    if (user.role === 'citizen') return <Navigate to="/" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main Layout Wrapper
function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
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
          p: { xs: 2, md: 3 }, 
          width: { md: `calc(100% - 240px)` },
          transition: 'all 0.2s ease-in-out',
          backgroundColor: 'background.default',
          color: 'text.primary',
          minHeight: '100vh'
        }}
      >
        <Toolbar /> {/* Spacer below navbar */}
        
        <Routes>
          {/* Public Citizen Landing Page at / */}
          <Route 
            path="/" 
            element={<Landing />} 
          />
          
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
            element={<TrackComplaint />} 
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
                  <Navigate to="/" replace />
                )
              ) : (
                <Navigate to="/" replace />
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
          <CustomThemeProvider>
            <AppLayout />
          </CustomThemeProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}
