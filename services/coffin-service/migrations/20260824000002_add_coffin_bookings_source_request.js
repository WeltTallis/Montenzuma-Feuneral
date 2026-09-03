/**
 * Coffin Service - add `source_request_id` to coffin_bookings.
 * Idempotent migration: adds the column only when missing. Links a reservation
 * back to the inter-branch stock request that produced it, so a delivered
 * transfer can be registered as a REAL reservation exactly once (idempotent
 * even if "Delivered" is confirmed twice).
 */
module.exports = {
  async up(knex) {
    const hasTable = async (t) => { try { return await knex.schema.hasTable(t); } catch { return false; } };
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (await hasTable('coffin_bookings') && !(await hasColumn('coffin_bookings', 'source_request_id'))) {
      await knex.raw('ALTER TABLE `coffin_bookings` ADD COLUMN `source_request_id` VARCHAR(255) NULL');
    }

    try {
      if (await hasTable('coffin_bookings')) {
        await knex.raw('ALTER TABLE `coffin_bookings` ADD INDEX `idx_cbk_source_request_id` (`source_request_id`)');
      }
    } catch (e) {
      // Index may already exist (e.g. created by a prior partial run); ignore duplicate-key errors.
    }
  },

  async down(knex) {
    // Non-destructive (matches the style of sibling migrations in this service).
  },
};
