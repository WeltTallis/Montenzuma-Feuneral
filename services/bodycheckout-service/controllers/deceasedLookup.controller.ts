import { Request, Response } from 'express';
import Logger from '../../../packages/shared-logger/dist/index';
import { getTenantDBBySlug } from '../../../shared/dbConfig';

// ─── Types ───────────────────────────────────────────────────────────────────

type Row = { [key: string]: any };

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Express 5 may pass route params as `string | string[]` — always normalize. */
const normalizeParam = (value: unknown): string => {
  if (Array.isArray(value)) return String(value[0] ?? '');
  if (value == null) return '';
  return String(value);
};

/** Graceful handling for tenants whose DB hasn't been migrated yet. */
const isTableMissing = (err: any): boolean =>
  !!err && (err.code === 'ER_NO_SUCH_TABLE' || err.errno === 1146);

/**
 * Find a deceased record by admission number (case-insensitive, ignores
 * soft-deleted rows). Runs directly against the tenant database so the
 * body-checkout service is self-sufficient for release auto-fill.
 */
const findDeceasedByAdmissionNumber = async (
  pool: any,
  admissionNumber: string
): Promise<Row | null> => {
  const [rows] = await pool.execute(
    `SELECT * FROM deceased
     WHERE UPPER(TRIM(admission_number)) = UPPER(TRIM(?))
       AND (is_deleted IS NULL OR is_deleted = FALSE)
     ORDER BY created_at DESC
     LIMIT 1`,
    [admissionNumber]
  );
  const list = rows as any[];
  return list && list.length > 0 ? (list[0] as Row) : null;
};

/** Find the primary (or first) next-of-kin for a deceased record. */
const findPrimaryNextOfKin = async (
  pool: any,
  deceasedId: string
): Promise<Row | null> => {
  const [rows] = await pool.execute(
    `SELECT * FROM next_of_kin
     WHERE deceased_id = ? AND (is_deleted IS NULL OR is_deleted = FALSE)
     ORDER BY (is_primary = TRUE) DESC, created_at DESC
     LIMIT 1`,
    [deceasedId]
  );
  const list = rows as any[];
  return list && list.length > 0 ? (list[0] as Row) : null;
};

/**
 * Build the exact object the Release form's `fillDeceasedIntoForm()` consumes.
 * Aliases cover every variant (deceased table / next_of_kin table / legacy names).
 */
const mergeDeceasedWithKin = (deceased: Row, kin: Row | null): Row => {
  const kinName = kin?.full_name || '';
  const kinPhone = kin?.contact || kin?.alternative_phone || '';
  const kinId = kin?.id_number || '';
  const deceasedPhone = deceased.phone_number || deceased.tel_number || deceased.tell_no || '';

  return {
    ...deceased,
    deceased_id: deceased.deceased_id,
    admission_number: deceased.admission_number,
    full_name: deceased.full_name || '',
    gender: deceased.gender || '',
    age: deceased.age || '',
    date_of_birth: deceased.date_of_birth || '',
    date_of_death: deceased.date_of_death || '',
    date_admitted: deceased.date_admitted || '',
    time_received: deceased.time_received || '',
    cause_of_death: deceased.cause_of_death || '',
    place_of_death: deceased.place_of_death || deceased.location || '',
    death_location: deceased.location || deceased.place_of_death || '',
    body_status: deceased.body_status || 'In Morgue',
    permit_number: deceased.permit_number || '',
    phone_number: deceasedPhone || kinPhone,
    // Kin aliases understood by the release form
    next_kin: kinName,
    contact_person: kinName,
    relationship: deceased.relationship || kin?.relationship || '',
    kin_relationship: kin?.relationship || '',
    id_number: deceased.national_id || kinId || '',
    national_id: deceased.national_id || '',
    nationalId: deceased.national_id || '',
    tel_number: deceasedPhone || kinPhone || '',
    tel_no: deceasedPhone || kinPhone || '',
    contact: kinPhone || deceasedPhone || '',
    next_of_kin_record: kin,
  };
};
/**
 * GET /body-release/deceased/:id
 * Fetch a single deceased record by id / deceased_id for release pre-fill.
 */
export const getDeceasedByIdController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const tenantSlug =
      (req.headers['x-tenant-slug'] as string) ||
      (req.headers['X-tenant-slug'] as string);

    if (!tenantSlug) {
      return res.status(400).json({ success: false, message: 'Tenant slug is required' });
    }

    const id = decodeURIComponent(normalizeParam(req.params?.id)).trim();
    if (!id) {
      return res.status(400).json({ success: false, message: 'Deceased id is required' });
    }

    const db = await getTenantDBBySlug(tenantSlug);
    if (!db) {
      return res.status(400).json({
        success: false,
        message: 'No database configured for this tenant',
      });
    }

    const [rows] = await db.execute(
      `SELECT * FROM deceased
       WHERE (deceased_id = ? OR id = ?)
         AND (is_deleted IS NULL OR is_deleted = FALSE)
       LIMIT 1`,
      [id, id]
    );
    const list = rows as any[];
    const deceased = list && list.length > 0 ? (list[0] as Row) : null;

    if (!deceased) {
      return res.status(404).json({ success: false, message: 'Deceased record not found' });
    }

    const kin = await findPrimaryNextOfKin(db, deceased.deceased_id);
    Logger.info(`[LOOKUP] Deceased found by id: ${id} for tenant: ${tenantSlug}`);

    return res.status(200).json({
      success: true,
      message: 'Deceased record fetched successfully',
      data: mergeDeceasedWithKin(deceased, kin),
    });
  } catch (error: any) {
    Logger.error({
      message: 'getDeceasedByIdController error',
      error: error.message,
      stack: error.stack,
    });

    if (isTableMissing(error)) {
      return res.status(404).json({ success: false, message: 'Deceased record not found' });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /body-release/deceased
 * List deceased records that are still admitted (not Released / Transferred)
 * so the release form can pre-load its dropdown without the deceased service.
 */
export const listDeceasedForReleaseController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const tenantSlug =
      (req.headers['x-tenant-slug'] as string) ||
      (req.headers['X-tenant-slug'] as string);

    if (!tenantSlug) {
      return res.status(400).json({ success: false, message: 'Tenant slug is required' });
    }

    const { search = '' } = req.query as { search?: string };
    const db = await getTenantDBBySlug(tenantSlug);
    if (!db) {
      return res.status(400).json({
        success: false,
        message: 'No database configured for this tenant',
      });
    }

    let sql = `
      SELECT * FROM deceased
      WHERE (body_status IS NULL OR body_status NOT IN ('Released', 'Transferred'))
        AND (is_deleted IS NULL OR is_deleted = FALSE)
    `;
    const params: any[] = [];

    if (search && String(search).trim()) {
      sql += ` AND (full_name LIKE ? OR admission_number LIKE ?)`;
      const keyword = `%${String(search).trim()}%`;
      params.push(keyword, keyword);
    }

    sql += ` ORDER BY created_at DESC LIMIT 500`;

    const [rows] = await db.execute(sql, params);
    const list = rows as any[];

    return res.status(200).json({
      success: true,
      message: 'Deceased list fetched successfully',
      data: list || [],
    });
  } catch (error: any) {
    Logger.error({
      message: 'listDeceasedForReleaseController error',
      error: error.message,
      stack: error.stack,
    });

    if (isTableMissing(error)) {
      return res.status(200).json({ success: true, message: 'No records yet', data: [] });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * GET /body-release/deceased/by-admission/:admissionNumber
 * Search a deceased record by admission number and return auto-fill details.
 * (Moved into the body-checkout service so the release form no longer depends
 *  on the deceased-service admission-number route which is shadowed by the
 *  admission-number pre-generator route.)
 */
export const getDeceasedByAdmissionController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const tenantSlug =
      (req.headers['x-tenant-slug'] as string) ||
      (req.headers['X-tenant-slug'] as string);

    if (!tenantSlug) {
      return res.status(400).json({ success: false, message: 'Tenant slug is required' });
    }

    const admissionNumber = decodeURIComponent(normalizeParam(req.params?.admissionNumber))
      .trim()
      .toUpperCase();

    if (!admissionNumber) {
      return res.status(400).json({ success: false, message: 'Admission number is required' });
    }

    const db = await getTenantDBBySlug(tenantSlug);
    if (!db) {
      return res.status(400).json({
        success: false,
        message: 'No database configured for this tenant',
      });
    }

    const deceased = await findDeceasedByAdmissionNumber(db, admissionNumber);
    if (!deceased) {
      return res.status(404).json({
        success: false,
        message: `Deceased record not found with this admission number`,
      });
    }

    const kin = await findPrimaryNextOfKin(db, deceased.deceased_id);
    Logger.info(`[LOOKUP] Deceased found by admission: ${admissionNumber} for tenant: ${tenantSlug}`);

    return res.status(200).json({
      success: true,
      message: 'Deceased record fetched successfully',
      data: mergeDeceasedWithKin(deceased, kin),
    });
  } catch (error: any) {
    Logger.error({
      message: 'getDeceasedByAdmissionController error',
      error: error.message,
      stack: error.stack,
    });

    if (isTableMissing(error)) {
      return res.status(404).json({
        success: false,
        message: 'Deceased record not found with this admission number',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};