// ============================================
// HEARSE SERVICE MIGRATION - Make `model` nullable
// ============================================
// Aligns the operations DB with the tenant-service canonical schema
// (model VARCHAR(100), nullable) and with the controller, which sends
// `model || null`. The live DB had model NOT NULL, so registering a
// hearse without a model failed with "Column 'model' cannot be null"
// even though the frontend treats model as optional.
//
// Idempotent (hasColumn + columnInfo check).
// ============================================

exports.up = async function (knex) {
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };
    if (!(await hasColumn('hearses', 'model'))) return;

    // Only alter if currently NOT NULL
    const info = await knex('information_schema.COLUMNS')
        .select('IS_NULLABLE')
        .where({ TABLE_SCHEMA: knex.raw('DATABASE()'), TABLE_NAME: 'hearses', COLUMN_NAME: 'model' })
        .first();
    if (info && String(info.IS_NULLABLE).toUpperCase() === 'NO') {
        await knex.raw('ALTER TABLE `hearses` MODIFY COLUMN `model` VARCHAR(100) NULL DEFAULT NULL');
    }
};

exports.down = async function (knex) {
    const hasColumn = async (t, c) => { try { return await knex.schema.hasColumn(t, c); } catch { return false; } };
    if (await hasColumn('hearses', 'model')) {
        await knex.raw('ALTER TABLE `hearses` MODIFY COLUMN `model` VARCHAR(100) NOT NULL');
    }
};
