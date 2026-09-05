import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { invalidateCache } from '../api/cache';

const AuthContext = createContext();

const DEMO_CREDENTIALS = {
  admin: { email: 'admin@peoplepay360.com', pass: 'Admin@123', label: 'Admin' },
  hr_payroll_manager: { email: 'payrollmanager@peoplepay360.com', pass: 'PayrollManager@123', label: 'HR Payroll Manager' },
  hr_payroll_user: { email: 'payrolluser@peoplepay360.com', pass: 'PayrollUser@123', label: 'HR Payroll User' },
  hr_manager: { email: 'hrmanager@peoplepay360.com', pass: 'HRManager@123', label: 'HR Manager' },
  employee: { email: 'employee@peoplepay360.com', pass: 'Employee@123', label: 'Employee' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switchingRoleMsg, setSwitchingRoleMsg] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('pp360_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.warn('Auth token expired or invalid:', err.message);
          localStorage.removeItem('pp360_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    loadUser();

    const handleUnauthorized = () => {
      invalidateCache();
      setUser(null);
    };

    window.addEventListener('pp360_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pp360_unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    invalidateCache();
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('pp360_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const switchRole = async (targetRole) => {
    const creds = DEMO_CREDENTIALS[targetRole] || DEMO_CREDENTIALS.admin;
    setSwitchingRoleMsg(`Switching demo account to ${creds.label}...`);
    invalidateCache();
    
    try {
      const res = await api.post('/auth/login', { email: creds.email, password: creds.pass });
      localStorage.setItem('pp360_token', res.token);
      setUser(res.user);
      invalidateCache();
      return { success: true, user: res.user, label: creds.label };
    } catch (err) {
      console.error('Demo account authentication failed:', err.message);
      throw err;
    } finally {
      setSwitchingRoleMsg(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('pp360_token');
    invalidateCache();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, switchingRoleMsg, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
