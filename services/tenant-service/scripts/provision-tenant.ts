#!/usr/bin/env ts-node
/* Detached provisioning worker
 * Usage: npx ts-node services/tenant-service/scripts/provision-tenant.ts --payload <base64json>
 */
import * as process from 'process';
import * as mysql from 'mysql2/promise';
import { TenantModel } from '../models/Tenant.model';

async function updateProvisioningStatus(tenantSlug: string, status: string, progress: number, details?: string, errorMessage?: string) {
  try {
    const tenantTrackingDbHost = process.env.TENANT_TRACKING_DB_HOST || process.env.DB_HOST || '127.0.0.1';
    const tenantTrackingDbPort = parseInt(process.env.TENANT_TRACKING_DB_PORT || process.env.DB_PORT || '3306');
    const tenantTrackingDbUser = process.env.TENANT_TRACKING_DB_USER || process.env.DB_USER;
    const tenantTrackingDbPassword = process.env.TENANT_TRACKING_DB_PASSWORD || process.env.DB_PASSWORD;

    // Connect using the application user (restpoint_user) — no root credentials in code.
    const bootstrapConn = await mysql.createConnection({
      host: tenantTrackingDbHost,
      port: tenantTrackingDbPort,
      user: tenantTrackingDbUser,
      password: tenantTrackingDbPassword,
      multipleStatements: true
    });

    try {
      // Best-effort so a fresh deployment still creates the schema.
      await bootstrapConn.query('CREATE DATABASE IF NOT EXISTS tenant_tracking');
      await bootstrapConn.query(`GRANT ALL PRIVILEGES ON tenant_tracking.* TO '${tenantTrackingDbUser}'@'%'`);
      await bootstrapConn.query(`GRANT ALL PRIVILEGES ON tenant_tracking.* TO '${tenantTrackingDbUser}'@'localhost'`);
    } catch (bootstrapErr: any) {
      // Grants may already exist from the DBA setup — skip regardless.
      console.warn('DB bootstrap (create/grant) skipped:', bootstrapErr && bootstrapErr.message ? bootstrapErr.message : String(bootstrapErr));
    } finally {
      await bootstrapConn.end();
    }

    const conn = await mysql.createConnection({
      host: tenantTrackingDbHost,
      port: tenantTrackingDbPort,
      user: tenantTrackingDbUser,
      password: tenantTrackingDbPassword,
      database: 'tenant_tracking'
    });
    try {
      await conn.query(`INSERT INTO provisioning_status (tenant_slug, status, progress, details, error_message) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), progress = VALUES(progress), details = VALUES(details), error_message = VALUES(error_message), updated_at = CURRENT_TIMESTAMP`, [tenantSlug, status, progress, details || null, errorMessage || null]);
    } finally { await conn.end(); }
  } catch (err) {
    // best-effort
    console.warn('Failed to update provisioning_status:', err && (err as any).message ? (err as any).message : String(err));
  }
}

async function main() {
  const argv = require('minimist')(process.argv.slice(2));
  const payloadB64 = argv.payload as string;
  if (!payloadB64) {
    console.error('Missing --payload argument');
    process.exit(2);
  }

  const raw = Buffer.from(payloadB64, 'base64').toString('utf8');
  const payload = JSON.parse(raw);
  const tenantSlug = payload.tenant_slug || (payload.tenant_name || 'tenant').replace(/\s+/g, '-').toLowerCase();

  await updateProvisioningStatus(tenantSlug, 'running', 5, 'Worker started');

  try {
    // Call the registered tenant creation flow
        const result = await TenantModel.registerTenant({
      tenant_name: payload.tenant_name,
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,
      phone: payload.phone,
      location: payload.location,
      country: payload.country,
      deployment_type: payload.deployment_type,
      logo_url: payload.logo_url,
      branches: payload.branches
    });

        // Auto-connect all branches so they can communicate with each other.
    // Use the tenant record returned by registerTenant() (canonical tenant_id /
    // tenant_slug / db_name) — the slug MUST match the registered subdomain exactly,
    // otherwise findBySubdomain() returns null and branch_connections are never
    // created, leaving the branch_connections table empty.
    try {
      const tenant = result.tenant;
      if (tenant) {
        await TenantModel.autoConnectBranches(tenant.db_name, tenant.tenant_slug, tenant.tenant_id);
        console.log(`Auto-connected all branches for tenant: ${tenant.tenant_slug}`);
      } else {
        console.warn('Auto-connect skipped: registerTenant did not return a tenant record');
      }
    } catch (autoConnectErr: any) {
      console.warn(` Auto-connect branches failed: ${autoConnectErr.message}`);
    }

    await updateProvisioningStatus(tenantSlug, 'completed', 100, 'Provisioning completed');
    process.exit(0);
  } catch (err: any) {
    console.error('Provisioning worker failed:', err && err.message ? err.message : String(err));
    await updateProvisioningStatus(tenantSlug, 'failed', 0, 'Provisioning failed', err && err.message ? err.message : String(err));
    process.exit(1);
  }
}

main().catch(err => { console.error('Fatal worker error:', err); process.exit(1); });