import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

// Invoices
export const invoiceAPI = {
  submit: (data) => API.post('/invoices', data),
  getMy: () => API.get('/invoices/my'),
  getAll: (params) => API.get('/invoices', { params }),
  getById: (id) => API.get(`/invoices/${id}`),
  approve: (id, data) => API.patch(`/invoices/${id}/approve`, data),
  reject: (id, data) => API.patch(`/invoices/${id}/reject`, data),
  fbrCheck: (id) => API.get(`/invoices/${id}/fbr-check`),
  creditCheck: (id) => API.get(`/invoices/${id}/credit-check`),
};

// Investments
export const investmentAPI = {
  place: (data) => API.post('/investments', data),
  getMy: () => API.get('/investments/my'),
};

// Wallet
export const walletAPI = {
  get: () => API.get('/wallet'),
  topup: (data) => API.post('/wallet/topup', data),
  withdraw: (data) => API.post('/wallet/withdraw', data),
};

// Notifications
export const notificationAPI = {
  getAll: () => API.get('/notifications'),
  markAllRead: () => API.put('/notifications/read-all'),
};

// Admin
export const adminAPI = {
  getUsers: (params) => API.get('/admin/users', { params }),
  activateUser: (id) => API.patch(`/admin/users/${id}/activate`),
  blockUser: (id) => API.patch(`/admin/users/${id}/block`),
  getInvoices: (params) => API.get('/admin/invoices', { params }),
  getStats: () => API.get('/admin/stats'),
};

export default API;
