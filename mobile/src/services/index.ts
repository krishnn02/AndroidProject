import api from './api';

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getProfile: () =>
    api.get('/auth/me'),

  logout: () =>
    api.post('/auth/logout'),
};

export const eventApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/events', { params }),

  getById: (id: string) =>
    api.get(`/events/${id}`),

  create: (data: Record<string, any>) =>
    api.post('/events', data),

  update: (id: string, data: Record<string, any>) =>
    api.patch(`/events/${id}`, data),

  delete: (id: string) =>
    api.delete(`/events/${id}`),

  assignUsers: (id: string, userIds: string[]) =>
    api.post(`/events/${id}/assign`, { userIds }),

  getAssignments: (id: string) =>
    api.get(`/events/${id}/assignments`),
};

export const reportApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/reports', { params }),

  getById: (id: string) =>
    api.get(`/reports/${id}`),

  create: (eventId: string, templateId?: string) =>
    api.post('/reports', { eventId, templateId }),

  update: (id: string, data: Record<string, any>) =>
    api.patch(`/reports/${id}`, data),

  updateFrontPage: (id: string, frontPage: Record<string, any>) =>
    api.patch(`/reports/${id}/front-page`, frontPage),

  submit: (id: string) =>
    api.post(`/reports/${id}/submit`),

  approve: (id: string) =>
    api.post(`/reports/${id}/approve`),

  reject: (id: string, note: string) =>
    api.post(`/reports/${id}/reject`, { note }),

  generatePdf: (id: string) =>
    api.get(`/reports/${id}/pdf`),

  // Sections
  addSection: (reportId: string, data: Record<string, any>) =>
    api.post(`/reports/${reportId}/sections`, data),

  updateSection: (sectionId: string, data: Record<string, any>) =>
    api.patch(`/reports/sections/${sectionId}`, data),

  deleteSection: (sectionId: string) =>
    api.delete(`/reports/sections/${sectionId}`),

  reorderSections: (reportId: string, sectionIds: string[]) =>
    api.patch(`/reports/${reportId}/sections/reorder`, { sectionIds }),

  // Budgets
  addBudget: (reportId: string, data: Record<string, any>) =>
    api.post(`/reports/${reportId}/budgets`, data),

  updateBudget: (budgetId: string, data: Record<string, any>) =>
    api.patch(`/reports/budgets/${budgetId}`, data),

  deleteBudget: (budgetId: string) =>
    api.delete(`/reports/budgets/${budgetId}`),
};

export const imageApi = {
  upload: (sectionId: string, formData: FormData) =>
    api.post(`/images/sections/${sectionId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),

  delete: (id: string) =>
    api.delete(`/images/${id}`),

  reorder: (sectionId: string, imageIds: string[]) =>
    api.patch(`/images/sections/${sectionId}/reorder`, { imageIds }),

  uploadLogo: (formData: FormData) =>
    api.post('/images/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const notificationApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/notifications', { params }),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/notifications/read-all'),
};

export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getEventAnalytics: () => api.get('/analytics/events'),
  getReportAnalytics: () => api.get('/analytics/reports'),
};

export const userApi = {
  getAll: (params?: Record<string, any>) =>
    api.get('/users', { params }),

  getById: (id: string) =>
    api.get(`/users/${id}`),

  create: (data: Record<string, any>) =>
    api.post('/auth/register', data),

  update: (id: string, data: Record<string, any>) =>
    api.patch(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/users/${id}`),
};
