/**
 * Global authentication utility helpers
 */

/**
 * Decode the JWT payload WITHOUT verifying the signature.
 * This is only ever used as a client-side recovery hint (which tenant/role does
 * this token belong to?) — the server still validates every token itself.
 * Returns null when there is no token or it cannot be parsed.
 */
export const decodeTokenClaims = (token = null) => {
  const raw = token || getAuthToken();
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  try {
    const payload = raw.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    // decodeURIComponent trick keeps non-ASCII claims (tenant names) intact.
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

/** True when `value` looks like a real tenant slug (never a placeholder). */
const isUsableSlug = (value) =>
  !!value &&
  value !== 'default' &&
  value !== 'dashboard' &&
  value !== 'login' &&
  value !== 'undefined' &&
  value !== 'null';

/**
 * Get the current tenant slug from localStorage
 * NO 'default' fallback - must always return the real tenant slug
 * Falls back to parentTenantSlug since backend stores the real slug there
 */
export const getTenantSlug = () => {
  // Priority: 1) tenantSlug key, 2) tenant_slug key, 3) parentTenantSlug key, 4) user object
  const direct = localStorage.getItem('tenantSlug') || localStorage.getItem('tenant_slug');
  if (isUsableSlug(direct)) {
    return direct;
  }

  const parent = localStorage.getItem('parentTenantSlug');
  if (isUsableSlug(parent)) {
    return parent;
  }

  try {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    // tenantSlug is the effective scope (branch for branch users); only fall back to
    // parentTenantSlug when no branch/effective slug exists (e.g. legacy data).
    const fromUser = user.tenantSlug || user.tenant_slug || user.branchDbName || user.branchSlug || user.tenant?.slug || user.parentTenantSlug || '';
    if (isUsableSlug(fromUser)) return fromUser;
  } catch {
    // Ignore parsing errors
  }

  // Last resort: the access token itself carries the parent tenant slug
  // (auth-service `generateTokens`). This rescues sessions whose `user` blob
  // was cleared but whose token is still valid — without it those users were
  // bounced to /login forever because no slug could be found.
  const claims = decodeTokenClaims();
  const fromClaims = claims?.parentTenantSlug || claims?.tenantSlug || '';
  if (isUsableSlug(fromClaims)) return fromClaims;

  return '';
};

/** True when a usable access token exists (in either storage). */
export const hasSession = () => {
  const token = getAuthToken();
  return !!token && token !== 'undefined' && token !== 'null';
};

/**
 * Route names that sit directly under the tenant slug. Tenant URLs are
 * slug-first (`/acme/deceased`), while the marketing site uses root-level
 * paths (`/blog/history`) — so the SECOND segment is what tells them apart.
 */
const TENANT_ROUTE_SEGMENTS = new Set([
  'dashboard', 'analytics', 'all-deceased', 'deceased', 'deceased-details',
  'coffins', 'hearse', 'workshop', 'flowers', 'flower-samples', 'flower-bookings',
  'settings', 'leaves', 'support', 'support-dashboard', 'store', 'mini-store',
  'driver-portal', 'receptionist', 'reception', 'financials', 'financial-details',
  'monitoring', 'scanner', 'system-admin', 'release-form', 'requests',
  'postmortem-form', 'postmortem-qr', 'postmortem-results', 'postmortem-request',
  'postmortem-verify', 'visitors', 'chemicals', 'invoices', 'documents',
]);

/**
 * True for routes that require an authenticated session
 * (i.e. the only places a 401 is allowed to bounce the browser to /login).
 * Public pages — the landing page, /scanner, /blog, /pricing, ... — must
 * never be hijacked by a background 401.
 */
export const isAppPath = (pathname = typeof window !== 'undefined' ? window.location.pathname : '/') => {
  const path = pathname || '/';
  if (
    path.startsWith('/tenant/') ||   // legacy tenant URLs (still redirected in-app)
    path.startsWith('/dashboard') ||
    path.startsWith('/system-admin') ||
    path.startsWith('/monitoring')
  ) {
    return true;
  }

  // Slug-first tenant URL: /<slug>/<route>
  const [, first, second] = path.split('/');
  if (!first || !second) return false;
  return TENANT_ROUTE_SEGMENTS.has(second);
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
 * The database slug of the branch the signed-in user is working in.
 *
 * A multi-branch organisation runs ONE DATABASE PER BRANCH
 * (`<org>-<branch>`, e.g. `montenzuma-monalisa-feuneral-home-thika`) and the
 * branch's full slug IS its database name. The organisation (parent) slug
 * resolves to the MAIN/HQ database instead — that is why a user signed in at
 * Thika was served Nairobi's deceased records: the request was addressed with
 * the parent slug.
 *
 * Returns null for users without a branch (HQ/single-branch tenants), so
 * callers can fall back to the parent tenant slug.
 */
export const getBranchDbSlug = () => {
  // getBranchSlug() already falls back to the user blob
  // (branchSlug → branchDbName), then the persisted branch db name is used.
  const slug = getBranchSlug();
  if (isUsableSlug(slug)) return slug;
  try {
    const db = localStorage.getItem('branchDbName') || sessionStorage.getItem('branchDbName');
    if (isUsableSlug(db)) return db;
  } catch {
    // Storage unavailable (private mode / SSR)
  }
  return null;
};

/**
 * Tenant + branch headers for a request to the deceased module.
 *
 * The deceased-service (and the body-release lookups) pick the DATABASE from
 * `x-tenant-slug`, so for a branch user it MUST carry the branch slug — the
 * parent slug reads the organisation's main database. The explicit
 * `x-branch-*` headers travel alongside it so services that scope by branch
 * once (instead of by database) keep working too.
 *
 * @param {string} [tenantSlug] organisation slug — the fallback for users who
 *                              are not assigned to a branch (HQ / single-branch).
 */
export const getBranchScopeHeaders = (tenantSlug) => {
  const branchSlug = getBranchDbSlug();
  const headers = {};

  // Prefer the branch: it decides which database the record lives in.
  const effectiveSlug = branchSlug || tenantSlug;
  if (effectiveSlug) headers['x-tenant-slug'] = String(effectiveSlug);

  const branchId = getBranchId();
  if (branchId) headers['x-branch-id'] = String(branchId);
  if (branchSlug) headers['x-branch-slug'] = String(branchSlug);
  if (branchSlug) headers['x-branch-db'] = String(branchSlug);

  return headers;
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
