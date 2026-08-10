import api from './axios';
import { ENDPOINTS } from './endpoints';

export const analyticsApi = {
  /**
   * Core mortuary analytics dashboard data
   * GET /api/v1/restpoint/analytics/mortuary-analytics
   */
  getMortuaryAnalytics: async () => {
    const response = await api.get(ENDPOINTS.ANALYTICS.MORTUARY);
    return response.data;
  },

  /**
   * Vehicle / hearse analytics by month+year
   * GET /api/v1/restpoint/analytics/vehicle-analytics?month=&year=
   */
  getVehicleAnalytics: async (month, year) => {
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    const response = await api.get(`${ENDPOINTS.ANALYTICS.VEHICLES}?month=${m}&year=${y}`);
    return response.data;
  },

  /**
   * High-level dashboard summary widget data
   * GET /api/v1/restpoint/analytics/dashboard
   */
  getDashboard: async () => {
    const response = await api.get(ENDPOINTS.ANALYTICS.DASHBOARD);
    return response.data;
  },

  /**
   * Comprehensive dashboard — full aggregate data for current tenant/branch
   * GET /api/v1/restpoint/analytics/dashboard/comprehensive
   */
  getComprehensiveDashboard: async () => {
    const response = await api.get(ENDPOINTS.ANALYTICS.COMPREHENSIVE);
    return response.data;
  },

  /**
   * Comparison dashboard — fetches aggregate data for ALL specified branches
   * GET /api/v1/restpoint/analytics/dashboard/compare?branches=id1,id2,...
   */
  getComparisonDashboard: async (branches) => {
    const response = await api.get(ENDPOINTS.ANALYTICS.COMPARE, {
      params: { branches },
    });
    return response.data;
  },

  /**
   * Fetch REAL day-by-day records from the actual list endpoints,
   * using the real date fields as stored in the database.
   *   - Deceased:    GET /deceased/deceased-all  (paginated; date_admitted)
   *   - Hearses:     GET /hearse-bookings        (booking_dates / created_at)
   *   - Coffins:     GET /coffins/list           (created_at)
   *
   * @returns {Promise<{deceased: Array, hearses: Array, coffins: Array, branchNames: Array}>}
   */
  fetchAllDashboardRecords: async () => {
    const slug =
      localStorage.getItem('tenantSlug') ||
      sessionStorage.getItem('tenantSlug') ||
      'system_shared';
    const toArr = (v) => (Array.isArray(v) ? v : v ? [v] : []);

    let deceased = [];
    let hearses = [];
    let coffins = [];
    let branchNames = [];

    // 1) Deceased records (paginate through EVERYTHING, not just 5 pages)
    try {
      let collected = [];
      for (let page = 1; page <= 200; page++) {
        const r = await api.get(ENDPOINTS.DECEASED.LIST, { params: { page, limit: 100 } });
        const d = r?.data?.data || r?.data || [];
        const arr = Array.isArray(d) ? d : [];
        if (arr.length === 0) break;
        collected = collected.concat(arr);
        if (arr.length < 100) break;
      }
      deceased = collected;
    } catch (err) {
      console.warn('[Dashboard] Failed to fetch deceased records:', err?.message);
    }

    // 2) Hearse bookings
    try {
      const r = await api.get('/hearse-bookings');
      hearses = toArr(r?.data?.bookings || r?.data?.data || r?.data);
    } catch (err) {
      console.warn('[Dashboard] Failed to fetch hearse bookings:', err?.message);
    }

    // 3) Coffins (fetch ALL - do NOT pass branch_slug=tenant, that returns nothing)
    try {
      const r = await api.get(ENDPOINTS.COFFINS.LIST ?? '/coffins/list');
      coffins = toArr(r?.data?.data || r?.data);
    } catch (err) {
      console.warn('[Dashboard] Failed to fetch coffins:', err?.message);
    }

    // 4) Branch names (for labelling / source)
    try {
      const br = await api.get(`/tenant/${slug}/branches`);
      const arr = Array.isArray(br?.data?.data) ? br.data.data : Array.isArray(br?.data) ? br.data : [];
      branchNames = arr.map((b) => b?.branch_name || b?.name).filter(Boolean);
    } catch (err) {
      console.warn('[Dashboard] Failed to fetch branch names:', err?.message);
    }

    return { deceased, hearses, coffins, branchNames };
  },

  /**
   * Fetch all branches for a tenant
   * GET /api/v1/restpoint/tenant/{slug}/branches
   */
    getTenantBranches: async (tenantSlug) => {
    const slug = tenantSlug || localStorage.getItem('tenantSlug');
    const response = await api.get(`/tenant/${slug}/branches`);
    return response.data;
  },

  /**
   * Financial analytics
   * GET /api/v1/restpoint/analytics/financials?from=&to=
   */
  getFinancials: async (from, to) => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const response = await api.get(`${ENDPOINTS.ANALYTICS.FINANCIALS}?${params.toString()}`);
    return response.data;
  },
};
