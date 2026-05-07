import axios from 'axios';

// Robust API URL construction
const rawEnvUrl = import.meta.env.VITE_API_URL;
console.log('[API Debug] Raw VITE_API_URL from environment:', rawEnvUrl);

let baseURL = rawEnvUrl || '/api';

// Handle absolute URLs (production)
if (baseURL.startsWith('http')) {
  baseURL = baseURL.replace(/\/+$/, '');
  if (!baseURL.endsWith('/api') && !baseURL.includes('/api/')) {
    baseURL += '/api';
  }
}

if (!baseURL.endsWith('/')) {
  baseURL += '/';
}

console.log('[API Debug] Resolved Final BaseURL:', baseURL);

const api = axios.create({
  baseURL,
  timeout: 120000,
});

// Attach custom JWT session token to every request
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Log failed responses for easier debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error] Request Failed:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      fullUrl: error.config?.baseURL + error.config?.url,
      message: error.response?.data?.message || error.message,
    });
    return Promise.reject(error);
  }
);

// ── Auth (Custom Backend) ─────────────────────────────────────────────────────

export const login = async (credentials) => {
  const response = await api.post('auth/login', credentials);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('auth/register', userData);
  return response.data;
};

export const verifyEmail = async (token, email) => {
  const response = await api.get(`auth/verify-email?token=${token}&email=${email}`);
  return response.data;
};

export const logout = async () => {
  localStorage.removeItem('token');
};


// ── Profile ───────────────────────────────────────────────────────────────────

export const updateProfile = async (userData) => {
  const response = await api.put('auth/profile', userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('auth/me');
  return response.data;
};

// ── MFA ───────────────────────────────────────────────────────────────────────

export const verifyMfaLogin = async (data) => {
  const response = await api.post('auth/mfa/verify', data);
  return response.data;
};

export const setupMfa = async () => {
  const response = await api.post('auth/mfa/setup');
  return response.data;
};

export const enableMfa = async (token) => {
  const response = await api.post('auth/mfa/enable', { token });
  return response.data;
};

export const disableMfa = async (token) => {
  const response = await api.post('auth/mfa/disable', { token });
  return response.data;
};

// ── Scans ─────────────────────────────────────────────────────────────────────

export const getScans = async () => {
  const response = await api.get('scans');
  return response.data;
};

export const createScan = async (scanData) => {
  const response = await api.post('scans', scanData);
  return response.data;
};

export const getScan = async (id) => {
  const response = await api.get(`scans/${id}`);
  return response.data;
};

export const cancelScan = async (id) => {
  const response = await api.post(`scans/${id}/cancel`);
  return response.data;
};

export const getGithubRepos = async (username) => {
  const response = await api.get(`scans/github-repos/${username}`);
  return response.data;
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getSystemStats = async () => {
  const response = await api.get('admin/stats');
  return response.data;
};

export const getAllUsers = async () => {
  const response = await api.get('admin/users');
  return response.data;
};

export const getActivityLogs = async () => {
  const response = await api.get('admin/activity');
  return response.data;
};

export default api;
