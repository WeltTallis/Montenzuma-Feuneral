/**
 * Insurance Service - 003 create `insurance_claims`.
 *
 * A claim is filed against an existing policy by quoting its POLICY NUMBER,
 * which (per migration 001) is the policy holder's national ID number. The
 * claimant does NOT have to be the policy holder - after a death a relative
 * files the claim - so `claimant_*` columns are kept separate from the
 * policy's holder columns.
 *
 * `policy_number` is stored denormalised (rather than only a policy_id FK) on
 * purpose: the family line must be able to pull up "claims filed under ID
 * 29384716" without a join when a caller only has the number, which is the
 * common case at the counter. policy_id is kept alongside it for integrity.
 */
module.exports = {
  async up(knex) {
    if (await knex.schema.hasTable('insurance_claims')) return;

    await knex.schema.createTable('insurance_claims', (table) => {
      table.increments('claim_id').primary();

      /* The policy number quoted on the claim form == the holder's ID number. */
      table.string('policy_number', 64).notNullable();
      table.integer('policy_id').nullable();

      /* Claimant (may be a relative of the deceased policy holder). */
      table.string('claimant_full_name', 160).notNullable();
      table.string('claimant_id_number', 64).notNullable();
      table.string('phone', 32).notNullable();
      table.string('relationship', 96).notNullable();

      /* Deceased details. */
      table.string('deceased_name', 160).notNullable();
      table.date('death_date').notNullable();
      table.string('cause_of_death', 255).notNullable();
      table.string('place_of_death', 160).notNullable();
      table.text('notes').nullable();

      /* Uploaded supporting documents. Stored as repo-relative paths written
         by the file service, never as BLOBs, so a claim row stays small and
         the files can be served through the existing /uploads route. */
      table.string('doc_death_cert_path', 255).nullable();
      table.string('doc_claimant_id_path', 255).nullable();
      table.string('doc_burial_permit_path', 255).nullable();

      /* submitted -> under_review -> approved | settled | rejected */
      table.string('status', 32).notNullable().defaultTo('submitted');
      table.text('review_notes').nullable();

      table.string('tenant_slug', 100).notNullable().defaultTo('system_shared');
      table.integer('tenant_id').nullable();
      table.integer('branch_id').nullable().defaultTo(0);

      table.boolean('is_deleted').notNullable().defaultTo(false);
      table.string('created_at', 255).notNullable();
      table.string('updated_at', 255).nullable();

      table.index(['policy_number'], 'idx_insurance_claims_policy_number');
      table.index(['policy_id'], 'idx_insurance_claims_policy_id');
      table.index(['tenant_slug'], 'idx_insurance_claims_tenant_slug');
      table.index(['tenant_id'], 'idx_insurance_claims_tenant_id');
      table.index(['status'], 'idx_insurance_claims_status');
      table.index(['deceased_name'], 'idx_insurance_claims_deceased_name');
      table.index(['created_at'], 'idx_insurance_claims_created_at');
    });
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('insurance_claims');
  },
};