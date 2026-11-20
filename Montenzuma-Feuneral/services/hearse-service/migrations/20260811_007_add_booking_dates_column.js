
// HEARSE SERVICE MIGRATION - Add booking_dates column to hearse_bookings


exports.up = async function (knex) {
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
};