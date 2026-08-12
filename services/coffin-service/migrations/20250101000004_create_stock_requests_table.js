/**
 * Coffin Service - 004 create central `stock_requests` table (all tenants).
 * Cross-branch / client coffin replenishment requests. One shared table for all
 * tenants, isolated via tenant_slug / tenant_id.
 */
module.exports = {
  async up(knex) {
    const exists = await knex.schema.hasTable('stock_requests');
    if (exists) return;

    await knex.schema.createTable('stock_requests', (table) => {
      table.string('request_id', 255).primary();
      table.string('tenant_slug', 100).notNullable();
      table.integer('tenant_id').nullable();
      table.string('coffin_id', 255).nullable();
      table.string('coffin_name', 255).nullable();
      table.string('color', 100).nullable();
      table.string('size', 100).nullable();
      table.string('requested_by', 255).nullable();
      table.string('booked_for', 255).nullable();
      table.string('requesting_branch', 255).nullable();
      table.string('image_url', 500).nullable();
      table.string('req_type', 20).nullable();
      table.string('status', 50).notNullable().defaultTo('pending');
      table.string('created_at', 255).notNullable();
      table.string('updated_at', 255).nullable();

      table.index(['tenant_slug'], 'idx_sreq_tenant_slug');
      table.index(['tenant_id'], 'idx_sreq_tenant_id');
      table.index(['coffin_id'], 'idx_sreq_coffin_id');
      table.index(['status'], 'idx_sreq_status');
      table.index(['created_at'], 'idx_sreq_created_at');
    });
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('stock_requests');
  },
};
