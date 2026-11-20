/**
 * Coffin Service - add `amount` (total price) and `deposit` (amount paid) to
 * coffin_bookings.
 *
 * Idempotent migration: adds the columns only when missing. This lets clients
 * pay a deposit when reserving a coffin, and stores the full expected amount
 * so the dashboard can show outstanding balances per booking.
 *
 * Existing rows keep amount=0 / deposit=0.
 */
module.exports = {
  async up(knex) {
    const hasTable = async (t) => { try { return await knex.schema.hasTable(t); } catch { return false; } };
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (await hasTable('coffin_bookings') && !(await hasColumn('coffin_bookings', 'amount'))) {
      await knex.raw('ALTER TABLE `coffin_bookings` ADD COLUMN `amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `paid`');
    }

    if (await hasTable('coffin_bookings') && !(await hasColumn('coffin_bookings', 'deposit'))) {
      await knex.raw('ALTER TABLE `coffin_bookings` ADD COLUMN `deposit` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `amount`');
    }

    // Helpful indexes for search-by-name performance on the dashboard.
    if (await hasTable('coffin_bookings') && !(await hasColumn('coffin_bookings', 'amount'))) {
      // index already exists from column add if needed; named indexes below
    }
    try {
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_cbk_amount ON `coffin_bookings` (`amount`)');
    } catch { /* index may already exist */ }
    try {
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_cbk_deposit ON `coffin_bookings` (`deposit`)');
    } catch { /* index may already exist */ }
  },

  async down(knex) {
    // Non-destructive (matches the style of sibling migrations in this service).
  },
};
