const { safeQuery, safeQueryOne } = require('../config/database');

class Tenant {
  // All queries target the tenant_tracking database explicitly since
  // safeQuery without a tenantSlug uses a root pool with no database selected

  // Find tenant by slug (tenant_slug)
  static async findBySlug(slug) {
    console.log('[Tenant.findBySlug] Searching for slug:', slug);
    const result = await safeQueryOne(
      `SELECT * FROM tenant_tracking.tenants WHERE tenant_slug = ? AND status != 'deleted'`,
      [slug]
    );
    console.log('[Tenant.findBySlug] Result:', result);
    return result;
  }

  // Find tenant by email
  static async findByEmail(email) {
    console.log('[Tenant.findByEmail] Searching for email:', email);
    try {
      const result = await safeQueryOne(
        `SELECT * FROM tenant_tracking.tenants WHERE email = ? AND status != 'deleted'`,
        [email.toLowerCase()]
      );
      console.log('[Tenant.findByEmail] Result:', result);
      return result;
    } catch (error) {
      console.error('[Tenant.findByEmail] Error:', error);
      return null;
    }
  }

  // Find tenant by ID
  static async findById(tenantId) {
    console.log('[Tenant.findById] Searching for ID:', tenantId);
    // CRITICAL FIX: The tenants table uses `id` as the primary key, NOT `tenant_id`
    const result = await safeQueryOne(
      `SELECT * FROM tenant_tracking.tenants WHERE id = ? AND status != 'deleted'`,
      [tenantId]
    );
    console.log('[Tenant.findById] Result:', result);
    return result;
  }

  // Create new tenant
  static async create(tenantData) {
    const {
      tenant_name,
      tenant_slug,
      email,
      phone = null,
      location = null,
      status = 'active'
    } = tenantData;

    const result = await safeQuery(
      `INSERT INTO tenant_tracking.tenants (tenant_name, tenant_slug, email, phone, location, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenant_name, tenant_slug, email.toLowerCase(), phone, location, status]
    );
    
    return result.insertId;
  }

  // Get all tenants
  static async getAll() {
    return await safeQuery(
      `SELECT id AS tenant_id, tenant_name, tenant_slug, email, status, created_at 
       FROM tenant_tracking.tenants 
       WHERE status != 'deleted' 
       ORDER BY created_at DESC`
    );
  }

  // Update tenant status
  static async updateStatus(tenantId, status) {
    // CRITICAL FIX: The tenants table uses `id` as the primary key, NOT `tenant_id`
    await safeQuery(
      'UPDATE tenant_tracking.tenants SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, tenantId]
    );
  }

  // Update last login
  static async updateLastLogin(tenantId) {
    // CRITICAL FIX: The tenants table uses `id` as the primary key, NOT `tenant_id`
    await safeQuery(
      'UPDATE tenant_tracking.tenants SET last_login_at = NOW() WHERE id = ?',
      [tenantId]
    );
  }
}

module.exports = Tenant;
