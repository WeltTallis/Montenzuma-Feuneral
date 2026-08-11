// ============================================
// HEARSE SERVICE MIGRATION - Add booking_dates column to hearse_bookings
// ============================================
// The booking_dates column stores a JSON-array string of calendar dates
// that the booking spans, e.g. '["2026-08-12","2026-08-13"]'.
// It is queried with LIKE in the notification cron service and controllers
// (e.g. WHERE hb.booking_dates LIKE '%\"2026-08-12\"%').
//
// This migration is idempotent (hasColumn) so it is safe to run more than once
// and also safe on databases where migration 006 already added the column.

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