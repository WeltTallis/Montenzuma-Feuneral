
// HEARSE SERVICE MIGRATION - Tenant context columns
// Adds tenant_id / tenant_slug to hearses & hearse_bookings and widens
// branch_id to VARCHAR so multi-branch tenants can store UUID branch ids.


exports.up = async function (knex) {
  const hasTable = async (t) => { try { return await knex.schema.hasTable(t); } catch { return false; } };
  const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

  // ── hearses ───────────────────────────────────────────────────────────
  if (await hasTable('hearses')) {
    if (!(await hasColumn('hearses', 'tenant_id'))) {
      await knex.raw('ALTER TABLE `hearses` ADD COLUMN `tenant_id` VARCHAR(36) NULL AFTER `id`');
    }
    if (!(await hasColumn('hearses', 'tenant_slug'))) {
      await knex.raw('ALTER TABLE `hearses` ADD COLUMN `tenant_slug` VARCHAR(255) NULL AFTER `tenant_id`');
    }
    // branch_id: INT -> VARCHAR(100) NULL (UUID branch ids for multi-branch tenants)
    await knex.raw('ALTER TABLE `hearses` MODIFY COLUMN `branch_id` VARCHAR(100) NULL');
  }

  // ── hearse_bookings ───────────────────────────────────────────────────
  if (await hasTable('hearse_bookings')) {
    if (!(await hasColumn('hearse_bookings', 'tenant_id'))) {
      await knex.raw('ALTER TABLE `hearse_bookings` ADD COLUMN `tenant_id` VARCHAR(36) NULL AFTER `tenant_db_name`');
    }
    if (!(await hasColumn('hearse_bookings', 'tenant_slug'))) {
      await knex.raw('ALTER TABLE `hearse_bookings` ADD COLUMN `tenant_slug` VARCHAR(255) NULL AFTER `tenant_id`');
    }
    if (!(await hasColumn('hearse_bookings', 'branch_slug'))) {
      await knex.raw('ALTER TABLE `hearse_bookings` ADD COLUMN `branch_slug` VARCHAR(255) NULL AFTER `branch_code`');
    }
    await knex.raw('ALTER TABLE `hearse_bookings` MODIFY COLUMN `branch_id` VARCHAR(100) NULL');
  }
};

exports.down = async function (knex) {
  const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };
  if (await hasColumn('hearses', 'tenant_id')) await knex.raw('ALTER TABLE `hearses` DROP COLUMN `tenant_id`');
  if (await hasColumn('hearses', 'tenant_slug')) await knex.raw('ALTER TABLE `hearses` DROP COLUMN `tenant_slug`');
  if (await hasColumn('hearse_bookings', 'tenant_id')) await knex.raw('ALTER TABLE `hearse_bookings` DROP COLUMN `tenant_id`');
  if (await hasColumn('hearse_bookings', 'tenant_slug')) await knex.raw('ALTER TABLE `hearse_bookings` DROP COLUMN `tenant_slug`');
  if (await hasColumn('hearse_bookings', 'branch_slug')) await knex.raw('ALTER TABLE `hearse_bookings` DROP COLUMN `branch_slug`');
};