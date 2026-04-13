import axios from 'axios';

// Robust API URL construction
let baseURL = import.meta.env.VITE_API_URL || '/api';

// Handle absolute URLs (production)
if (baseURL.startsWith('http')) {
  // Clean multiple trailing slashes and normalize
  baseURL = baseURL.replace(/\/+$/, '');
  
  // Ensure the /api path is present
  if (!baseURL.endsWith('/api')) {
    baseURL += '/api';
  }
}

// Ensure it always ends with a single trailing slash for Axios consistency
if (!baseURL.endsWith('/')) {
  baseURL += '/';
}

console.log('Final API Base URL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = async (userData) => {
  const response = await api.post('auth/login', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('auth/register', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const updateProfile = async (userData) => {
  const response = await api.put('auth/profile', userData);
  if (response.data) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    localStorage.setItem('user', JSON.stringify({ ...currentUser, ...response.data }));
  }
  return response.data;
};

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

// Admin
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
