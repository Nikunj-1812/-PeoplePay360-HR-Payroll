import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { clearAllCache } from '../api/cache';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('pp360_token');
      if (token) {
        try {
          // Verify user role directly from backend
          const res = await api.get('/auth/me');
          if (res && res.data) {
            setUser(res.data);
          } else {
            throw new Error('Invalid user payload');
          }
        } catch (err) {
          console.warn('Auth session expired or invalid:', err.message);
          localStorage.removeItem('pp360_token');
          clearAllCache();
          setUser(null);
        }
      } else {
        clearAllCache();
        setUser(null);
      }
      setLoading(false);
    }

    loadUser();

    const handleUnauthorized = () => {
      clearAllCache();
      setUser(null);
    };

    window.addEventListener('pp360_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pp360_unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    // Clear previous client cache on login
    clearAllCache();
    
    // Authenticate through backend
    const res = await api.post('/auth/login', { email, password });
    if (!res || !res.token || !res.user) {
      throw new Error(res?.message || 'Authentication failed');
    }

    localStorage.setItem('pp360_token', res.token);

    // Fetch authoritative backend user record
    try {
      const meRes = await api.get('/auth/me');
      setUser(meRes.data || res.user);
      return meRes.data || res.user;
    } catch {
      setUser(res.user);
      return res.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('pp360_token');
    clearAllCache();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
