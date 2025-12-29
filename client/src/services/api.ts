import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
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
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout')
};

// Documents
export const documentApi = {
  list: () => api.get('/api/documents'),
  create: (data: { title: string; htmlContent?: string }) =>
    api.post('/api/documents', data),
  upload: (formData: FormData) =>
    api.post('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  get: (id: string) => api.get(`/api/documents/${id}`),
  update: (id: string, data: { title?: string; htmlContent?: string }) =>
    api.put(`/api/documents/${id}`, data),
  delete: (id: string) => api.delete(`/api/documents/${id}`),
  getPdfUrl: (id: string) => `${API_URL}/api/documents/${id}/pdf`,
  generatePdf: (id: string) => api.post(`/api/documents/${id}/generate-pdf`),
  send: (id: string) => api.post(`/api/documents/${id}/send`),
  void: (id: string) => api.post(`/api/documents/${id}/void`),
  getAudit: (id: string) => api.get(`/api/documents/${id}/audit`)
};

// Recipients
export const recipientApi = {
  add: (documentId: string, data: { name: string; email: string; signingOrder?: number }) =>
    api.post(`/api/documents/${documentId}/recipients`, data),
  update: (recipientId: string, data: { name?: string; email?: string; signingOrder?: number }) =>
    api.put(`/api/documents/recipients/${recipientId}`, data),
  delete: (recipientId: string) =>
    api.delete(`/api/documents/recipients/${recipientId}`)
};

// Fields
export const fieldApi = {
  add: (documentId: string, data: {
    recipientId: string;
    fieldType: string;
    pageNumber: number;
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    isRequired?: boolean;
  }) => api.post(`/api/documents/${documentId}/fields`, data),
  update: (fieldId: string, data: {
    xPercent?: number;
    yPercent?: number;
    widthPercent?: number;
    heightPercent?: number;
    isRequired?: boolean;
  }) => api.put(`/api/documents/fields/${fieldId}`, data),
  delete: (fieldId: string) => api.delete(`/api/documents/fields/${fieldId}`)
};

// Signing (public - no auth token)
export const signApi = {
  getPage: (documentId: string, token: string) =>
    axios.get(`${API_URL}/sign/${documentId}/${token}`),
  getPdfUrl: (documentId: string, token: string) =>
    `${API_URL}/sign/${documentId}/${token}/pdf`,
  submitSignature: (documentId: string, token: string, data: { fieldId: string; value: string }) =>
    axios.post(`${API_URL}/sign/${documentId}/${token}/signature`, data),
  complete: (documentId: string, token: string) =>
    axios.post(`${API_URL}/sign/${documentId}/${token}/complete`),
  decline: (documentId: string, token: string, data?: { reason?: string }) =>
    axios.post(`${API_URL}/sign/${documentId}/${token}/decline`, data)
};

export default api;
