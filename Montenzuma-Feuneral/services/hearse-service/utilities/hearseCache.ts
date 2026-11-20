/**
 * @file services/hearse-service/utilities/hearseCache.ts
 * Redis cache helpers for the hearse service.

 */

import { Request } from 'express';
import { serviceGet, serviceSet, clearServiceCache } from '@montezuma/shared-services';

export const HEARSE_SERVICE_NAME = 'hearse-service';

/** Booking mutations invalidate this cache, so a longer TTL improves reuse
 * without extending staleness after writes handled by this service. */
export const BOOKING_CACHE_TTL = 120;
/** The fleet changes only when a hearse is registered/edited/removed. */
export const FLEET_CACHE_TTL = 300;

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
    headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug || (req as any).tenantSlug ||
    (req.query as any)?.tenant_slug || null;

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
export function hearseCacheScopes(req: Request): string[] {
  const scopes = new Set<string>();
  scopes.add(hearseCacheScope(req));

  // Resolve every plausible tenant scope so a stale entry written under a
  // different identifier (id vs. slug vs. shared bucket) is also purged.
  const headerOf = (name: string): string | null => {
    const v = (req.headers as any)?.[name];
    return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
  };
  const tenantId = headerOf('x-tenant-id') || (req.query as any)?.tenant_id ||
    (req as any).tenant?.id || (req as any).tenant?.tenant_id || null;
  const tenantSlug = headerOf('x-tenant-slug') || (req as any).tenant?.tenant_slug ||
    (req as any).tenantSlug || (req.query as any)?.tenant_slug || null;
  if (tenantId != null && String(tenantId).trim() !== '') scopes.add(`id-${String(tenantId).trim()}`);
  if (tenantSlug && tenantSlug !== 'system') scopes.add(`slug-${tenantSlug}`);
  scopes.add('shared');
  return [...scopes];
}

export async function invalidateHearseCache(req: Request): Promise<void> {
  try {
    for (const scope of hearseCacheScopes(req)) {
      await clearServiceCache(HEARSE_SERVICE_NAME, scope);
    }
  } catch {
    // Non-critical: the TTL bounds staleness if Redis is unreachable.
  }
}