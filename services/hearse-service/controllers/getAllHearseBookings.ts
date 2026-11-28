
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { safeQuery } from '../database';
import { hearseCacheGet, hearseCacheSet, BOOKING_CACHE_TTL } from '../utilities/hearseCache';
import { decorateBranchNames } from '../utilities/branchNames';

/**
 * Get all hearse bookings
 */
export const getAllHearseBookings = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { status, from, to } = req.query;
        const whereClauses: string[] = [];
        const params: any[] = [];

        // NOTE: Do NOT filter by branch_id — hearses are in a SHARED operations
        // database across ALL branches. Hearse bookings are TENANT-wide: every branch
        // must see every booking so the whole fleet can coordinate.
        // ACCURACY: because the operations DB is shared by MANY tenants, always scope
        // by the calling tenant's id (x-tenant-id). Legacy rows may only have
        // tenant_db_name, so match those as well for the same tenant.
        const headerOf = (name: string): string | null => {
            const v = (req.headers as any)[name];
            return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
        };
        const tenantId = headerOf('x-tenant-id') || (req.query as any)?.tenant_id ||
            (req as any).tenant?.id || (req as any).tenant?.tenant_id || null;
        const tenantSlugScope = headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug ||
            (req as any).tenantSlug || (req.query as any)?.tenant_slug || null;

        if (tenantId) {
            whereClauses.push('(hb.tenant_id = ? OR (hb.tenant_id IS NULL AND hb.tenant_db_name = ?))');
            params.push(tenantId, tenantSlugScope || '');
        } else if (tenantSlugScope) {
            whereClauses.push('hb.tenant_db_name = ?');
            params.push(tenantSlugScope);
        }

        if (status && status !== 'all') {
            whereClauses.push('hb.status = ?');
            params.push(status);
        }

        // ─── MONTH SCOPING ───────────────────────────────────────────────────
        // The Hearse page is a calendar, so it only ever renders ONE month at a
        // time. Previously this endpoint always returned every booking the tenant
        // has ever had, so a long-established funeral home downloaded thousands
        // of rows just to draw 30 day cells. `from`/`to` are inclusive
        // YYYY-MM-DD bounds; a booking is kept when any of its dates fall inside.
        //
        // `booking_dates` is a TEXT column holding the EXPANDED list of every day
        // the booking spans, e.g. '["2026-08-30","2026-08-31","2026-09-01"]'.
        // A booking that overlaps September therefore always contains at least
        // one "2026-09-" key, so a month-prefix LIKE is an exact test for this
        // data model (the same technique the notification cron already uses).
        // The legacy single-date `booking_date` column is OR-ed in so older rows
        // without a booking_dates array are never silently dropped.
        const isDateKey = (v: any): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
        // Shape check alone is not enough: "2026-99-99" matches the regex but is
        // not a real date. Round-tripping through Date rejects impossible
        // months/days (and 29 Feb in a non-leap year) without pulling in a
        // date library.
        const isRealDate = (v: any): v is string => {
            if (!isDateKey(v)) return false;
            const [y, m, d] = v.split('-').map(Number);
            if (m < 1 || m > 12 || d < 1 || d > 31) return false;
            const dt = new Date(Date.UTC(y, m - 1, d));
            return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
        };
        // A reversed range (to before from) is a caller bug, not a request for
        // "everything" — normalising it silently would hide the bug and widen
        // the scan, so swap it back into a sane order instead.
        const rawFrom = isRealDate(from) ? from : null;
        const rawTo = isRealDate(to) ? to : null;
        const fromKey = rawFrom && rawTo && rawFrom > rawTo ? rawTo : rawFrom;
        const toKey = rawFrom && rawTo && rawFrom > rawTo ? rawFrom : rawTo;
        if (fromKey || toKey) {
            // Collect every YYYY-MM prefix the requested range touches, so a
            // range spanning a month boundary (or a whole year) still works.
            const prefixes = new Set<string>();
            const start = fromKey || toKey!;
            const [sy, sm] = start.split('-').map(Number);
            const [ey, em] = (toKey || fromKey!).split('-').map(Number);
            const span = Math.abs((ey * 12 + em) - (sy * 12 + sm));
            // Cap at 24 months: a wider request is almost certainly a mistake
            // and should not silently become a full-table scan.
            if (span <= 24) {
                for (let i = 0; i <= span; i += 1) {
                    const total = (sy * 12 + sm - 1) + i;
                    prefixes.add(`${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`);
                }
            }
            const bits: string[] = [];
            if (prefixes.size > 0 && prefixes.size <= 24) {
                // NOTE: the LIKE patterns MUST be bound parameters. They used to
                // be inlined unquoted (a bare `%"2026-09-%`), so MySQL rejected
                // the whole statement with ER_PARSE_ERROR and
                // GET /hearse-bookings answered 500 for EVERY request that
                // carried from/to — i.e. every month the calendar asked for.
                const likes = [...prefixes].map(() => 'hb.booking_dates LIKE ?');
                for (const prefix of prefixes) params.push(`%"${prefix}-%`);
                bits.push(`(${likes.join(' OR ')})`);
            }
            // Legacy rows only carry the single `booking_date` column, so they get
            // a real range test. They must NOT be OR-ed as `>= from OR <= to`:
            // that matches every booking older than `to`, i.e. the whole table.
            if (fromKey && toKey) {
                bits.push('(hb.booking_date >= ? AND hb.booking_date <= ?)');
                params.push(fromKey, toKey);
            } else if (fromKey) {
                bits.push('hb.booking_date >= ?'); params.push(fromKey);
            } else if (toKey) {
                bits.push('hb.booking_date <= ?'); params.push(toKey);
            }
            if (bits.length > 0) whereClauses.push(`(${bits.join(' OR ')})`);
        }

        // ─── REDIS CACHE ─────────────────────────────────────────────────────
        // This endpoint had no cache at all, so the Hearse Bookings page hit
        // MySQL on every render. The cache key must include BOTH the status
        // filter and the tenant scope (the namespace already carries the scope,
        // so only the filter belongs in the key).
        const statusFilter = status && status !== 'all' ? String(status) : 'all';
        // The month range MUST be part of the key: without it, September's
        // response would be served to an October request and the calendar would
        // silently show the wrong month.
        const rangeFilter = fromKey && toKey ? `${fromKey}_${toKey}` : (fromKey || toKey || 'all');
        const cacheKey = `bookings:list:status:${statusFilter}:range:${rangeFilter}`;

        // Same scope rule on read and write: an unscoped request queries the whole
        // shared operations DB, so it must neither read from nor write to cache.
        const cacheScopeSafe = tenantId != null || tenantSlugScope != null;

        if (cacheScopeSafe) {
            const cached = await hearseCacheGet<any>(req, cacheKey);
            if (cached) {
                res.status(200).json({
                    ...cached,
                    source: 'cache',
                    total: cached.bookings?.length ?? 0
                });
                return;
            }
        }

        const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        // Branch display names are NOT resolved with a SQL join any more.
        // `branches` is a per-tenant table (plus the tenant_tracking registry)
        // and DOES NOT EXIST in restpoint_operations, so the old
        // `LEFT JOIN branches b ON COALESCE(hb.branch_id, h.branch_id) = b.branch_id`
        // made this endpoint answer 500 (ER_NO_SUCH_TABLE: table
        // 'restpoint_operations.branches' doesn't exist) for every request — the
        // whole Hearse page was dead. It also matched nothing: those ids are
        // UUIDs (or NULL), not the integers of the old schema.
        // decorateBranchNames() resolves the REAL branch name from the branch
        // registry afterwards and can never fail the request.
        // Tenant identifiers are selected only for registry matching and are
        // stripped before the payload is sent. Branch identity comes from the
        // booking, not the hearse, because they can belong to different branches.
        const query = `
            SELECT hb.id AS booking_id, hb.booking_code, hb.client_name, hb.client_phone,
                   hb.destination, hb.from_location, hb.to_location, hb.from_timestamp,
                   hb.branch_name, hb.status, hb.booking_dates, hb.created_at, hb.updated_at,
                   hb.booked_by, hb.cancel_reason, hb.postpone_reason, hb.service_charge,
                   hb.driver_id, hb.driver_id AS assigned_driver_id,
                   hb.manual_driver_name, hb.assistant_name, hb.assistant_phone,
                   COALESCE(NULLIF(hb.manual_driver_name, ''), d.full_name) AS assigned_driver_name,
                   hb.branch_slug AS booking_branch_slug, hb.tenant_slug AS tenant_slug,
                   hb.tenant_db_name AS tenant_db_name, hb.branch_id, hb.branch_code,
                   h.id AS hearse_id, h.plate_number, h.hearse_name, h.model,
                   h.status AS hearse_status, h.capacity,
                   h.branch_id AS hearse_branch_id, h.branch_code AS hearse_branch_code,
                   h.branch_name AS hearse_branch_name
              FROM hearse_bookings hb
              LEFT JOIN hearses h ON hb.hearse_id = h.id
              LEFT JOIN drivers d ON d.id = hb.driver_id
              ${whereSQL}
             ORDER BY hb.created_at DESC`;

        const bookings = await decorateBranchNames(
            await safeQuery(query, params) as any[],
            { strip: ['tenant_slug', 'tenant_db_name'] }
        );
        let allBranches: any[] = [];
        try {
            allBranches = await safeQuery(tenantId
                ? `SELECT DISTINCT branch_id, branch_code, branch_name FROM hearses WHERE branch_id IS NOT NULL AND tenant_id = ? ORDER BY branch_name ASC`
                : `SELECT DISTINCT branch_id, branch_code, branch_name FROM hearses WHERE branch_id IS NOT NULL ORDER BY branch_name ASC`,
                tenantId ? [tenantId] : []);
        } catch (e) { /* branches lookup optional */ }

        const payload = { status: 'success', total: bookings.length, bookings, branches: allBranches };

        // Same scope rule as the read above: an unscoped response must not be
        // written to cache either.
        if (cacheScopeSafe) {
            await hearseCacheSet(req, cacheKey, payload, BOOKING_CACHE_TTL);
        }

        res.status(200).json({ ...payload, source: 'database' });
    } catch (error: any) {
        // Never swallow the cause: the previous 'generic 500' made the
        // ER_NO_SUCH_TABLE above invisible in production logs.
        console.error('[hearse] getAllHearseBookings failed:',
            error?.code || '', error?.sqlMessage || error?.message || error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch hearse bookings.' });
    }
});
