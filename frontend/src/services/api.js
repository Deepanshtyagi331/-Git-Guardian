import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
  const response = await api.post('/auth/login', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const updateProfile = async (userData) => {
  const response = await api.put('/auth/profile', userData);
  if (response.data) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    localStorage.setItem('user', JSON.stringify({ ...currentUser, ...response.data }));
  }
  return response.data;
};

export const getScans = async () => {
  const response = await api.get('/scans');
  return response.data;
};

export const createScan = async (scanData) => {
  const response = await api.post('/scans', scanData);
  return response.data;
};

export const getScan = async (id) => {
  const response = await api.get(`/scans/${id}`);
  return response.data;
};

export const cancelScan = async (id) => {
  const response = await api.post(`/scans/${id}/cancel`);
  return response.data;
};

export const getGithubRepos = async (username) => {
  const response = await api.get(`/scans/github-repos/${username}`);
  return response.data;
};

// Admin
export const getSystemStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};


export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getActivityLogs = async () => {
  const response = await api.get('/admin/activity');
  return response.data;
};

export default api;
