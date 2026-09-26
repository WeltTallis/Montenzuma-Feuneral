/**
 * @file packages/shared-services/src/redisService.ts
 * CENTRALIZED: Redis Service with per-service memory limits
 */

import { createClient, RedisClientType, RedisModules, RedisFunctions, RedisScripts } from 'redis';
import Logger from '../../shared-logger/dist/index';

type RedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

const REDIS_AUTH_SEGMENT = process.env.REDIS_PASSWORD
  ? `:${encodeURIComponent(process.env.REDIS_PASSWORD)}@`
  : '';
const DEFAULT_REDIS_URL = process.env.REDIS_URL
  || (process.env.REDIS_HOST
    ? `redis://${REDIS_AUTH_SEGMENT}${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}`
    : 'redis://redis:6379');

// ─── Service Configurations

export interface ServiceConfig {
  name: string;              // Service name (e.g., 'deceased-service', 'auth-service')
  maxMemoryMB: number;       // Max RAM per service (default: 10MB)
  softLimitMB: number;       // Soft limit (default: 8MB)
  notificationTTL: number;   // Notification TTL in seconds
  balanceTTL: number;        // Balance cache TTL in seconds
}

// ─── Notification Types 

export enum NotificationType {
  ALERT = 'alert',
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error',
  SYSTEM = 'system',
  PAYMENT = 'payment',
  BOOKING = 'booking',
  REMINDER = 'reminder',
  TASK = 'task',
  DECEASED = 'deceased',
  HEARSE = 'hearse',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Notification {
  id: string;
  tenantSlug: string;
  serviceName: string;       // Which service created it
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  delivered: boolean;
  createdAt: string;
  expiresAt: string;
  source?: string;
  target?: string | string[];
  actions?: { label: string; url: string; }[];
}

export interface NotificationFilters {
  type?: NotificationType[];
  priority?: NotificationPriority[];
  serviceName?: string[];
  read?: boolean;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

// ─── Default Configuration ─────────────────────────────────────────────

const DEFAULT_SERVICE_CONFIG: Omit<ServiceConfig, 'name'> = {
  maxMemoryMB: 10,           // 10MB per service
  softLimitMB: 8,            // Start cleaning at 8MB
  notificationTTL: 86400,    // 24 hours
  balanceTTL: 300,           // 5 minutes
};

// Unregistered services fall back to these. They are ENV-TUNABLE because a
// single tenant page can legitimately be several megabytes (the deceased list
// caches whole rows, incl. long TEXT columns). With the old hard-coded
// 10MB/8MB budget, checkAndBalance() evicted the tenant's ENTIRE cache —
// including the entry that had just been written — so no key ever survived
// long enough to be read, i.e. the cache produced zero hits while the log only
// showed "cache miss" style DB reads.
const DEFAULT_MAX_MEMORY_MB = Number(process.env.REDIS_SERVICE_MAX_MEMORY_MB) > 0
  ? Number(process.env.REDIS_SERVICE_MAX_MEMORY_MB)
  : 10;
const DEFAULT_SOFT_LIMIT_MB = Number(process.env.REDIS_SERVICE_SOFT_LIMIT_MB) > 0
  ? Number(process.env.REDIS_SERVICE_SOFT_LIMIT_MB)
  : Math.max(1, Math.round(DEFAULT_MAX_MEMORY_MB * 0.8));

// A single cached value above this size is refused (see serviceSet). Caching a
// multi-megabyte JSON blob costs more than it saves and is what pushed tenants
// over the budget below. Tune with REDIS_MAX_CACHE_VALUE_KB (default 5MB).
const MAX_CACHE_VALUE_BYTES = (Number(process.env.REDIS_MAX_CACHE_VALUE_KB) > 0
  ? Number(process.env.REDIS_MAX_CACHE_VALUE_KB)
  : 5120) * 1024;

// checkAndBalance() SCANs every key of a service+tenant and calls MEMORY USAGE
// on each one. Running that after EVERY serviceSet doubled the cost of each
// cached write; throttle it per service+tenant instead.
const BALANCE_INTERVAL_MS = 30_000;
const lastBalanceRun = new Map<string, number>();

// Service config registry
const serviceConfigs = new Map<string, ServiceConfig>();

// ─── Notification Event Emitter ──────────────────────────────────────────

let notificationEmitter: ((notification: Notification) => void) | null = null;

export function setNotificationEmitter(emitter: (notification: Notification) => void): void {
  notificationEmitter = emitter;
  Logger.info('[Redis]  Notification emitter configured');
}

function emitNotification(notification: Notification): void {
  if (notificationEmitter) {
    notificationEmitter(notification);
  }
}

// ─── Service Configuration ──────────────────────────────────────────────

/**
 * Register or update service configuration
 */
export function registerService(config: ServiceConfig): void {
  const max = Math.min(config.maxMemoryMB, 20); // Max 20MB per service
  const soft = Math.min(config.softLimitMB || max * 0.8, max * 0.9);

  serviceConfigs.set(config.name, {
    ...DEFAULT_SERVICE_CONFIG,
    ...config,
    maxMemoryMB: max,
    softLimitMB: soft,
  });

  Logger.info(`[Redis]  Service "${config.name}" registered: ${max}MB max, ${soft}MB soft limit`);
}

/**
 * Get service configuration
 */
export function getServiceConfig(serviceName: string): ServiceConfig {
  const config = serviceConfigs.get(serviceName);
  if (config) return config;

  // Return default config if service not registered (env-tunable — see
  // DEFAULT_MAX_MEMORY_MB above).
  return {
    name: serviceName,
    maxMemoryMB: DEFAULT_MAX_MEMORY_MB,
    softLimitMB: DEFAULT_SOFT_LIMIT_MB,
    notificationTTL: 86400,
    balanceTTL: 300,
  };
}

// ─── Client Pool ─────────────────────────────────────────────────────

let client: RedisClient | null = null;
let isConnected = false;
let connecting: Promise<RedisClient | null> | null = null;
let lastConnectAttempt = 0;

// After a failure we wait this long (ms) before allowing another connect attempt.
// WITHOUT this back-off, a short Redis blip at startup would permanently disable
// caching for the whole process lifetime (previous `connectionAttempted` flag).
const RETRY_AFTER_MS = 5_000;

export async function getRedisClient(): Promise<RedisClient | null> {
  if (client && isConnected) return client;

  const now = Date.now();
  if (now - lastConnectAttempt < RETRY_AFTER_MS) return null;

  // Only ever run ONE connect attempt at a time — concurrent callers share it.
  if (!connecting) {
    lastConnectAttempt = now;
    connecting = (async (): Promise<RedisClient | null> => {
      try {
        const c = createClient({
          url: DEFAULT_REDIS_URL,
          socket: {
            reconnectStrategy: (retries: number) => Math.min(retries * 50, 2000),
            connectTimeout: 3000,
          },
        });

        c.on('connect', () => {
          Logger.info('[Redis]  Connected');
        });

        c.on('error', (err) => {
          if (isConnected) {
            Logger.error(`[Redis]  Error: ${err.message}`);
          }
          isConnected = false;
        });

        c.on('end', () => {
          Logger.info('[Redis]  Connection closed');
          isConnected = false;
        });

        await c.connect();

        // AUTH probe — the redis:// URL must embed the password. If the server
        // requires a password (requirepass) and the URL lacks it, every command
        // (GET/SET) fails with NOAUTH and the cache silently never works while the
        // app keeps hitting the database. Fail the connect attempt NOW so the
        // error surfaces in the logs instead of NOAUTH-ing on every request.
        const pong = await c.ping();
        if (pong !== 'PONG') {
          throw new Error(`Redis AUTH/ping failed (got: ${String(pong).slice(0, 40)})`);
        }

        client = c;
        isConnected = true;
        return c;
      } catch (error: any) {
        Logger.warn(`[Redis] Connection failed (will retry in ${RETRY_AFTER_MS / 1000}s): ${error.message}`);
        client = null;
        isConnected = false;
        return null;
      } finally {
        connecting = null;
      }
    })();
  }

  return connecting;
}

// ─── Key Namespacing ──────────────────────────────────────────────

export function serviceKey(serviceName: string, tenantSlug: string, key: string): string {
  return `service:${serviceName}:tenant:${tenantSlug}:${key}`;
}

export function notificationKey(tenantSlug: string, serviceName: string, notificationId: string): string {
  return `notifications:${tenantSlug}:${serviceName}:${notificationId}`;
}

export function crossNotificationKey(sourceTenant: string, targetTenant: string, notificationId: string): string {
  return `cross:notifications:${sourceTenant}:${targetTenant}:${notificationId}`;
}

// ─── Base Operations ──────────────────────────────────────────────

export async function serviceSet(
  serviceName: string,
  tenantSlug: string,
  key: string,
  value: any,
  ttlSeconds: number = 3600
): Promise<boolean> {
  try {
    const r = await getRedisClient();
    if (!r) return false;

    const fullKey = serviceKey(serviceName, tenantSlug, key);
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);

    // Refuse to cache an oversized payload. With the per-tenant budget in
    // checkAndBalance(), one huge entry (e.g. a page of deceased rows whose
    // `signature TEXT` column still holds base64 blobs) used to delete every
    // key of that tenant — including this one — immediately after writing it,
    // so the cache never served a hit and the counter looked "broken".
    const bytes = Buffer.byteLength(serialized, 'utf8');
    if (bytes > MAX_CACHE_VALUE_BYTES) {
      Logger.warn(
        `[Redis] serviceSet skipped ${fullKey}: value is ${Math.round(bytes / 1024)}KB ` +
        `(limit REDIS_MAX_CACHE_VALUE_KB=${Math.round(MAX_CACHE_VALUE_BYTES / 1024)}KB). ` +
        `Cache this response in a smaller shape or raise the limit.`
      );
      return false;
    }

    await r.setEx(fullKey, ttlSeconds, serialized);

    // Check memory usage after set
    await checkAndBalance(serviceName, tenantSlug);

    return true;
  } catch (error: any) {
    Logger.warn(`[Redis] serviceSet failed for ${serviceName}: ${error.message}`);
    return false;
  }
}

export async function serviceGet<T = any>(
  serviceName: string,
  tenantSlug: string,
  key: string
): Promise<T | null> {
  try {
    const r = await getRedisClient();
    if (!r) return null;

    const fullKey = serviceKey(serviceName, tenantSlug, key);
    const value = await r.get(fullKey);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  } catch (error: any) {
    Logger.warn(`[Redis] serviceGet failed for ${serviceName}: ${error.message}`);
    return null;
  }
}

export async function serviceDel(
  serviceName: string,
  tenantSlug: string,
  key: string
): Promise<boolean> {
  try {
    const r = await getRedisClient();
    if (!r) return false;

    const fullKey = serviceKey(serviceName, tenantSlug, key);
    await r.del(fullKey);
    return true;
  } catch (error: any) {
    Logger.warn(`[Redis] serviceDel failed for ${serviceName}: ${error.message}`);
    return false;
  }
}

// ─── Memory Management ──────────────────────────────────────────────

async function scanKeys(pattern: string): Promise<string[]> {
  const r = await getRedisClient();
  if (!r) return [];

  const keys: string[] = [];
  let cursor = 0;
  do {
    const result = await r.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = result.cursor;
    keys.push(...result.keys);
  } while (cursor !== 0);

  return keys;
}

export async function getServiceMemoryUsage(
  serviceName: string,
  tenantSlug: string
): Promise<{
  usedMB: number;
  maxMB: number;
  softLimitMB: number;
  percentage: number;
  softLimitPercentage: number;
  keys: number;
  keysWithTTL: number;
}> {
  try {
    const r = await getRedisClient();
    if (!r) return { usedMB: 0, maxMB: 0, softLimitMB: 0, percentage: 0, softLimitPercentage: 0, keys: 0, keysWithTTL: 0 };

    const pattern = serviceKey(serviceName, tenantSlug, '*');
    const keys = await scanKeys(pattern);

    let totalMemory = 0;
    let keysWithTTL = 0;
    for (const key of keys) {
      const mem = await r.memoryUsage(key) || 1024;
      totalMemory += mem;
      const ttl = await r.ttl(key);
      if (ttl > 0) keysWithTTL++;
    }

    const usedMB = totalMemory / (1024 * 1024);
    const config = getServiceConfig(serviceName);

    return {
      usedMB: Math.round(usedMB * 100) / 100,
      maxMB: config.maxMemoryMB,
      softLimitMB: config.softLimitMB,
      percentage: Math.min(Math.round((usedMB / config.maxMemoryMB) * 100), 100),
      softLimitPercentage: Math.min(Math.round((usedMB / config.softLimitMB) * 100), 100),
      keys: keys.length,
      keysWithTTL,
    };
  } catch (error: any) {
    Logger.warn(`[Redis] getServiceMemoryUsage failed: ${error.message}`);
    return { usedMB: 0, maxMB: 0, softLimitMB: 0, percentage: 0, softLimitPercentage: 0, keys: 0, keysWithTTL: 0 };
  }
}

export async function checkAndBalance(
  serviceName: string,
  tenantSlug: string
): Promise<{
  balanced: boolean;
  removed: number;
  freedMB: number;
  reason: 'soft_limit' | 'hard_limit' | 'none';
}> {
  try {
    const r = await getRedisClient();
    if (!r) return { balanced: false, removed: 0, freedMB: 0, reason: 'none' };

    // Throttle — this walks every key of the service+tenant and calls
    // MEMORY USAGE on each one. Doing it after every single set was the main
    // cost of the cache and the reason entries vanished right after being
    // written whenever a tenant sat at the limit.
    const throttleKey = `${serviceName}:${tenantSlug}`;
    const now = Date.now();
    if (now - (lastBalanceRun.get(throttleKey) || 0) < BALANCE_INTERVAL_MS) {
      return { balanced: false, removed: 0, freedMB: 0, reason: 'none' };
    }
    lastBalanceRun.set(throttleKey, now);

    const memory = await getServiceMemoryUsage(serviceName, tenantSlug);
    const config = getServiceConfig(serviceName);

    if (memory.usedMB < config.softLimitMB) {
      return { balanced: false, removed: 0, freedMB: 0, reason: 'none' };
    }

    const isHardLimit = memory.usedMB >= config.maxMemoryMB * 0.85;
    const reason = isHardLimit ? 'hard_limit' : 'soft_limit';

    const pattern = serviceKey(serviceName, tenantSlug, '*');
    const keys = await scanKeys(pattern);

    const keyData = await Promise.all(
      keys.map(async (key) => {
        const ttl = await r.ttl(key);
        const mem = await r.memoryUsage(key) || 1024;
        return { key, ttl, mem };
      })
    );

    keyData.sort((a, b) => {
      if (a.ttl === -1 && b.ttl === -1) return 0;
      if (a.ttl === -1) return 1;
      if (b.ttl === -1) return -1;
      return a.ttl - b.ttl;
    });

    const targetMB = isHardLimit ? config.softLimitMB : config.softLimitMB * 0.85;

    let removed = 0;
    let freedMB = 0;
    let currentMB = memory.usedMB;

    for (const { key, ttl, mem } of keyData) {
      if (currentMB <= targetMB) break;
      if (ttl === -1 && !isHardLimit) continue;

      await r.del(key);
      removed++;
      freedMB += mem / (1024 * 1024);
      currentMB -= mem / (1024 * 1024);
    }

    if (removed > 0) {
      const level = isHardLimit ? 'warn' : 'info';
      Logger[level](
        `[Redis] 🔄 Balanced "${serviceName}" for "${tenantSlug}": ` +
        `${removed} keys, ${Math.round(freedMB * 100) / 100}MB freed (${reason})`
      );
    }

    return { balanced: removed > 0, removed, freedMB: Math.round(freedMB * 100) / 100, reason };
  } catch (error: any) {
    Logger.warn(`[Redis] checkAndBalance failed: ${error.message}`);
    return { balanced: false, removed: 0, freedMB: 0, reason: 'none' };
  }
}

// ─── UNIVERSAL NOTIFICATION SYSTEM ─────────────────────────────────────

export async function storeNotification(
  tenantSlug: string,
  serviceName: string,
  notification: Omit<Notification, 'createdAt' | 'expiresAt' | 'read' | 'delivered' | 'serviceName'>
): Promise<Notification | null> {
  try {
    const r = await getRedisClient();
    if (!r) return null;

    const config = getServiceConfig(serviceName);
    const ttl = config.notificationTTL;

    const fullNotification: Notification = {
      ...notification,
      tenantSlug,
      serviceName,
      read: false,
      delivered: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
    };

    const key = notificationKey(tenantSlug, serviceName, notification.id);
    await r.setEx(key, ttl, JSON.stringify(fullNotification));

    const listKey = `notifications:${tenantSlug}:${serviceName}:list`;
    await r.lPush(listKey, notification.id);
    await r.expire(listKey, ttl);

    emitNotification(fullNotification);
    await checkAndBalance(serviceName, tenantSlug);

    Logger.info(`[Redis]  [${serviceName}] Notification: ${notification.type} - ${notification.title}`);
    return fullNotification;
  } catch (error: any) {
    Logger.error(`[Redis] storeNotification failed: ${error.message}`);
    return null;
  }
}

export async function getNotifications(
  tenantSlug: string,
  serviceName?: string,
  filters?: NotificationFilters
): Promise<{ notifications: Notification[]; total: number }> {
  try {
    const r = await getRedisClient();
    if (!r) return { notifications: [], total: 0 };

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    // If no service specified, get from all services
    if (!serviceName) {
      const allNotifications: Notification[] = [];
      const serviceNames = Array.from(serviceConfigs.keys());

      for (const svc of serviceNames) {
        const listKey = `notifications:${tenantSlug}:${svc}:list`;
        const ids = await r.lRange(listKey, offset, offset + limit - 1);
        for (const id of ids) {
          const key = notificationKey(tenantSlug, svc, id);
          const data = await r.get(key);
          if (data) {
            try {
              allNotifications.push(JSON.parse(data));
            } catch { }
          }
        }
      }

      // Apply filters
      let filtered = allNotifications;
      if (filters?.type) filtered = filtered.filter(n => filters.type!.includes(n.type));
      if (filters?.priority) filtered = filtered.filter(n => filters.priority!.includes(n.priority));
      if (filters?.serviceName) filtered = filtered.filter(n => filters.serviceName!.includes(n.serviceName));
      if (filters?.read !== undefined) filtered = filtered.filter(n => n.read === filters.read);

      return { notifications: filtered.slice(0, limit), total: filtered.length };
    }

    // Get from specific service
    const listKey = `notifications:${tenantSlug}:${serviceName}:list`;
    const ids = await r.lRange(listKey, offset, offset + limit - 1);

    const notifications: Notification[] = [];
    for (const id of ids) {
      const key = notificationKey(tenantSlug, serviceName, id);
      const data = await r.get(key);
      if (data) {
        try {
          const notif = JSON.parse(data);
          if (filters?.type && !filters.type.includes(notif.type)) continue;
          if (filters?.priority && !filters.priority.includes(notif.priority)) continue;
          if (filters?.read !== undefined && notif.read !== filters.read) continue;
          notifications.push(notif);
        } catch { }
      }
    }

    return { notifications, total: notifications.length };
  } catch (error: any) {
    Logger.warn(`[Redis] getNotifications failed: ${error.message}`);
    return { notifications: [], total: 0 };
  }
}

export async function deleteNotification(
  tenantSlug: string,
  serviceName: string,
  notificationId: string
): Promise<boolean> {
  try {
    const r = await getRedisClient();
    if (!r) return false;

    const key = notificationKey(tenantSlug, serviceName, notificationId);
    await r.del(key);

    const listKey = `notifications:${tenantSlug}:${serviceName}:list`;
    await r.lRem(listKey, 1, notificationId);

    Logger.info(`[Redis] 🗑️ [${serviceName}] Notification deleted: ${notificationId}`);
    return true;
  } catch (error: any) {
    Logger.warn(`[Redis] deleteNotification failed: ${error.message}`);
    return false;
  }
}

export async function deleteAllNotifications(
  tenantSlug: string,
  serviceName: string
): Promise<number> {
  try {
    const r = await getRedisClient();
    if (!r) return 0;

    const listKey = `notifications:${tenantSlug}:${serviceName}:list`;
    const ids = await r.lRange(listKey, 0, -1);

    let deleted = 0;
    for (const id of ids) {
      const key = notificationKey(tenantSlug, serviceName, id);
      await r.del(key);
      deleted++;
    }

    await r.del(listKey);
    Logger.info(`[Redis] 🗑️ [${serviceName}] Deleted ${deleted} notifications`);
    return deleted;
  } catch (error: any) {
    Logger.warn(`[Redis] deleteAllNotifications failed: ${error.message}`);
    return 0;
  }
}

// ─── Per-Service Cache Clearing ──────────────────────────────────────────────

/**
 * Clear all cache entries for a specific service and tenant
 */
export async function clearServiceCache(
  serviceName: string,
  tenantSlug: string
): Promise<number> {
  try {
    const r = await getRedisClient();
    if (!r) return 0;

    const pattern = serviceKey(serviceName, tenantSlug, '*');
    const keys = await scanKeys(pattern);

    if (keys.length > 0) {
      await r.del(keys);
      Logger.info(`[Redis]  [${serviceName}] Cleared ${keys.length} cache entries for "${tenantSlug}"`);
    }
    return keys.length;
  } catch (error: any) {
    Logger.error(`[Redis] clearServiceCache failed: ${error.message}`);
    return 0;
  }
}

// ─── Tenant-wide Cache Clearing ────────────────────────────────────────────

/**
 * Clear ALL cache entries for a specific tenant across all registered services.
 * This is useful when suspending/deleting a tenant to ensure all their cached data is purged.
 */
export async function clearTenantCache(tenantSlug: string): Promise<number> {
  try {
    const r = await getRedisClient();
    if (!r) return 0;

    let totalCleared = 0;

    // Clear cache for each registered service
    for (const [serviceName] of serviceConfigs) {
      const pattern = serviceKey(serviceName, tenantSlug, '*');
      const keys = await scanKeys(pattern);
      if (keys.length > 0) {
        await r.del(keys);
        totalCleared += keys.length;
      }
    }

    // Also clear any notification keys for this tenant
    const notifPattern = `notifications:${tenantSlug}:*`;
    const notifKeys = await scanKeys(notifPattern);
    if (notifKeys.length > 0) {
      await r.del(notifKeys);
      totalCleared += notifKeys.length;
    }

    Logger.info(`[Redis] 🧹 Cleared ${totalCleared} cache entries for tenant "${tenantSlug}"`);
    return totalCleared;
  } catch (error: any) {
    Logger.error(`[Redis] clearTenantCache failed for "${tenantSlug}": ${error.message}`);
    return 0;
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────

export async function redisHealth(): Promise<{
  status: string;
  latencyMs: number;
  services: number;
}> {
  const start = Date.now();
  try {
    const r = await getRedisClient();
    if (!r) return { status: 'DISCONNECTED', latencyMs: 0, services: 0 };
    await r.ping();
    return {
      status: 'UP',
      latencyMs: Date.now() - start,
      services: serviceConfigs.size,
    };
  } catch {
    return { status: 'DOWN', latencyMs: Date.now() - start, services: 0 };
  }
}

// ─── Initialization ──────────────────────────────────────────────────────

export async function initRedis(serviceConfigsList?: ServiceConfig[]): Promise<boolean> {
  if (serviceConfigsList) {
    serviceConfigsList.forEach((config) => registerService(config));
  }

  const client = await getRedisClient();
  if (client) {
    Logger.info('[Redis] ✅ Initialized successfully');
    Logger.info(`[Redis] 📊 Registered ${serviceConfigs.size} services`);
    return true;
  }

  Logger.warn('[Redis] ⚠️ Running in fallback mode (no Redis)');
  return false;
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────

export default {
  // Connection
  getRedisClient,
  redisHealth,
  initRedis,

  // Service config
  registerService,
  getServiceConfig,

  // Cache operations
  serviceSet,
  serviceGet,
  serviceDel,
  clearServiceCache,
  clearTenantCache,

  // Memory management
  getServiceMemoryUsage,
  checkAndBalance,

  // Universal Notification System
  storeNotification,
  getNotifications,
  deleteNotification,
  deleteAllNotifications,
  setNotificationEmitter,

  // Enums
  NotificationType,
  NotificationPriority,
};