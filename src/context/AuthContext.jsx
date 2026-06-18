import React, { createContext, useContext, useState, useEffect } from 'react';
import { isMock, supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const MOCK_USERS = [
  { id: 'cm-user-id', email: 'cm@delhi.gov.in', password: 'password', role: 'cm', full_name: "Hon'ble Chief Minister", district: 'New Delhi' },
  { id: 'admin-user-id', email: 'admin@delhi.gov.in', password: 'password', role: 'admin', full_name: 'Rajesh Kumar (State Admin)', district: 'Central Delhi' },
  { id: 'pwd-officer-id', email: 'pwd.officer@delhi.gov.in', password: 'password', role: 'officer', full_name: 'S.K. Sharma (EE, PWD)', department_name: 'Public Works Department (PWD)', department_code: 'PWD', district: 'North Delhi' },
  { id: 'djb-officer-id', email: 'djb.officer@delhi.gov.in', password: 'password', role: 'officer', full_name: 'Meena Das (AE, DJB)', department_name: 'Delhi Jal Board (DJB)', department_code: 'DJB', district: 'South Delhi' },
  { id: 'mcd-officer-id', email: 'mcd.officer@delhi.gov.in', password: 'password', role: 'officer', full_name: 'Rakesh Yadav (SI, MCD)', department_name: 'MCD Garbage & Sanitation', department_code: 'MCD', district: 'East Delhi' },
  { id: 'discom-officer-id', email: 'discom.officer@delhi.gov.in', password: 'password', role: 'officer', full_name: 'Anil Gupta (SE, DISCOM)', department_name: 'Power & Electricity (DISCOMs)', department_code: 'DISCOM', district: 'West Delhi' },
  { id: 'police-officer-id', email: 'police.officer@delhi.gov.in', password: 'password', role: 'officer', full_name: 'SHO Amit Singh', department_name: 'Delhi Police & Security', department_code: 'POLICE', district: 'New Delhi' },
  { id: 'citizen-user-id', email: 'priya@gmail.com', password: 'password', role: 'citizen', full_name: 'Priya Sharma (Citizen)', district: 'South West Delhi', phone: '9876543210' }
];

const REGISTERED_USERS_KEY = 'delhi_registered_users';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMock) {
      const storedUser = localStorage.getItem('delhi_cm_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    } else {
      const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      };

      getSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const fetchUserProfile = async (supabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, departments(*), officers(id)')
        .eq('id', supabaseUser.id)
        .single();
      
      if (error) throw error;
      
      const profile = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        role: data.role,
        full_name: data.full_name,
        district: data.district,
        phone: data.phone,
        department_id: data.department_id,
        department_name: data.departments?.name,
        department_code: data.departments?.code,
        officer_id: data.officers?.[0]?.id || null
      };
      setUser(profile);
      return profile;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      const guestProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        role: 'citizen',
        full_name: supabaseUser.email.split('@')[0],
        officer_id: null
      };
      setUser(guestProfile);
      return guestProfile;
    }
  };

  const login = async (email, password, mockRole = null) => {
    setLoading(true);
    if (isMock) {
      // 1. Check if quick mock role bypass is selected
      if (mockRole) {
        const matched = MOCK_USERS.find(u => u.role === mockRole);
        if (matched) {
          localStorage.setItem('delhi_cm_user', JSON.stringify(matched));
          setUser(matched);
          setLoading(false);
          return { success: true, user: matched };
        }
      }

      // 2. Search predefined mock users list
      const matchedPredefined = MOCK_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (matchedPredefined) {
        localStorage.setItem('delhi_cm_user', JSON.stringify(matchedPredefined));
        setUser(matchedPredefined);
        setLoading(false);
        return { success: true, user: matchedPredefined };
      }

      // 3. Search local storage registered users list
      const registeredList = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
      const matchedRegistered = registeredList.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (matchedRegistered) {
        localStorage.setItem('delhi_cm_user', JSON.stringify(matchedRegistered));
        setUser(matchedRegistered);
        setLoading(false);
        return { success: true, user: matchedRegistered };
      }

      setLoading(false);
      throw new Error('Invalid email or password. Password is "password".');
    } else {
      // Supabase Live Auth
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // Check if it's one of our predefined quick profiles and they don't exist yet
          const isQuickProfile = MOCK_USERS.some(u => u.email.toLowerCase() === email.toLowerCase());
          if (isQuickProfile && (error.message.includes('Invalid login credentials') || error.status === 400)) {
            console.log(`Demo user ${email} not found. Attempting automatic live database seeding...`);
            
            const matchedMock = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            // Auto register the demo user in Supabase Auth
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password
            });
            
            if (signUpError) throw signUpError;
            
            if (signUpData.user) {
              // Fetch department ID if department_code is provided
              let departmentId = null;
              if (matchedMock.department_code) {
                const { data: dept } = await supabase
                  .from('departments')
                  .select('id')
                  .eq('code', matchedMock.department_code)
                  .single();
                departmentId = dept?.id;
              }

              // Insert into public users profile table
              const { error: profileError } = await supabase
                .from('users')
                .insert([{
                  id: signUpData.user.id,
                  email: email.toLowerCase(),
                  role: matchedMock.role,
                  full_name: matchedMock.full_name,
                  phone: matchedMock.phone || null,
                  district: matchedMock.district || null,
                  department_id: departmentId
                }]);

              if (profileError) throw profileError;
              
              // Retry sign in (will succeed if Confirm Email is disabled in Supabase console)
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email, password });
              if (retryError) throw retryError;
              
              const profile = await fetchUserProfile(retryData.user);
              setLoading(false);
              return { success: true, user: profile };
            }
          }
          throw error;
        }
        const profile = await fetchUserProfile(data.user);
        setLoading(false);
        return { success: true, user: profile };
      } catch (err) {
        setLoading(false);
        throw err;
      }
    }
  };

  const register = async (userData) => {
    setLoading(true);
    const { email, password, fullName, role, phone, district, departmentCode } = userData;

    if (isMock) {
      const registeredList = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || '[]');
      
      // Check if user already exists
      const existsInPredefined = MOCK_USERS.some(u => u.email.toLowerCase() === email.toLowerCase());
      const existsInRegistered = registeredList.some(u => u.email.toLowerCase() === email.toLowerCase());

      if (existsInPredefined || existsInRegistered) {
        setLoading(false);
        throw new Error('An account with this email address already exists.');
      }

      const departmentName = departmentCode === 'PWD' ? 'Public Works Department (PWD)' :
                             departmentCode === 'DJB' ? 'Delhi Jal Board (DJB)' :
                             departmentCode === 'MCD' ? 'MCD Garbage & Sanitation' :
                             departmentCode === 'DISCOM' ? 'Power & Electricity (DISCOMs)' :
                             departmentCode === 'POLICE' ? 'Delhi Police & Security' : '';

      const newMockUser = {
        id: 'user-' + Date.now(),
        email: email.toLowerCase(),
        password,
        role: role || 'citizen',
        full_name: fullName,
        phone: phone || '',
        district: district || 'New Delhi',
        department_code: departmentCode || null,
        department_name: departmentName || null
      };

      registeredList.push(newMockUser);
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registeredList));
      
      // Auto-login after successful registration
      localStorage.setItem('delhi_cm_user', JSON.stringify(newMockUser));
      setUser(newMockUser);
      setLoading(false);
      return { success: true, user: newMockUser };
    } else {
      // Supabase Live signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signUpError) {
        setLoading(false);
        throw signUpError;
      }

      let profile = null;
      if (signUpData.user) {
        // Fetch department ID if departmentCode is provided
        let departmentId = null;
        if (departmentCode) {
          const { data: dept } = await supabase
            .from('departments')
            .select('id')
            .eq('code', departmentCode)
            .single();
          departmentId = dept?.id;
        }

        // Insert into public users profile table
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: signUpData.user.id,
            email: email.toLowerCase(),
            role: role || 'citizen',
            full_name: fullName,
            phone: phone || null,
            district: district || null,
            department_id: departmentId
          }]);

        if (profileError) {
          setLoading(false);
          throw profileError;
        }

        profile = await fetchUserProfile(signUpData.user);
      }
      setLoading(false);
      return { success: true, user: profile };
    }
  };

  const logout = async () => {
    setLoading(true);
    if (isMock) {
      localStorage.removeItem('delhi_cm_user');
      setUser(null);
      setLoading(false);
    } else {
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isMock }}>
      {children}
    </AuthContext.Provider>
  );
};
