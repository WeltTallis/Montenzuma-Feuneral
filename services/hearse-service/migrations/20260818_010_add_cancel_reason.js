// ============================================
// HEARSE SERVICE MIGRATION - Add cancel_reason column
// ============================================
// Persists the reason a hearse booking was cancelled so the UI can display
// *why* a booking was cancelled (in the booking detail sidebar). The column is
// optional/nullable so legacy rows remain valid, and the migration is
// idempotent (hasColumn guard) so it is safe to run more than once.

exports.up = async function (knex) {
    const hasTable = async (t) => { try { return await knex.schema.hasTable(t); } catch { return false; } };
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (await hasTable('hearse_bookings')) {
        if (!(await hasColumn('hearse_bookings', 'cancel_reason'))) {
            await knex.schema.alterTable('hearse_bookings', (table) => {
                table.string('cancel_reason', 500).nullable().after('status');
            });
        }
    }
};

exports.down = async function (knex) {
    try {
        if (await knex.schema.hasTable('hearse_bookings')) {
            if (await knex.schema.hasColumn('hearse_bookings', 'cancel_reason')) {
                await knex.schema.alterTable('hearse_bookings', (table) => {
                    table.dropColumn('cancel_reason');
                });
            }
        }
    } catch (e) {
        // Non-fatal: column may not exist.
    }
    return Promise.resolve();
};
