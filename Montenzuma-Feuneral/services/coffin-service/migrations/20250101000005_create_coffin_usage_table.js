/**
 * Coffin Service - 005 create central `coffin_usage` table (all tenants).
 */
module.exports = {
  async up(knex) {
    const exists = await knex.schema.hasTable('coffin_usage');
    if (exists) return;

    await knex.schema.createTable('coffin_usage', (table) => {
      table.increments('usage_id').primary();
      table.string('coffin_id', 255).notNullable();
      table.string('tenant_slug', 100).notNullable();
      table.integer('tenant_id').nullable();
      table.string('deceased_id', 100).nullable();
      table.integer('quantity_used').notNullable().defaultTo(1);
      table.decimal('unit_price', 15, 2).notNullable().defaultTo(0);
      table.decimal('total_price', 15, 2).notNullable().defaultTo(0);
      table.string('invoice_id', 100).nullable();
      table.string('used_at', 255).notNullable();
      table.text('notes').nullable();
      table.integer('created_by').nullable();
      table.string('created_at', 255).notNullable();
      table.string('updated_at', 255).nullable();

      table.index(['coffin_id'], 'idx_cuse_coffin_id');
      table.index(['tenant_slug'], 'idx_cuse_tenant_slug');
      table.index(['deceased_id'], 'idx_cuse_deceased_id');
      table.index(['invoice_id'], 'idx_cuse_invoice_id');
      table.index(['used_at'], 'idx_cuse_used_at');
    });
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('coffin_usage');
  },
};
