import axios from 'axios';
import { ENDPOINTS } from './endpoints';
import env from '../utils/config/env';

// Base instance
const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true, // Crucial for HTTP-only cookies & CSRF
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: env.API_TIMEOUT,
});

// Request Interceptor
api.interceptors.request.use((config) => {
  // Most components use 'authToken', but fallback to 'token' just in case
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach tenant slug from active tenant store if available
  // Check multiple possible keys for tenant slug
  let tenantSlug =
    localStorage.getItem('tenant_slug') ||
    localStorage.getItem('tenantSlug');

  // If not found, try to extract from stored user data
  if (!tenantSlug) {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      // Check various possible fields in user data
      tenantSlug = userData.tenantSlug ||
        userData.tenant_slug ||
        userData.tenant?.slug ||
        null;
    } catch (e) {
      // Ignore parsing errors
    }
  }

  // Default to system_shared if still not found
  config.headers['x-tenant-slug'] = tenantSlug || 'system_shared';

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor for Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt refresh for login/refresh endpoints to avoid loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const refreshUrl = env.API_URL + ENDPOINTS.AUTH.REFRESH;
        // Include refreshToken in request body
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // No refresh token available, clear auth and reject
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          return Promise.reject(error);
        }

        const response = await axios.post(refreshUrl, { refreshToken }, { withCredentials: true });

        if (response.data?.token || response.data?.accessToken) {
          const newToken = response.data.token || response.data.accessToken;
          localStorage.setItem('authToken', newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Clear auth details on failure
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Optionally redirect to login here, but better handled by hooks/components
        // window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
