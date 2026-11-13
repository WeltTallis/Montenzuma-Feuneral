/**
 * @file shared/dbConfig.ts
 * PRODUCTION-GRADE CENTRALIZED DATABASE CONFIGURATION
 * Features: Circuit Breaker, Pool Limits, Logger, Memory Leak Prevention
 */
import * as mysql from 'mysql2/promise';
export declare const getRootPool: () => Promise<mysql.Pool>;
/**
 * Resolve a tenant slug → database name through the tenant allowlist.
 *
 * SECURITY: the slug is ALWAYS matched against tenant_tracking.tenants, so an
 * arbitrary schema name (information_schema, mysql, another tenant's db_name,
 * …) can never be used as "the tenant".
 *
 * `requireActive` defaults to TRUE (unchanged behaviour for every caller).
 * Pass `{ requireActive: false }` when the DATA must still be readable while the
 * tenant row is not `status = "active"` (suspended / trial / pending) — e.g. the
 * deceased-service, where a suspended funeral home must keep access to its
 * mortuary records. The slug↔db_name allowlist check is kept in both modes.
 *
 * RESOLUTION ORDER (first hit wins):
 *   1. tenants.tenant_slug / tenants.db_name (exact, trimmed, `-`/`_` folded)
 *   2. tenant_tracking.branches.branch_slug → branch_db_name (the parent row is
 *      the fallback) — multi-branch tenants address a branch as
 *      `<org>-<branch>`, a slug `tenants` alone does not know about
 *   3. `<parent>-<branch>` decomposition: the parent tenant's own `branches`
 *      table decides the database (`branch_slug` exact, then a name match)
 */
export declare const lookupTenantDatabase: (tenantSlug: string, options?: {
    requireActive?: boolean;
}) => Promise<string | null>;
export declare const resolveDatabase: (slug: string) => Promise<string | null>;
export declare const getTenantDB: (tenantDbName: string) => Promise<mysql.Pool>;
export declare const getTenantDBBySlug: (tenantSlug: string) => Promise<mysql.Pool | null>;
export declare const query: (req: any, sql: string, params?: any[]) => Promise<any[]>;
export declare const execute: (req: any, sql: string, params?: any[]) => Promise<mysql.ResultSetHeader>;
export declare const safeTenantQuery: (dbName: string, sql: string, params?: any[]) => Promise<any[]>;
export declare const safeTenantExecute: (dbName: string, sql: string, params?: any[]) => Promise<mysql.ResultSetHeader>;
export declare const closeTenantDB: (tenantDbName: string) => Promise<void>;
export declare const closeAllConnections: () => Promise<void>;
export declare const healthCheck: () => Promise<{
    status: string;
    pools: number;
    cacheSize: number;
    rootPoolBreaker: string;
    timestamp: string;
    error?: string;
}>;
declare const _default: {
    getRootPool: () => Promise<mysql.Pool>;
    lookupTenantDatabase: (tenantSlug: string, options?: {
        requireActive?: boolean;
    }) => Promise<string | null>;
    resolveDatabase: (slug: string) => Promise<string | null>;
    getTenantDB: (tenantDbName: string) => Promise<mysql.Pool>;
    getTenantDBBySlug: (tenantSlug: string) => Promise<mysql.Pool | null>;
    query: (req: any, sql: string, params?: any[]) => Promise<any[]>;
    execute: (req: any, sql: string, params?: any[]) => Promise<mysql.ResultSetHeader>;
    safeTenantQuery: (dbName: string, sql: string, params?: any[]) => Promise<any[]>;
    safeTenantExecute: (dbName: string, sql: string, params?: any[]) => Promise<mysql.ResultSetHeader>;
    closeTenantDB: (tenantDbName: string) => Promise<void>;
    closeAllConnections: () => Promise<void>;
    healthCheck: () => Promise<{
        status: string;
        pools: number;
        cacheSize: number;
        rootPoolBreaker: string;
        timestamp: string;
        error?: string;
    }>;
};
export default _default;
//# sourceMappingURL=dbConfig.d.ts.map