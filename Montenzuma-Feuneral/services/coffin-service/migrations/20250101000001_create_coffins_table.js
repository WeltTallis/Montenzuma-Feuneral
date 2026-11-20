/**
 * Coffin Service - 001 create central `coffins` inventory table.
 * One shared table for ALL tenants (isolated by tenant_slug / tenant_id).
 * The coffin service runs this migration independently via knex.
 */
module.exports = {
  async up(knex) {
    const exists = await knex.schema.hasTable('coffins');
    if (exists) return;

    await knex.schema.createTable('coffins', (table) => {
      table.string('coffin_id', 255).primary();
      table.string('tenant_slug', 100).notNullable();
      table.integer('tenant_id').nullable();
      table.integer('branch_id').nullable().defaultTo(0);
      table.string('name', 255).nullable();
      table.string('type', 255).nullable();
      table.string('material', 100).nullable();
      table.string('sku', 100).nullable();
      table.decimal('exact_price', 15, 2).notNullable().defaultTo(0);
      table.decimal('price', 15, 2).notNullable().defaultTo(0);
      table.integer('quantity').notNullable().defaultTo(0);
      table.integer('stock').notNullable().defaultTo(0);
      table.string('color', 100).nullable();
      table.string('size', 100).nullable();
      table.boolean('is_active').notNullable().defaultTo(true);
      table.boolean('is_deleted').notNullable().defaultTo(false);
      table.string('created_at', 255).notNullable();
      table.string('updated_at', 255).nullable();

      table.index(['tenant_slug'], 'idx_coffins_tenant_slug');
      table.index(['tenant_id'], 'idx_coffins_tenant_id');
      table.index(['branch_id'], 'idx_coffins_branch_id');
      table.index(['type'], 'idx_coffins_type');
      table.index(['quantity'], 'idx_coffins_quantity');
      table.index(['is_deleted'], 'idx_coffins_is_deleted');
      table.index(['created_at'], 'idx_coffins_created_at');
    });
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('coffins');
  },
};
