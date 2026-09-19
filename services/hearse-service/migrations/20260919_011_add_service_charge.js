// ============================================
// HEARSE SERVICE MIGRATION - Add service_charge to hearse_bookings
// ============================================
// Stores the total service charge (KSH) that was agreed at booking
// time (per-day rate × number of booking days). The column is also
// added to config/database.js so fresh DBs pick it up.
//
// Idempotent (hasColumn) — safe to run more than once.

exports.up = async function (knex) {
    const hasCharge = await knex.schema.hasColumn('hearse_bookings', 'service_charge');
    if (!hasCharge) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.decimal('service_charge', 10, 2).defaultTo(0.00).after('booked_by_name');
        });
    }
};

exports.down = async function (knex) {
    const hasCharge = await knex.schema.hasColumn('hearse_bookings', 'service_charge');
    if (hasCharge) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.dropColumn('service_charge');
        });
    }
};
