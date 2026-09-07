import { Request, Response, NextFunction } from 'express';
import Logger from '../../../packages/shared-logger/dist/index';
import { getTenantDB, resolveDatabase } from '../../../shared/dbConfig';

/**
 * Slug variants for release matching: releases may have been saved under the
 * branch slug (`org-home-nairobi`) or the parent org slug (`org-home`).
 * Accept either so the Release tab / list never miss saved records.
 */
const tenantSlugVariants = (slug: string): string[] => {
  const s = String(slug || '').trim();
  const variants = [s];
  const lastDash = s.lastIndexOf('-');
  if (lastDash > 0) variants.push(s.substring(0, lastDash));
  return Array.from(new Set(variants.filter(Boolean)));
};
/**
 * mysql2 `execute()` (prepared statements) does NOT expand a JS array bound to
 * `IN (?)` — the array is bound as a single value and matches nothing. Build
 * the placeholder list and spread the variants into params instead.
 */
const slugInClause = (variants: string[]): string => variants.map(() => '?').join(', ');

// GET /body-release/checkout/:id - Get specific release by ID

// GET /body-release/checkout/:id - Get specific release by ID
export const getReleaseController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.headers['X-tenant-slug'] as string;
    const { id } = req.params;

    if (!tenantSlug) {
      res.status(400).json({
        success: false,
        message: 'Tenant slug is required'
      });
      return;
    }

    // resolveDatabase understands raw db names, main tenant slugs AND branch
    // slugs (e.g. `org-home-nairobi`) — never pass the raw slug to getTenantDB.
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      res.status(400).json({ success: false, message: 'No database configured for this tenant' });
      return;
    }
    const db = await getTenantDB(dbName);
    const variants = tenantSlugVariants(tenantSlug);
    const query = `
      SELECT * FROM body_releases
      WHERE release_id = ? AND tenant_slug IN (${slugInClause(variants)})
      LIMIT 1
    `;

    const [rows] = await db.execute(query, [id, ...variants]);
    const results = rows as any[];

    if (!results || results.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Release not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: results[0]
    });
  } catch (error: any) {
    Logger.error({
      message: 'Error fetching release',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// GET /body-release/checkout/by-admission/:admissionNumber - Get release by admission number
export const getReleaseByAdmissionController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.headers['X-tenant-slug'] as string;
    const { admissionNumber } = req.params;

    if (!tenantSlug) {
      res.status(400).json({ success: false, message: 'Tenant slug is required' });
      return;
    }

    if (!admissionNumber) {
      res.status(400).json({ success: false, message: 'Admission number is required' });
      return;
    }

    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      res.status(400).json({ success: false, message: 'No database configured for this tenant' });
      return;
    }
    const db = await getTenantDB(dbName);
    const variants = tenantSlugVariants(tenantSlug);
    const query = `SELECT * FROM body_releases WHERE admission_number = ? AND tenant_slug IN (${slugInClause(variants)}) LIMIT 1`;
    const [rows] = await db.execute(query, [admissionNumber, ...variants]);
    const results = rows as any[];

    if (!results || results.length === 0) {
      res.status(404).json({ success: false, message: 'Release not found for this admission number' });
      return;
    }

    res.status(200).json({ success: true, data: results[0] });
  } catch (error: any) {
    Logger.error({ message: 'Error fetching release by admission', error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /body-release/checkout - List all releases
export const listReleasesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.headers['X-tenant-slug'] as string;

    if (!tenantSlug) {
      res.status(400).json({
        success: false,
        message: 'Tenant slug is required'
      });
      return;
    }

    const { page = '1', limit = '50', search = '' } = req.query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 50, 1), 100);

    const offset = (pageNumber - 1) * limitNumber;
    const variants = tenantSlugVariants(tenantSlug);
    let whereClause = `WHERE tenant_slug IN (${slugInClause(variants)})`;
    const params: any[] = [...variants];

    if (search && typeof search === 'string' && search.trim()) {
      whereClause += ` AND (release_id LIKE ? OR name_of_deceased LIKE ? OR admission_number LIKE ?)`;
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
    }

    // resolveDatabase understands raw db names, main tenant slugs AND branch
    // slugs (e.g. `org-home-nairobi`) — never pass the raw slug to getTenantDB.
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      res.status(400).json({ success: false, message: 'No database configured for this tenant' });
      return;
    }
    const db = await getTenantDB(dbName);
    
    const countQuery = `SELECT COUNT(*) as total FROM body_releases ${whereClause}`;
    const [countRows] = await db.execute(countQuery, params);
    const countResults = countRows as any[];
    const total = Number(countResults[0]?.total || 0);

    const query = `
      SELECT * FROM body_releases
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [releases] = await db.execute(query, [...params, limitNumber, offset]);
    const releaseResults = releases as any[];

    res.status(200).json({
      success: true,
      data: releaseResults || [],
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error: any) {
    Logger.error({
      message: 'Error fetching releases',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};