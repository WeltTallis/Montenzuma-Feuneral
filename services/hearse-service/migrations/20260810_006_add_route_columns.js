// ============================================
// HEARSE SERVICE MIGRATION - Add route columns to hearse_bookings
// ============================================
// Persists the separate From / To locations for every hearse booking
// (e.g. route "from NAIROBI to MASSI") as two distinct columns.
// Both columns are optional/nullable so legacy rows remain valid, and the
// migration is idempotent (hasColumn) so it is safe to run more than once.

exports.up = async function (knex) {
    const hasFrom = await knex.schema.hasColumn('hearse_bookings', 'from_location');
    if (!hasFrom) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.string('from_location', 255).nullable().after('destination');
        });
    }

    const hasTo = await knex.schema.hasColumn('hearse_bookings', 'to_location');
    if (!hasTo) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.string('to_location', 255).nullable().after('from_location');
        });
    }
};

exports.down = async function (knex) {
    const hasTo = await knex.schema.hasColumn('hearse_bookings', 'to_location');
    if (hasTo) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.dropColumn('to_location');
        });
    }

    const hasFrom = await knex.schema.hasColumn('hearse_bookings', 'from_location');
    if (hasFrom) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.dropColumn('from_location');
        });
    }
};