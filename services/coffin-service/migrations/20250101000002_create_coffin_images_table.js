/**
 * Coffin Service - 002 create central `coffin_images` table (all tenants).
 */
module.exports = {
  async up(knex) {
    const exists = await knex.schema.hasTable('coffin_images');
    if (exists) return;

    await knex.schema.createTable('coffin_images', (table) => {
      table.increments('image_id').primary();
      table.string('coffin_id', 255).notNullable();
      table.string('tenant_slug', 100).notNullable();
      table.integer('tenant_id').nullable();
      table.string('image_url', 500).notNullable();
      table.string('image_name', 255).nullable();
      table.integer('display_order').notNullable().defaultTo(0);
      table.string('created_at', 255).notNullable();

      table.index(['coffin_id'], 'idx_cimg_coffin_id');
      table.index(['tenant_slug'], 'idx_cimg_tenant_slug');
      table.foreign('coffin_id').references('coffins.coffin_id').onDelete('CASCADE');
    });
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('coffin_images');
  },
};
