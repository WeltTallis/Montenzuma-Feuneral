/**
 * Coffin Service - add `paid` and `client_phone` to coffin_bookings.
 * Idempotent migration: only adds columns when missing, safe to run on existing
 * databases (existing rows keep paid=0 / NULL phone). Needed so the reservation
 * detail view can show payment status and the client phone, and so the
 * "Mark as Paid" action can persist.
 */
module.exports = {
  async up(knex) {
    const hasTable = async (t) => { try { return await knex.schema.hasTable(t); } catch { return false; } };
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (await hasTable('coffin_bookings') && !(await hasColumn('coffin_bookings', 'paid'))) {
      await knex.raw('ALTER TABLE `coffin_bookings` ADD COLUMN `paid` TINYINT(1) NOT NULL DEFAULT 0');
    }

    if (await hasTable('coffin_bookings') && !(await hasColumn('coffin_bookings', 'client_phone'))) {
      await knex.raw('ALTER TABLE `coffin_bookings` ADD COLUMN `client_phone` VARCHAR(100) NULL');
    }
  },

  async down(knex) {
    // Non-destructive (matches the style of sibling migrations in this service).
  },
};
