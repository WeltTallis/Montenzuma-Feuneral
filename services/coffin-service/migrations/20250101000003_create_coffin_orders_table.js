/**
 * Coffin Service - 003 create central `coffin_orders` (bookings) table.
 * This is the coffin-service booking table (order_id, coffin_id, tenant_slug...)
 * - distinct from the workshop's production coffin_orders that lives in the
 * workshop database. All tenants share this single table (tenant_slug scoped).
 */
module.exports = {
  async up(knex) {
    const exists = await knex.schema.hasTable('coffin_orders');
    if (exists) return;

    await knex.schema.createTable('coffin_orders', (table) => {
      table.string('order_id', 255).primary();
      table.string('tenant_slug', 100).notNullable();
      table.integer('tenant_id').nullable();
      table.integer('branch_id').nullable().defaultTo(0);
      table.string('coffin_id', 255).nullable();
      table.string('coffin_name', 255).nullable();
      table.string('color', 100).nullable();
      table.string('size', 100).nullable();
      table.integer('quantity').notNullable().defaultTo(1);
      table.string('booked_by', 255).nullable();
      table.string('booked_for', 255).nullable();
      table.string('status', 50).notNullable().defaultTo('active');
      table.string('created_at', 255).notNullable();
      table.string('updated_at', 255).nullable();

      table.index(['tenant_slug'], 'idx_cord_tenant_slug');
      table.index(['tenant_id'], 'idx_cord_tenant_id');
      table.index(['coffin_id'], 'idx_cord_coffin_id');
      table.index(['status'], 'idx_cord_status');
      table.index(['booked_for'], 'idx_cord_booked_for');
      table.index(['created_at'], 'idx_cord_created_at');
    });
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('coffin_orders');
  },
};
