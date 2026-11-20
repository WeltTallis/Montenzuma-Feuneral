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
 *
 * Workshop access levels (lowest → highest privilege):
 *   - 'workshop'        floor staff — orders + materials (live board)
 *   - 'carpenter'       floor staff — orders + materials (live board)
 *   - 'workshop_technician' floor technician — orders + materials
 *   - 'workshop_manager' manager level — floor + store + worker/material registration
 *   - 'admin' / 'manager' / 'systemadmin' / 'system_administrator' / 'tenant_admin' — full access
 */

const ADMIN_ROLES = ['admin', 'manager', 'systemadmin', 'system_administrator', 'tenant_admin'];

/** Roles that may work the workshop floor (orders, materials, store). */
export const WORKSHOP_ROLES = [
  'workshop',
  'carpenter',
  'workshop_manager',
  'workshop_technician',
];

/** Roles that count as workshop management (store + worker/material registration). */
export const WORKSHOP_MANAGER_ROLES = [...WORKSHOP_ROLES, ...ADMIN_ROLES];

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

/** True when the user's role lets them enter the workshop module at all. */
export const canAccessWorkshop = (role = getUserRole()) =>
  WORKSHOP_ROLES.includes(role) || isWorkshopAdmin();

/** True when the user's role is workshop-management level (store, workers, materials). */
export const isWorkshopManager = (role = getUserRole()) =>
  WORKSHOP_MANAGER_ROLES.includes(role);

/** True when the user's role lets them create flower bookings. */
export const canCreateFlowerBooking = (role = getUserRole()) =>
  ['staff', 'manager', ...WORKSHOP_ROLES, ...ADMIN_ROLES].includes(role);

export default {
  getUserRole,
  isWorkshopAdmin,
  canAccessWorkshop,
  isWorkshopManager,
  canCreateFlowerBooking,
  ADMIN_ROLES,
  WORKSHOP_ROLES,
  WORKSHOP_MANAGER_ROLES,
};