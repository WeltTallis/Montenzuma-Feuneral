
module.exports = {
  async up(knex) {
    if (!(await knex.schema.hasTable('insurance_policies'))) return;
    if (await knex.schema.hasColumn('insurance_policies', 'monthly_premium')) return;

    await knex.schema.alterTable('insurance_policies', (table) => {
      /* Agreed monthly contribution, in whole shillings. */
      table.integer('monthly_premium').nullable();

      /* Plan identity at time of sale: Solo | Family | Group. */
      table.string('plan_code', 32).nullable();

      /* Lets the finance report sum contributions per plan without a join. */
      table.index(['plan_code'], 'idx_insurance_policies_plan_code');
    });
  },

  async down(knex) {
    if (!(await knex.schema.hasTable('insurance_policies'))) return;
    if (!(await knex.schema.hasColumn('insurance_policies', 'monthly_premium'))) return;

    await knex.schema.alterTable('insurance_policies', (table) => {
      table.dropIndex('idx_insurance_policies_plan_code', 'idx_insurance_policies_plan_code');
      table.dropColumn('plan_code');
      table.dropColumn('monthly_premium');
    });
  },
};
