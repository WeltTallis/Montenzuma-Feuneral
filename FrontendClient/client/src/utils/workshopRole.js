/**
 * Role gate for the Workshop module.
 *
 * Two things are admin-only:
 *   - the Store tab's Calendar / History journal (they are management views;
 *     floor staff work from the live inventory list instead)
 *   - "Register Worker" (adding people is an admin action)
 *
 * The role list mirrors the one already used by SettingsPage so the two pages
 * never disagree about who counts as an admin.
 */

const ADMIN_ROLES = ['admin', 'manager', 'systemadmin', 'system_administrator', 'tenant_admin'];

/** Reads the signed-in user's role out of storage. Returns '' when unknown. */
export const getUserRole = () => {
  try {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!raw) return '';
    return String(JSON.parse(raw)?.role || '').toLowerCase();
  } catch {
    return '';
  }
};

/** True when the signed-in user may see admin-only workshop features. */
export const isWorkshopAdmin = () => ADMIN_ROLES.includes(getUserRole());

export default { getUserRole, isWorkshopAdmin, ADMIN_ROLES };