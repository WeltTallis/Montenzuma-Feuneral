// ============================================
// AUTH STORE
// Authentication tokens remain in HttpOnly cookies.
// ============================================
import { create } from 'zustand';
import { startTokenRefresh, stopTokenRefresh, forceLogout } from '../../api/axios';

const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: (userData) => {
        sessionStorage.setItem('user', JSON.stringify(userData));
        if (userData.tenantSlug) localStorage.setItem('tenantSlug', userData.tenantSlug);
        if (userData.branchId) localStorage.setItem('branchId', userData.branchId);
        if (userData.dbName) localStorage.setItem('dbName', userData.dbName);
        if (userData.tenantId) localStorage.setItem('tenantId', String(userData.tenantId));
        if (userData.userId || userData.id) {
          const uid = userData.userId || userData.id;
          localStorage.setItem('userId', String(uid));
          sessionStorage.setItem('userId', String(uid));
        }
        if (userData.branchSlug) {
          localStorage.setItem('branchSlug', userData.branchSlug);
          sessionStorage.setItem('branchSlug', userData.branchSlug);
        }

        set({
            user: userData,
            token: null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
        });
        // NOTE: startTokenRefresh() is called by authApi.login() before this method,
        // so we don't call it here to avoid the "already running" guard message.
    },

    logout: () => {
        // Stop auto-refresh
        stopTokenRefresh();

        // Clear sessionStorage (access token, user data)
        sessionStorage.removeItem('user');

        // Clear localStorage (non-sensitive metadata only)
        localStorage.removeItem('tenantSlug');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('branchSlug');
        localStorage.removeItem('branchId');
        localStorage.removeItem('dbName');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        localStorage.removeItem('parentTenantSlug');
        localStorage.removeItem('branches');
        localStorage.removeItem('branchHierarchy');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('branchSlug');

        set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        });
    },

    setLoading: (status) => set({ isLoading: status }),
    setError: (error) => set({ error, isLoading: false }),

    // Restore non-sensitive identity metadata; the server validates the cookie
    // when protected API requests are made.
    initialize: () => {
        try {
            for (const storage of [localStorage, sessionStorage]) {
                ['authToken', 'accessToken', 'token', 'refreshToken'].forEach((key) => storage.removeItem(key));
            }
            const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');

            if (userStr) {
                const user = JSON.parse(userStr);
                sessionStorage.setItem('user', userStr);

                set({
                    user,
                    token: null,
                    isAuthenticated: true,
                    isLoading: false,
                });

                startTokenRefresh();
            } else {
                set({ isLoading: false });
            }
        } catch (e) {
            console.error('Auth initialization error:', e);
            set({ isLoading: false });
        }
    },

    // Force logout (used when token refresh fails)
    forceLogout: () => {
        stopTokenRefresh();
        forceLogout(); // This redirects to /login
    },

    // Check if user belongs to a specific branch
    belongsToBranch: (branchId) => {
        const { user } = get();
        if (!user) return false;
        if (!user.branchId) return true;
        return user.branchId === branchId;
    },

    canManageUsers: () => {
        const { user } = get();
        if (!user) return false;
        return user.role === 'admin';
    },
}));

export default useAuthStore;
