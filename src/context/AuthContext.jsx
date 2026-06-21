import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, getToken, setToken, clearToken } from '../services/apiClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Demo users for quick-login buttons (credentials match the seeded database)
export const MOCK_USERS = [
  { email: 'cm@delhi.gov.in', role: 'cm', label: "Chief Minister", password: 'password' },
  { email: 'admin@delhi.gov.in', role: 'admin', label: "State Administrator", password: 'password' },
  { email: 'pwd.officer@delhi.gov.in', role: 'officer', label: "PWD Officer", password: 'password' },
  { email: 'djb.officer@delhi.gov.in', role: 'officer', label: "DJB Officer", password: 'password' },
  { email: 'mcd.officer@delhi.gov.in', role: 'officer', label: "MCD Officer", password: 'password' },
  { email: 'discom.officer@delhi.gov.in', role: 'officer', label: "DISCOM Officer", password: 'password' },
  { email: 'police.officer@delhi.gov.in', role: 'officer', label: "Police Officer", password: 'password' },
  { email: 'priya@gmail.com', role: 'citizen', label: "Citizen (Priya)", password: 'password' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from token on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await apiClient.get('/api/auth/me');
        setUser(profile);
      } catch {
        // Token expired or invalid — clear it
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ─── Login ────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await apiClient.post('/api/auth/login', { email, password });
      setToken(result.token);
      setUser(result.user);
      setLoading(false);
      return { success: true, user: result.user };
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // ─── Register ─────────────────────────────────────────────
  const register = async (userData) => {
    setLoading(true);
    const { email, password, fullName, role, phone, district, departmentCode } = userData;
    try {
      const result = await apiClient.post('/api/auth/register', {
        email, password, fullName, role, phone, district, departmentCode
      });
      setToken(result.token);
      setUser(result.user);
      setLoading(false);
      return { success: true, user: result.user };
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // ─── Logout ───────────────────────────────────────────────
  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isMock: false }}>
      {children}
    </AuthContext.Provider>
  );
};
