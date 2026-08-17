import api from './axios';
import { ENDPOINTS } from './endpoints';
import useAuthStore from '../utils/store/useAuthStore';
import { storeBranchContext, clearBranchContext } from '../utils/globalAuth';

// ─── Shared Auth API ──────────────────────────────────────────
// Uses httpOnly cookies for refresh tokens (via withCredentials)
// Uses sessionStorage for access tokens (cleared on tab close)
// Tokens auto-refresh every 10 minutes

export const authApi = {
  /**
   * Login — POST /api/v1/restpoint/auth/login
   * Backend should set httpOnly cookie with refresh token
   * Returns: { success, accessToken, user, tenantId, tenantSlug }
   */
  login: async ({ email, identifier, password }) => {
    const loginIdentifier = email || identifier;

    const response = await api.post(ENDPOINTS.AUTH.LOGIN, {
      identifier: loginIdentifier,
      password
    });

    const data = response.data;

    if (data?.accessToken) {
      // Store in BOTH storages for cross-compatibility
      // sessionStorage for tab isolation, localStorage for page refresh persistence
      sessionStorage.setItem('authToken', data.accessToken);
      sessionStorage.setItem('user', JSON.stringify(data.user || {}));

      // Store refresh token in BOTH storages for consistency
      if (data.refreshToken) {
        sessionStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Non-sensitive metadata in localStorage
      if (data.tenant?.tenantSlug) localStorage.setItem('tenantSlug', data.tenant.tenantSlug);
      if (data.tenant?.tenantId) localStorage.setItem('tenantId', data.tenant.tenantId.toString());
      if (data.tenant?.dbName || data.user?.dbName) localStorage.setItem('dbName', data.user?.dbName || data.tenant.dbName);

      // Store the authenticated IDs for branch/tenant-scoped requests
      const uid = data.user?.userId || data.user?.user_id || data.user?.id;
      if (uid) {
        localStorage.setItem('userId', String(uid));
        sessionStorage.setItem('userId', String(uid));
      }
      const bid = data.user?.branchId || data.user?.branch_id || data.user?.branch?.branchId;
      if (bid) localStorage.setItem('branchId', String(bid));
      else localStorage.removeItem('branchId');
      const bslug = data.user?.branchSlug || data.user?.branch?.branchSlug || data.user?.branchDbName || null;
      if (bslug) {
        localStorage.setItem('branchSlug', bslug);
        sessionStorage.setItem('branchSlug', bslug);
      } else {
        localStorage.removeItem('branchSlug');
        sessionStorage.removeItem('branchSlug');
      }
      if (data.user?.branchDbName) localStorage.setItem('branchDbName', data.user.branchDbName);
      // Persist the full branch list + parent/child hierarchy for multi-branch switching
      storeBranchContext(data.branches);

      // Start auto-refresh via the axios module
      const { startTokenRefresh } = await import('./axios');
      startTokenRefresh();

      // Update zustand store
      useAuthStore.getState().login(data.user, data.accessToken);
    }
    return data;
  },

  /**
   * Logout — POST /api/v1/restpoint/auth/logout
   */
  logout: async () => {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (_) {
      // Swallow network errors on logout
    } finally {
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
      clearBranchContext();
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantSlug');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('dbName');

      // Stop auto-refresh
      const { stopTokenRefresh, forceLogout } = await import('./axios');
      stopTokenRefresh();

      // Update store
      useAuthStore.getState().logout();
    }
    return { success: true };
  },

  /**
   * Get current authenticated user — GET /api/v1/restpoint/auth/me
   */
  getMe: async () => {
    const response = await api.get(ENDPOINTS.AUTH.ME);
    return response.data;
  },

  /**
   * Refresh access token — POST /api/v1/restpoint/auth/refresh
   * Sends refresh token in request body
   */
  refresh: async () => {
    const refreshToken = sessionStorage.getItem('refreshToken') || localStorage.getItem('refreshToken');
    const response = await api.post(ENDPOINTS.AUTH.REFRESH, { refreshToken });
    const data = response.data;
    if (data?.accessToken) {
      sessionStorage.setItem('authToken', data.accessToken);
      localStorage.setItem('authToken', data.accessToken);
    }
    return data;
  },

  /**
   * Register new tenant — POST /api/v1/restpoint/tenants/register
   */
  register: async (tenantData) => {
    const response = await api.post(ENDPOINTS.TENANT.REGISTER, tenantData);
    return response.data;
  },

  /**
   * Get auth headers for external service calls
   */
  getAuthHeaders: () => {
    const token = sessionStorage.getItem('authToken');
    const slug = localStorage.getItem('tenantSlug');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (slug) headers['x-tenant-slug'] = slug;
    return headers;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    const token = sessionStorage.getItem('authToken');
    return !!token && token !== 'undefined' && token !== 'null';
  },

  /**
   * Portal Login — POST /api/v1/restpoint/portal/login
   */
  portalLogin: async ({ phone }) => {
    const previousTenantSlug = api.defaults.headers.common['x-tenant-slug'];
    delete api.defaults.headers.common['x-tenant-slug'];

    try {
      const response = await api.post(ENDPOINTS.PORTAL.LOGIN, {
        phone: phone.trim()
      });
      const data = response.data;

      if (data?.success && data?.tenantSlug) {
        sessionStorage.setItem('sessionToken', data.sessionToken || data.session_token);
        localStorage.setItem('tenantSlug', data.tenantSlug);
        if (data.deceased) {
          sessionStorage.setItem('deceased', JSON.stringify(data.deceased));
          sessionStorage.setItem('deceasedId', data.deceased.deceased_id);
        }
        api.defaults.headers.common['x-tenant-slug'] = data.tenantSlug;
      }
      return data;
    } catch (error) {
      if (previousTenantSlug) {
        api.defaults.headers.common['x-tenant-slug'] = previousTenantSlug;
      }
      throw error;
    }
  },

  portalLogout: () => {
    sessionStorage.removeItem('sessionToken');
    sessionStorage.removeItem('deceased');
    sessionStorage.removeItem('deceasedId');
    delete api.defaults.headers.common['x-tenant-slug'];
    return { success: true };
  },

  getPortalDeceased: async (deceasedId, tenantSlug) => {
    api.defaults.headers.common['x-tenant-slug'] = tenantSlug;
    const response = await api.get(`${ENDPOINTS.PORTAL.DECEASED}/${deceasedId}`);
    return response.data;
  },

  getTenantContext: () => ({
    tenantSlug: localStorage.getItem('tenantSlug'),
    tenantId: localStorage.getItem('tenantId')
  }),
};

export default authApi;