/**
 * SQL filter builder for analytics controllers  (audit finding 2.4)
 * =============================================================================
 * These controllers previously built their WHERE fragments by interpolating
 * `req.query` straight into template literals:
 *
 *   const statusFilter  = query.status  ? `AND hb.status = '${query.status}'`   : '';
 *   const searchFilter  = query.searchQuery
 *     ? `AND (hb.client_name LIKE '%${query.searchQuery}%' ...)` : '';
 *   return `AND DATE(hb.booking_date) BETWEEN '${query.startDate}' AND '${query.endDate}'`;
 *
 * Those fragments were concatenated into the statement text and the values were
 * NOT passed in `params`, so mysql2 offered no protection whatsoever. Combined
 * with the `optionalAuth` middleware on the analytics routes, that made the
 * endpoints reachable with no authentication and turned
 *
 *   GET /api/v1/restpoint/analytics/hearse?searchQuery=x' UNION SELECT jwt_secret,2,3
 *     FROM tenant_tracking.tenants-- %
 *
 * into a working exfiltration primitive.
 *
 * The rule now enforced by this module: **no user-supplied value is ever
 * concatenated into SQL text.** Every value is bound through a `?` placeholder
 * and supplied via `params`. Column names may still be interpolated, but they
 * are supplied exclusively by the code below from a closed union of known
 * identifiers — never by a request.
 */

/** The only column expressions this module is allowed to interpolate. */
export type FilterColumn =
  | 'd.date_admitted'
  | 'date_admitted'
  | 'hb.booking_date'
  | 'hb.branch_id'
  | 'hb.status'
  | 'hb.client_name'
  | 'hb.booking_code'
  | 'h.destination'
  | 'fb.delivery_date'
  | 'fb.status'
  | 'fb.priority'
  | 'fb.deceased_name'
  | 'fb.funeral_home'
  | 'fb.arrangement_name';

// ─── Input validators ───────────────────────────────────────────────────────
// These normalise and constrain input BEFORE it reaches a placeholder. The
// placeholder is what actually makes the query injection-proof; the validators
// exist so that a hostile value becomes a harmless no-op instead of a
// semantically valid but wrong result set (e.g. `status=<script>`).

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TOKEN_RE = /^[A-Za-z0-9][A-Za-z0-9 _.:@#-]{0,99}$/;
const BRANCH_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/** Accept only a real calendar date in `YYYY-MM-DD` form. */
export function sanitizeDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!DATE_RE.test(trimmed)) return undefined;
  // Reject 2025-02-31 and friends: construct the date and compare the round-trip.
  const [y, m, d] = trimmed.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return undefined;
  }
  return trimmed;
}

/** Accept only one of a fixed set of literals. */
export function sanitizeEnum(value: unknown, allowed: readonly string[]): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return allowed.includes(trimmed) ? trimmed : undefined;
}

/** Accept only a short human-readable token (search terms, status labels). */
export function sanitizeToken(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 100) return undefined;
  return TOKEN_RE.test(trimmed) ? trimmed : undefined;
}

/** Accept only an identifier, which is later used inside a LIKE pattern. */
export function sanitizeBranchId(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const trimmed = String(value).trim();
  return BRANCH_ID_RE.test(trimmed) ? trimmed : undefined;
}

/** Accept only an integer inside an inclusive range. */
export function sanitizeInteger(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(n) || n < min || n > max) return undefined;
  return n;
}


// ─── FilterBuilder ──────────────────────────────────────────────────────────

export interface BuiltFilter {
  /** SQL text containing only `?` placeholders — never a user value. */
  sql: string;
  /** Values to bind, in the same order as the placeholders appear. */
  params: any[];
}

/**
 * Accumulates `AND <condition> ?` fragments and the matching bind values.
 *
 * Usage at a call site:
 *
 *   const f = buildHearseFilters(query);
 *   safeTenantQuery(dbName, `SELECT ... WHERE hb.tenant_slug = ? ${f.sql}`,
 *                   [tenantSlug, ...f.params]);
 *
 * The tenant slug is bound first because it is written first in the statement;
 * every filter value then follows in exactly the order its placeholder appears.
 */
export class FilterBuilder {
  private readonly parts: string[] = [];
  private readonly values: any[] = [];

  /** `AND <column> = ?` */
  equals(column: FilterColumn, value: unknown): this {
    if (value === undefined || value === null || value === '') return this;
    this.parts.push(`AND ${column} = ?`);
    this.values.push(value);
    return this;
  }

  /** `AND <column> BETWEEN ? AND ?` (both bounds already validated). */
  between(column: FilterColumn, from?: string, to?: string): this {
    if (!from || !to) return this;
    this.parts.push(`AND ${column} BETWEEN ? AND ?`);
    this.values.push(from, to);
    return this;
  }

  /** `AND <column> >= DATE_SUB(NOW(), INTERVAL ? MONTH)` */
  withinLastMonths(column: FilterColumn, months: number): this {
    this.parts.push(`AND ${column} >= DATE_SUB(NOW(), INTERVAL ? MONTH)`);
    this.values.push(months);
    return this;
  }

  /** `AND <column> = CURDATE()` / an explicit literal date, both parameter-free. */
  equalsDate(column: FilterColumn, isoDate?: string): this {
    if (isoDate) {
      this.parts.push(`AND ${column} = ?`);
      this.values.push(isoDate);
    } else {
      this.parts.push(`AND ${column} = CURDATE()`);
    }
    return this;
  }

  /** `AND MONTH(<column>) = ? AND YEAR(<column>) = ?` */
  monthAndYear(column: FilterColumn, month?: number, year?: number): this {
    if (month === undefined || year === undefined) return this;
    this.parts.push(`AND MONTH(${column}) = ? AND YEAR(${column}) = ?`);
    this.values.push(month, year);
    return this;
  }

  /**
   * `AND (<col> LIKE ? ESCAPE '\\' OR <col> LIKE ? ESCAPE '\\' ...)`
   * The search term is bound, not concatenated, and LIKE metacharacters in the
   * user's own input are escaped so `%` cannot widen the match.
   */
  anyLike(columns: readonly FilterColumn[], value: string | undefined): this {
    if (!value || columns.length === 0) return this;
    const pattern = `%${escapeLike(value)}%`;
    const clause = columns.map((c) => `${c} LIKE ? ESCAPE '\\\\'`).join(' OR ');
    this.parts.push(`AND (${clause})`);
    for (let i = 0; i < columns.length; i += 1) this.values.push(pattern);
    return this;
  }

  /** Raw escape hatch for a condition that is already fully parameterised. */
  raw(sql: string, ...params: any[]): this {
    this.parts.push(sql);
    this.values.push(...params);
    return this;
  }

  build(): BuiltFilter {
    return { sql: this.parts.length ? this.parts.join(' ') : '', params: this.values };
  }
}

/** Time-range → month-count lookup. Unrecognised values fall back to 3 months. */
export function monthsBackFromTimeRange(timeRange: unknown, table: Record<string, number>): number {
  const key = typeof timeRange === 'string' ? timeRange.trim() : '';
  return table[key] ?? table['3m'] ?? 3;
}

/**
 * Escape the LIKE metacharacters `%` and `_` plus the escape character itself,
 * so a user searching for "100%" does not match every row. Used together with
 * `ESCAPE '\\'` so backslashes are not swallowed by MySQL's own escaping.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
