exports.up = async function (knex) {
    await knex.schema.alterTable('hearse_bookings', (table) => {
        table.index(['hearse_id', 'status'], 'idx_booking_hearse_status');
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('hearse_bookings', (table) => {
        table.dropIndex(['hearse_id', 'status'], 'idx_booking_hearse_status');
    });
};