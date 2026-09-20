// ============================================
// HEARSE SERVICE MIGRATION - Add service_charge to hearse_bookings
// ============================================
// Stores the total service charge (KSH) that was agreed at booking
// time (per-day rate × number of booking days). The column is also
// added to config/database.js so fresh DBs pick it up.
//
// Idempotent (hasColumn) — safe to run more than once.

exports.up = async function (knex) {
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (!(await hasColumn('hearse_bookings', 'service_charge'))) {
        // NOTE: only anchor the new column AFTER a column that actually exists.
        // `booked_by_name` is created by config/database.js for FRESH databases
        // only — installs created by migration 001 never have it, and
        // `ALTER TABLE ... AFTER booked_by_name` fails with ER_BAD_FIELD_ERROR
        // ("Unknown column 'booked_by_name'"), which silently aborted this
        // migration and left `service_charge` missing. The booking INSERT then
        // failed with "Unknown column 'service_charge' in 'INSERT INTO'".
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
