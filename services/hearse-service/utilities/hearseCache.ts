/**
 * @file services/hearse-service/utilities/hearseCache.ts
 * Redis cache helpers for the hearse service.
 *
 * WHY THIS EXISTS: hearse-service previously had NO caching at all — every
 * `GET /hearse-bookings` and `GET /hearses` went straight to MySQL, which is
 * why `redis-cli --scan` showed zero `service:hearse-service:*` keys while the
 * other services' traffic (BullMQ, notifications) dominated the keyspace.
 *
 * Keys live under `service:hearse-service:tenant:<slug>:<key>`, the exact
 * namespace clearServiceCache() SCANs, so a single call wipes every cached
 * read for that tenant after any write.
 */
import { Request } from 'express';
import { serviceGet, serviceSet, clearServiceCache } from '@montezuma/shared-services';

export const HEARSE_SERVICE_NAME = 'hearse-service';

/** Bookings change constantly (status flips, driver assignment, postponements),
 * so keep this TTL short. Reads are cheap to re-do if a stale row slips through
 * inside the window, and every write path still invalidates explicitly. */
export const BOOKING_CACHE_TTL = 30;
/** The fleet changes only when a hearse is registered/edited/removed. */
export const FLEET_CACHE_TTL = 300;

/**
 * Resolve the cache namespace for a request.
 *
 * The operations DB that holds `hearses` / `hearse_bookings` is SHARED by every
 * tenant, so the cache MUST be partitioned the same way the SQL is: by the
 * tenant id (x-tenant-id), falling back to the slug. Requests with neither are
 * deliberately mapped to a 'shared' bucket rather than being cached globally.
 */
export function hearseCacheScope(req: Request): string {
  const headerOf = (name: string): string | null => {
    const v = (req.headers as any)?.[name];
    return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
  };

  const tenantId =
    headerOf('x-tenant-id') ||
    (req.query as any)?.tenant_id ||
    (req as any).tenant?.id ||
    (req as any).tenant?.tenant_id ||
    null;

  const tenantSlug =
    headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug || (req as any).tenantSlug || null;

  if (tenantId != null && String(tenantId).trim() !== '') return `id-${String(tenantId).trim()}`;
  if (tenantSlug && tenantSlug !== 'system') return `slug-${tenantSlug}`;
  return 'shared';
}

/** Read a cached value, or null on a miss / Redis outage (never throws). */
export async function hearseCacheGet<T = any>(req: Request, key: string): Promise<T | null> {
  try {
    return await serviceGet<T>(HEARSE_SERVICE_NAME, hearseCacheScope(req), key);
  } catch {
    return null;
  }
}

/** Write a cached value. Failures are swallowed — a cache miss must never
 * turn a working endpoint into a 500. */
export async function hearseCacheSet(req: Request, key: string, value: any, ttl: number): Promise<boolean> {
  try {
    return await serviceSet(HEARSE_SERVICE_NAME, hearseCacheScope(req), key, value, ttl);
  } catch {
    return false;
  }
}

/**
 * Invalidate every cached hearse read for the calling tenant.
 * Call this after ANY create / update / status change / deletion.
 */
export async function invalidateHearseCache(req: Request): Promise<void> {
  try {
    await clearServiceCache(HEARSE_SERVICE_NAME, hearseCacheScope(req));
  } catch {
    // Non-critical: the TTL bounds staleness if Redis is unreachable.
  }
}