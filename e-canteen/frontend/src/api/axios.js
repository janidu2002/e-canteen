import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject({ ...error, message });
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Menu API
export const menuAPI = {
  getAll: (params) => api.get('/menu', { params }),
  getById: (id) => api.get(`/menu/${id}`),
  getRecent: () => api.get('/menu/recent'),
  getCategories: () => api.get('/menu/categories'),
  getLowStock: () => api.get('/menu/admin/low-stock'),
  create: (data) => api.post('/menu', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/menu/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/menu/${id}`),
};

// Order API
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getMyOrders: () => api.get('/orders/my-orders'),
  getById: (id) => api.get(`/orders/${id}`),
  getStats: () => api.get('/orders/stats'),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  cancel: (id) => api.put(`/orders/${id}/cancel`),
};

// Notification API
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getMine: () => api.get('/notifications/my-notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};
