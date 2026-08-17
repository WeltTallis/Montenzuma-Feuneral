import type { Knex } from 'knex';

/**
 * Adds custom tenant code + shared database columns to the master tenants table.
 * tenant_code      → custom tenant ID like "<tenantname>-a3f9" (unique, human-friendly).
 * db_shared_name   → name of the tenant's 2nd (SHARED) database that all branches share
 *                    (hearse / coffin / workshop operational data in one place).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tenants', (table) => {
    table.string('tenant_code', 100).nullable().unique();
    table.string('db_shared_name', 100).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tenants', (table) => {
    table.dropColumn('tenant_code');
    table.dropColumn('db_shared_name');
  });
}