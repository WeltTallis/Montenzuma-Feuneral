/**
 * Coffin Service - widen tenant_id & branch_id to VARCHAR(100) NULL so records can
 * store the UUID tenant id + UUID branch id used by the current tenant schema
 * (multi-branch tenants scope coffins/coffin_bookings by BOTH tenant and branch).
 * Existing records keep their legacy INT values ('1', '2', ...).
 */
module.exports = {
  async up(knex) {
    const hasTable = async (table) => { try { return await knex.schema.hasTable(table); } catch { return false; } };
    const hasColumn = async (table, col) => { try { return await knex.schema.hasColumn(table, col); } catch { return false; } };

    for (const table of ['coffins', 'coffin_bookings']) {
      const exists = await hasTable(table);
      if (!exists) continue;

      if (!(await hasColumn(table, 'tenant_id'))) {
        await knex.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`tenant_id\` VARCHAR(100) NULL`);
      } else {
        await knex.raw(`ALTER TABLE \`${table}\` MODIFY COLUMN \`tenant_id\` VARCHAR(100) NULL`);
      }

      if (!(await hasColumn(table, 'branch_id'))) {
        await knex.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`branch_id\` VARCHAR(100) NULL`);
      } else {
        await knex.raw(`ALTER TABLE \`${table}\` MODIFY COLUMN \`branch_id\` VARCHAR(100) NULL`);
      }

      if (!(await hasColumn(table, 'tenant_slug'))) {
        await knex.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`tenant_slug\` VARCHAR(255) NULL`);
      }
    }
  },

  async down(knex) {
    // Non-destructive: columns simply remain widened VARCHAR(100) NULL.
  },
};