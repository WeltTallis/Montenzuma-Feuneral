import { MigrationService } from '../../../shared/services/migration-service';
import { BODY_CHECKOUT_SERVICE_MIGRATIONS } from '../../../shared/services/all-service-migrations';
import { getRootPool } from '../../../shared/dbConfig';
import Logger from '../../../packages/shared-logger/dist/index';

/**
 * Run the body-checkout migrations (070 body_checkout, 071 checkout_approvals,
 * 072 body_releases, 073 destination/plate columns) against EVERY active tenant
 * database at service startup.
 *
 * This makes the body-checkout service self-sufficient: even tenants that were
 * provisioned before the central migration runner added the body_releases table
 * will get it created here, mirroring how coffin / florist / hearse services
 * ensure their tables at boot.
 */
export async function runBodyCheckoutMigrations(): Promise<void> {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'restpoint_user';
  const password = process.env.DB_PASSWORD || '';

  const connectionConfig = { host, port, user, password };
  const svc = new MigrationService();

  try {
    const rootPool = await getRootPool();
    const [rows] = await rootPool.query(
      'SELECT db_name, tenant_slug FROM tenants WHERE status = "active"'
    );
    const tenants = rows as any[];

    let appliedCount = 0;

    for (const tenant of tenants) {
      if (!tenant?.db_name) continue;

      try {
        const result = await svc.runTenantMigrations(
          tenant.db_name,
          BODY_CHECKOUT_SERVICE_MIGRATIONS,
          connectionConfig
        );

        appliedCount += result.migrationsRun.length;

        if (result.errors && result.errors.length > 0) {
          Logger.error({
            message: `[BODYCHECKOUT] Migration errors for ${tenant.db_name}`,
            errors: result.errors,
          });
        } else if (result.migrationsRun.length > 0) {
          Logger.info(
            `[BODYCHECKOUT] Applied ${result.migrationsRun.length} migration(s) to ${tenant.db_name}: ${result.migrationsRun.join(', ')}`
          );
        }
      } catch (err: any) {
        Logger.error({
          message: `[BODYCHECKOUT] Migration failed for ${tenant.db_name}`,
          error: err.message,
          stack: err.stack,
        });
      }
    }

    Logger.info(
      `[BODYCHECKOUT] Body checkout migrations complete. Total migrations applied: ${appliedCount}`
    );
  } catch (error: any) {
    Logger.error({
      message: '[BODYCHECKOUT] Could not run body checkout migrations',
      error: error.message,
      stack: error.stack,
    });
  } finally {
    await svc.close().catch(() => {});
  }
}