import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
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

// E-Books API
export const ebooksAPI = {
  getAll: (params = {}) => api.get('/api/ebooks', { params }),
  getById: (id) => api.get(`/api/ebooks/${id}`),
  getCategories: () => api.get('/api/ebooks/categories'),
};

// Cart API
export const cartAPI = {
  get: () => api.get('/api/cart'),
  addItem: (data) => api.post('/api/cart/items', data),
  updateItem: (id, data) => api.put(`/api/cart/items/${id}`, data),
  removeItem: (id) => api.delete(`/api/cart/items/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/api/orders', data),
  uploadPaymentSlip: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/orders/payment-slip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: () => api.get('/api/orders'),
  getById: (id) => api.get(`/api/orders/${id}`),
  cancel: (id) => api.post(`/api/orders/${id}/cancel`),
  getDownloadUrl: (path) => `${API_URL}${path}`,
};

// Wishlist API
export const wishlistAPI = {
  get: () => api.get('/api/wishlist'),
  add: (ebookId) => api.post(`/api/wishlist/${ebookId}`),
  remove: (ebookId) => api.delete(`/api/wishlist/${ebookId}`),
};

// Reviews API
export const reviewsAPI = {
  getByEbook: (ebookId) => api.get(`/api/reviews/ebook/${ebookId}`),
  create: (ebookId, data) => api.post(`/api/reviews/ebook/${ebookId}`, data),
};

export default api;