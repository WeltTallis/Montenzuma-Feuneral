
// HEARSE SERVICE MIGRATION - Make `model` nullable


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
