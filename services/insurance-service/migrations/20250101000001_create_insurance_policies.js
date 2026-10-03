/**
 * Insurance Service - 001 create `insurance_policies`.
 *
 * POLICY NUMBER == THE APPLICANT'S ID NUMBER
 * ------------------------------------------
 * Amani Cover issues the policy number off the applicant's national ID /
 * passport number. There is no separate generated policy number and no
 * lookup table between the two: `policy_number` IS the ID number exactly as
 * typed on the application form. That is the whole reason the claim form asks
 * a bereaved family for a single "Policy / Cover Number" — they read their
 * ID number off the policy card.
 *
 * Consequence: policy_number must be stored with the same trimming and
 * case-folding the application form applies, or a claim filed as " 29384716 "
 * would not match a policy stored as "29384716". Every read and write path
 * therefore normalises through the same helper before comparing. See
 * models/policies.js `normalisePolicyNumber`.
 *
 * Unique per tenant, not globally: two different funeral homes must be able
 * to issue the same national ID number without colliding.
 */
module.exports = {
  async up(knex) {
    if (await knex.schema.hasTable('insurance_policies')) return;

    await knex.schema.createTable('insurance_policies', (table) => {
      table.increments('policy_id').primary();

      /* THE POLICY NUMBER. Also the applicant's national ID / passport. */
      table.string('policy_number', 64).notNullable();

      /* Kept as a separate, normalised copy for reporting ("how many
         applicants aged 18-30 applied") without re-parsing policy_number. */
      table.string('id_number', 64).notNullable();

      /* Tenant isolation - same convention as coffin-service `coffins`. */
      table.string('tenant_slug', 100).notNullable().defaultTo('system_shared');
      table.integer('tenant_id').nullable();
      table.integer('branch_id').nullable().defaultTo(0);

      /* Applicant details, exactly as captured on the public application form. */
      table.string('full_name', 160).notNullable();
      table.integer('age').nullable();
      table.string('employment', 64).nullable();
      table.string('phone', 32).notNullable();
      table.string('email', 160).nullable();

      /* Amani Solo / Amani Family / Amani Group (see amaniData.js coverOptions). */
      table.string('cover_type', 32).notNullable().defaultTo('Solo');

      /* Number of people the policy will cover. Solo/Family are recorded as
         entered; Group is enforced at >= 5 by the controller. */
      table.integer('covered_count').notNullable().defaultTo(1);

      /* pending -> active (under review / accepted) -> rejected | cancelled */
      table.string('status', 32).notNullable().defaultTo('pending');

      table.boolean('declaration_accepted').notNullable().defaultTo(false);
      table.boolean('is_deleted').notNullable().defaultTo(false);

      table.string('created_at', 255).notNullable();
      table.string('updated_at', 255).nullable();

      /* The claim form looks a policy up by this column alone. */
      table.unique(['tenant_slug', 'policy_number'], {
        indexName: 'uq_insurance_policies_tenant_policy',
      });
      table.index(['policy_number'], 'idx_insurance_policies_policy_number');
      table.index(['tenant_slug'], 'idx_insurance_policies_tenant_slug');
      table.index(['tenant_id'], 'idx_insurance_policies_tenant_id');
      table.index(['status'], 'idx_insurance_policies_status');
      table.index(['cover_type'], 'idx_insurance_policies_cover_type');
      table.index(['phone'], 'idx_insurance_policies_phone');
      table.index(['created_at'], 'idx_insurance_policies_created_at');
    });
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('insurance_policies');
  },
};