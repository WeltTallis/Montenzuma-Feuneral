/**
 * Coffin Service - add from/to branch context to stock_requests.
 *
 * Cross-branch stock requests are stored in ONE central shared table. The frontend
 * classifies requests as "incoming" / "outgoing" using from_branch_id / to_branch_id
 * (the branch UUIDs used across the tenant), so we persist them alongside friendly
 * branch NAMES (from_branch_name / to_branch_name, e.g. "Nairobi", "Machakos") so the
 * UI can display names without needing to resolve every id. A quantity column is also
 * added so request amounts survive.
 */
module.exports = {
  async up(knex) {
    const hasTable = async (table) => { try { return await knex.schema.hasTable(table); } catch { return false; } };
    const hasColumn = async (table, col) => { try { return await knex.schema.hasColumn(table, col); } catch { return false; } };

    if (!(await hasTable('stock_requests'))) return;

    if (!(await hasColumn('stock_requests', 'from_branch_id'))) {
      await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `from_branch_id` VARCHAR(100) NULL');
    }
    if (!(await hasColumn('stock_requests', 'to_branch_id'))) {
      await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `to_branch_id` VARCHAR(100) NULL');
    }
    if (!(await hasColumn('stock_requests', 'from_branch_name'))) {
      await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `from_branch_name` VARCHAR(255) NULL');
    }
    if (!(await hasColumn('stock_requests', 'to_branch_name'))) {
      await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `to_branch_name` VARCHAR(255) NULL');
    }
    if (!(await hasColumn('stock_requests', 'quantity'))) {
      await knex.raw('ALTER TABLE `stock_requests` ADD COLUMN `quantity` INT NULL DEFAULT 1');
    }
  },

  async down(knex) {
    // Non-destructive: columns simply remain in place.
  },
};

