
// HEARSE SERVICE MIGRATION - Add route columns to hearse_bookings


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

    const hasBookingDates = await knex.schema.hasColumn('hearse_bookings', 'booking_dates');
    if (!hasBookingDates) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.text('booking_dates').nullable().after('to_location');
        });
    }
};

exports.down = async function (knex) {
    const hasBookingDates = await knex.schema.hasColumn('hearse_bookings', 'booking_dates');
    if (hasBookingDates) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.dropColumn('booking_dates');
        });
    }

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