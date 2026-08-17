/**
 * Florist Service - add tenant context columns so every flower booking / flower
 * sample records the tenant id and the branch id (multi-branch tenants scope
 * flowers by BOTH tenant and branch, exactly like coffins and hearses).
 */
export async function up(knex) {
  const hasTable = async (table) => { try { return await knex.schema.hasTable(table); } catch { return false; } };
  const hasColumn = async (table, col) => { try { return await knex.schema.hasColumn(table, col); } catch { return false; } };

  if (await hasTable('flower_bookings')) {
    if (!(await hasColumn('flower_bookings', 'tenant_slug'))) {
      await knex.raw('ALTER TABLE `flower_bookings` ADD COLUMN `tenant_slug` VARCHAR(255) NULL');
    }
    if (!(await hasColumn('flower_bookings', 'tenant_id'))) {
      await knex.raw('ALTER TABLE `flower_bookings` ADD COLUMN `tenant_id` VARCHAR(36) NULL');
    }
    if (!(await hasColumn('flower_bookings', 'branch_slug'))) {
      await knex.raw('ALTER TABLE `flower_bookings` ADD COLUMN `branch_slug` VARCHAR(255) NULL');
    }
    // branch_id: INT -> VARCHAR(100) NULL (UUID branch ids for multi-branch tenants)
    await knex.raw('ALTER TABLE `flower_bookings` MODIFY COLUMN `branch_id` VARCHAR(100) NULL');
  }

  if (await hasTable('flower_samples')) {
    if (!(await hasColumn('flower_samples', 'tenant_id'))) {
      await knex.raw('ALTER TABLE `flower_samples` ADD COLUMN `tenant_id` VARCHAR(36) NULL');
    }
    if (!(await hasColumn('flower_samples', 'branch_id'))) {
      await knex.raw('ALTER TABLE `flower_samples` ADD COLUMN `branch_id` VARCHAR(100) NULL');
    }
  }
}

export async function down(knex) {
  // Non-destructive: columns are simply kept as nullable VARCHAR.
}