// ============================================
// HEARSE SERVICE - Branch display-name resolution
// ============================================
// WHY THIS EXISTS
// ---------------
// `branches` is a PER-TENANT table: the tenant-service creates it inside every
// tenant database (branch_id, branch_name, branch_slug, branch_code,
// branch_db_name, …) and mirrors it into the platform-wide registry
// `tenant_tracking.branches`.
//
// It does NOT exist in `restpoint_operations` — the shared database the hearse
// service is connected to. Two queries used to do
// `LEFT JOIN branches b ON COALESCE(hb.branch_id, h.branch_id) = b.branch_id`
// while pointing at restpoint_operations, so MySQL answered
// `ER_NO_SUCH_TABLE (1146) Table 'restpoint_operations.branches' doesn't exist`
// and:
//   • GET /hearse-bookings returned 500 for every month, and
//   • the notification cron logged the same error every 30 seconds.
//
// The join was also meaningless: `hearse_bookings.branch_id` /
// `hearses.branch_id` are UUIDs (or NULL) while the old integer `branches`
// schema they were matched against never existed here.
//
// This module resolves the display name from the REGISTRY instead, keyed on the
// identifiers a booking actually carries (branch slug, tenant/branch db name,
// branch code, branch id). Every lookup is best-effort: a missing registry or a
// transient DB error must never break the booking list, so callers always get
// their rows back (annotated when resolution worked, untouched when it did not).

import { safeQuery } from '../database';

export interface BranchRegistryEntry {
    branch_id: string;
    branch_name: string;
    branch_slug: string;
    branch_code: string;
}

/** How long the (tiny) branch registry may be reused before being re-read. */
const REGISTRY_TTL_MS = 5 * 60 * 1000;

/**
 * Values that are NOT real branch names. `hearses.branch_name` is seeded with
 * "Main Branch" / "Branch 1" by older rows, so a resolved registry name must
 * win over them.
 */
const GENERIC_BRANCH_NAMES = new Set([
    'main branch', 'main', 'default', 'branch', 'unknown', 'n/a', '—', ''
]);

// Columns that exist in BOTH known schemas of tenant_tracking.branches:
// the original init-db.sql table (id, tenant_slug, branch_slug, branch_name,
// branch_db_name, parent_branch_id, is_active) and the newer one that also has
// tenant_id / branch_code. `branch_id` is deliberately NOT used: it only exists
// in the per-tenant `branches` table, not in this registry.
const REGISTRY_SQL = `SELECT id, branch_slug, branch_name, branch_db_name
                        FROM tenant_tracking.branches
                       WHERE is_active = 1`;

let cache: { at: number; map: Map<string, BranchRegistryEntry> } | null = null;

const isGenericBranchName = (name: unknown): boolean =>
    GENERIC_BRANCH_NAMES.has(String(name ?? '').trim().toLowerCase());

/**
 * Cached `<any branch identifier> → { branch_name, branch_slug, branch_code }`
 * lookup. Never throws: if the registry is missing (older deployments) or the
 * query fails, an empty map is returned so callers fall back to the values
 * stored on the row itself.
 */
export async function getBranchRegistry(): Promise<Map<string, BranchRegistryEntry>> {
    if (cache && Date.now() - cache.at < REGISTRY_TTL_MS) {
        return cache.map;
    }

    try {
        const rows = (await safeQuery(REGISTRY_SQL, [])) as any[];
        const map = new Map<string, BranchRegistryEntry>();

        for (const row of rows) {
            if (!row || !row.branch_name) continue;
            const entry: BranchRegistryEntry = {
                branch_id: row.id != null ? String(row.id) : '',
                branch_name: String(row.branch_name),
                branch_slug: row.branch_slug != null ? String(row.branch_slug) : '',
                branch_code: row.branch_code != null ? String(row.branch_code) : '',
            };
            // Index the entry under every identifier a booking/hearse row can
            // realistically carry, so one registry read serves all tenants.
            for (const key of [row.id, row.branch_slug, row.branch_db_name, row.branch_code]) {
                if (key != null && key !== '') {
                    map.set(String(key).toLowerCase(), entry);
                }
            }
        }

        cache = { at: Date.now(), map };
        return map;
    } catch (error: any) {
        // Cache the miss too: retrying on every request would hammer a table
        // that is legitimately absent in this deployment.
        cache = { at: Date.now(), map: new Map() };
        console.warn('[hearse] branch registry unavailable, using stored branch values:', error?.message || error);
        return cache.map;
    }
}

/**
 * Find the registry entry for a booking/hearse row using the identifiers that
 * row carries. The booking's OWN branch wins over the hearse's, because a
 * booking made by branch A can be served by a hearse owned by branch B.
 */
function matchBranchEntry(row: any, map: Map<string, BranchRegistryEntry>): BranchRegistryEntry | undefined {
    if (!row) return undefined;
    const keys = [
        row.branch_slug,        // booking's own branch slug (exact, most reliable)
        row.booking_branch_slug,
        row.tenant_slug,        // branch tenants address their DB by branch slug
        row.tenant_db_name,
        row.branch_code,
        row.booking_branch_id,
        row.branch_id,
    ];
    for (const key of keys) {
        if (key == null || key === '') continue;
        const hit = map.get(String(key).toLowerCase());
        if (hit) return hit;
    }
    return undefined;
}

export interface DecorateBranchNamesOptions {
    /** Row fields used only for matching, removed again before the row is sent. */
    strip?: string[];
}

/**
 * Annotate booking rows with `branch_name` / `branch_slug` /
 * `branch_slug_resolved` (the key the hearse UI already reads).
 *
 * Rows are mutated in place and returned for convenience. When the registry has
 * no entry the row keeps whatever it already had, so the response shape stays
 * identical for deployments without a registry.
 */
export async function decorateBranchNames(
    rows: any[],
    options: DecorateBranchNamesOptions = {}
): Promise<any[]> {
    if (!Array.isArray(rows) || rows.length === 0) return rows;

    const map = await getBranchRegistry();
    const strip = options.strip || [];

    for (const row of rows) {
        if (!row) continue;

        const entry = matchBranchEntry(row, map);

        // Prefer the registry name, then a real name already on the row, then
        // the hearse's own (possibly generic) branch name.
        const ownName = String(row.branch_name || '').trim();
        const hearseName = String(row.hearse_branch_name || '').trim();

        row.branch_name =
            (entry?.branch_name)
            || (!isGenericBranchName(ownName) ? ownName : '')
            || (!isGenericBranchName(hearseName) ? hearseName : '')
            || ownName
            || hearseName
            || null;

        // booking_branch_slug is what the UI's slug→name resolver keys on, so it
        // is upgraded too when the registry knows the real slug.
        const slug = entry?.branch_slug
            || String(row.branch_slug || '').trim()
            || String(row.booking_branch_slug || '').trim();
        if (slug) {
            row.branch_slug = slug;
            row.branch_slug_resolved = slug;
            if (!row.booking_branch_slug) row.booking_branch_slug = slug;
        }

        if ((row.branch_code == null || row.branch_code === '') && entry?.branch_code) {
            row.branch_code = entry.branch_code;
        }

        for (const key of strip) delete row[key];
    }

    return rows;
}
