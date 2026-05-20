import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// === Auth API ===
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// === Users API ===
export const usersApi = {
  getAll: (params?: Record<string, any>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, any>) => api.post('/auth/register', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// === Events API ===
export const eventsApi = {
  getAll: (params?: Record<string, any>) => api.get('/events', { params }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: Record<string, any>) => api.post('/events', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  assign: (id: string, userIds: string[]) => api.post(`/events/${id}/assign`, { userIds }),
  getAssignments: (id: string) => api.get(`/events/${id}/assignments`),
};

// === Reports API ===
export const reportsApi = {
  getAll: (params?: Record<string, any>) => api.get('/reports', { params }),
  getById: (id: string) => api.get(`/reports/${id}`),
  approve: (id: string) => api.post(`/reports/${id}/approve`),
  reject: (id: string, note: string) => api.post(`/reports/${id}/reject`, { note }),
  generatePdf: (id: string) => api.get(`/reports/${id}/pdf`),
};

// === Analytics API ===
export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  events: () => api.get('/analytics/events'),
  reports: () => api.get('/analytics/reports'),
};
