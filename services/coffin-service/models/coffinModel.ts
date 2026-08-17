import { coffinQuery } from '../db.js';
import crypto from 'crypto';

/**
 * Coffin Model - Database operations against the CENTRAL coffin database.
 * All tenants share one central coffin DB; every query is scoped by tenant_slug
 * (and tenant_id) columns. There is no per-tenant database for coffin data.
 * Assumes the modern `coffins` schema:
 *   coffin_id, tenant_slug, type, exact_price, quantity, color, size, ...
 * Maps rows into the shape the frontend Inventory / Register / Select modals expect.
 */
class CoffinModel {
  /**
   * Map a raw `coffins` row into the frontend shape.
   */
  static mapRow(r: any): any {
    const images = r.image_urls
      ? r.image_urls.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 10)
      : [];
    const name = r.type || r.name || r.coffin_id || 'Unnamed Coffin';
    return {
      coffin_id: r.coffin_id,
      custom_id: r.custom_id || null,
      name,
      type: r.type || r.name || '',
      exact_price: parseFloat(r.exact_price ?? r.price) || 0,
      price: parseFloat(r.exact_price ?? r.price) || 0, // UI uses `price`
      price_kes: parseFloat(r.exact_price ?? r.price) || 0, // UI fallback
      quantity: parseInt(r.quantity ?? r.stock) || 0,
      stock: parseInt(r.quantity ?? r.stock) || 0, // UI uses `stock`
      color: r.color || '',
      size: r.size || '',
      material: r.material || '',
      sku: r.coffin_id || r.sku || '',
      branch_id: r.branch_id ? parseInt(r.branch_id) : null,
      created_at: r.created_at || null,
      images,
      primary_image: images[0] || null,
      image_urls: images
    };
  }

  /**
   * Create a new coffin
   */
  static async create(tenantSlug: string, data: any): Promise<any> {
    const type = (data.type || data.name || '').toString().trim();
    const color = (data.color || '').toString().trim() || null;
    const size = (data.size || '').toString().trim() || null;
    const quantity = parseInt(data.quantity) || 0;
    const exactPrice = parseFloat(data.exact_price ?? data.price) || 0;

    const coffinId = `COF-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const sql = `
      INSERT INTO coffins
        (coffin_id, tenant_slug, tenant_id, branch_id, type, exact_price, quantity, color, size,
         is_active, is_deleted, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE, NOW())
    `;

    await coffinQuery(sql, [
      coffinId, tenantSlug, data.tenant_id || null, data.branch_id || null,
      type, exactPrice, quantity, color, size
    ]);

    return {
      insertId: 0,
      coffin_id: coffinId,
      type,
      name: type,
      exact_price: exactPrice,
      price: exactPrice,
      quantity,
      stock: quantity,
      color,
      size
    };
  }

  /**
   * Get all coffins for a tenant
   */
  static async getAll(tenantSlug: string): Promise<any[]> {
    const sql = `
      SELECT c.coffin_id, c.type, c.exact_price, c.quantity, c.color, c.size, c.created_at,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
      WHERE c.tenant_slug = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
      ORDER BY c.created_at DESC
    `;

    const rows: any[] = await coffinQuery(sql, [tenantSlug]);
    return rows.map(row => this.mapRow(row));

  }

  /**
   * Get coffins from the central coffin database for a tenant (optionally a branch).
   * All branches share one central DB - the tenant (and optional branch) filter
   * is applied with columns, never by switching databases.
   */
  static async getByBranch(tenantSlug: string, _branchDbName?: string | null, _branchSlug?: string | null, branchId: number | null = null): Promise<any[]> {
    const sql = `
      SELECT c.coffin_id, c.type, c.exact_price, c.quantity, c.color, c.size, c.created_at,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
      WHERE c.tenant_slug = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
      ORDER BY c.created_at DESC
    `;

    const rows: any[] = await coffinQuery(sql, [tenantSlug]);
    return rows.map(row => ({
      ...this.mapRow(row),
      branch_id: branchId ? parseInt(String(branchId)) : (row.branch_id ? parseInt(String(row.branch_id)) : null)
    }));
  }

  /**
   * Get coffin by ID
   */
  static async getById(tenantSlug: string, id: string): Promise<any | null> {
    const sql = `
      SELECT c.coffin_id, c.type, c.exact_price, c.quantity, c.color, c.size, c.created_at,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
      WHERE c.coffin_id = ? AND c.tenant_slug = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
    `;

    const rows: any[] = await coffinQuery(sql, [id, tenantSlug]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  /**
   * Update coffin
   * Can update: name/type, color, size, quantity, price
   */
  static async update(tenantSlug: string, id: string, data: any): Promise<boolean> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.type !== undefined || data.name !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(((data.type ?? data.name) || '').toString().trim() || 'Unnamed Coffin');
    }
    if (data.color !== undefined) {
      updateFields.push('color = ?');
      updateValues.push((data.color || '').toString().trim() || null);
    }
    if (data.size !== undefined) {
      updateFields.push('size = ?');
      updateValues.push((data.size || '').toString().trim() || null);
    }
    if (data.quantity !== undefined) {
      updateFields.push('quantity = ?');
      updateValues.push(parseInt(data.quantity) || 0);
    }
    if (data.exact_price !== undefined || data.price !== undefined) {
      updateFields.push('exact_price = ?');
      updateValues.push(parseFloat(data.exact_price ?? data.price) || 0);
    }
    if (data.image_url) {
      await this.updateImages(tenantSlug, id, [data.image_url]);
    }

    updateFields.push('updated_at = NOW()');

    if (updateFields.length > 1) {
      const sql = `UPDATE coffins SET ${updateFields.join(', ')} WHERE coffin_id = ? AND tenant_slug = ? AND is_deleted = FALSE`;
      updateValues.push(id, tenantSlug);
      await coffinQuery(sql, updateValues);
    }

    return true;
  }

  /**
   * Soft delete coffin
   */
  static async delete(tenantSlug: string, id: string): Promise<boolean> {
    const orders: any[] = await coffinQuery(
      'SELECT order_id FROM coffin_bookings WHERE coffin_id = ? AND tenant_slug = ? AND status != "completed"',
      [id, tenantSlug]
    );

    if (orders.length > 0) {
      throw new Error('Cannot delete coffin with active orders');
    }

    await coffinQuery(
      'UPDATE coffins SET is_deleted = TRUE WHERE coffin_id = ? AND tenant_slug = ?',
      [id, tenantSlug]
    );

    return true;
  }

  /**
   * Create a coffin order
   */
  static async createOrder(tenantSlug: string, data: any): Promise<any> {
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Look the coffin up by its id — the caller auto-fills name/color/size from
    // the selected coffin, so we never require those fields for a booking.
    const coffin: any[] = await coffinQuery(
      'SELECT coffin_id, quantity FROM coffins WHERE coffin_id = ? AND tenant_slug = ? AND is_deleted = FALSE',
      [data.coffin_id, tenantSlug]
    );

    if (coffin.length === 0) {
      throw new Error('Coffin not found with the specified id');
    }

    if (coffin[0].quantity < parseInt(data.quantity)) {
      throw new Error(`Insufficient stock. Available: ${coffin[0].quantity}`);
    }

    await coffinQuery(
      'UPDATE coffins SET quantity = quantity - ? WHERE coffin_id = ? AND tenant_slug = ?',
      [parseInt(data.quantity), coffin[0].coffin_id, tenantSlug]
    );

    const sql = `
      INSERT INTO coffin_bookings (order_id, tenant_slug, tenant_id, branch_id, coffin_id, coffin_name, color, size, quantity, booked_by, booked_for, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    `;

    const result: any = await coffinQuery(sql, [
      orderId, tenantSlug, data.tenant_id || null, data.branch_id || null,
      coffin[0].coffin_id, data.coffin_name?.trim() || null,
      data.color ?? null, data.size ?? null, parseInt(data.quantity),
      data.booked_by?.trim() || null, data.booked_for?.trim() || null
    ]);

    return {
      order_id: orderId,
      insertId: result.insertId,
      coffin_name: data.coffin_name,
      color: data.color,
      size: data.size,
      quantity: data.quantity,
      booked_by: data.booked_by,
      booked_for: data.booked_for
    };
  }

  /**
   * Request stock from another branch
   */
  static async requestStock(tenantSlug: string, data: any): Promise<any> {
    const requestId = `REQ-${Date.now().toString().slice(-6)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const sql = `
      INSERT INTO stock_requests (request_id, tenant_slug, coffin_name, color, size, requested_by, booked_for, requesting_branch, image_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    const result: any = await coffinQuery(sql, [
      requestId, tenantSlug, data.coffin_name?.trim(), data.color?.trim(),
      data.size?.trim(), data.requested_by?.trim(), data.booked_for?.trim(),
      data.requesting_branch?.trim(), data.image_url || null
    ]);

    return {
      request_id: requestId,
      insertId: result.insertId,
      coffin_name: data.coffin_name,
      color: data.color,
      size: data.size,
      requested_by: data.requested_by,
      booked_for: data.booked_for,
      requesting_branch: data.requesting_branch,
      image: data.image_url || null
    };
  }

  /**
   * Add images to a coffin
   */
  static async addImages(tenantSlug: string, coffinId: string, imageUrls: string[]): Promise<boolean> {
    if (imageUrls.length > 0) {
      const sql = `INSERT INTO coffin_images (coffin_id, tenant_slug, image_url, created_at) VALUES ?`;
      const values = imageUrls.map(url => [coffinId, tenantSlug, url, new Date().toISOString().slice(0, 19).replace('T', ' ')]);
      await coffinQuery(sql, [values]);
    }
    return true;
  }

  /**
   * Update images for a coffin (replace existing)
   */
  static async updateImages(tenantSlug: string, coffinId: string, imageUrls: string[]): Promise<boolean> {
    await coffinQuery(
      'DELETE FROM coffin_images WHERE coffin_id = ? AND tenant_slug = ?',
      [coffinId, tenantSlug]
    );

    if (imageUrls.length > 0 && imageUrls[0]) {
      return this.addImages(tenantSlug, coffinId, imageUrls);
    }
    return true;
  }
}

export default CoffinModel;
