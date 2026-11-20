
// HEARSE SERVICE - Branch display-name resolution


import { safeQuery } from '../database';

export interface BranchRegistryEntry {
    branch_id: string;
    branch_name: string;
    branch_slug: string;
    branch_code: string;
}

/** How long the (tiny) branch registry may be reused before being re-read. */
const REGISTRY_TTL_MS = 5 * 60 * 1000;

const GENERIC_BRANCH_NAMES = new Set([
    'main branch', 'main', 'default', 'branch', 'unknown', 'n/a', '—', ''
]);
const REGISTRY_SQL = `SELECT id, branch_slug, branch_name, branch_db_name
                        FROM tenant_tracking.branches
                       WHERE is_active = 1`;

let cache: { at: number; map: Map<string, BranchRegistryEntry> } | null = null;

const isGenericBranchName = (name: unknown): boolean =>
    GENERIC_BRANCH_NAMES.has(String(name ?? '').trim().toLowerCase());

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
        const ownName = String(row.branch_name || '').trim();
        const hearseName = String(row.hearse_branch_name || '').trim();

        row.branch_name =
            (!isGenericBranchName(ownName) ? ownName : '')
            || (entry?.branch_name)
            || (!isGenericBranchName(hearseName) ? hearseName : '')
            || ownName
            || hearseName
            || null;


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
