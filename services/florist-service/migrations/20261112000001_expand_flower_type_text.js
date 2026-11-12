export async function up(knex) {
  const hasTable = await knex.schema.hasTable('flower_bookings');
  if (!hasTable) return;

  const hasColumn = await knex.schema.hasColumn('flower_bookings', 'flower_type');
  if (!hasColumn) return;

  await knex.raw('ALTER TABLE `flower_bookings` MODIFY COLUMN `flower_type` MEDIUMTEXT NOT NULL');
}

export async function down() {
  // Keep the larger column to avoid truncating existing booking descriptions.
}
