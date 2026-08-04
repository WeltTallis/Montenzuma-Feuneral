/**
 * Coffin Model - Database operations with tenant isolation
 */
const { resolveDatabase, safeTenantQuery } = require('../../../shared/dbConfig');

class CoffinModel {
  /**
   * Create a new coffin
   */
  static async create(tenantSlug, data) {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    const price = parseFloat(data.exact_price);
    
    // Generate coffin_id if not provided
    const coffinId = data.custom_id || `COF-${Date.now().toString().slice(-6)}-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`;
    
    // Generate SKU if not provided
    const sku = data.sku || `SKU-${Date.now().toString().slice(-8)}`;


    const sql = `
      INSERT INTO coffins (coffin_id, tenant_slug, branch_id, name, sku, type, price, stock, size, color, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const result = await safeTenantQuery(dbName, sql, [
      coffinId, 
      tenantSlug, 
      data.branch_id || 1, 
      data.name?.trim() || 'Unnamed Coffin', 
      sku,
      data.type || 'Traditional',
      price,
      parseInt(data.quantity) || 0,
      data.size?.trim() || null, 
      data.color?.trim() || null, 
      data.notes?.trim() || null
    ]);

    return { insertId: result.insertId, coffin_id: coffinId, price: price };
  }

  /**
   * Get all coffins for a tenant
   */
  static async getAll(tenantSlug) {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      // Return empty array for branch slugs without their own database
      return [];
    }

    const sql = `
      SELECT c.*, c.created_by as created_by_name,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_slug = ci.tenant_slug
      WHERE c.tenant_slug = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
      ORDER BY c.created_at DESC
    `;

    return safeTenantQuery(dbName, sql, [tenantSlug]);
  }

  /**
   * Get coffins by branch ID
   */
  static async getByBranch(tenantSlug, branchId) {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return [];
    }

    const sql = `
      SELECT c.*, c.created_by as created_by_name,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_slug = ci.tenant_slug
      WHERE c.tenant_slug = ? AND c.branch_id = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
      ORDER BY c.created_at DESC
    `;

    return safeTenantQuery(dbName, sql, [tenantSlug, branchId]);
  }

  /**
   * Get coffin by ID or custom ID
   */
  static async getById(tenantSlug, id) {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return null;
    }

    const sql = `
      SELECT c.*, c.created_by as created_by_name,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_slug = ci.tenant_slug
      WHERE (c.coffin_id = ? OR c.sku = ?) AND c.tenant_slug = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
    `;

    const rows = await safeTenantQuery(dbName, sql, [id, id, tenantSlug]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Update coffin
   */
  static async update(tenantSlug, id, data) {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      throw new Error('Tenant database not found');
    }

    const updateFields = [];
    const updateValues = [];

    if (data.name !== undefined) { updateFields.push('name = ?'); updateValues.push(data.name?.trim() || 'Unnamed Coffin'); }
    if (data.price !== undefined) { updateFields.push('price = ?'); updateValues.push(parseFloat(data.price)); }
    if (data.stock !== undefined) { updateFields.push('stock = ?'); updateValues.push(parseInt(data.stock)); }
    if (data.size !== undefined) { updateFields.push('size = ?'); updateValues.push(data.size?.trim() || null); }
    if (data.color !== undefined) { updateFields.push('color = ?'); updateValues.push(data.color?.trim() || null); }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id, id, tenantSlug);

    if (updateFields.length > 1) {
      const sql = `UPDATE coffins SET ${updateFields.join(', ')} WHERE (coffin_id = ? OR sku = ?) AND tenant_slug = ? AND is_deleted = FALSE`;
      await safeTenantQuery(dbName, sql, updateValues);
    }

    return true;
  }

  /**
   * Soft delete coffin
   */
  static async delete(tenantSlug, id) {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      throw new Error('Tenant database not found');
    }

    // Check assignments
    const assignments = await safeTenantQuery(dbName,
      'SELECT id FROM deceased_coffin WHERE coffin_id = ? AND tenant_id = ?',
      [id, tenantSlug]
    );

    if (assignments.length > 0) {
      throw new Error('Cannot delete coffin with existing assignments');
    }

    await safeTenantQuery(dbName,
      'UPDATE coffins SET is_deleted = TRUE WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [id, id, tenantSlug]
    );

    return true;
  }

  /**
   * Assign coffin to deceased
   */
  static async assign(tenantSlug, data) {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      throw new Error('Tenant database not found');
    }

    const coffins = await safeTenantQuery(dbName,
      'SELECT quantity FROM coffins WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ? FOR UPDATE',
      [data.coffin_id, data.coffin_id, tenantSlug]
    );

    if (coffins.length === 0 || coffins[0].quantity <= 0) {
      throw new Error('Coffin not available');
    }

    const rfid = `RFID-${require('crypto').createHash('md5').update(`${data.deceased_name}-${Date.now()}`).digest('hex').substring(0, 8).toUpperCase()}`;
    const finalAssignedDate = data.assigned_date || new Date().toISOString().split('T')[0];

    await safeTenantQuery(dbName,
      `INSERT INTO deceased_coffin (deceased_id, coffin_id, tenant_id, assigned_by_username, assigned_date, rfid)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.deceased_id, data.coffin_id, tenantSlug, data.assigned_by || 'system', finalAssignedDate, rfid]
    );

    await safeTenantQuery(dbName,
      'UPDATE coffins SET quantity = quantity - 1 WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [data.coffin_id, data.coffin_id, tenantSlug]
    );

    return rfid;
  }

  /**
   * Get coffin analytics
   */
  static async getAnalytics(tenantSlug) {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      // Return empty analytics for branch slugs without their own database
      return { overview: {}, by_type: [] };
    }

    const overview = await safeTenantQuery(dbName, `
      SELECT 
        COUNT(*) AS total_coffins,
        SUM(stock) AS total_in_stock,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
        COUNT(DISTINCT type) as unique_types,
        SUM(price * stock) AS total_inventory_value
      FROM coffins
      WHERE tenant_slug = ? AND is_deleted = FALSE
    `, [tenantSlug]);

    const typeBreakdown = await safeTenantQuery(dbName, `
      SELECT type, COUNT(*) as models, SUM(stock) as stock, SUM(price * stock) as value
      FROM coffins WHERE tenant_slug = ? AND is_deleted = FALSE GROUP BY type ORDER BY value DESC LIMIT 10
    `, [tenantSlug]);

    return { overview: overview[0], by_type: typeBreakdown };
  }

  /**
   * Add images to a coffin
   */
  static async addImages(tenantSlug, coffinId, imageUrls) {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return false;
    }

    if (imageUrls.length > 0) {
      const sql = `INSERT INTO coffin_images (coffin_id, tenant_id, image_url, created_at) VALUES ?`;
      const values = imageUrls.map(url => [coffinId, tenantSlug, url, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
      await safeTenantQuery(dbName, sql, [values]);
    }
    return true;
  }
}

module.exports = CoffinModel;