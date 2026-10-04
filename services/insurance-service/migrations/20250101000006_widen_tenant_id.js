/**
 * Insurance Service - 006 widen `tenant_id` to VARCHAR(36).
 *
 * WHY
 * All three insurance tables declared `tenant_id` as an INTEGER, copied from
 * the convention used by the older services in this repo. But the gateway does
 * not send numeric tenant ids — it sends a UUID (the tenant middleware sets
 * `req.tenant.id` to one). Every insert therefore failed:
 *
 *   Data truncated for column 'tenant_id' at row 1
 *   code: 'WARN_DATA_TRUNCATED', errno: 1265
 *
 * MariaDB does NOT coerce here: in non-strict mode it warns and truncates, and
 * under strict mode it rejects the row outright — which is what turned every
 * application submit into a 500 with nothing inserted.
 *
 * All THREE tables are changed, not just insurance_policies: filing a Group
 * claim also inserts insurance_policy_members rows carrying the same tenant_id,
 * so fixing only the policies table would simply move the failure one code path
 * along.
 *
 * VARCHAR(36) is exactly a UUID's length — wide enough for every id this
 * platform issues, without pretending to support arbitrary-length keys.
 */
const TABLES = ['insurance_policies', 'insurance_policy_members', 'insurance_claims'];

module.exports = {
  async up(knex) {
    for (const table of TABLES) {
      if (!(await knex.schema.hasTable(table))) continue;

      await knex.raw(
        'ALTER TABLE ?? MODIFY COLUMN `tenant_id` VARCHAR(36) DEFAULT NULL',
        [table],
      );
    }
  },

  async down(knex) {
    for (const table of TABLES) {
      if (!(await knex.schema.hasTable(table))) continue;

      /* Only safe while no rows hold a UUID — narrowing back would truncate
         them. Left here so the migration is reversible on an empty table. */
      await knex.raw(
        'ALTER TABLE ?? MODIFY COLUMN `tenant_id` INTEGER DEFAULT NULL',
        [table],
      );
    }
  },
};