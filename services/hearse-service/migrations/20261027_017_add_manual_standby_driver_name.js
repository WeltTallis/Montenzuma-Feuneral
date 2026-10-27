exports.up = async function (knex) {
    if (!(await knex.schema.hasColumn('hearse_daily_lineups', 'standby_driver_name'))) {
        await knex.raw(
            'ALTER TABLE `hearse_daily_lineups` ADD COLUMN `standby_driver_name` VARCHAR(200) NULL AFTER `standby_driver_id`'
        );
    }
};

exports.down = async function (knex) {
    if (await knex.schema.hasColumn('hearse_daily_lineups', 'standby_driver_name')) {
        await knex.raw('ALTER TABLE `hearse_daily_lineups` DROP COLUMN `standby_driver_name`');
    }
};
