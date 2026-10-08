module.exports = {
  async up(knex) {
    if (!(await knex.schema.hasTable('insurance_policies'))) return;
    if (await knex.schema.hasColumn('insurance_policies', 'next_of_kin_name')) return;

    /* Next of kin on the POLICY (application time), not the claimant: who the
       care team calls when it matters. Nullable so every existing policy keeps
       working — older applications were simply filed without it. */
    await knex.schema.alterTable('insurance_policies', (table) => {
      table.string('next_of_kin_name', 160).nullable();
      table.string('next_of_kin_phone', 32).nullable();
      table.string('next_of_kin_relationship', 64).nullable();
    });
  },

  async down(knex) {
    if (!(await knex.schema.hasTable('insurance_policies'))) return;
    if (!(await knex.schema.hasColumn('insurance_policies', 'next_of_kin_name'))) return;

    await knex.schema.alterTable('insurance_policies', (table) => {
      table.dropColumn('next_of_kin_relationship');
      table.dropColumn('next_of_kin_phone');
      table.dropColumn('next_of_kin_name');
    });
  },
};