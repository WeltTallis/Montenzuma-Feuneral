/**
 * Global authentication utility helpers
 */

/**
 * Get the current tenant slug from localStorage
 */
export const getTenantSlug = () => {
  return (
    localStorage.getItem('tenantSlug') ||
    localStorage.getItem('tenant_slug') ||
    (() => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.tenantSlug || user.tenant?.slug || 'default';
      } catch {
        return 'default';
      }
    })()
  );
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
