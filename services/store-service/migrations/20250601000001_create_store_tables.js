/**
 * Mini Store Service - create store_tables
 */
export async function up(knex) {
  const hasItems = await knex.schema.hasTable('mini_store_items');
  if (!hasItems) {
    await knex.schema.createTable('mini_store_items', function (table) {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.string('category', 100).notNullable().defaultTo('Other');
      table.string('unit', 50).notNullable().defaultTo('pcs');
      table.decimal('stock', 12, 3).notNullable().defaultTo(0);
      table.decimal('min_stock', 12, 3).notNullable().defaultTo(0);
      table.string('created_at', 255);
      table.string('updated_at', 255);

      table.index(['name'], 'idx_mini_store_items_name');
      table.index(['category'], 'idx_mini_store_items_category');
    });
  }

  const hasTx = await knex.schema.hasTable('mini_store_transactions');
  if (!hasTx) {
    await knex.schema.createTable('mini_store_transactions', function (table) {
      table.increments('id').primary();
      table.integer('item_id').notNullable();
      table.string('item_name', 255).notNullable();
      table.enu('action', ['used', 'restocked', 'adjusted']).notNullable();
      table.decimal('quantity', 12, 3).notNullable();
      table.string('unit', 50).notNullable();
      table.string('staff', 255).notNullable();
      table.string('reason', 500);
      table.decimal('remaining', 12, 3).notNullable();
      table.string('created_at', 255);

      table.index(['item_id'], 'idx_store_tx_item');
      table.index(['action'], 'idx_store_tx_action');
      table.index(['created_at'], 'idx_store_tx_created');
      table.index(['staff'], 'idx_store_tx_staff');
    });
  }

  console.log('[STORE MIGRATION] mini_store_items & mini_store_transactions ready');
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('mini_store_transactions');
  await knex.schema.dropTableIfExists('mini_store_items');
}
