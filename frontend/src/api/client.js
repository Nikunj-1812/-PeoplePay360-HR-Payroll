import axios from 'axios';
import { getCacheKey, getCached, setCached, invalidateCache } from './cache';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp360_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('pp360_token');
      invalidateCache();
      window.dispatchEvent(new CustomEvent('pp360_unauthorized', { detail: error.response?.data?.message }));
    }
    const msg = error.response?.data?.message || error.message || 'An unexpected API error occurred.';
    return Promise.reject(new Error(msg));
  }
);

// Map mutation endpoints to affected cache tags for automatic invalidation
function getTagsForUrl(url) {
  const lower = url.toLowerCase();
  const tags = [];
  if (lower.includes('/employee')) tags.push('employees', 'dashboard', 'payruns');
  if (lower.includes('/contract')) tags.push('contracts', 'employees', 'dashboard', 'payruns');
  if (lower.includes('/attendance')) tags.push('attendance', 'dashboard');
  if (lower.includes('/time-off')) tags.push('time-off', 'dashboard');
  if (lower.includes('/salary')) tags.push('salary', 'payruns', 'dashboard');
  if (lower.includes('/payrun')) tags.push('payruns', 'dashboard', 'employees');
  if (lower.includes('/schedule')) tags.push('schedules', 'attendance');
  return tags;
}

// Wrapper for GET requests with client caching
api.getFetch = async (url, config = {}) => {
  const useCache = config.useCache !== false;
  const key = getCacheKey(url, config.params || {});
  
  if (useCache) {
    const cached = getCached(key);
    if (cached) return cached;
  }

  const res = await api.get(url, config);
  if (useCache && res) {
    const tags = getTagsForUrl(url);
    setCached(key, res, tags);
  }
  return res;
};

// Helper for invalidating cache on mutations
api.invalidate = (tags) => {
  invalidateCache(tags);
};

export default api;

