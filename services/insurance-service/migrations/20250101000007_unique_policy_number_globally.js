/**
 * Insurance Service - 007 enforce a GLOBAL unique policy_number.
 *
 * WHY
 * For Amani Cover the policy number IS the applicant's national ID number
 * (migration 001) - there is no separate generated number and no lookup table
 * between the two. That makes one policy per person a hard business rule: a
 * given national ID must never hold two live policies, because the family line
 * looks a claim up by that number alone and would not know which policy it hit.
 *
 * The original index was UNIQUE (tenant_slug, policy_number) - unique only
 * WITHIN a tenant. That permitted the same national ID to be issued two
 * policies by two different funeral homes, which is precisely the duplication
 * this removes.
 *
 * This narrows the key from (tenant_slug, policy_number) to policy_number
 * alone. MariaDB has no partial/filtered unique indexes, so this is a drop +
 * re-add rather than an ALTER of the index in place.
 *
 * BLOCKS ON DIRTY DATA, ON PURPOSE
 * If two tenants already share a policy_number, the new index cannot be
 * created. Rather than letting MariaDB emit an opaque duplicate-key error, this
 * migration finds the offending rows first and aborts with them listed, so the
 * operator knows exactly which IDs to merge or void before retrying. Silently
 * skipping would leave the invariant unenforced while reporting success, which
 * is how duplicate policies creep back in.
 */
module.exports = {
  async up(knex) {
    if (!(await knex.schema.hasTable('insurance_policies'))) return;
    if (await knex.schema.hasColumn('insurance_policies', 'policy_number') === false) return;

    const duplicates = await knex('insurance_policies')
      .select('policy_number')
      .count({ total: '*' })
      .where('is_deleted', false)
      .groupBy('policy_number')
      .havingRaw('COUNT(*) > 1');

    if (duplicates.length) {
      const listed = duplicates.map((d) => `${d.policy_number} (${d.total})`).join(', ');
      throw new Error(
        'Cannot enforce a unique policy_number: these national ID numbers already hold more ' +
          `than one policy: ${listed}. Resolve them (void or merge the duplicates) and re-run the ` +
          'migration. Skipping this would leave the duplicate policies in place silently.',
      );
    }

    /* Drop the per-tenant key (may already be absent on a hand-built DB). */
    const hasTenantKey = await knex.raw(
      `SELECT COUNT(*) AS n FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insurance_policies'
          AND INDEX_NAME = 'uq_insurance_policies_tenant_policy'`,
    );
    if (Number(hasTenantKey[0]?.n || 0) > 0) {
      await knex.raw('ALTER TABLE `insurance_policies` DROP INDEX `uq_insurance_policies_tenant_policy`');
    }

    /* One national ID -> one policy, across every tenant. */
    await knex.raw(
      'ALTER TABLE `insurance_policies` ADD UNIQUE KEY `uq_insurance_policies_policy_number` (`policy_number`)',
    );
  },

  async down(knex) {
    if (!(await knex.schema.hasTable('insurance_policies'))) return;

    const hasGlobalKey = await knex.raw(
      `SELECT COUNT(*) AS n FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'insurance_policies'
          AND INDEX_NAME = 'uq_insurance_policies_policy_number'`,
    );
    if (Number(hasGlobalKey[0]?.n || 0) > 0) {
      await knex.raw('ALTER TABLE `insurance_policies` DROP INDEX `uq_insurance_policies_policy_number`');
    }

    await knex.raw(
      'ALTER TABLE `insurance_policies` ADD UNIQUE KEY `uq_insurance_policies_tenant_policy` (`tenant_slug`, `policy_number`)',
    );
  },
};