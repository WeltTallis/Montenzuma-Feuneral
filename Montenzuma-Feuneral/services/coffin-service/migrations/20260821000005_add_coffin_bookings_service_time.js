/**
 * Coffin Service - add `service_time` to coffin_bookings.
 * Idempotent migration: adds the column only when missing. Coffin reservations can
 * optionally carry a service time (HH:MM) so the dashboard shows the real time per
 * booking instead of a phantom default.
 */
module.exports = {
  async up(knex) {
    const hasTable = async (t) => { try { return await knex.schema.hasTable(t); } catch { return false; } };
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (await hasTable('coffin_bookings') && !(await hasColumn('coffin_bookings', 'service_time'))) {
      await knex.raw('ALTER TABLE `coffin_bookings` ADD COLUMN `service_time` VARCHAR(10) NULL');
    }
  },

  async down(knex) {
    // Non-destructive (matches the style of sibling migrations in this service).
  },
};
