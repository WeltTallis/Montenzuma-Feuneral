import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { query, execute } from '../../../shared/dbConfig';


export interface NextOfKinRecord {
  id: number;
  deceased_id: string;
  tenant_slug: string;
  full_name: string;
  relationship: string;
  contact: string;
  email: string | null;
  is_primary: boolean;
  is_notified: boolean;
  notified_at: Date | null;
  address: string | null;
  alternative_contact: string | null;
  signature: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
  deleted_at: Date | null;
  deleted_by: string | null;
}

export interface CreateNextOfKinDTO {
  deceased_id: string;
  tenant_slug?: string;
  full_name: string;
  relationship: string;
  contact: string;
  email?: string;
  is_primary?: boolean;
  address?: string;
  alternative_contact?: string;
  id_number?: string | null;
  id_type?: string | null;
  signature?: string;
  created_by?: string;
}

export interface UpdateNextOfKinDTO {
  full_name?: string;
  contact?: string;
  email?: string;
  relationship?: string;
  is_primary?: boolean;
  is_notified?: boolean;
  address?: string;
  alternative_contact?: string;
}

export class NextOfKinModel {
  /**
   * Create next of kin record
   */
  static async create(req: any, data: CreateNextOfKinDTO): Promise<NextOfKinRecord | null> {
    // If marking as primary, ensure no other primary exists
    if (data.is_primary) {
      await execute(req,
        'UPDATE next_of_kin SET is_primary = FALSE WHERE deceased_id = ? AND is_primary = TRUE',
        [data.deceased_id]
      );
    }

    // Discover which columns this tenant's next_of_kin table actually has —
    // older databases may be missing signature / id_number / id_type.
    let existingCols = new Set<string>();
    try {
      const rows = await query(req,
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'next_of_kin'`
      );
      existingCols = new Set((rows as any[]).map((r) => String(r.COLUMN_NAME).toLowerCase()));
    } catch {
      // Assume the full modern schema if introspection fails
      ['signature', 'alternative_contact', 'id_number', 'id_type', 'created_by'].forEach((c) => existingCols.add(c));
    }
    const has = (col: string) => existingCols.has(col);

    // tenant_slug is NOT NULL in the schema — derive it from the request so the
    // insert can never fail with "Field 'tenant_slug' doesn't have a default value".
    const rawSlug = req?.headers?.['x-tenant-slug'] || req?.headers?.['x-slug'] || data.tenant_slug || '';
    const tenantSlug = (Array.isArray(rawSlug) ? rawSlug[0] : String(rawSlug)).slice(0, 255);

    const columns: string[] = ['deceased_id', 'tenant_slug', 'full_name', 'relationship', 'contact', 'email', 'is_primary'];
    const values: any[] = [
      data.deceased_id,
      tenantSlug,
      data.full_name,
      data.relationship || 'Not Specified',
      data.contact || '',
      data.email || null,
      data.is_primary || false,
    ];

    if (has('address')) { columns.push('address'); values.push(data.address ?? null); }
    if (has('alternative_contact')) { columns.push('alternative_contact'); values.push(data.alternative_contact ?? null); }
    if (has('id_number')) { columns.push('id_number'); values.push(data.id_number ?? null); }
    if (has('id_type')) { columns.push('id_type'); values.push(data.id_type ?? null); }
    if (has('signature')) { columns.push('signature'); values.push(data.signature ?? null); }
    if (has('created_by')) { columns.push('created_by'); values.push(data.created_by ?? null); }

    const placeholders = columns.map(() => '?').join(', ');
    columns.push('created_at');
    const sql = `INSERT INTO next_of_kin (${columns.join(', ')}) VALUES (${placeholders}, NOW())`;

    const result = await execute(req, sql, values);

    return this.getById(req, (result as ResultSetHeader).insertId);
  }

  /**
   * Get next of kin by ID
   */
  static async getById(req: any, id: number): Promise<NextOfKinRecord | null> {
    const result = await query(req,
      'SELECT * FROM next_of_kin WHERE id = ? AND is_deleted = FALSE',
      [id]
    );

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get all next of kin for a deceased person
   */
  static async getByDeceasedId(req: any, deceasedId: string): Promise<NextOfKinRecord[]> {
    const result = await query(req,
      `SELECT * FROM next_of_kin 
       WHERE deceased_id = ? AND is_deleted = FALSE
       ORDER BY is_primary DESC, created_at ASC`,
      [deceasedId]
    );

    return result;
  }

  /**
   * Get primary next of kin for deceased
   */
  static async getPrimary(req: any, deceasedId: string): Promise<NextOfKinRecord | null> {
    const result = await query(req,
      `SELECT * FROM next_of_kin 
       WHERE deceased_id = ? AND is_primary = TRUE AND is_deleted = FALSE
       LIMIT 1`,
      [deceasedId]
    );

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update next of kin record
   */
  static async update(req: any, id: number, data: UpdateNextOfKinDTO): Promise<NextOfKinRecord | null> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(data.full_name);
    }

    if (data.contact !== undefined) {
      updates.push('contact = ?');
      params.push(data.contact);
    }

    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email);
    }

    if (data.relationship !== undefined) {
      updates.push('relationship = ?');
      params.push(data.relationship);
    }

    if (data.is_primary !== undefined) {
      updates.push('is_primary = ?');
      params.push(data.is_primary);
    }

    if (data.is_notified !== undefined) {
      updates.push('is_notified = ?');
      params.push(data.is_notified);
      if (data.is_notified) {
        updates.push('notified_at = NOW()');
      }
    }

    if (data.address !== undefined) {
      updates.push('address = ?');
      params.push(data.address);
    }

    if (data.alternative_contact !== undefined) {
      updates.push('alternative_contact = ?');
      params.push(data.alternative_contact);
    }

    if (updates.length === 0) {
      return this.getById(req, id);
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    await execute(req,
      `UPDATE next_of_kin SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return this.getById(req, id);
  }

  /**
   * Soft delete next of kin record
   */
  static async delete(req: any, id: number): Promise<boolean> {
    const result = await execute(req,
      `UPDATE next_of_kin SET is_deleted = TRUE, deleted_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    return (result as ResultSetHeader).affectedRows > 0;
  }

  /**
   * Mark as notified
   */
  static async markNotified(req: any, id: number): Promise<boolean> {
    const result = await execute(req,
      `UPDATE next_of_kin SET is_notified = TRUE, notified_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [id]
    );

    return (result as ResultSetHeader).affectedRows > 0;
  }
}