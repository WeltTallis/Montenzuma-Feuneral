import React,{ createContext, useContext, useEffect, useCallback, useState } from 'react';
import { storeBranchContext, clearBranchContext } from '../../utils/globalAuth';
import api from '../../api/client';


const AuthContext = createContext(null);

/**
 * Read user state from storage synchronously.
 * Checks both localStorage and sessionStorage for cross-compatibility.
 */
const restoreUserFromStorage = () => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const userData = localStorage.getItem('user') || sessionStorage.getItem('user');

  if (token && token !== 'undefined' && token !== 'null' && userData) {
    try {
      const parsedUser = JSON.parse(userData);
      return {
        token,
        isAuthenticated: true,
        ...parsedUser,
      };
    } catch (error) {
      // Invalid stored data
    }
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  // Initialize state synchronously from storage so ProtectedRoute
  // sees the correct user state on first render (not deferred via useEffect)
  const [user, setUser] = useState(() => restoreUserFromStorage());
  const [loading, setLoading] = useState(false);

  // Re-check storage on mount (catches cases where storage was updated
  // after initial render, e.g. by authApi.login() called from login.jsx)
  useEffect(() => {
    const restored = restoreUserFromStorage();
    if (restored && !user) {
      setUser(restored);
    }
    setLoading(false);

    // Listen for storage changes (authApi/login.jsx stores tokens directly)
    // This ensures AuthContext stays in sync when login happens outside this context
    const handleStorageChange = (event) => {
      if (event.key === 'authToken' || event.key === 'user' || event.key === null) {
        const restored = restoreUserFromStorage();
        if (restored) {
          setUser(restored);
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const data = response.data;
      if (data?.success) {
        // Backend returns: { accessToken, refreshToken, user: {...}, ... }
        const accessToken = data.accessToken || data.token;
        const refreshTokenVal = data.refreshToken;
        const userData = data.user;

        if (!accessToken) {
          return { success: false, message: 'No token received from server' };
        }

        // Store in BOTH storages for cross-compatibility
        localStorage.setItem('authToken', accessToken);
        sessionStorage.setItem('authToken', accessToken);
        if (refreshTokenVal) {
          localStorage.setItem('refreshToken', refreshTokenVal);
          sessionStorage.setItem('refreshToken', refreshTokenVal);
        }
        if (userData) {
          // SECURITY: Remove sensitive data from localStorage
          // Only store non-sensitive user information
          const safeUserData = {
            // userId is required so the socket client can join the
            // tenant/branch room (join-tenant guard: tenantSlug && userId)
            userId: userData.userId || userData.user_id || userData.id,
            tenantId:
              userData.tenantId ||
              userData.tenant?.tenantId ||
              userData.tenant?.id ||
              data.tenant?.tenantId ||
              data.tenant?.id,
            branchId: userData.branchId || userData.branch_id || userData.branch?.branchId,
            branchDbName: userData.branchDbName,
            username: userData.fullName || userData.username || 'User',
            fullName: userData.fullName || userData.username || 'User',
            // tenantSlug must ALWAYS be the PARENT tenant slug so URLs,
            // redirects and the x-tenant-slug header resolve the real tenant.
            // Branch context stays in branchId/branchSlug/branchDbName.
            tenantSlug:
              userData.parentTenantSlug ||
              userData.tenant?.slug ||
              data.tenant?.slug ||
              data.tenant?.parentTenantSlug ||
              userData.tenantSlug ||
              userData.branchDbName ||
              userData.dbName,
            branchSlug: userData.branchSlug || userData.branchDbName || null,
            parentTenantSlug: userData.parentTenantSlug,
            branchDbName: userData.branchDbName,
            dbName: userData.dbName,
            isActive: userData.isActive,
            isVerified: userData.isVerified,
            // Role is required by route guards (e.g. system admin dashboard)
            role: userData.role || userData.user_role || null,
          };
          localStorage.setItem('user', JSON.stringify(safeUserData));
          sessionStorage.setItem('user', JSON.stringify(safeUserData));
          console.log('[AuthContext] Safe user data stored (no sensitive info)');

          // Tell the socket layer to re-join tenant rooms with the new
          // credentials without requiring a full page reload.
          window.dispatchEvent(new CustomEvent('auth-state-changed'));
        }

        // Store tenant slug from multiple possible sources.
        // IMPORTANT: store the PARENT tenant slug here — for branch users
        // data.tenant.tenantSlug is the branch DB name, which must never be
        // used for routing or the x-tenant-slug header.
        const tenantSlug =
          userData?.parentTenantSlug ||
          data.tenant?.parentTenantSlug ||
          data.tenant?.slug ||
          data.tenant?.tenantSlug ||
          userData?.tenant?.slug;
        if (tenantSlug) {
          localStorage.setItem('tenantSlug', tenantSlug);
        }

        // Store parent tenant slug as SEPARATE key (no fallbacks)
        const parentTenantSlug = userData?.parentTenantSlug || data.tenant?.parentTenantSlug;
        if (parentTenantSlug) {
          localStorage.setItem('parentTenantSlug', parentTenantSlug);
          console.log('[AuthContext] Stored parentTenantSlug:', parentTenantSlug);
        } else {
          console.warn('[AuthContext] No parentTenantSlug found in login response!');
        }

        // Store the resolved IDs in localStorage so every component can read them:
        //   tenantId  → current tenant (parent) id
        //   userId    → current authenticated user id
        //   branchId  → current branch id (null for single-branch tenants)
        //   branchSlug→ current branch slug / scope
        const loginTenantId =
          data.tenant?.tenantId || data.tenant?.id || userData?.tenantId;
        if (loginTenantId) localStorage.setItem('tenantId', String(loginTenantId));

        const loginUserId = userData?.userId || userData?.user_id || userData?.id;
        if (loginUserId) {
          localStorage.setItem('userId', String(loginUserId));
          sessionStorage.setItem('userId', String(loginUserId));
        }

        const loginBranchId = userData?.branchId || userData?.branch_id || userData?.branch?.branchId;
        if (loginBranchId) localStorage.setItem('branchId', String(loginBranchId));
        else localStorage.removeItem('branchId');

        const loginBranchSlug = userData?.branchSlug || userData?.branch?.branchSlug || userData?.branchDbName || null;
        if (loginBranchSlug) {
          localStorage.setItem('branchSlug', loginBranchSlug);
          sessionStorage.setItem('branchSlug', loginBranchSlug);
        } else {
          localStorage.removeItem('branchSlug');
          sessionStorage.removeItem('branchSlug');
        }

        if (userData?.dbName) localStorage.setItem('dbName', userData.dbName);
        if (userData?.branchDbName) localStorage.setItem('branchDbName', userData.branchDbName);

        console.log('[AuthContext] Stored IDs in localStorage:', {
          tenantId: localStorage.getItem('tenantId'),
          userId: localStorage.getItem('userId'),
          branchId: localStorage.getItem('branchId'),
          branchSlug: localStorage.getItem('branchSlug'),
        });

        // Persist the branch list + parent/child hierarchy straight from the login
        // response (fallback: the /tenant/:slug/branches fetch below).
        storeBranchContext(data.branches);

        // Fetch and store branches for inter-branch operations
        try {
          const parentTenantSlug = userData?.parentTenantSlug || tenantSlug;
          const branchesRes = await api.get(`/tenant/${parentTenantSlug}/branches`);
          if (branchesRes.data?.success && branchesRes.data?.data) {
            storeBranchContext(branchesRes.data.data);
            console.log(
              '[AuthContext] Branches saved to localStorage:',
              branchesRes.data.data.length,
            );
          }
        } catch (branchError) {
          console.warn('[AuthContext] Could not fetch branches:', branchError.message);
        }

        setUser({
          token: accessToken,
          isAuthenticated: true,
          ...userData,
        });

        // Return the full data object so login page can extract tenantSlug, user, etc.
        return data;
      }
      return { success: false, message: data?.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate refresh token on server
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if server request fails
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantSlug');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('userId');
      localStorage.removeItem('branchId');
      localStorage.removeItem('branchSlug');
      localStorage.removeItem('branchDbName');
      localStorage.removeItem('dbName');
      localStorage.removeItem('parentTenantSlug');
      clearBranchContext();
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('branchSlug');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
