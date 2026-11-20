/**
 * Workshop Service - Simplify coffin_orders table
 *
 * Replaces the old customer_name / deceased_name columns with a single
 * coffin_name column and removes the selling_price / total_cost / profit
 * cost-tracking columns from coffin_orders (the separate costing table is
 * left intact).
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('coffin_orders');
  if (!hasTable) return;

  // Add coffin_name as nullable first, then back-fill from old columns
  const hasCoffinName = await knex.schema.hasColumn('coffin_orders', 'coffin_name');
  if (!hasCoffinName) {
    await knex.schema.alterTable('coffin_orders', (table) => {
      table.string('coffin_name', 255).nullable().after('order_number');
    });
  }

  // Back-fill: copy deceased_name (or customer_name) into coffin_name where blank
  // (only if the source columns still exist — keeps the migration idempotent)
  const hasDeceased = await knex.schema.hasColumn('coffin_orders', 'deceased_name');
  const hasCustomer = await knex.schema.hasColumn('coffin_orders', 'customer_name');
  if (hasDeceased || hasCustomer) {
    await knex.raw(`
      UPDATE coffin_orders
      SET coffin_name = COALESCE(NULLIF(coffin_name, ''), deceased_name, customer_name, 'Coffin Order')
      WHERE coffin_name IS NULL OR coffin_name = ''
    `);
  }

  // Drop obsolete columns (idempotent)
  await knex.schema.alterTable('coffin_orders', (table) => {
    table.dropColumnIfExists('customer_name');
    table.dropColumnIfExists('customer_phone');
    table.dropColumnIfExists('customer_email');
    table.dropColumnIfExists('deceased_name');
    table.dropColumnIfExists('selling_price');
    table.dropColumnIfExists('total_cost');
    table.dropColumnIfExists('profit');
  });
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable('coffin_orders');
  if (!hasTable) return;

  await knex.schema.alterTable('coffin_orders', (table) => {
    table.string('deceased_name', 255).nullable().after('coffin_name');
    table.string('customer_name', 255).nullable().after('coffin_name');
    table.string('customer_phone', 20);
    table.string('customer_email', 255);
    table.decimal('selling_price', 10, 2).defaultTo(0);
    table.decimal('total_cost', 10, 2).defaultTo(0);
    table.decimal('profit', 10, 2).defaultTo(0);
  });

  // Restore data
  await knex.raw(`
    UPDATE coffin_orders
    SET deceased_name = coffin_name, customer_name = coffin_name
    WHERE deceased_name IS NULL OR customer_name IS NULL
  `);
}

