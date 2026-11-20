

exports.up = async function (knex) {
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (!(await hasColumn('hearse_bookings', 'service_charge'))) {

        let afterClause = '';
        for (const anchor of ['booked_by_name', 'booked_by', 'booked_by_email']) {
            if (await hasColumn('hearse_bookings', anchor)) {
                afterClause = ` AFTER \`${anchor}\``;
                break;
            }
        }
        await knex.raw(
            `ALTER TABLE \`hearse_bookings\` ADD COLUMN \`service_charge\` DECIMAL(10,2) NULL DEFAULT 0.00${afterClause}`
        );
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
