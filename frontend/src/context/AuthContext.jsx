import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        }
      } else {
        // Auto-login default demo user (HR Payroll Manager)
        try {
          const loginRes = await api.post('/auth/login', {
            email: 'payroll.manager@peoplepay360.com',
            password: 'password123'
          });
          localStorage.setItem('pp360_token', loginRes.token);
          setUser(loginRes.user);
        } catch (e) {
          console.error('Demo auto-login failed:', e.message);
        }
      }
      setLoading(false);
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('pp360_token', res.token);
    setUser(res.user);
    return res.user;
  };

  const switchRole = async (newRole) => {
    try {
      const res = await api.post('/auth/switch-role', { role: newRole });
      setUser(res.data);
    } catch (err) {
      console.error('Role switch failed:', err.message);
      setUser(prev => prev ? { ...prev, role: newRole } : null);
    }
  };

  const logout = () => {
    localStorage.removeItem('pp360_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
