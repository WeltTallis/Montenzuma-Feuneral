/**
 * Insurance Service - 002 create `insurance_policy_members`.
 *
 * Only Amani GROUP policies use this table. The applicant is the primary
 * holder and lives on insurance_policies; everyone else on the shared policy
 * is a row here, each with their own name and phone so the family line can
 * reach them independently.
 *
 * The group minimum (5 people) is enforced in the controller, not here, so
 * the constraint stays in one readable place rather than being split between
 * a schema check and application code. A DB-level check would also make the
 * migration fail on databases created before the rule changed.
 */
module.exports = {
  async up(knex) {
    if (await knex.schema.hasTable('insurance_policy_members')) return;

    await knex.schema.createTable('insurance_policy_members', (table) => {
      table.increments('member_id').primary();

      /* References insurance_policies.policy_id. Deliberately NOT the policy
         number: members are internal rows, and joining on the surrogate key
         keeps them correct even if a policy number is ever re-issued. */
      table.integer('policy_id').notNullable();

      table.string('full_name', 160).notNullable();
      table.string('phone', 32).notNullable();

      table.string('tenant_slug', 100).notNullable().defaultTo('system_shared');
      table.integer('tenant_id').nullable();
      table.integer('branch_id').nullable().defaultTo(0);

      /* 1-based position on the policy, so the UI can render "Member 2..5". */
      table.integer('position').notNullable().defaultTo(2);

      table.boolean('is_deleted').notNullable().defaultTo(false);
      table.string('created_at', 255).notNullable();
      table.string('updated_at', 255).nullable();

      table.index(['policy_id'], 'idx_insurance_members_policy_id');
      table.index(['tenant_slug'], 'idx_insurance_members_tenant_slug');
      table.index(['phone'], 'idx_insurance_members_phone');
    });
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('insurance_policy_members');
  },
};