
import axios from 'axios';
import { API_BASE_URL } from '../constants';

// Create specialized axios instance with credentials for HttpOnly cookies
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle token expiry (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we get a 401 and it's not a refresh request itself
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the accessToken using the refreshToken cookie
        await api.post('/auth/refresh');
        // If successful, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, the user needs to login again
        window.dispatchEvent(new CustomEvent('auth-failure'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
