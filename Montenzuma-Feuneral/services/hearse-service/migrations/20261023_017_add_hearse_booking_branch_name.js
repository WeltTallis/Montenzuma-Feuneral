exports.up = async function (knex) {
    if (!(await knex.schema.hasColumn('hearse_bookings', 'branch_name'))) {
        await knex.raw(
            'ALTER TABLE `hearse_bookings` ADD COLUMN `branch_name` VARCHAR(255) NULL AFTER `branch_slug`'
        );
    }
};

exports.down = async function (knex) {
    if (await knex.schema.hasColumn('hearse_bookings', 'branch_name')) {
        await knex.raw('ALTER TABLE `hearse_bookings` DROP COLUMN `branch_name`');
    }
};
