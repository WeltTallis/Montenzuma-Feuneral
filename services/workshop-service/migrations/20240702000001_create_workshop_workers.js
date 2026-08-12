/**
 * Workshop Service - Workshop workers table
 *
 * Workshop workers only need a name + free-text role (e.g. "Painter").
 * They are stored separately from the shared authentication 'users' table so
 * that no email / password / phone is required (and login is not affected).
 */
export async function up(knex) {
  return knex.schema.createTable('workshop_workers', (table) => {
    table.increments('id').primary();
    table.string('full_name', 255).notNullable();
    table.string('role', 100).defaultTo('Worker');
    table.string('created_at', 255);
    table.index(['full_name'], 'idx_workers_name');
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('workshop_workers');
}
