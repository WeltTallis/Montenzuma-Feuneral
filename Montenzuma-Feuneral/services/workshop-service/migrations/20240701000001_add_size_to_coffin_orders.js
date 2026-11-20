/**
 * Workshop Service - Add 'size' column to coffin_orders
 *
 * Size is free-form text (e.g. "6 ft") — coffins are measured in feet, so the
 * value must be stored as a string rather than a number.
 */

export async function up(knex) {
  return knex.schema.alterTable('coffin_orders', (table) => {
    table.string('size', 100).nullable().after('coffin_type');
  });
}

export async function down(knex) {
  return knex.schema.alterTable('coffin_orders', (table) => {
    table.dropColumn('size');
  });
}
