/**
 * Global authentication utility helpers
 */

/**
 * Get the current tenant slug from localStorage
 * NO 'default' fallback - must always return the real tenant slug
 * Falls back to parentTenantSlug since backend stores the real slug there
 */
export const getTenantSlug = () => {
  // Priority: 1) tenantSlug key, 2) tenant_slug key, 3) parentTenantSlug key, 4) user object
  const direct = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug');
  if (direct && direct !== 'default' && direct !== 'dashboard' && direct !== 'undefined' && direct !== 'null') {
    return direct;
  }
  
  const parent = localStorage.getItem('parentTenantSlug');
  if (parent && parent !== 'default' && parent !== 'dashboard' && parent !== 'undefined' && parent !== 'null') {
    return parent;
  }
  
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // tenantSlug is the effective scope (branch for branch users); only fall back to
    // parentTenantSlug when no branch/effective slug exists (e.g. legacy data).
    return user.tenantSlug || user.tenant_slug || user.branchDbName || user.branchSlug || user.tenant?.slug || user.parentTenantSlug || '';
  } catch {
    return '';
  }
};

/**
 * Get the parent tenant slug for branch operations
 * When in a branch, this returns the main tenant slug (needed for fetching branches, settings, etc.)
 * When in main tenant, returns the same as getTenantSlug()
 */
export const getParentTenantSlug = () => {
  // ONLY use parentTenantSlug - NO FALLBACKS to branch slug
  // This ensures we never accidentally use the branch slug for parent operations
  const parentSlug = localStorage.getItem('parentTenantSlug');
  if (parentSlug && parentSlug !== 'undefined' && parentSlug !== 'null') {
    return parentSlug;
  }
  
  // Check user object as secondary source
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.parentTenantSlug) {
      return user.parentTenantSlug;
    }
  } catch {
    // ignore parse errors
  }
  
  // Return null if no parent slug found - DO NOT fall back to branch slug
  console.warn('[getParentTenantSlug] No parentTenantSlug found! User must log in again.');
  return null;
};

/**
 * Get the current auth token from localStorage or sessionStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
};

/**
 * Get the current user ID from localStorage
 */
export const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || user.userId || user._id || null;
  } catch {
    return null;
  }
};
