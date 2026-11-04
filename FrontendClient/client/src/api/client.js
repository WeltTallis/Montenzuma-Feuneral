import axios from 'axios';
import { ENDPOINTS } from './endpoints';
import env from '../utils/config/env';
import { isAppPath } from '../utils/globalAuth';

// ─── Refresh Queue ──────────────────────────────────────────────────────────
// Prevents multiple concurrent refresh attempts when multiple requests fail
// simultaneously with 401. All failed requests are queued and retried once
// the refresh completes (or rejected if refresh fails).
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token) => {
  refreshSubscribers.map(callback => callback(token));
  refreshSubscribers = [];
};

const onTokenRefreshFailed = () => {
  refreshSubscribers = [];
};

// ─── Auth Event Dispatch ────────────────────────────────────────────────────
// Dispatches a custom event that AuthContext listens for to trigger logout.
// This avoids using alert() and provides a clean way to handle auth state.
const dispatchAuthEvent = (eventType, detail = {}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-event', {
      detail: { type: eventType, ...detail }
    }));
  }
};

// ─── Clear Auth Storage ─────────────────────────────────────────────────────
const clearAuthStorage = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
};

// ─── Base Instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: env.API_URL,
  withCredentials: true, // Crucial for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: env.API_TIMEOUT,
});

// Request Interceptor
api.interceptors.request.use((config) => {
  if (/\/auth\/(login|refresh)(?:$|[?#])/.test(config.url || '')) {
    config.headers['x-auth-cookie'] = '1';
  }
  // Most components use 'authToken', but fallback to 'token' just in case
  const token = '';
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Attach tenant slug from active tenant store if available
  let tenantSlug =
    localStorage.getItem('tenant_slug') ||
    localStorage.getItem('tenantSlug');

  // If not found, try to extract from stored user data
  if (!tenantSlug) {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
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

  // Attach branch context so microservices can route to the correct branch DB
  // for multi-branch tenants (branchSlug / branchDbName are the branch scope).
  const branchSlug = localStorage.getItem('branchSlug') || sessionStorage.getItem('branchSlug');
  const branchId = localStorage.getItem('branchId');
  const branchDbName = localStorage.getItem('branchDbName');
  if (branchSlug && branchSlug !== 'undefined' && branchSlug !== 'null') {
    config.headers['x-branch-slug'] = branchSlug;
  }
  if (branchDbName && branchDbName !== 'undefined' && branchDbName !== 'null') {
    config.headers['x-branch-db'] = branchDbName;
  }
  if (branchId && branchId !== 'undefined' && branchId !== 'null') {
    config.headers['x-branch-id'] = branchId;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor for Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt refresh for auth endpoints to avoid loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/logout');

    // Handle 401 Unauthorized - try token refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue the request - it will be retried when refresh completes
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (token) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              delete originalRequest.headers['Authorization'];
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshUrl = env.API_URL + ENDPOINTS.AUTH.REFRESH;
        // The refresh token is sent via httpOnly cookie (withCredentials: true)
        // We also send it from localStorage as a fallback for backward compatibility
        const response = await axios.post(
          refreshUrl,
          {},
          { withCredentials: true, headers: { 'x-auth-cookie': '1' } }
        );

        const newToken = '';

        if (response.data?.success) {
          // Update token in localStorage
          // Retry all queued requests
          onTokenRefreshed(true);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          delete originalRequest.headers['Authorization'];
          return api(originalRequest);
        } else {
          // No token returned - refresh failed
          throw new Error('No token in refresh response');
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        onTokenRefreshFailed();
        clearAuthStorage();
        dispatchAuthEvent('logout', {
          reason: 'Token refresh failed - session expired',
          error: refreshError?.message || 'Unknown error'
        });
        // Redirect to login — but ONLY from inside the app. A failed refresh
        // triggered by an optional call on a public page (home, /scanner, ...)
        // must never yank a visitor off the page they asked for.
        if (typeof window !== 'undefined' && isAppPath()) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 401 without retry (already retried or not eligible)
    if (error.response?.status === 401) {
      error.friendlyMessage = error.response?.data?.message || 'Your session has expired. Please log in again.';
    }

    return Promise.reject(error);
  }
);

export { clearAuthStorage, dispatchAuthEvent };
export default api;
