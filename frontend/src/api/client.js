import axios from 'axios';
import { getCacheKey, getCached, setCached, invalidateCache, clearAllCache } from './cache';

// Dual backend configuration
const DEPLOYED_URL = import.meta.env.VITE_DEPLOYED_API_URL || import.meta.env.VITE_API_URL || '';
const LOCAL_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:5000/api';

let activeBaseURL = DEPLOYED_URL || LOCAL_URL;
let fallbackBaseURL = DEPLOYED_URL && LOCAL_URL && DEPLOYED_URL !== LOCAL_URL 
  ? (activeBaseURL === DEPLOYED_URL ? LOCAL_URL : DEPLOYED_URL)
  : (activeBaseURL !== LOCAL_URL ? LOCAL_URL : '');

const api = axios.create({
  baseURL: activeBaseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Switch active URL on connectivity failure
function switchToFallbackURL(failedURL) {
  if (!fallbackBaseURL || failedURL !== activeBaseURL) {
    return false;
  }
  const prevURL = activeBaseURL;
  activeBaseURL = fallbackBaseURL;
  fallbackBaseURL = prevURL;
  api.defaults.baseURL = activeBaseURL;
  console.warn(`[API Resolver] Switched backend from ${prevURL} to ${activeBaseURL}`);
  return true;
}

// Request interceptor: attach token and active base URL
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp360_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.baseURL) {
    config.baseURL = activeBaseURL;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: auto invalidation & automatic failover retry
api.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || 'get').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const tags = getTagsForUrl(response.config?.url || '');
      if (tags.length > 0) {
        invalidateCache(tags);
      }
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
    const isServerUnavailable = error.response && [502, 503, 504].includes(error.response.status);

    if ((isNetworkError || isServerUnavailable) && originalRequest && !originalRequest._isRetry) {
      originalRequest._isRetry = true;

      const switched = switchToFallbackURL(originalRequest.baseURL || activeBaseURL);
      if (switched) {
        originalRequest.baseURL = activeBaseURL;
        const token = localStorage.getItem('pp360_token');
        if (token) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      }
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('pp360_token');
      clearAllCache();
      window.dispatchEvent(new CustomEvent('pp360_unauthorized', { detail: error.response?.data?.message }));
    }

    const msg = error.response?.data?.message || error.message || 'An unexpected API error occurred.';
    return Promise.reject(new Error(msg));
  }
);

// Map mutation URL to affected cache tags
function getTagsForUrl(url) {
  const lower = url.toLowerCase();
  const tags = [];
  if (lower.includes('/employee')) tags.push('employees', 'dashboard', 'payruns');
  if (lower.includes('/contract')) tags.push('contracts', 'employees', 'dashboard', 'payruns');
  if (lower.includes('/attendance')) tags.push('attendance', 'dashboard', 'employees');
  if (lower.includes('/time-off')) tags.push('time-off', 'dashboard', 'employees');
  if (lower.includes('/salary')) tags.push('salary', 'payruns', 'dashboard');
  if (lower.includes('/payrun')) tags.push('payruns', 'dashboard', 'employees');
  if (lower.includes('/schedule')) tags.push('schedules', 'attendance', 'employees');
  return tags;
}

// Client cache GET wrapper with user-scoped key
api.getFetch = async (url, config = {}) => {
  const useCache = config.useCache !== false;
  const token = localStorage.getItem('pp360_token') || 'anon';
  const userScope = token.slice(-8);
  const key = getCacheKey(url, config.params || {}, userScope);

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

// Invalidate specific tags
api.invalidate = (tags) => {
  invalidateCache(tags);
};

api.getActiveBaseURL = () => activeBaseURL;
api.getFallbackBaseURL = () => fallbackBaseURL;

export default api;
