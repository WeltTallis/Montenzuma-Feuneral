import api from './axios';
import { ENDPOINTS } from './endpoints';
import useAuthStore from '../utils/store/useAuthStore';
import { storeBranchContext, clearBranchContext } from '../utils/globalAuth';

// ─── Shared Auth API ──────────────────────────────────────────
// Authentication tokens remain in HttpOnly cookies; browser storage holds only
// non-sensitive user and tenant context.

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
    }, { headers: { 'x-auth-cookie': '1' } });

    const data = response.data;

    if (data?.success && data.user) {
      ['authToken', 'accessToken', 'token', 'refreshToken'].forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });
      sessionStorage.setItem('user', JSON.stringify(data.user || {}));
      localStorage.setItem('user', JSON.stringify(data.user || {}));


      // Non-sensitive metadata in localStorage.
      // The slug used for routing/API headers must ALWAYS be the parent tenant
      // slug — never a branch db name — otherwise tenants land on the wrong
      // (or non-existent) subdomain after login.
      const routeTenantSlug =
        data.tenant?.parentTenantSlug || data.tenant?.slug || data.tenant?.tenantSlug ||
        data.user?.parentTenantSlug || data.user?.tenantSlug || '';
      if (routeTenantSlug) localStorage.setItem('tenantSlug', routeTenantSlug);
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
      const bslug = data.user?.branchSlug || data.user?.branch?.branchSlug || null;
      if (bslug) {
        localStorage.setItem('branchSlug', bslug);
        sessionStorage.setItem('branchSlug', bslug);
      } else {
        localStorage.removeItem('branchSlug');
        sessionStorage.removeItem('branchSlug');
      }
      // CRITICAL: clear leftover branch context from a PREVIOUS session —
      // otherwise a user without a branch inherits the old session's branch
      // headers (x-branch-id/x-branch-db) and lands on the wrong branch.
      if (data.user?.branchDbName) {
        localStorage.setItem('branchDbName', data.user.branchDbName);
      } else {
        localStorage.removeItem('branchDbName');
        sessionStorage.removeItem('branchDbName');
      }
      // Persist the full branch list + parent/child hierarchy for multi-branch switching
      storeBranchContext(data.branches);

      // Start auto-refresh via the axios module
      const { startTokenRefresh } = await import('./axios');
      startTokenRefresh();

      // Update zustand store
      useAuthStore.getState().login(data.user);
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
   * Uses the HttpOnly refresh cookie.
   */
  refresh: async () => {
    const response = await api.post(ENDPOINTS.AUTH.REFRESH, {}, { headers: { 'x-auth-cookie': '1' } });
    return response.data;
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
    const token = '';
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
    return !!(sessionStorage.getItem('user') || localStorage.getItem('user'));
  },

  getTenantContext: () => ({
    tenantSlug: localStorage.getItem('tenantSlug'),
    tenantId: localStorage.getItem('tenantId')
  }),
};

export default authApi;