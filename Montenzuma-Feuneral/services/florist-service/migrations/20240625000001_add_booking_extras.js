/**
 * Add extra fields to flower_bookings table
 * - quantity: number of arrangements
 * - arrangements: JSON string of selected arrangements
 * - primary_color, accent_color, ribbon_color: custom colors
 */

export async function up(knex) {
  await knex.schema.table('flower_bookings', (table) => {
    table.integer('quantity').defaultTo(1);
    table.text('arrangements');
    table.string('primary_color', 100);
    table.string('accent_color', 100);
    table.string('ribbon_color', 100);
    table.string('size', 50); // <-- Missing: used by createBooking INSERT + frontend payload
  });
}

export async function down(knex) {
  await knex.schema.table('flower_bookings', (table) => {
    table.dropColumn('quantity');
    table.dropColumn('arrangements');
    table.dropColumn('primary_color');
    table.dropColumn('accent_color');
    table.dropColumn('ribbon_color');
    table.dropColumn('size');
  });
}