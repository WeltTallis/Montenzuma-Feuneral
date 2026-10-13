import api from './axios';
import { ENDPOINTS } from './endpoints';

export const tenantApi = {
  // ─── User Management (via auth service) ─────────────────────────────
  getUsers: async (tenantSlug) => {
    try {
      const slug = tenantSlug || localStorage.getItem('tenantSlug');
      const response = await api.get(ENDPOINTS.AUTH.USERS);
      return response.data;
    } catch (err) {
      console.warn('⚠️ Fetch users API failed:', err.message);
      return { success: false, users: [] };
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post(ENDPOINTS.AUTH.CREATE_USER, userData);
      return response.data;
    } catch (err) {
      console.warn('⚠️ Create user API failed:', err.message);
      throw err;
    }
  },
  getBranding: async (slug) => {
    try {
      const response = await api.get(ENDPOINTS.TENANT.CONFIG(slug));
      const settings = response.data?.data || response.data || {};
      const name = settings.tenantName || settings.name || slug || 'RESTPOINT Default Tenant';
      const logo = settings.logoUrl || settings.logo_url || settings.logo || '';

      return {
        ...settings,
        name,
        tenantName: name,
        logo,
        logoUrl: logo,
        primaryColor: settings.primaryColor || '#2b5a82',
      };
    } catch (err) {
      console.warn('⚠️ Branding API failed; using the tenant name fallback:', err.message);
      return {
        name: slug || 'RESTPOINT Default Tenant',
        logo: '',
        primaryColor: '#2b5a82',
        features: {
          hearseTracking: false,
          analytics: true,
          invoicing: true
        }
      };
    }
  },

  getTenantSettings: async (tenantSlug, dbName) => {
    try {
      // Use tenantSlug from parameter or localStorage
      const slug = tenantSlug || localStorage.getItem('tenantSlug');

      if (!slug) {
        console.warn('⚠️ No tenantSlug provided or found in localStorage');
        return {
          deploymentType: 'single',
          branchCount: 0,
          tenantName: 'Default Tenant',
          tenantSlug: 'default'
        };
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const url = ENDPOINTS.TENANT.SETTINGS(slug);
        const response = await api.get(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response.data;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (err) {
      console.warn('⚠️ Tenant settings API failed:', err.message);
      // Return default multi-tenant settings for development
      return {
        deploymentType: 'single',
        branchCount: 0,
        tenantName: 'Default Tenant',
        tenantSlug: 'default'
      };
    }
  },

  getBranches: async (tenantSlug, dbName) => {
    try {
      // Use tenantSlug from parameter or localStorage
      const slug = tenantSlug || localStorage.getItem('tenantSlug');

      if (!slug) {
        console.warn('⚠️ No tenantSlug provided or found in localStorage');
        return null;
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const url = ENDPOINTS.TENANT.BRANCHES(slug);
        const response = await api.get(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response.data;
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    } catch (err) {
      console.warn('⚠️ Branches API failed:', err.message);
      return null;
    }
  },

  // Branch-aware endpoints for multi-tenant
  getBranchUsers: async (tenantSlug, branchSlug) => {
    try {
      const url = ENDPOINTS.TENANT_BRANCH?.USERS?.(tenantSlug, branchSlug) || `/tenant/${tenantSlug}/${branchSlug}/users`;
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      console.warn('⚠️ Branch users API failed:', err.message);
      return null;
    }
  },

  getBranchBranches: async (tenantSlug, branchSlug) => {
    try {
      const url = ENDPOINTS.TENANT_BRANCH?.BRANCHES?.(tenantSlug) || `/tenant/${tenantSlug}/branches`;
      const response = await api.get(url);
      return response.data;
    } catch (err) {
      console.warn('⚠️ Branch branches API failed:', err.message);
      return null;
    }
  },

  registerTenant: async (tenantData) => {
    const response = await api.post(ENDPOINTS.TENANT.REGISTER, tenantData);
    return response.data;
  },

  updateTenantSettings: async (tenantSlug, settings) => {
    try {
      const url = ENDPOINTS.TENANT.SETTINGS(tenantSlug);
      const response = await api.put(url, settings);
      return response.data;
    } catch (err) {
      console.warn('⚠️ Update tenant settings API failed:', err.message);
      throw err;
    }
  }
};
