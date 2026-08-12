/**
 * Coffin Service - 006 create central `deceased_coffin` table (all tenants).
 * Tracks which coffin is assigned to which deceased person.
 */
module.exports = {
  async up(knex) {
    const exists = await knex.schema.hasTable('deceased_coffin');
    if (exists) return;

    await knex.schema.createTable('deceased_coffin', (table) => {
      table.increments('id').primary();
      table.string('deceased_id', 100).notNullable();
      table.string('coffin_id', 255).notNullable();
      table.string('tenant_slug', 100).notNullable();
      table.integer('tenant_id').nullable();
      table.string('assigned_by_username', 100).nullable();
      table.date('assigned_date').notNullable();
      table.string('rfid', 100).nullable();
      table.string('created_at', 255).nullable();

      table.index(['deceased_id'], 'idx_dcf_deceased_id');
      table.index(['coffin_id'], 'idx_dcf_coffin_id');
      table.index(['tenant_slug'], 'idx_dcf_tenant_slug');
      table.index(['assigned_date'], 'idx_dcf_assigned_date');
      table.unique(['rfid'], { indexName: 'uq_dcf_rfid' });
      table.unique(['deceased_id', 'coffin_id'], { indexName: 'uq_deceased_coffin' });
    });
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('deceased_coffin');
  },
};
