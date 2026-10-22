const { runMigrations } = require('./services/hearse-service/dist/services/hearse-service/database');
(async () => {
  try {
    await runMigrations();
    console.log('MIGRATIONS_OK');
    process.exit(0);
  } catch (e) {
    console.error('MIGRATIONS_FAIL', e);
    process.exit(1);
  }
})();
