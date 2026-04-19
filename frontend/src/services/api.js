// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

// Helper: converts a stored image path to a full URL
// Local disk images are stored as "/uploads/filename.jpg"
// Cloudinary images are already full "https://..." URLs
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;           // Cloudinary
  return `http://localhost:5000${path}`;              // Local disk
};

export default api;