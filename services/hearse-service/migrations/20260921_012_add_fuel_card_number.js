
// HEARSE SERVICE MIGRATION - Add fuel_card_number to hearses



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
