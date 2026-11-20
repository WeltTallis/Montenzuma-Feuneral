
// HEARSE SERVICE MIGRATION - Fix booked_by column type

exports.up = async function (knex) {
    const hasTable = async (t) => { try { return await knex.schema.hasTable(t); } catch { return false; } };
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (await hasTable('hearse_bookings')) {
        if (await hasColumn('hearse_bookings', 'booked_by')) {
            await knex.raw("ALTER TABLE `hearse_bookings` MODIFY COLUMN `booked_by` VARCHAR(255) NULL DEFAULT NULL COMMENT 'User who created the booking (name, email, or system)'");
        }
        // Companion string columns — guard against them ever being INT.
        if (await hasColumn('hearse_bookings', 'booked_by_name')) {
            await knex.raw('ALTER TABLE `hearse_bookings` MODIFY COLUMN `booked_by_name` VARCHAR(255) NULL DEFAULT NULL');
        }
        if (await hasColumn('hearse_bookings', 'booked_by_email')) {
            await knex.raw('ALTER TABLE `hearse_bookings` MODIFY COLUMN `booked_by_email` VARCHAR(255) NULL DEFAULT NULL');
        }
    }
};

exports.down = async function (knex) {

    return Promise.resolve();
};