module.exports = {
  async up(knex) {
    if (!(await knex.schema.hasColumn('coffins', 'description'))) await knex.schema.alterTable('coffins', (table) => table.text('description').nullable());
  },
  async down(knex) {
    if (await knex.schema.hasColumn('coffins', 'description')) await knex.schema.alterTable('coffins', (table) => table.dropColumn('description'));
  },
};
