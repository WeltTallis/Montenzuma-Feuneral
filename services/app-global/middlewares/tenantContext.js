'use strict';

const crypto = require('crypto');

// ─── Tenant context resolution (audit 2.2 / 2.3) ────────────────────────────
//
// The platform is DATABASE-PER-TENANT, so the tenant slug on a request *is* the
// isolation boundary. Before this module, ~40 controllers each did:
//
//     const tenantSlug = req.headers['x-tenant-slug'] || req.headers['x-tenant-id'] || 'system_shared';
//
// i.e. the tenant was chosen **entirely by the client**. Combined with a database
// name being derived from that value, this meant any authenticated user could
// read or mutate another tenant's data by changing one header — a full IDOR
// across invoices, coffins, hearses, analytics, deceased records and next-of-kin.
//
// The rule now enforced everywhere:
//
//   1. `req.tenantSlug`, set by `attachTenantFromClaims()` in authMiddleware.js
//      from the VERIFIED JWT claims, is authoritative.
//   2. The `x-tenant-slug` header is only a fallback for genuinely
//      unauthenticated / pre-authentication routes (login, register, public
//      lookup), and is always shape-validated first.
//   3. Duplicate headers (Node delivers arrays) never stringify as "[ 'a', 'b' ]".

const PLATFORM_ROLES = new Set(['systemadmin', 'superadmin']);

// Every tenant slug the platform issues is lowercase-kebab.
const TENANT_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
// Branch ids are concatenated into the "<org>-<branch>" database slug downstream.
const BRANCH_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

const DEFAULT_TENANT = 'system_shared';

const first = (value) => (Array.isArray(value) ? value[0] : value);

/**
 * Legitimate slug relationships inside ONE organisation:
 *  - exact match                       ("org"         -> "org")
 *  - a branch of the claimed tenant    ("org"         -> "org-machakos")
 *  - the parent of the claimed tenant  ("org-machakos"-> "org")
 * Anything else is a different organisation and must be refused.
 */
const slugBelongsToOrg = (claimSlug, headerSlug) => {
  if (!claimSlug || !headerSlug) return false;
  if (claimSlug === headerSlug) return true;
  return headerSlug.startsWith(`${claimSlug}-`) || claimSlug.startsWith(`${headerSlug}-`);
};
