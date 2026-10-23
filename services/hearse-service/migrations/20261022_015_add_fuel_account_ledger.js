exports.up = async function (knex) {
    await knex.schema.createTable('hearse_fuel_accounts', (table) => {
        table.string('tenant_key', 191).primary();
        table.decimal('low_balance_threshold', 12, 2).notNullable().defaultTo(5000);
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.createTable('hearse_fuel_transactions', (table) => {
        table.bigIncrements('id').primary();
        table.string('tenant_key', 191).notNullable();
        table.enu('transaction_type', ['deposit', 'allocation', 'fuel_purchase']).notNullable();
        table.decimal('amount', 12, 2).notNullable();
        table.integer('hearse_id').unsigned().nullable();
        table.string('hearse_plate', 50).nullable();
        table.string('fuel_card_number', 50).nullable();
        table.string('reference', 120).nullable();
        table.string('station', 150).nullable();
        table.date('transaction_date').notNullable();
        table.string('notes', 500).nullable();
        table.integer('driver_id').unsigned().nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.index(['tenant_key', 'transaction_date'], 'idx_fuel_tx_tenant_date');
        table.index(['tenant_key', 'transaction_type'], 'idx_fuel_tx_tenant_type');
        table.index(['tenant_key', 'fuel_card_number'], 'idx_fuel_tx_tenant_card');
        table.index(['tenant_key', 'driver_id'], 'idx_fuel_tx_tenant_driver');
    });
};

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('hearse_fuel_transactions');
    await knex.schema.dropTableIfExists('hearse_fuel_accounts');
};
