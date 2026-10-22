// ============================================
// HEARSE SERVICE MIGRATION - Add fuel_card_number to hearses
// ============================================
// Stores the fuel card number assigned to a hearse (optional). The field
// existed in the tenant-service canonical schema and in the application
// code (registration INSERT, fleet PUT, frontend) but was never added to the
// hearse-service (operations) database by any previous migration, so the
// registration INSERT failed with "Unknown column 'fuel_card_number'".
//
// Idempotent (hasColumn) — safe to run more than once. Anchors the new
// column AFTER a column that actually exists (mirrors the 011 precedent).
// ============================================

exports.up = async function (knex) {
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };

    if (!(await hasColumn('hearses', 'fuel_card_number'))) {
        let afterClause = '';
        for (const anchor of ['engine_number', 'chassis_number', 'hearse_name', 'plate_number', 'id']) {
            if (await hasColumn('hearses', anchor)) {
                afterClause = ` AFTER \`${anchor}\``;
                break;
            }
        }
        await knex.raw(
            `ALTER TABLE \`hearses\` ADD COLUMN \`fuel_card_number\` VARCHAR(50) NULL DEFAULT NULL${afterClause}`
        );
    }
};

exports.down = async function (knex) {
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };
    if (await hasColumn('hearses', 'fuel_card_number')) {
        await knex.raw('ALTER TABLE `hearses` DROP COLUMN `fuel_card_number`');
    }
};
