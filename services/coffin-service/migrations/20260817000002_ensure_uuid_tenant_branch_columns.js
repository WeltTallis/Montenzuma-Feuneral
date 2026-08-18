/**
 * Coffin Service - ensure tenant_id/branch_id are stored as VARCHAR UUID strings.
 *
 * The multi-branch tenant schema identifies tenants and branches with UUIDs
 * (e.g. branch_id '55e1190b-683a-4cef-a697-86508b3232f4', tenant_id
 * 'dc007ca7-e47f-4981-b22b-2712a3ca5569'). The old coffins/coffin_bookings/
 * stock_requests tables declared tenant_id / branch_id as INT, which silently
 * truncated or rejected UUID inserts and made coffins leak to every branch.
 *
 * This migration is idempotent: it widens (or adds) the columns to VARCHAR(100)
 * so the exact UUID string is persisted and reads compare exact UUID values.
 */
module.exports = {
  async up(knex) {
    const hasTable = async (table) => { try { return await knex.schema.hasTable(table); } catch { return false; } };
    const hasColumn = async (table, col) => { try { return await knex.schema.hasColumn(table, col); } catch { return false; } };

    const ensureVarchar = async (table, column) => {
      if (!(await hasTable(table))) return;
      if (await hasColumn(table, column)) {
        await knex.raw(`ALTER TABLE \`${table}\` MODIFY COLUMN \`${column}\` VARCHAR(100) NULL`);
      }
    };
    const ensureAdded = async (table, column) => {
      if (!(await hasTable(table))) return;
      if (!(await hasColumn(table, column))) {
        await knex.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` VARCHAR(100) NULL`);
      }
    };

    for (const table of ['coffins', 'coffin_bookings']) {
      await ensureVarchar(table, 'tenant_id');
      await ensureVarchar(table, 'branch_id');
    }

    // Cross-branch stock requests share the same central table.
    await ensureVarchar('stock_requests', 'tenant_id');
    await ensureAdded('stock_requests', 'from_branch_id');
    await ensureAdded('stock_requests', 'to_branch_id');
    await ensureVarchar('stock_requests', 'from_branch_id');
    await ensureVarchar('stock_requests', 'to_branch_id');
  },

  async down(knex) {
    // Non-destructive: columns simply remain widened VARCHAR(100) NULL.
  },
};