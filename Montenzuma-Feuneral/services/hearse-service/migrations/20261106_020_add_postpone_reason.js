exports.up = async function (knex) {
    const exists = await knex.schema.hasColumn('hearse_bookings', 'postpone_reason');
    if (!exists) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.string('postpone_reason', 500).nullable();
        });
    }
};

exports.down = async function (knex) {
    const exists = await knex.schema.hasColumn('hearse_bookings', 'postpone_reason');
    if (exists) {
        await knex.schema.alterTable('hearse_bookings', (table) => {
            table.dropColumn('postpone_reason');
        });
    }
};
