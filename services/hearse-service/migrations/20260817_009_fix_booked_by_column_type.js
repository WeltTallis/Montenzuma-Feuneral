// ============================================
// HEARSE SERVICE MIGRATION - Fix booked_by column type
// ============================================
// The original schema created hearse_bookings.booked_by as INT, but the
// booking controllers store string values there (user name, email, or the
// literal 'system'). MySQL rejects those strings with:
//   ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: "Incorrect integer value: 'system'"
// This migration widens the column to VARCHAR(255) so it accepts any value.
// It is idempotent and safe to run more than once.

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
    // NOTE: Reverting VARCHAR -> INT would truncate the string values saved by
    // this upgrade. If an INT booked_by is ever needed again, do it manually:
    //   ALTER TABLE `hearse_bookings` MODIFY COLUMN `booked_by` INT NULL;
    return Promise.resolve();
};