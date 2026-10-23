exports.up = async function (knex) {
    const hasColumn = async (table, column) => {
        try { return await knex.schema.hasColumn(table, column); } catch { return false; }
    };
    if (!(await hasColumn('hearse_bookings', 'driver_id'))) {
        await knex.raw('ALTER TABLE `hearse_bookings` ADD COLUMN `driver_id` INT NULL AFTER `hearse_id`');
    }
    if (!(await hasColumn('hearse_bookings', 'assistant_name'))) {
        await knex.raw('ALTER TABLE `hearse_bookings` ADD COLUMN `assistant_name` VARCHAR(200) NULL AFTER `driver_id`');
    }
    if (!(await hasColumn('hearse_bookings', 'assistant_phone'))) {
        await knex.raw('ALTER TABLE `hearse_bookings` ADD COLUMN `assistant_phone` VARCHAR(50) NULL AFTER `assistant_name`');
    }

    await knex.schema.createTable('hearse_daily_lineups', (table) => {
        table.string('tenant_key', 191).notNullable();
        table.date('lineup_date').notNullable();
        table.integer('standby_driver_id').unsigned().nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.primary(['tenant_key', 'lineup_date'], 'pk_hearse_daily_lineups');
        table.index(['tenant_key', 'standby_driver_id'], 'idx_hearse_lineups_standby');
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('hearse_daily_lineups');
    for (const column of ['assistant_phone', 'assistant_name', 'driver_id']) {
        if (await knex.schema.hasColumn('hearse_bookings', column)) {
            await knex.raw(`ALTER TABLE \`hearse_bookings\` DROP COLUMN \`${column}\``);
        }
    }
};
