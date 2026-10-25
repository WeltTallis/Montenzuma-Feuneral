exports.up = async function (knex) {
    if (!(await knex.schema.hasColumn('hearse_bookings', 'manual_driver_name'))) {
        await knex.raw(
            'ALTER TABLE `hearse_bookings` ADD COLUMN `manual_driver_name` VARCHAR(200) NULL AFTER `driver_id`'
        );
    }
};

exports.down = async function (knex) {
    if (await knex.schema.hasColumn('hearse_bookings', 'manual_driver_name')) {
        await knex.raw('ALTER TABLE `hearse_bookings` DROP COLUMN `manual_driver_name`');
    }
};