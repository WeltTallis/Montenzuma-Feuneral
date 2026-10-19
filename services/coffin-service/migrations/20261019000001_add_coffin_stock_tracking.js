/**
 * Track total, available, and reserved coffin stock while preserving the
 * existing `quantity` field as the available-stock value.
 */
module.exports = {
  async up(knex) {
    const addAvailableColumns = [];
    if (!(await knex.schema.hasColumn('coffins', 'quantity_on_hand'))) {
      addAvailableColumns.push('quantity_on_hand');
    }
    if (!(await knex.schema.hasColumn('coffins', 'quantity_reserved'))) {
      addAvailableColumns.push('quantity_reserved');
    }
    if (addAvailableColumns.length) {
      await knex.schema.alterTable('coffins', (table) => {
        if (addAvailableColumns.includes('quantity_on_hand')) {
          table.integer('quantity_on_hand').notNullable().defaultTo(0);
        }
        if (addAvailableColumns.includes('quantity_reserved')) {
          table.integer('quantity_reserved').notNullable().defaultTo(0);
        }
      });
    }

    const addedStockReserved = !(await knex.schema.hasColumn('coffin_bookings', 'stock_reserved'));
    const addedMadeToOrder = !(await knex.schema.hasColumn('coffin_bookings', 'is_made_to_order'));
    if (addedStockReserved || addedMadeToOrder) {
      await knex.schema.alterTable('coffin_bookings', (table) => {
        if (addedStockReserved) {
          table.boolean('stock_reserved').notNullable().defaultTo(true);
        }
        if (addedMadeToOrder) {
          table.boolean('is_made_to_order').notNullable().defaultTo(false);
        }
      });
    }

    if (addedStockReserved) {
      await knex('coffin_bookings')
        .update({
          stock_reserved: knex.raw(
            "CASE WHEN status IN ('active', 'booked', 'pending') AND source_request_id IS NULL AND coffin_id IS NOT NULL THEN 1 ELSE 0 END"
          ),
        });
    }
    if (addedMadeToOrder) {
      await knex('coffin_bookings')
        .whereNull('coffin_id')
        .update({ is_made_to_order: true });
    }

    if (addAvailableColumns.includes('quantity_reserved')) {
      await knex.raw(`
        UPDATE coffins c
        SET c.quantity_reserved = COALESCE((
          SELECT SUM(b.quantity)
          FROM coffin_bookings b
          WHERE b.coffin_id = c.coffin_id
            AND b.stock_reserved = TRUE
        ), 0)
      `);
    }

    if (addAvailableColumns.includes('quantity_on_hand')) {
      await knex.raw(`
        UPDATE coffins
        SET quantity_on_hand = COALESCE(quantity, 0) + COALESCE(quantity_reserved, 0)
      `);
    }
  },

  async down(knex) {
    if (await knex.schema.hasColumn('coffin_bookings', 'is_made_to_order')) {
      await knex.schema.alterTable('coffin_bookings', (table) => table.dropColumn('is_made_to_order'));
    }
    if (await knex.schema.hasColumn('coffin_bookings', 'stock_reserved')) {
      await knex.schema.alterTable('coffin_bookings', (table) => table.dropColumn('stock_reserved'));
    }
    if (await knex.schema.hasColumn('coffins', 'quantity_reserved')) {
      await knex.schema.alterTable('coffins', (table) => table.dropColumn('quantity_reserved'));
    }
    if (await knex.schema.hasColumn('coffins', 'quantity_on_hand')) {
      await knex.schema.alterTable('coffins', (table) => table.dropColumn('quantity_on_hand'));
    }
  },
};
