import { getHearsePool } from '../database';

// ============================================
// HEARSE SCHEMA CAPABILITY HELPERS
// ============================================
// The hearse-service reads/writes the SHARED `hearses` table in the
// operations database. Different deployments may be on slightly different
// schema versions (e.g. a column added by a migration that hasn't run yet,
// or a DB provisioned out-of-band). These helpers report which optional
// columns actually exist so callers can build their INSERT/UPDATE statements
// against the *effective* schema instead of assuming a column is present and
// failing with "Unknown column".
//
// Mirrors the ensureHoldColumns pattern used in workshop-service.
// ============================================

const CACHE_TTL_MS = 60_000;
let cache: { at: number; columns: Set<string> } | null = null;

export const getHearseColumns = async (): Promise<Set<string>> => {
    const now = Date.now();
    if (cache && (now - cache.at) < CACHE_TTL_MS) {
        return cache.columns;
    }
    try {
        const pool = await getHearsePool();
        const [rows] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hearses'`
        );
        const cols = new Set((rows as any[]).map((r: any) => String(r.COLUMN_NAME)));
        cache = { at: now, columns: cols };
        return cols;
    } catch (e: any) {
        // On introspection failure, be conservative: assume the column exists
        // so we don't silently drop data; the migration guarantees it exists.
        console.warn('[hearse-schema] column introspection failed:', e?.message || e);
        cache = { at: now, columns: new Set<string>(['fuel_card_number']) };
        return cache.columns;
    }
};

export const hasHearseColumn = async (column: string): Promise<boolean> => {
    const cols = await getHearseColumns();
    return cols.has(column);
};

export const invalidateHearseColumnsCache = (): void => {
    cache = null;
};
