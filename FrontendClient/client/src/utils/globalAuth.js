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
  const direct = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  if (direct && direct !== 'undefined' && direct !== 'null') return direct;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || user.userId || user._id || null;
  } catch {
    return null;
  }
};

/**
 * Get the current tenant ID from localStorage
 */
export const getTenantId = () => {
  const direct = localStorage.getItem('tenantId');
  if (direct && direct !== 'undefined' && direct !== 'null') return direct;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.tenantId || user.tenant?.id || null;
  } catch {
    return null;
  }
};

/**
 * Get the current branch ID from localStorage
 * Returns null when the logged-in user is not scoped to a branch
 */
export const getBranchId = () => {
  const direct = localStorage.getItem('branchId');
  if (direct && direct !== 'undefined' && direct !== 'null') return direct;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.branchId || user.branch_id || user.branch?.branchId || null;
  } catch {
    return null;
  }
};

/**
 * Get the current branch slug from localStorage
 */
export const getBranchSlug = () => {
  const direct = localStorage.getItem('branchSlug') || sessionStorage.getItem('branchSlug');
  if (direct && direct !== 'undefined' && direct !== 'null') return direct;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.branchSlug || user.branchDbName || null;
  } catch {
    return null;
  }
};

/**
 * Get the full branch list stored after login (each item carries branchId, branchSlug,
 * branchDbName and parentBranchId so the parent/child tree can be rebuilt anywhere).
 */
export const getBranches = () => {
  try {
    const raw = localStorage.getItem('branches');
    const branches = raw ? JSON.parse(raw) : [];
    return Array.isArray(branches) ? branches : [];
  } catch {
    return [];
  }
};

/**
 * Build a parent/child branch hierarchy from a flat branch list.
 * Returns { roots: [], byParent: { parentBranchId: [children] } }.
 * Works with both camelCase (branchId/branchSlug/parentBranchId) and snake_case
 * (branch_id/branch_slug/parent_branch_id) payloads.
 */
export const buildBranchHierarchy = (branches = []) => {
  const result = { roots: [], byParent: {} };
  if (!Array.isArray(branches)) return result;

  for (const b of branches) {
    if (!b) continue;
    const node = {
      branchId: b.branchId || b.branch_id || b.id || null,
      branchSlug: b.branchSlug || b.branch_slug || null,
      branchName: b.branchName || b.branch_name || null,
      branchDbName: b.branchDbName || b.branch_db_name || null,
      parentBranchId: b.parentBranchId || b.parent_branch_id || null,
    };
    if (!node.parentBranchId) {
      result.roots.push(node);
    } else {
      result.byParent[node.parentBranchId] = result.byParent[node.parentBranchId] || [];
      result.byParent[node.parentBranchId].push(node);
    }
  }
  return result;
};

/**
 * Get the cached parent/child hierarchy (set by storeBranchContext after login).
 */
export const getBranchHierarchy = () => {
  try {
    return JSON.parse(localStorage.getItem('branchHierarchy') || 'null');
  } catch {
    return null;
  }
};

/**
 * Persist the branch list + parent/child hierarchy to localStorage.
 * Returns true when branches were stored.
 */
export const storeBranchContext = (branches) => {
  if (Array.isArray(branches) && branches.length > 0) {
    localStorage.setItem('branches', JSON.stringify(branches));
    localStorage.setItem('branchHierarchy', JSON.stringify(buildBranchHierarchy(branches)));
    return true;
  }
  return false;
};

/**
 * Clear cached branch data (used on logout).
 */
export const clearBranchContext = () => {
  localStorage.removeItem('branches');
  localStorage.removeItem('branchHierarchy');
};
