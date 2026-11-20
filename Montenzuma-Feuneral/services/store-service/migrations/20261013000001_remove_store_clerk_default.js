export async function up(knex) {
  await knex('mini_store_transactions')
    .where({ staff: 'Store Clerk' })
    .update({ staff: 'Unattributed' });
  await knex.raw('ALTER TABLE mini_store_transactions MODIFY staff VARCHAR(255) NOT NULL');
}

export async function down(knex) {
  await knex.raw('ALTER TABLE mini_store_transactions MODIFY staff VARCHAR(255) NOT NULL');
}
