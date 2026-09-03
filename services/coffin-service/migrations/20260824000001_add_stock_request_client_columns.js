/**
 * Coffin Service - add client/expected-date columns to `stock_requests`.
 * Idempotent migration: only adds a column when it is missing, safe to run on
 * existing databases. Needed so a client coffin transfer request stores WHO it
 * is for (client/phone/deceased) and WHEN the coffin is expected (service_date)
 * — the reservation dashboard surfaces undelivered client transfers as
 * reservations and needs these fields.
 */
module.exports = {
  async up(knex) {
    const hasTable = async (t) => { try { return await knex.schema.hasTable(t); } catch { return false; } };
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (await hasTable('stock_requests')) {
      if (!(await hasColumn('stock_requests', 'client_name'))) {
        await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `client_name` VARCHAR(255) NULL');
      }
      if (!(await hasColumn('stock_requests', 'client_phone'))) {
        await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `client_phone` VARCHAR(50) NULL');
      }
      if (!(await hasColumn('stock_requests', 'deceased_name'))) {
        await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `deceased_name` VARCHAR(255) NULL');
      }
      if (!(await hasColumn('stock_requests', 'service_date'))) {
        await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `service_date` DATE NULL');
      }
      if (!(await hasColumn('stock_requests', 'notes'))) {
        await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `notes` TEXT NULL');
      }
    }

    try {
      if (await hasTable('stock_requests')) {
        await knex.raw('ALTER TABLE `stock_requests` ADD INDEX `idx_sreq_service_date` (`service_date`)');
      }
    } catch (e) {
      // Index may already exist (e.g. created by a prior partial run); ignore duplicate-key errors.
    }
  },

  async down(knex) {
    // Non-destructive (matches the style of sibling migrations in this service).
  },
};
