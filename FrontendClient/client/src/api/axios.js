import axios from 'axios';
import { ENDPOINTS } from './endpoints';
import env from '../utils/config/env';
import { getUserId, getAuthToken, getTenantSlug, getBranchSlug, getBranchId } from '../utils/globalAuth';

// Alias for backwards compatibility
const getSlug = getTenantSlug;

// Workshop service axios instance
export const workshopApi = axios.create({
  baseURL: env.WORKSHOP_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: env.API_TIMEOUT,
});

workshopApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  const slug = getTenantSlug();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (slug) config.headers['x-tenant-slug'] = slug;

  // Attach branch context for multi-branch routing
  const branchSlug = getBranchSlug();
  const branchId = getBranchId();
  const branchDbName = localStorage.getItem('branchDbName');
  if (branchSlug) config.headers['x-branch-slug'] = branchSlug;
  if (branchId) config.headers['x-branch-id'] = branchId;
  if (branchDbName && branchDbName !== 'undefined' && branchDbName !== 'null') config.headers['x-branch-db'] = branchDbName;

  return config;
}, (error) => Promise.reject(error));

// ─── Shared Auth Token (single source of truth) ──────────────────────────
// Uses localStorage (primary) with sessionStorage as fallback
// Auto-refreshes every 10 minutes

let cachedToken = null;
let cachedSlug = null;
let refreshIntervalId = null;
let isRefreshing = false; // Prevent concurrent refresh calls

const getToken = () => cachedToken || localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
const setToken = (token) => {
  cachedToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
    sessionStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
  }
};

/** Get refresh token from sessionStorage first (where authApi stores it), fallback to localStorage */
const getRefreshToken = () => sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');

/** Store refresh token in both storages for consistency */
const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem('refreshToken', token);
    sessionStorage.setItem('refreshToken', token);
  } else {
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
  }
};

// ─── Token Refresh (every 10 minutes) ────────────────────────────────────
export const startTokenRefresh = () => {
  // Guard: don't start multiple intervals
  if (refreshIntervalId) {
    console.log('[Auth] Token refresh already running, skipping duplicate start');
    return;
  }

  refreshIntervalId = setInterval(async () => {
    // Guard: prevent concurrent refresh calls
    if (isRefreshing) {
      console.log('[Auth] Refresh already in progress, skipping');
      return;
    }

    isRefreshing = true;
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        console.warn('[Auth] No refresh token available');
        return;
      }

      const response = await axios.post(
        env.FULL_API_URL + ENDPOINTS.AUTH.REFRESH,
        { refreshToken },
        { withCredentials: true }
      );
      const newToken = response.data?.token || response.data?.accessToken;
      const newRefreshToken = response.data?.refreshToken;
      if (newToken) {
        setToken(newToken);
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken);
        }
        console.log('[Auth] Token refreshed successfully');
      }
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error.message);
      // If refresh fails, try once more in 30s then force logout
      if (error.response?.status === 401) {
        setTimeout(async () => {
          try {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
              forceLogout();
              return;
            }
            const retry = await axios.post(
              env.FULL_API_URL + ENDPOINTS.AUTH.REFRESH,
              { refreshToken },
              { withCredentials: true }
            );
            if (retry.data?.token || retry.data?.accessToken) {
              setToken(retry.data.token || retry.data.accessToken);
              const retryRefreshToken = retry.data?.refreshToken;
              if (retryRefreshToken) {
                setRefreshToken(retryRefreshToken);
              }
              return;
            }
          } catch {
            forceLogout();
          }
        }, 30000);
      }
    } finally {
      isRefreshing = false;
    }
  }, 600000); // Every 10 minutes (600,000ms)
};

export const stopTokenRefresh = () => {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
};

const forceLogout = (message = 'Your session has expired. Please log in again.') => {
  setToken(null);
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('tenantId');
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    Object.keys(user).forEach(key => sessionStorage.removeItem(key));
  } catch { }
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
  if (typeof window !== 'undefined') {
    // Dispatch custom event instead of alert() for cleaner UX
    window.dispatchEvent(new CustomEvent('auth-event', {
      detail: { type: 'logout', reason: message }
    }));
    // Landing-page live previews run the real modules inside sandboxed iframes
    // (see components/common/LivePreviewHost.jsx). Never hijack those frames to
    // /login — let the module render its own empty state instead.
    if (sessionStorage.getItem('rpPreviewMode') === '1') return;
    window.location.href = '/login';
  }
};

// ─── Main Axios Instance ──────────────────────────────────────────────────
const api = axios.create({
  baseURL: env.FULL_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: env.API_TIMEOUT,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = getToken();
  const slug = getSlug();
  const tenantId = localStorage.getItem('tenantId');
  const userId = getUserId();
    // Prefer the global auth helpers (getBranchSlug / getBranchId) so the branch is
  // resolved even when it lives only on the logged-in `user` object and not as a bare
  // localStorage key. Reading localStorage directly left x-branch-id unset, which made
  // createCoffin/createOrder store branch_id = NULL -> the coffin leaked into every branch.
  const branchSlug = getBranchSlug();
  const branchDb = localStorage.getItem('branchDbName') || localStorage.getItem('branchDb');
  const branchId = getBranchId();

  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (slug && !config.headers['x-tenant-slug']) config.headers['x-tenant-slug'] = slug;
  if (tenantId) config.headers['x-tenant-id'] = tenantId;
  if (userId) config.headers['x-user-id'] = userId.toString();
  if (branchSlug) config.headers['x-branch-slug'] = branchSlug;
  if (branchDb) config.headers['x-branch-db'] = branchDb;
  if (branchId) config.headers['x-branch-id'] = branchId;

  return config;
}, (error) => Promise.reject(error));

// ─── Connection-status bridge ───────────────────────────────────────────────
// The browser's native `online`/`offline` events only fire when the network
// interface itself changes. When the backend/proxy is unreachable (or a
// service is down) the browser stays "online", so the ConnectionToast never
// appeared. We bridge that gap here: any request that fails with a network /
// proxy / timeout error dispatches `app:connection-lost`, and the first
// successful request afterwards dispatches `app:connection-restored`.
let connectionWasLost = false;

const notifyConnectionLost = () => {
  if (connectionWasLost) return;
  connectionWasLost = true;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('app:connection-lost'));
  }
};

const notifyConnectionRestored = () => {
  if (!connectionWasLost) return;
  connectionWasLost = false;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('app:connection-restored'));
  }
};

// Response interceptor with auto-refresh on 401 and friendly service-down messages
api.interceptors.response.use(
  (response) => {
    // A successful round-trip means the backend is reachable again.
    notifyConnectionRestored();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 503) {
      notifyConnectionLost();
      const serviceName = error.response?.data?.service || 'Service';
      const friendlyName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
      error.friendlyMessage = error.response?.data?.message || `${friendlyName} is temporarily unavailable. Please try again later.`;
      return Promise.reject(error);
    }

    if (error.response?.status === 504) {
      notifyConnectionLost();
      const url = originalRequest?.url || '';
      const pathParts = url.split('/').filter(Boolean);
      const serviceHint = pathParts[2] || pathParts[0] || 'Service';
      const friendlyName = serviceHint.charAt(0).toUpperCase() + serviceHint.slice(1);
      error.friendlyMessage = `${friendlyName} is temporarily unavailable. Please try again later.`;
      return Promise.reject(error);
    }
    
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      notifyConnectionLost();
      const url = originalRequest?.url || '';
      const pathParts = url.split('/').filter(Boolean);
      const serviceHint = pathParts[2] || pathParts[0] || 'Service';
      const friendlyName = serviceHint.charAt(0).toUpperCase() + serviceHint.slice(1);
      error.friendlyMessage = `${friendlyName} service is temporarily unavailable. Please try again later.`;
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - try token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = getRefreshToken();
        const response = await axios.post(
          env.FULL_API_URL + ENDPOINTS.AUTH.REFRESH,
          { refreshToken },
          { withCredentials: true }
        );
        const newToken = response.data?.token || response.data?.accessToken;
        const newRefreshToken = response.data?.refreshToken;
        if (newToken) {
          setToken(newToken);
          if (newRefreshToken) {
            setRefreshToken(newRefreshToken);
          }
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        forceLogout('Your session has expired. Please log in again.');
        return Promise.reject(refreshError);
      }
    }
    
    // Handle 401 without retry (already retried or not eligible) - show friendly message
    if (error.response?.status === 401) {
      error.friendlyMessage = error.response?.data?.message || 'Your session has expired. Please log in again.';
    }
    return Promise.reject(error);
  }
);

export { forceLogout };
export default api;