/**
 * Single source of truth for where the floating notification bell is allowed
 * to render.
 *
 * The bell is a global overlay (position: fixed, top-left — see
 * NotificationBell.css), so it must stay off the standalone screens where it
 * either covers page chrome or simply isn't wanted:
 *
 *   • /deceased/register  — body intake (deceased registration) form
 *   • /release-form/:id   — body release form
 *   • /driver-portal      — drivers portal
 *   • /dashboard          — the main dashboard
 *   • /analytics          — the same dashboard component, under its 2nd route
 *   • /receptionist       — reception portal
 *   • /flower-samples     — public flower gallery
 *   • /flowers            — the whole flower bookings area: list, /flowers/new
 *                           form and /flowers/order/:id detail (one prefix
 *                           match covers all three)
 *
 * Entries are tenant-relative paths WITHOUT a leading tenant segment, e.g.
 * "/dashboard" matches /acme/dashboard but never hides the bell because
 * the tenant slug itself happens to be called "dashboard".
 */
export const BELL_HIDDEN_ROUTES = [
  '/deceased/register', // body intake form
  '/release-form', // body release form
  '/driver-portal', // drivers portal
  '/dashboard', // main dashboard (standalone, full-screen)
  '/analytics', // same dashboard component under the analytics route
  '/receptionist', // reception portal
  '/flower-samples', // public flower gallery
  '/flowers', // whole flower bookings area: list, /flowers/new form, /flowers/order/:id detail (prefix match covers all three)
];

/** Strip the tenant segment (and any trailing slash) so matching is slug-proof.
 *  Current URLs are slug-first — /<slug>/<route> — while /tenant/<slug>/<route>
 *  is the legacy shape that must keep working for old bookmarks. */
const toTenantRelativePath = (pathname) => {
  const clean = String(pathname || '').split('?')[0].replace(/\/+$/, '') || '/';

  const legacy = clean.replace(/^\/tenant\/[^/]+/, '');
  if (legacy !== clean) return legacy || '/';

  // Slug-first: strip the first segment ONLY when what remains is one of the
  // hidden routes, so a tenant whose slug happens to be "dashboard" can never
  // hide the bell by accident.
  const segments = clean.split('/').filter(Boolean);
  if (segments.length > 1) {
    const rest = `/${segments.slice(1).join('/')}`;
    if (BELL_HIDDEN_ROUTES.some((route) => rest === route || rest.startsWith(`${route}/`))) {
      return rest;
    }
  }
  return clean;
};

/**
 * @param {string} pathname window/router pathname (e.g. location.pathname)
 * @returns {boolean} true when the bell may be rendered on this screen
 */
export function shouldShowNotificationBell(pathname) {
  const routePath = toTenantRelativePath(pathname);
  return !BELL_HIDDEN_ROUTES.some(
    (route) => routePath === route || routePath.startsWith(`${route}/`)
  );
}

export default shouldShowNotificationBell;
