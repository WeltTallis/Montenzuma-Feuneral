import { safeTenantQuery } from '../../../shared/dbConfig';

/**
 * Tenant databases were provisioned at different points in the product's life,
 * so their tables do NOT all carry the same columns — older tenants are missing
 * `age`, `phone_number`, `alternative_phone`, `signature`, `date_of_birth`, and
 * so on.
 *
 * Endpoints that hardcode a fixed column list therefore raise
 * ER_BAD_FIELD_ERROR ("Unknown column 'age' in 'SELECT'") on those tenants, and
 * `safeTenantQuery` rethrows — which surfaces as a 500 for the whole request.
 * Introspecting the live table lets a schema gap degrade to a NULL field instead
 * of failing the lookup.
 *
 * @returns lowercased column names, or an empty Set if the table is missing.
 */
export const tableColumns = async (dbName: string, table: string): Promise<Set<string>> => {
    try {
        const rows = await safeTenantQuery(
            dbName,
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            [dbName, table]
        );
        return new Set((Array.isArray(rows) ? rows : []).map((r: any) => String(r.COLUMN_NAME).toLowerCase()));
    } catch (e) {
        return new Set<string>();
    }
};

/**
 * Build one projection entry that is safe on ANY tenant schema: the real column
 * when it exists, otherwise a NULL alias so the response shape stays identical
 * for the frontend.
 */
export const pickAs = (present: Set<string>, col: string, alias: string, prefix = ''): string =>
    present.has(col) ? `${prefix}${col} AS ${alias}` : `NULL AS ${alias}`;
