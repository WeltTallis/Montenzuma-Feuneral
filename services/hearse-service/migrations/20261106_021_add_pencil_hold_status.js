// HEARSE SERVICE MIGRATION - Add pencil_hold to hearse_bookings status ENUM

exports.up = async function (knex) {
    await knex.raw(
        "ALTER TABLE hearse_bookings MODIFY COLUMN status ENUM('pending', 'confirmed', 'in_progress', 'in_transit', 'completed', 'cancelled', 'postponed', 'booked', 'on_hold', 'dispatched', 'pencil_hold') DEFAULT 'booked'"
    );
};

exports.down = async function (knex) {
    await knex.raw(
        "ALTER TABLE hearse_bookings MODIFY COLUMN status ENUM('pending', 'confirmed', 'in_progress', 'in_transit', 'completed', 'cancelled', 'postponed', 'booked', 'on_hold', 'dispatched') DEFAULT 'booked'"
    );
};