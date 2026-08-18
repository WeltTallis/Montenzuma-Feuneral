/**
 * Coffin Service - add `service_date` to coffin_bookings.
 * This migration is idempotent: it only adds the column when it is missing and
 * is safe to run on existing databases (existing rows keep NULL service_date;
 * the controller falls back to DATE(created_at) for them so they still render).
 */
module.exports = {
  async up(knex) {
    const hasTable = async (table) => { try { return await knex.schema.hasTable(table); } catch { return false; } };
    const hasColumn = async (table, col) => { try { return await knex.schema.hasColumn(table, col); } catch { return false; } };

    if (await hasTable('coffin_bookings') && !(await hasColumn('coffin_bookings', 'service_date'))) {
      await knex.raw('ALTER TABLE `coffin_bookings` ADD COLUMN `service_date` DATE NULL');
    }

    try {
      if (await hasTable('coffin_bookings')) {
        await knex.raw('ALTER TABLE `coffin_bookings` ADD INDEX `idx_cbk_service_date` (`service_date`)');
      }
    } catch (e) {
      // Index may already exist (e.g. created by a prior partial run); ignore duplicate-key errors.
    }
  },

  async down(knex) {
    // Non-destructive (matches the style of sibling migrations in this service).
  },
};