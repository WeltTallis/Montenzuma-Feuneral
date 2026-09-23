/**
 * Coffin Service - add `notes` to coffin_bookings.
 * Idempotent migration: adds the column only when missing. Reservations created
 * from the coffin inventory "New Reservation" sidebar collect a note from the
 * user, but it was never persisted (no column existed), so the reservation
 * detail sidebar had nothing to display.
 */
module.exports = {
  async up(knex) {
    const hasTable = async (t) => { try { return await knex.schema.hasTable(t); } catch { return false; } };
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (await hasTable('coffin_bookings') && !(await hasColumn('coffin_bookings', 'notes'))) {
      await knex.raw('ALTER TABLE `coffin_bookings` ADD COLUMN `notes` TEXT NULL');
    }
  },

  async down(knex) {
    // Non-destructive (matches the style of sibling migrations in this service).
  },
};
