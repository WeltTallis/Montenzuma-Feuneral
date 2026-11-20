import { Request, Response } from 'express';
import axios from 'axios';
import CoffinModel from '../models/coffinModel.js';
import { coffinQuery, coffinTransaction } from '../db.js';
import { serviceGet, serviceSet, serviceDel, clearServiceCache } from '@montezuma/shared-services';
import { centralizedUploadService } from '@montezuma/shared-services';
import logger from '@montezuma/shared-logger';

const SERVICE_NAME = 'coffin-service';
const CACHE_TTL = 300; // 5 minutes

// ─── Notification Emission via Socket.IO service ────────────────────────
const SOCKETIO_SERVICE_URL =
  process.env.SOCKETIO_SERVICE_URL ||
  process.env.SOCKETIO_URL ||
  'http://localhost:5018';

/**
 * Emit a real-time notification through the Socket.IO service so it surfaces
 * in the frontend Notification Bell. Matches the pattern used by the hearse,
 * deceased, store and support services.
 */

async function emitSocketNotification(event: string, data: any, tenantSlug: string, branchSlugs?: string[]) {
  try {
    await axios.post(
      `${SOCKETIO_SERVICE_URL}/emit/${event}`,
      { tenantSlug, data, branchSlugs: branchSlugs && branchSlugs.length > 0 ? branchSlugs : undefined },
      { timeout: 3000 }
    );
  } catch (error: any) {
    logger.warn({ msg: `Failed to emit socket notification ${event}`, tenantSlug, error: error?.message });
  }
}

// ─── Cache Helpers ──────────────────────────────────────────────────────

async function getCached(tenantSlug: string, key: string) {
  return serviceGet(SERVICE_NAME, tenantSlug, key);
}

async function setCached(tenantSlug: string, key: string, value: any, ttl: number = CACHE_TTL) {
  return serviceSet(SERVICE_NAME, tenantSlug, key, value, ttl);
}

async function clearCoffinCache(tenantSlug: string) {
  await clearServiceCache(SERVICE_NAME, tenantSlug);
}

// ─── Image Processing ───────────────────────────────────────────────────

async function processCoffinImages(files: any[], coffinId: string, tenantSlug: string) {
  return processImagesInline(files, coffinId, tenantSlug);
}

async function processImagesInline(files: any[], coffinId: string, tenantSlug: string) {
  const imageUrls: string[] = [];
  for (let i = 0; i < Math.min(files.length, 10); i++) {
    const file = files[i];
    if (!String(file.mimetype || '').startsWith('image/')) {
      throw new Error(`"${file.originalname}" is not a supported image`);
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`Image "${file.originalname}" exceeds the 10 MB upload limit`);
    }
    try {
      const uploadResult = await centralizedUploadService.uploadImage(
        file.buffer,
        file.originalname,
        tenantSlug,
        'coffins',
        `coffin-${coffinId}`
      );
      if (!uploadResult.success || !uploadResult.urlPath) {
        throw new Error(uploadResult.error || 'The image service did not return a URL');
      }
      imageUrls.push(uploadResult.urlPath);
    } catch (err: any) {
      logger.error({ msg: 'Image processing error', filename: file.originalname, error: err.message });
      throw new Error(`Failed to upload "${file.originalname}": ${err.message}`);
    }
  }
  return { queued: false, imageUrls };
}

// ─── CONTROLLER FUNCTIONS ──────────────────────────────────────────────

/**
 * POST /coffins - Create a new coffin
 * Required: name, color, quantity, price. Size is optional.
 */
export const createCoffin = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const {
      type, name, exact_price, price,
      quantity, color, size, description
    } = (req as any).body;

    // Tenant/branch context — prefer the auth headers the frontend sends
    // (x-tenant-id / x-branch-id), then req.tenant, then request body.
    const headerOf = (name: string): string | null => {
      const v = (req.headers as any)[name];
      return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
    };
    const rTenantId = headerOf('x-tenant-id') || (req as any).tenant?.id || (req as any).tenant?.tenant_id || (req as any).tenantId || (req as any).body?.tenant_id || (req as any).body?.tenantId || null;
    const rBranchId = headerOf('x-branch-id') || (req as any).branchId || (req as any).body?.branch_id || (req as any).body?.branchId || null;
    // Keep ids EXACT as strings (UUIDs). Coercing to numbers corrupts/truncates the
    // UUID branch_id/tenant_id and the coffin leaks into every branch.
    const tenantIdVal = (rTenantId != null && String(rTenantId).trim() !== '') ? String(rTenantId).trim() : null;
    const branchIdVal = (rBranchId != null && String(rBranchId).trim() !== '') ? String(rBranchId).trim() : null;

    const modelType = (type || name || '').toString().trim();
    const modelColor = (color || '').toString().trim();
    const modelSize = (size || '').toString().trim() || null;
    const modelPrice = parseFloat(exact_price ?? price) || 0;
    const parsedModelQty = parseInt(quantity, 10) || 0;
    const modelQty = Math.max(0, parsedModelQty);

    if (!modelType) {
      return res.status(400).json({ success: false, message: 'Missing required field: Model (name) is required' });
    }
    if (!modelColor) {
      return res.status(400).json({ success: false, message: 'Missing required field: Color is required' });
    }
    if (parsedModelQty < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative' });
    }
    if (!modelPrice || modelPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Missing required field: Price must be greater than 0' });
    }

    const tenantScope = tenantIdVal ? '(tenant_slug = ? OR tenant_id = ?)' : 'tenant_slug = ?';
    const tenantScopeParams = tenantIdVal ? [tenantSlug, tenantIdVal] : [tenantSlug];
    const existing: any[] = await coffinQuery(
      `SELECT coffin_id FROM coffins
       WHERE LOWER(TRIM(type)) = LOWER(?) AND LOWER(TRIM(color)) = LOWER(?)
         AND COALESCE(NULLIF(LOWER(TRIM(size)), ''), '') = COALESCE(LOWER(?), '')
         AND ${tenantScope}
         AND ((branch_id = ?) OR (branch_id IS NULL AND ? IS NULL))
         AND is_deleted = FALSE`,
      [modelType, modelColor, modelSize, ...tenantScopeParams, branchIdVal, branchIdVal]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Coffin with same name, color, and size already exists'
      });
    }

    const result = await CoffinModel.create(tenantSlug, {
      type: modelType,
      exact_price: modelPrice,
      quantity: modelQty,
      color: modelColor,
      size: modelSize,
      description,
      tenant_id: tenantIdVal,
      branch_id: branchIdVal
    });

    let imageResult: any = { queued: false, imageUrls: [] };
    if ((req as any).files && (req as any).files.length > 0) {
      try {
        imageResult = await processCoffinImages((req as any).files, result.coffin_id, tenantSlug);
        if (imageResult.imageUrls.length > 0) {
          await CoffinModel.addImages(tenantSlug, result.coffin_id, imageResult.imageUrls);
        }
      } catch (imageError: any) {
        try {
          await coffinQuery(
            'UPDATE coffins SET is_deleted = TRUE WHERE coffin_id = ? AND tenant_slug = ?',
            [result.coffin_id, tenantSlug]
          );
        } catch (cleanupError: any) {
          logger.error({
            msg: 'Could not roll back coffin after image upload failure',
            tenantSlug,
            coffinId: result.coffin_id,
            error: cleanupError.message
          });
        }
        await clearCoffinCache(tenantSlug);
        throw new Error(`Coffin registration failed because an image could not be saved: ${imageError.message}`);
      }
    }

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin created', tenantSlug, coffinId: result.coffin_id });

    return res.status(201).json({
      success: true,
      message: 'Coffin created successfully',
      coffin_id: result.coffin_id,
      database_id: result.insertId || 0,
      name: result.name,
      type: result.type,
      color: result.color,
      size: result.size,
      quantity_on_hand: result.quantity_on_hand,
      quantity_reserved: result.quantity_reserved,
      quantity_available: result.quantity_available,
      description: result.description,
      quantity: result.quantity,
      stock: result.quantity,
      exact_price: result.exact_price,
      price: result.price,
      branch_id: result.branch_id,
      tenant_id: result.tenant_id,
      images: {
        count: imageResult.imageUrls.length,
        urls: imageResult.imageUrls
      }
    });

  } catch (error: any) {
    logger.error({ msg: 'Create coffin error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins - Get all coffins (cached)
 */
export const getAllCoffins = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  const branchId = req.query.branch_id;
  const branchSlug = req.query.branch_slug;

  // Branch context also arrives via the auth headers (x-branch-id / x-branch-slug),
  // which the frontend now always sends for multi-branch tenants.
  const headerOf = (name: string): any => {
    const v = (req.headers as any)[name];
    return Array.isArray(v) ? v[0] : (v ? String(v) : null);
  };
  const headerBranchId = headerOf('x-branch-id');
  const headerBranchSlug = headerOf('x-branch-slug');
  // The tenant id (UUID) scopes the central coffin DB. Multi-branch tenants share ONE
  // tenant_id across every branch; coffins written by a branch carry tenant_slug =
  // <branch slug> while head-office coffins carry tenant_slug = <parent slug>. Matching
  // on tenant_id as well gives a correct tenant-wide/branch view regardless of slug.
  const tenantId = headerOf('x-tenant-id') || (req.query as any).tenant_id || (req as any).tenantId || null;
  const tenantParam = (tenantId != null && String(tenantId).trim() !== '') ? String(tenantId).trim() : null;
  const tenantClause = tenantParam
    ? '(c.tenant_slug = ? OR c.tenant_id = ?)'
    : 'c.tenant_slug = ?';
  const tenantParams: any[] = tenantParam ? [tenantSlug, tenantParam] : [tenantSlug];

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const effectiveBranchSlug = String(branchSlug || headerBranchSlug || '');
    const effectiveBranchId = branchId || headerBranchId || null;

    if (effectiveBranchSlug) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // All coffin inventory lives in ONE central coffin DB, scoped by tenant slug.
      // A branch slug (x-branch-slug) narrows to the current branch whenever a branch
      // id (x-branch-id) is also supplied; without a branch id we fall back to the
      // whole tenant inventory.

      const params: any[] = [...tenantParams];

      let branchClause = '';
      if (effectiveBranchId) {
        branchClause = ' AND (c.branch_id = ? OR c.branch_id IS NULL)';
        params.push(String(effectiveBranchId));
      }

      const sql = `
        SELECT c.coffin_id, c.tenant_id, c.branch_id, c.type, c.exact_price, c.quantity, c.quantity_on_hand, c.quantity_reserved, c.color, c.size, c.created_at,
          GROUP_CONCAT(ci.image_url) as image_urls
        FROM coffins c
        LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
        WHERE ${tenantClause} AND c.is_deleted = FALSE ${branchClause}
        GROUP BY c.coffin_id
        ORDER BY c.created_at DESC
      `;

      const rows: any[] = await coffinQuery(sql, params);

      const coffins = rows.map(row => CoffinModel.mapRow(row));

      return res.status(200).json({ success: true, data: coffins, count: coffins.length });
    }

    if (effectiveBranchId) {
      const sql = `
        SELECT c.coffin_id, c.tenant_id, c.branch_id, c.type, c.exact_price, c.quantity, c.quantity_on_hand, c.quantity_reserved, c.color, c.size, c.created_at,
          GROUP_CONCAT(ci.image_url) as image_urls
        FROM coffins c
        LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
        WHERE ${tenantClause} AND (c.branch_id = ? OR c.branch_id IS NULL) AND c.is_deleted = FALSE
        GROUP BY c.coffin_id
        ORDER BY c.created_at DESC
      `;

      const rows: any[] = await coffinQuery(sql, [...tenantParams, String(effectiveBranchId)]);

      const coffins = rows.map(row => CoffinModel.mapRow(row));

      return res.status(200).json({ success: true, data: coffins, count: coffins.length });
    }

    // Default = MY branch's inventory first (multi-branch tenants send x-branch-id).
    // Single-branch / no branch context = the whole tenant inventory (tenant_slug).
    const cacheKey = effectiveBranchId ? `branchCoffins_${effectiveBranchId}` : 'allCoffins';
    let coffins: any = await getCached(tenantSlug, cacheKey);

    if (!coffins) {
      if (effectiveBranchId) {
        const sql = `
          SELECT c.coffin_id, c.tenant_id, c.branch_id, c.type, c.exact_price, c.quantity, c.quantity_on_hand, c.quantity_reserved, c.color, c.size, c.created_at,
            GROUP_CONCAT(ci.image_url) as image_urls
          FROM coffins c
          LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
          WHERE ${tenantClause} AND (c.branch_id = ? OR c.branch_id IS NULL) AND c.is_deleted = FALSE
          GROUP BY c.coffin_id
          ORDER BY c.created_at DESC
        `;
        const rows: any[] = await coffinQuery(sql, [...tenantParams, String(effectiveBranchId)]);
        coffins = rows.map(row => CoffinModel.mapRow(row));
      } else {
        coffins = await CoffinModel.getAll(tenantSlug, tenantParam); // already mapped (name, price, stock, ...)
      }
      await setCached(tenantSlug, cacheKey, coffins);
    }

    return res.status(200).json({ success: true, data: coffins, count: coffins.length });
  } catch (error: any) {
    logger.error({ msg: 'Get all coffins error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/all-branches - Get coffins from ALL branch databases
 * Used for "Find in Other Branches" feature
 */
export const getAllCoffinsAllBranches = async (req: Request, res: Response) => {
  const parentSlug = req.query.parent_slug;

  if (!parentSlug) {
    return res.status(400).json({ success: false, message: 'parent_slug query parameter is required' });
  }

  try {
    // One central coffin DB holds every branch's inventory for the tenant; we no
    // longer iterate branch databases. Branch rows are written with tenant_slug =
    // <branch slug> while head-office rows use tenant_slug = <parent slug>. Both
    // share the SAME tenant_id (UUID), so when a tenant id is supplied we match on
    // it too. This guarantees "all branches" returns every branch's coffins.
    const headerOf = (name: string): any => {
      const v = (req.headers as any)[name];
      return Array.isArray(v) ? v[0] : (v ? String(v) : null);
    };
    const tenantId = headerOf('x-tenant-id') || (req.query as any).tenant_id || (req as any).tenantId || null;
    const tenantParam = (tenantId != null && String(tenantId).trim() !== '') ? String(tenantId).trim() : null;
    const tenantClause = tenantParam
      ? '(c.tenant_slug = ? OR c.tenant_id = ?)'
      : 'c.tenant_slug = ?';
    const params: any[] = tenantParam ? [String(parentSlug), tenantParam] : [String(parentSlug)];

    const rows: any[] = await coffinQuery(`
      SELECT c.coffin_id, c.tenant_id, c.branch_id, c.type, c.exact_price, c.quantity, c.quantity_on_hand, c.quantity_reserved, c.color, c.size, c.created_at,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
      WHERE ${tenantClause} AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
      ORDER BY c.created_at DESC
    `, params);

    const allCoffins = rows.map(row => ({
      ...CoffinModel.mapRow(row),
      branch_id: (row.branch_id !== null && row.branch_id !== undefined && String(row.branch_id).trim() !== '')
        ? String(row.branch_id)
        : '',
      branch_slug: String(parentSlug),
      branch_name: String(parentSlug)
    }));

    return res.status(200).json({
      success: true,
      data: allCoffins,
      count: allCoffins.length,
      branches: 1
    });
  } catch (error: any) {
    logger.error({ msg: 'Get all branch coffins error', parentSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/:id - Get coffin by ID (cached)
 */
export const getCoffinById = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  const id = String(req.params.id);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (id === 'all-branches' || id === 'list' || id === 'health') {
    return res.status(404).json({ success: false, message: 'Invalid coffin ID' });
  }

  try {
    const headerOf = (name: string): any => {
      const v = (req.headers as any)[name];
      return Array.isArray(v) ? v[0] : (v ? String(v) : null);
    };
    const tenantId = headerOf('x-tenant-id') || (req.query as any).tenant_id || (req as any).tenantId || null;
    const tenantParam = (tenantId != null && String(tenantId).trim() !== '') ? String(tenantId).trim() : null;

    const cacheKey = `coffin_${id}`;
    let coffin: any = await getCached(tenantSlug, cacheKey);

    if (!coffin) {
      coffin = await CoffinModel.getById(tenantSlug, id, tenantParam); // already mapped (name, price, stock, ...)
      if (!coffin) {
        return res.status(404).json({ success: false, message: 'Coffin not found' });
      }
      await setCached(tenantSlug, cacheKey, coffin);
    }

    return res.status(200).json({ success: true, data: coffin });
  } catch (error: any) {
    logger.error({ msg: 'Get coffin by ID error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /coffins/:id - Update coffin
 */
export const updateCoffin = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  const id = String(req.params.id);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  let detailsUpdated = false;
  try {
    const {
      type, name, material, exact_price, price,
      quantity, supplier, origin, color, size, category, currency
    } = (req as any).body;

    const headerOf = (name: string): string | null => {
      const value = (req.headers as any)[name];
      return Array.isArray(value) ? String(value[0]) : (value ? String(value) : null);
    };
    const tenantId = headerOf('x-tenant-id') || (req as any).user?.tenantId || (req as any).user?.tenant_id || null;
    const current = await CoffinModel.getById(tenantSlug, id, tenantId);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Coffin variant not found' });
    }

    const nextType = (type ?? name ?? current.type ?? '').toString().trim();
    const nextColor = (color !== undefined ? color : current.color).toString().trim();
    const nextSize = (size !== undefined ? size : current.size).toString().trim();
    if (!nextColor) {
      return res.status(400).json({ success: false, message: 'Coffin color is required' });
    }
    const ownerClause = tenantId
      ? '(tenant_slug = ? OR tenant_id = ?)'
      : 'tenant_slug = ?';
    const ownerParams = tenantId ? [tenantSlug, String(tenantId)] : [tenantSlug];
    const duplicate: any[] = await coffinQuery(
      `SELECT coffin_id FROM coffins
       WHERE coffin_id <> ?
         AND LOWER(TRIM(type)) = LOWER(?)
         AND LOWER(TRIM(color)) = LOWER(?)
         AND COALESCE(NULLIF(LOWER(TRIM(size)), ''), '') = COALESCE(LOWER(?), '')
         AND ${ownerClause}
         AND ((branch_id = ?) OR (branch_id IS NULL AND ? IS NULL))
         AND is_deleted = FALSE
       LIMIT 1`,
      [id, nextType, nextColor, nextSize || null, ...ownerParams, current.branch_id, current.branch_id]
    );
    if (duplicate.length) {
      return res.status(409).json({
        success: false,
        message: 'A coffin variant with the same type, color, and size already exists in this branch'
      });
    }

    const updateData = {
      type,
      name,
      material,
      exact_price: exact_price ?? price,
      currency,
      quantity: quantity !== undefined ? parseInt(quantity) : undefined,
      supplier,
      origin,
      color,
      size,
      category
    };
    const hasDetails = [
      updateData.type,
      updateData.name,
      updateData.exact_price,
      updateData.quantity,
      updateData.color,
      updateData.size,
      (req as any).body?.image_url
    ].some((value) => value !== undefined);
    if (hasDetails) {
      const updateResult = await CoffinModel.update(tenantSlug, id, updateData, tenantId);
      if (updateResult === 0) {
        return res.status(404).json({ success: false, message: 'Coffin variant not found' });
      }
      detailsUpdated = true;
    }

    // Handle new images
    if ((req as any).files && (req as any).files.length > 0) {
      const imageResult: any = await processCoffinImages((req as any).files, current.coffin_id, tenantSlug);
      if (imageResult.imageUrls.length > 0) {
        await CoffinModel.addImages(tenantSlug, current.coffin_id, imageResult.imageUrls);
      }
    }

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin updated', tenantSlug, id });

    return res.status(200).json({ success: true, message: 'Coffin updated successfully' });
  } catch (error: any) {
    logger.error({ msg: 'Update coffin error', tenantSlug, id, error: error.message });
    const message = detailsUpdated
      ? `Coffin details were saved, but image upload failed: ${error.message}`
      : error.message;
    return res.status(500).json({ success: false, message });
  }
};

/**
 * DELETE /coffins/:id - Soft delete coffin
 */
export const deleteCoffin = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  const id = String(req.params.id);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    await CoffinModel.delete(tenantSlug, id);

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin deleted', tenantSlug, id });

    return res.status(200).json({ success: true, message: 'Coffin deleted successfully' });
  } catch (error: any) {
    logger.error({ msg: 'Delete coffin error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── COFFIN ORDERS (BOOKINGS) ──────────────────────────────────────────

/**
 * POST /coffins/orders - Create a coffin order/booking
 */
export const createOrder = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const {
      coffin_id, coffin_name, type, color, size, quantity,
      booked_by, booked_for, client_name, deceased_name,
      service_date, amount, deposit
    } = (req as any).body;

    // Tenant/branch context — prefer the auth headers the frontend sends
    // (x-tenant-id / x-branch-id), then req.tenant, then request body.
    const headerOf = (name: string): string | null => {
      const v = (req.headers as any)[name];
      return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
    };
    const rTenantId = headerOf('x-tenant-id') || (req as any).tenant?.id || (req as any).tenant?.tenant_id || (req as any).tenantId || (req as any).body?.tenant_id || (req as any).body?.tenantId || null;
    const rBranchId = headerOf('x-branch-id') || (req as any).branchId || (req as any).body?.branch_id || (req as any).body?.branchId || null;
    const tenantIdVal = rTenantId != null && String(rTenantId).trim() ? String(rTenantId).trim() : null;
    const branchIdVal = rBranchId != null && String(rBranchId).trim() ? String(rBranchId).trim() : null;

    const parsedQuantity = parseInt(quantity);
    if (quantity !== undefined && quantity !== '' && quantity !== null && (isNaN(parsedQuantity) || parsedQuantity <= 0)) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }
    const finalQuantity = isNaN(parsedQuantity) || parsedQuantity <= 0 ? 1 : parsedQuantity;

    const coffinIdRaw = (coffin_id || '').toString().trim();
    const coffinNameRaw = (coffin_name || type || '').toString().trim();
    const requestedColor = (color || '').toString().trim();
    const requestedSize = (size || '').toString().trim();
    if (!coffinIdRaw && !coffinNameRaw) {
      return res.status(400).json({
        success: false, message: 'Coffin type is required'
      });
    }

    const tenantClause = tenantIdVal
      ? '(tenant_slug = ? OR tenant_id = ?)'
      : 'tenant_slug = ?';
    const tenantParams = tenantIdVal ? [tenantSlug, tenantIdVal] : [tenantSlug];
    const branchClause = branchIdVal ? ' AND (branch_id = ? OR branch_id IS NULL)' : '';
    const branchParams = branchIdVal ? [branchIdVal] : [];
    const variantSelect = `SELECT coffin_id, type, color, size, quantity
      FROM coffins
      WHERE ${tenantClause} AND is_deleted = FALSE${branchClause}`;

    const findVariant = async (modelName: string, modelColor: string, modelSize?: string) => {
      const sizeClause = modelSize
        ? " AND COALESCE(NULLIF(LOWER(TRIM(size)), ''), '') = ?"
        : " AND (size IS NULL OR TRIM(size) = '')";
      const params = [...tenantParams, ...branchParams, modelName, modelColor];
      if (modelSize) params.push(modelSize.toLowerCase());
      const rows: any[] = await coffinQuery(
        `${variantSelect}
         AND LOWER(TRIM(type)) = LOWER(?)
         AND LOWER(TRIM(color)) = LOWER(?)${sizeClause}
         ORDER BY CASE WHEN size IS NULL OR TRIM(size) = '' THEN 0 ELSE 1 END,
                  quantity DESC, coffin_id ASC`,
        params
      );
      return rows[0] || null;
    };

    let coffin: any = null;
    if (coffinIdRaw) {
      const rows: any[] = await coffinQuery(
        `SELECT coffin_id, type, color, size, quantity FROM coffins
         WHERE coffin_id = ? AND ${tenantClause} AND is_deleted = FALSE${branchClause}`,
        [coffinIdRaw, ...tenantParams, ...branchParams]
      );
      if (rows.length > 0) coffin = rows[0];
      if (!coffin) {
        return res.status(404).json({ success: false, message: 'Selected coffin variant was not found for this tenant or branch' });
      }
      if (coffinNameRaw && coffinNameRaw.toLowerCase() !== String(coffin.type || '').trim().toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Selected coffin type does not match the inventory variant' });
      }
      if (requestedColor && requestedColor.toLowerCase() !== String(coffin.color || '').trim().toLowerCase()) {
        return res.status(400).json({ success: false, message: 'Selected coffin color does not match the inventory variant' });
      }
      if (requestedSize && requestedSize.toLowerCase() !== String(coffin.size || '').trim().toLowerCase()) {
        coffin = await findVariant(coffin.type, requestedColor || coffin.color || '', requestedSize);
        if (!coffin) {
          return res.status(404).json({ success: false, message: 'No inventory variant matches the selected size' });
        }
      } else if (!requestedSize && String(coffin.size || '').trim()) {
        const unsizedVariant = await findVariant(coffin.type, requestedColor || coffin.color || '');
        coffin = unsizedVariant;
      }
    } else if (requestedColor) {
      coffin = await findVariant(coffinNameRaw, requestedColor, requestedSize);
    }

    const finalName = coffinNameRaw || coffin?.type || '';
    const finalColor = requestedColor || (coffin?.color || '').toString().trim();
    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Coffin type is required' });
    }
    if (!finalColor) {
      return res.status(400).json({ success: false, message: 'Coffin color is required' });
    }
    if (requestedSize && !coffin) {
      return res.status(404).json({ success: false, message: 'No inventory variant matches the selected type, color, and size' });
    }

    let stockReserved = false;
    if (coffin && requestedSize) {
      stockReserved = Number(coffin.quantity) >= finalQuantity;
    } else if (coffin && !String(coffin.size || '').trim()) {
      stockReserved = Number(coffin.quantity) >= finalQuantity;
    }
    if (requestedSize && !stockReserved) {
      return res.status(409).json({
        success: false,
        message: `Insufficient stock. Available: ${coffin?.quantity || 0}, Requested: ${finalQuantity}`
      });
    }

    const finalSize = requestedSize || null;
    const finalBookedBy = (booked_by || '').toString().trim() || (client_name || '').toString().trim() || null;
    const finalBookedFor = (booked_for || '').toString().trim() || (deceased_name || '').toString().trim() || null;

    if (finalBookedFor && coffin?.coffin_id) {
      const existingOrder: any[] = await coffinQuery(
        `SELECT order_id FROM coffin_bookings
         WHERE coffin_id = ? AND tenant_slug = ?
           AND status IN ('active', 'booked') AND booked_for = ?`,
        [coffin.coffin_id, tenantSlug, finalBookedFor]
      );

      if (existingOrder.length > 0) {
        return res.status(409).json({
          success: false,
          message: `This coffin is already booked for "${finalBookedFor}". Please check the booking.`
        });
      }
    }

    const result = await CoffinModel.createOrder(tenantSlug, {
      coffin_id: coffin?.coffin_id || null,
      coffin_name: finalName,
      color: finalColor,
      size: finalSize,
      quantity: finalQuantity,
      booked_by: finalBookedBy,
      booked_for: finalBookedFor,
      client_phone: ((req as any).body?.client_phone || '').toString().trim() || null,
      service_time: ((req as any).body?.service_time || '').toString().trim() || null,
      paid: !!((req as any).body?.paid),
      amount: (req as any).body?.amount,
      deposit: (req as any).body?.deposit,
      service_date: service_date || null,
      tenant_id: tenantIdVal,
      branch_id: branchIdVal,
      stock_reserved: stockReserved,
      is_made_to_order: !stockReserved
    });

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin order created', tenantSlug, orderId: result.order_id, booked_for: finalBookedFor });

    // Notify the tenant (incl. any branch rooms) that a new coffin reservation was created.
    await emitSocketNotification('coffin-booking-created', {
      id: result.order_id || `booking-${Date.now()}`,
      title: 'New Coffin Reservation',
      message: `${finalBookedBy || 'Client'} reserved ${finalName} (qty ${finalQuantity})${result.is_made_to_order ? ' · made to order' : ''}`,
      fullContent: `Coffin: ${finalName}\nColor: ${finalColor}\nSize: ${finalSize || 'Workshop to decide'}\nClient: ${finalBookedBy || 'N/A'}\nDeceased: ${finalBookedFor || 'N/A'}\nQuantity: ${finalQuantity}\nStock reserved: ${result.stock_reserved ? 'Yes' : 'No'}\nAmount: ${result.amount || 0}\nDeposit: ${result.deposit || 0}\nBalance: ${(result.amount || 0) - (result.deposit || 0)}\nBooking ID: ${result.order_id}`,
      orderId: result.order_id,
      coffinName: finalName,
      clientName: finalBookedBy,
      quantity: finalQuantity,
      stock_reserved: result.stock_reserved,
      is_made_to_order: result.is_made_to_order,
      amount: result.amount,
      deposit: result.deposit,
      balance: result.amount - result.deposit,
      status: 'active',
      priority: 'medium',
    }, tenantSlug);

    return res.status(201).json({
      success: true,
      message: 'Coffin order created successfully',
      data: {
        order_id: result.order_id,
        coffin_name: finalName,
        color: finalColor,
        size: finalSize,
        quantity: finalQuantity,
        booked_by: finalBookedBy,
        booked_for: finalBookedFor,
        service_date: service_date || null,
        status: 'active',
        stock_reserved: result.stock_reserved,
        is_made_to_order: result.is_made_to_order,
        paid: result.paid,
        amount: result.amount,
        deposit: result.deposit,
        balance: result.amount - result.deposit
      }
    });

  } catch (error: any) {
    logger.error({ msg: 'Create order error', tenantSlug, error: error.message });
    const statusCode = /insufficient stock/i.test(error.message || '') ? 409 : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * Unified calendar scoping for GET /coffins/orders (mirrors deceased-service).
 * Accepts, in priority order:
 *   from / to (or from_date / to_date) — strict YYYY-MM-DD; a malformed side is
 *     ignored rather than throwing, so a bad URL never 500s.
 *   year / month — integers (year 1900..2200, month 1..12) expanded to full
 *     month / full-year bounds.
 * Returns { from: string|null, to: string|null }. Both null means "no
 * scoping" — the historical behaviour every un-parameterised caller (ops
 * dashboards, rawCoffinOrders) relies on, so nothing that works today changes.
 */
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const isRealYmd = (s: string): boolean => {
  if (!YMD_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
export const resolveOrderDateRange = (q: Record<string, unknown>): { from: string | null; to: string | null } => {
  const pick = (v: unknown): string | null => {
    const s = String(v ?? '').trim();
    return isRealYmd(s) ? s : null;
  };
  const from = pick(q.from) ?? pick(q.from_date);
  const to = pick(q.to) ?? pick(q.to_date);
  if (from || to) return { from, to };
  const hasY = (() => { const n = Number(String(q.year ?? '').trim()); return Number.isInteger(n) && n >= 1900 && n <= 2200 ? n : null; })();
  const hasM = (() => { const n = Number(String(q.month ?? '').trim()); return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null; })();
  if (!hasY && !hasM) return { from: null, to: null };
  const y = hasY ?? new Date().getFullYear();
  if (!hasM) return { from: `${y}-01-01`, to: `${y}-12-31` };
  const last = new Date(Date.UTC(y, hasM as number, 0)).getUTCDate();
  const p2 = (n: number) => String(n).padStart(2, '0');
  return { from: `${y}-${p2(hasM as number)}-01`, to: `${y}-${p2(hasM as number)}-${p2(last)}` };
};

/**
 * GET /coffins/orders - Get all orders
 */
export const getAllOrders = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  const headerOf = (name: string): string | null => {
    const v = (req.headers as any)[name];
    return Array.isArray(v) ? String(v[0]) : v ? String(v) : null;
  };
  // Scope bookings to the current branch when one is present (x-branch-id header,
  // branch_id query param or the middleware-resolved req.branchId). Bookings with a
  // NULL branch_id are treated as shared central inventory and stay visible everywhere.
  // Without this, a coffin booked in e.g. Nairobi would show up in every other branch.
  const branchId =
    headerOf('x-branch-id') ||
    (req.query.branch_id as string | undefined) ||
    (req as any).branchId ||
    null;

  try {
    const params: any[] = [tenantSlug];
    let branchClause = '';
    if (branchId) {
      branchClause = ' AND (cb.branch_id = ? OR cb.branch_id IS NULL)';
      params.push(String(branchId));
    }

    // Support ?today=1 shortcut: scope to today's date only.
    const todayParam = (req.query.today as string | undefined);
    let effectiveQuery = req.query ?? {};
    if (todayParam === '1' || todayParam === 'true') {
      const today = new Date().toISOString().slice(0, 10);
      effectiveQuery = { ...effectiveQuery, from: today, to: today };
    }

    // Unified month/year scoping. The reservation dashboard always sends
    // from/to (first/last day of the visible month); other callers may send
    // year+month or nothing. Absent bounds keep the legacy "everything" view.
    const dateRange = resolveOrderDateRange(effectiveQuery as Record<string, unknown>);
    let dateClause = '';
    if (dateRange.from) { dateClause += ' AND DATE(COALESCE(cb.service_date, cb.created_at)) >= ?'; params.push(dateRange.from); }
    if (dateRange.to) { dateClause += ' AND DATE(COALESCE(cb.service_date, cb.created_at)) <= ?'; params.push(dateRange.to); }

    // Search filters: coffin name, client name (booked_by), deceased name (booked_for)
    const search = (req.query.search as string | undefined) || '';
    let searchClause = '';
    if (search && search.trim()) {
      const like = `%${search.trim()}%`;
      searchClause = ` AND (cb.coffin_name LIKE ? OR cb.booked_by LIKE ? OR cb.booked_for LIKE ? OR cb.client_phone LIKE ?)`;
      params.push(like, like, like, like);
    }

    const sql = `
      SELECT order_id, order_id AS id, coffin_id, coffin_name, color, size, quantity,
             booked_by, booked_for,
             booked_by AS client_name, booked_for AS deceased_name,
             client_phone,
             branch_id,
             source_request_id,
             status,
             paid,
             stock_reserved,
             is_made_to_order,
             amount,
             deposit,
             DATE_FORMAT(COALESCE(service_date, DATE(created_at)), '%Y-%m-%d') AS service_date,
             service_time,
             created_at
      FROM coffin_bookings cb
      WHERE cb.tenant_slug = ?${branchClause}${dateClause}${searchClause}
      ORDER BY cb.created_at DESC
    `;

    const orders: any[] = await coffinQuery(sql, params);

    // ── Inter-branch transfer requests → pending reservations ──────────────
    // When THIS branch requests a coffin from another branch (req_type =
    // 'client'), the request must show up in Reservations immediately — not
    // only after delivery. Synthesize pending reservation rows from the
    // branch's OUTGOING stock requests that are still pending/approved. Once
    // delivered, the linked real coffin_bookings row replaces the synthesized
    // one. Keeping the request linked to that booking prevents it from being
    // lost when the transfer action completes.
    try {
      const orgSlugForTransfers = await resolveOrgSlug(tenantSlug);
      const transferParams: any[] = [orgSlugForTransfers, orgSlugForTransfers];
      let transferBranchClause = '';
      if (branchId) {
        transferBranchClause = ' AND sr.to_branch_id = ?';
        transferParams.push(String(branchId));
      }
      const transferRows: any[] = await coffinQuery(
        `SELECT sr.request_id, sr.coffin_id, sr.coffin_name, sr.color, sr.size, sr.quantity,
                sr.client_name, sr.client_phone, sr.deceased_name,
                DATE_FORMAT(COALESCE(sr.service_date, DATE(sr.created_at)), '%Y-%m-%d') AS service_date,
                sr.notes, sr.from_branch_name, sr.status, sr.created_at
         FROM stock_requests sr
         WHERE (sr.tenant_slug = ? OR sr.tenant_slug LIKE CONCAT(?, '-%'))
           AND sr.req_type = 'client'
           AND sr.status IN ('pending', 'approved')${transferBranchClause}
         ORDER BY sr.created_at DESC`,
        transferParams
      );

    // Dedupe against real bookings that already exist for the same transfer
      // (e.g. the inter-branch reservation flow creates BOTH a booking and a
      // stock request): same coffin + client + service date = same order.
      // Honour the same month bounds on synthesized transfer rows: their
      // service_date is a 'YYYY-MM-DD' string, so a lexicographic compare is
      // exact. Undated rows stay visible rather than silently vanishing.
      const inRange = (d: unknown): boolean => {
        const s = String(d ?? '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return true;
        if (dateRange.from && s < dateRange.from) return false;
        if (dateRange.to && s > dateRange.to) return false;
        return true;
      };

      const existingKeys = new Set(
        orders.map((o) =>
          `${String(o.coffin_id ?? '')}|${String(o.client_name ?? o.booked_by ?? '').toLowerCase().trim()}|${String(o.service_date ?? '')}`,
        ),
      );

      for (const t of transferRows) {
        if (!inRange(t.service_date)) continue;
        const key = `${String(t.coffin_id ?? '')}|${String(t.client_name ?? '').toLowerCase().trim()}|${String(t.service_date ?? '')}`;
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        const transferNote =
          t.status === 'approved'
            ? `Approved — coffin in transit from ${t.from_branch_name || 'another branch'}`
            : `Awaiting approval from ${t.from_branch_name || 'another branch'}`;
        orders.push({
          order_id: `XFER-${t.request_id}`,
          id: `XFER-${t.request_id}`,
          coffin_id: t.coffin_id,
          coffin_name: t.coffin_name,
          color: t.color,
          size: t.size,
          quantity: t.quantity,
          booked_by: t.client_name,
          booked_for: t.deceased_name,
          client_name: t.client_name,
          deceased_name: t.deceased_name,
          client_phone: t.client_phone,
          branch_id: branchId,
          status: 'pending',
          paid: 0,
          stock_reserved: false,
          is_made_to_order: true,
          pending_transfer: true,
          transfer_status: t.status,
          source_request_id: t.request_id,
          service_date: t.service_date,
          service_time: null,
          notes: t.notes ? `${transferNote} — ${t.notes}` : transferNote,
          created_at: t.created_at,
        });
      }
    } catch (transferErr: any) {
      logger.warn({ msg: 'Could not synthesize pending transfer reservations', tenantSlug, error: transferErr?.message });
    }

    return res.status(200).json({ success: true, data: orders, count: orders.length });
  } catch (error: any) {
    logger.error({ msg: 'Get all orders error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/orders/:id - Get order by ID
 */
export const getOrderById = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  const id = String(req.params.id);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const sql = `
      SELECT order_id, order_id AS id, coffin_id, coffin_name, color, size, quantity,
             booked_by, booked_for,
             booked_by AS client_name, booked_for AS deceased_name,
             client_phone,
             branch_id,
             status,
             paid,
             stock_reserved,
             is_made_to_order,
             DATE_FORMAT(COALESCE(service_date, DATE(created_at)), '%Y-%m-%d') AS service_date,
             service_time,
             created_at, updated_at
      FROM coffin_bookings
      WHERE order_id = ? AND tenant_slug = ?
    `;

    const orders: any[] = await coffinQuery(sql, [id, tenantSlug]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, data: orders[0] });
  } catch (error: any) {
    logger.error({ msg: 'Get order by ID error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /coffins/orders/:id/status - Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  const id = String(req.params.id);
  const { status, paid, amount, deposit } = (req as any).body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (status === undefined && paid === undefined && amount === undefined && deposit === undefined) {
    return res.status(400).json({ success: false, message: 'No update provided (status, paid, amount or deposit required)' });
  }

  if (status !== undefined && !['active', 'booked', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be: active, booked, completed, or cancelled' });
  }

  try {
    await coffinTransaction(async (query: any) => {
      const orders: any[] = await query(
        `SELECT order_id, coffin_id, quantity, status, stock_reserved, is_made_to_order, source_request_id
         FROM coffin_bookings WHERE order_id = ? AND tenant_slug = ? FOR UPDATE`,
        [id, tenantSlug]
      );
      if (!orders.length) {
        const error: any = new Error('Order not found');
        error.statusCode = 404;
        throw error;
      }

      const order = orders[0];
      const currentStatus = String(order.status || '').toLowerCase();
      const active = ['active', 'booked', 'pending'].includes(currentStatus);
      const stockIsReserved = Boolean(order.stock_reserved);
      const madeToOrder = Boolean(order.is_made_to_order);
      let nextStockReserved = stockIsReserved;

      if (currentStatus === 'completed' && status && status !== 'completed') {
        const error: any = new Error('A completed reservation cannot change status');
        error.statusCode = 409;
        throw error;
      }

      if (status === 'cancelled' && active && stockIsReserved && order.coffin_id) {
        await query(
          `UPDATE coffins
           SET quantity = quantity + ?,
               quantity_reserved = GREATEST(quantity_reserved - ?, 0)
           WHERE coffin_id = ?`,
          [order.quantity, order.quantity, order.coffin_id]
        );
        nextStockReserved = false;
      } else if (status === 'completed' && active && stockIsReserved && order.coffin_id) {
        await query(
          `UPDATE coffins
           SET quantity_reserved = GREATEST(quantity_reserved - ?, 0),
               quantity_on_hand = GREATEST(quantity_on_hand - ?, 0)
           WHERE coffin_id = ?`,
          [order.quantity, order.quantity, order.coffin_id]
        );
        nextStockReserved = false;
      } else if (
        ['active', 'booked'].includes(status)
        && currentStatus === 'cancelled'
        && !madeToOrder
        && !order.source_request_id
      ) {
        const stockUpdate: any = await query(
          `UPDATE coffins
           SET quantity = quantity - ?, quantity_reserved = quantity_reserved + ?
           WHERE coffin_id = ? AND is_deleted = FALSE AND quantity >= ?`,
          [order.quantity, order.quantity, order.coffin_id, order.quantity]
        );
        if (Number(stockUpdate?.affectedRows || 0) !== 1) {
          const error: any = new Error('Insufficient stock to reactivate this reservation');
          error.statusCode = 409;
          throw error;
        }
        nextStockReserved = true;
      } else if (['active', 'booked'].includes(status) && currentStatus === 'completed') {
        const error: any = new Error('A completed reservation cannot be reactivated');
        error.statusCode = 409;
        throw error;
      }

      const updates: string[] = [];
      const values: any[] = [];
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
        if (status === 'cancelled' || status === 'completed') {
          updates.push('stock_reserved = ?');
          values.push(nextStockReserved ? 1 : 0);
        } else if (currentStatus === 'cancelled' && nextStockReserved) {
          updates.push('stock_reserved = ?');
          values.push(1);
        }
      }
      if (paid !== undefined) {
        updates.push('paid = ?');
        values.push(paid ? 1 : 0);
      }
      if (amount !== undefined) {
        updates.push('amount = ?');
        values.push(parseFloat(amount) || 0);
      }
      if (deposit !== undefined) {
        updates.push('deposit = ?');
        values.push(parseFloat(deposit) || 0);
      }

      updates.push('updated_at = NOW()');
      values.push(id, tenantSlug);
      await query(
        `UPDATE coffin_bookings SET ${updates.join(', ')} WHERE order_id = ? AND tenant_slug = ?`,
        values
      );
    });

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Order status updated', tenantSlug, orderId: id, status, paid, amount, deposit });
    return res.status(200).json({ success: true, message: 'Order updated successfully' });
  } catch (error: any) {
    logger.error({ msg: 'Update order status error', tenantSlug, id, error: error.message });
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// ─── STOCK REQUESTS ──────────────────────────────────────────────────────

/**
 * Stock requests are ORG-WIDE records in the central operations DB: every
 * branch of an organization must see them all so Incoming/Outgoing
 * classification works. Normalize a BRANCH slug (e.g. org-home-machakos) to
 * the PARENT org slug (org-home) so writes and reads always share one slug.
 *
 * Resolution is authoritative via `tenant_tracking.tenants` (one row per
 * ORGANIZATION — branch DBs are not registered there): strip trailing dash
 * segments off the slug until the prefix matches a registered tenant slug.
 * No branches table is required, so this works even though the operations DB
 * has no `branches` table. Result is cached per slug for 5 minutes.
 */
const ORG_SLUG_CACHE_TTL = 5 * 60 * 1000;
const orgSlugCache = new Map<string, { slug: string; at: number }>();

const resolveOrgSlug = async (tenantSlug: string): Promise<string> => {
  const slug = String(tenantSlug || '').trim();
  if (!slug) return slug;

  const cached = orgSlugCache.get(slug);
  if (cached && Date.now() - cached.at < ORG_SLUG_CACHE_TTL) {
    return cached.slug;
  }

  let resolved = slug;

  // 1) Authoritative: tenant_tracking.tenants holds the org (parent) slugs.
  //    If the slug itself is registered it IS the org slug; otherwise strip
  //    trailing segments until a registered org slug is found.
  try {
    const exact: any[] = await coffinQuery(
      'SELECT tenant_slug FROM tenant_tracking.tenants WHERE tenant_slug = ? LIMIT 1',
      [slug]
    );
    if (!exact || exact.length === 0) {
      const parts = slug.split('-');
      for (let i = parts.length - 1; i >= 1; i--) {
        const candidate = parts.slice(0, i).join('-');
        if (!candidate) continue;
        const found: any[] = await coffinQuery(
          'SELECT tenant_slug FROM tenant_tracking.tenants WHERE tenant_slug = ? LIMIT 1',
          [candidate]
        );
        if (found && found.length > 0) {
          resolved = candidate;
          break;
        }
      }
    }
  } catch {
    // 2) Fallback: a legacy `branches` table inside the operations DB (if a
    //    deployment created one) maps branch_slug -> tenant_slug directly.
    try {
      const rows: any[] = await coffinQuery(
        'SELECT tenant_slug FROM branches WHERE branch_slug = ? LIMIT 1',
        [slug]
      );
      const ownOrg = String(rows[0]?.tenant_slug || '').trim();
      if (ownOrg && ownOrg !== slug) resolved = ownOrg;
    } catch { /* keep the slug as-is */ }
  }

  orgSlugCache.set(slug, { slug: resolved, at: Date.now() });
  return resolved;
};

/**
 * POST /coffins/stock-requests - Request stock from another branch
 */
export const createStockRequest = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }
  // Org-wide slug: branch users store/read under the PARENT org slug so the
  // receiving branch sees the same request rows.
  const orgSlug = await resolveOrgSlug(tenantSlug);

  try {
    const { coffin_id, coffin_name, color, size, requested_by, booked_for, requesting_branch, client_name, client_phone, deceased_name, service_date, notes, from_branch_id, to_branch_id, from_branch_name, to_branch_name, quantity, req_type } = (req as any).body;

    const coffinIdRaw = (coffin_id || '').toString().trim();
    const coffinNameRaw = (coffin_name || '').toString().trim();

    if (!coffinIdRaw && !coffinNameRaw) {
      return res.status(400).json({
        success: false,
        message: 'Please select a coffin for the stock request (coffin_id or coffin_name is required)'
      });
    }

    // Auto-fill coffin details from the selected coffin when only an id is given.
    let resolvedName = coffinNameRaw;
    let resolvedColor = (color || '').toString().trim() || null;
    let resolvedSize = (size || '').toString().trim() || null;
    if (coffinIdRaw) {
      const rows: any[] = await coffinQuery(
        'SELECT type, color, size FROM coffins WHERE coffin_id = ? AND (tenant_slug = ? OR tenant_slug LIKE CONCAT(?, \'-%\')) AND is_deleted = FALSE LIMIT 1',
        [coffinIdRaw, orgSlug, orgSlug]
      );
      if (rows.length > 0) {
        resolvedName = resolvedName || rows[0].type || 'Coffin';
        resolvedColor = resolvedColor || rows[0].color || null;
        resolvedSize = resolvedSize || rows[0].size || null;
      }
    }

    let imageUrl: string | null = null;
    if ((req as any).files && (req as any).files.length > 0) {
      const file = (req as any).files[0];
      try {
        const uploadResult = await centralizedUploadService.uploadImage(
          file.buffer,
          file.originalname,
          tenantSlug,
          'stock-requests',
          `request-${Date.now()}`
        );
        if (uploadResult.success) {
          imageUrl = uploadResult.urlPath;
        }
      } catch (err: any) {
        logger.warn({ msg: 'Image upload failed for stock request', error: err.message });
      }
    }

    // ─── Branch resolution: EXACT BRANCH NAME ONLY (never slugs) ───
    // The client sends from/to branch names (+ ids for reference). Every
    // ref is resolved against the branches table so the stored
    // from_branch_name / to_branch_name are ALWAYS the exact DB names.
    const cleanStr = (v: any) => (v == null ? '' : String(v).trim());
    let fromId = cleanStr(from_branch_id) || null;
    let toId = cleanStr(to_branch_id) || null;
    let fromName = cleanStr(from_branch_name);
    let toName = cleanStr(to_branch_name);
    // Branch SLUGs (complete, e.g. org-home-machakos) — used to target the
    // socket notification at the correct branch room only.
    let fromSlug: string | null = null;
    let toSlug: string | null = null;

    if (fromName || toName || fromId || toId) {
      let allBranches: any[] = [];
      try {
        allBranches = await coffinQuery(
          'SELECT * FROM branches WHERE tenant_slug = ?',
          [orgSlug]
        );
      } catch {
        // Schema variants whose branches table lacks tenant_slug —
        // fall through and match purely by exact branch name.
        try { allBranches = await coffinQuery('SELECT * FROM branches'); } catch { allBranches = []; }
      }
      const normName = (s: any) => String(s || '').trim().toLowerCase();
      const branchByName = (list: any[], n: string) =>
        list.find((b) => normName(b?.branch_name ?? b?.name) === normName(n));
      const branchById = (list: any[], idVal: any) =>
        list.find((b) => String(b?.branch_id ?? b?.id ?? '') === String(idVal));
      const canonicalName = (b: any) => String(b?.branch_name ?? b?.name ?? '').trim();

      // SOURCE branch — exact name wins; the id is only used to recover
      // the canonical name when the client sent an id without a name.
      if (fromName) {
        const m = branchByName(allBranches, fromName);
        if (m) {
          fromName = canonicalName(m);
          if (!fromId) fromId = String(m.branch_id ?? m.id);
          if (!fromSlug) fromSlug = String(m.branch_slug ?? m.slug ?? '').trim() || null;
        } else {
          logger.warn({ msg: 'Stock request source branch not matched by exact name — keeping provided name', tenantSlug, providedFromName: fromName });
        }
      } else if (fromId) {
        const m = branchById(allBranches, fromId);
        if (m) {
          fromName = canonicalName(m);
          if (!fromSlug) fromSlug = String(m.branch_slug ?? m.slug ?? '').trim() || null;
        }
      }

      // DESTINATION branch — same rules
      if (toName) {
        const m = branchByName(allBranches, toName);
        if (m) {
          toName = canonicalName(m);
          if (!toId) toId = String(m.branch_id ?? m.id);
          if (!toSlug) toSlug = String(m.branch_slug ?? m.slug ?? '').trim() || null;
        } else {
          logger.warn({ msg: 'Stock request destination branch not matched by exact name — keeping provided name', tenantSlug, providedToName: toName });
        }
      } else if (toId) {
        const m = branchById(allBranches, toId);
        if (m) {
          toName = canonicalName(m);
          if (!toSlug) toSlug = String(m.branch_slug ?? m.slug ?? '').trim() || null;
        }
      }
    }

    // The requesting branch IS the receiver of the stock — store its exact name.
    const requestingBranchName = cleanStr(requesting_branch) || toName || null;

    const result = await CoffinModel.requestStock(orgSlug, {
      coffin_id: coffinIdRaw || null,
      coffin_name: resolvedName || 'Coffin',
      color: resolvedColor,
      size: resolvedSize,
      requested_by: (requested_by || '').toString().trim() || (client_name || '').toString().trim() || null,
      booked_for: (booked_for || '').toString().trim() || (deceased_name || '').toString().trim() || null,
      requesting_branch: requestingBranchName,
      from_branch_id: fromSlug || fromId,
      to_branch_id: toSlug || toId,
      from_branch_name: fromName || null,
      to_branch_name: toName || null,
      quantity,
      client_name: (client_name || '').toString().trim() || null,
      client_phone: (client_phone || '').toString().trim() || null,
      deceased_name: (deceased_name || '').toString().trim() || null,
      // Expected (service) date — normalised to YYYY-MM-DD so the DATE column
      // always accepts it. Previously these fields were dropped here and never
      // reached the model, so the expected date was never stored in the DB.
      service_date: (service_date || '').toString().trim() || null,
      notes: (notes || '').toString().trim() || null,
      req_type: (req_type || '').toString().trim() || null,
      tenant_id: (req as any).tenantId || (req as any).body?.tenant_id || null,
      image_url: imageUrl
    });

    logger.info({ msg: 'Stock request created', tenantSlug, requestId: result.request_id });

    // Notify the destination branch that a transfer/stock request was created.
    const emitReq = {
      id: result.request_id || `stock-${Date.now()}`,
      title: 'Stock Transfer Requested',
      message: `A coffin transfer was requested (${resolvedName || 'Coffin'}, qty ${parseInt(quantity) || 1})`,
      fullContent: `Coffin: ${resolvedName || 'Coffin'}\nQuantity: ${parseInt(quantity) || 1}\nFrom: ${fromName || 'Branch'}\nTo: ${toName || 'Branch'}\nRequest ID: ${result.request_id}`,
      requestId: result.request_id,
      coffinId: coffinIdRaw || null,
      coffinName: resolvedName || 'Coffin',
      quantity: parseInt(quantity) || 1,
      fromBranch: fromName || null,
      toBranch: toName || null,
      fromBranchSlug: fromSlug || null,
      toBranchSlug: toSlug || null,
      status: 'pending',
      priority: 'high',
    };
    // Target the notification at the SOURCE branch room — Nairobi (the
    // fulfiller) is the one who must approve/act on the transfer request.
    // Falls back to org-wide when the branch slug could not be resolved.
    await emitSocketNotification('coffin-stock-request', emitReq, orgSlug, fromSlug ? [fromSlug] : undefined);

    return res.status(201).json({
      success: true,
      message: 'Stock request created successfully',
      data: {
        request_id: result.request_id,
        coffin_id: result.coffin_id,
        coffin_name: result.coffin_name,
        color: result.color,
        size: result.size,
        requested_by: (requested_by || '').toString().trim() || (client_name || '').toString().trim() || null,
        booked_for: (booked_for || '').toString().trim() || (deceased_name || '').toString().trim() || null,
        requesting_branch: requestingBranchName,
        from_branch_id: result.from_branch_id,
        to_branch_id: result.to_branch_id,
        from_branch_name: result.from_branch_name,
        to_branch_name: result.to_branch_name,
        quantity: result.quantity,
        client_name: result.client_name,
        client_phone: result.client_phone,
        deceased_name: result.deceased_name,
        service_date: result.service_date,
        notes: result.notes,
        image: imageUrl,
        status: 'pending'
      }
    });

  } catch (error: any) {
    logger.error({ msg: 'Create stock request error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/stock-requests - Get all stock requests
 */
export const getAllStockRequests = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  // List under the ORG slug so every branch sees all org requests — the UI
  // classifies Incoming (my branch fulfills) vs Outgoing (my branch requested).
  const orgSlug = await resolveOrgSlug(tenantSlug);

  // LEGACY REPAIR — before 2026-08-17 the request was saved with the
  // branch UUID (or branch slug) as `tenant_slug` and the branch IDs as
  // numeric ids, so sibling branches never saw their own reservations.
  // Rewrite those rows once to the canonical org slug + canonical branch
  // slugs now that we compare on complete slugs everywhere.
  try {
    await coffinQuery(
      `UPDATE stock_requests
       SET tenant_slug = ?
       WHERE tenant_slug = ? OR tenant_slug = ? OR tenant_slug LIKE CONCAT(?, '-%')
         AND (from_branch_id = ? OR to_branch_id = ? OR from_branch_id = ? OR to_branch_id = ?)`,
      [orgSlug, tenantSlug, tenantSlug, orgSlug, tenantSlug, tenantSlug, tenantSlug]
    );
  } catch {
    // Non-critical: only repairs historical rows; keep serving current rows.
  }

  try {
    const sql = `
      SELECT request_id, request_id AS id, coffin_id, tenant_id, coffin_name, color, size, requested_by, booked_for,
        requesting_branch, from_branch_id, to_branch_id, from_branch_name, to_branch_name,
        quantity, req_type, image_url, status, created_at, updated_at,
        client_name, client_phone, deceased_name, notes,
        DATE_FORMAT(COALESCE(service_date, DATE(created_at)), '%Y-%m-%d') AS service_date
      FROM stock_requests
      WHERE tenant_slug = ? OR tenant_slug LIKE CONCAT(?, '-%')
      ORDER BY created_at DESC
    `;

    const requests: any[] = await coffinQuery(sql, [orgSlug, orgSlug]);

    return res.status(200).json({ success: true, data: requests, count: requests.length });
  } catch (error: any) {
    logger.error({ msg: 'Get all stock requests error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/stock-requests/:id - Get stock request by ID
 */
export const getStockRequestById = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  const id = String(req.params.id);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }
  const orgSlug = await resolveOrgSlug(tenantSlug);

  try {
    const sql = `
      SELECT request_id, request_id AS id, coffin_id, tenant_id, coffin_name, color, size, requested_by, booked_for,
        requesting_branch, from_branch_id, to_branch_id, from_branch_name, to_branch_name,
        quantity, req_type, image_url, status, created_at, updated_at,
        client_name, client_phone, deceased_name, notes,
        DATE_FORMAT(COALESCE(service_date, DATE(created_at)), '%Y-%m-%d') AS service_date
      FROM stock_requests
      WHERE request_id = ? AND (tenant_slug = ? OR tenant_slug LIKE CONCAT(?, '-%'))
    `;

    const requests: any[] = await coffinQuery(sql, [id, orgSlug, orgSlug]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock request not found' });
    }

    return res.status(200).json({ success: true, data: requests[0] });
  } catch (error: any) {
    logger.error({ msg: 'Get stock request by ID error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /coffins/stock-requests/:id/status - Update stock request status
 */
export const updateStockRequestStatus = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  const id = String(req.params.id);
  const { status } = (req as any).body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (!status || !['pending', 'approved', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const orgSlug = await resolveOrgSlug(tenantSlug);
    const sql = `UPDATE stock_requests SET status = ?, updated_at = NOW() WHERE request_id = ? AND (tenant_slug = ? OR tenant_slug LIKE CONCAT(?, '-%'))`;
    await coffinQuery(sql, [status, id, orgSlug, orgSlug]);

    logger.info({ msg: 'Stock request status updated', tenantSlug, requestId: id, status });

    return res.status(200).json({ success: true, message: `Stock request ${status} successfully` });
  } catch (error: any) {
    logger.error({ msg: 'Update stock request status error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/health - Health check
 */
/**
 * POST /coffins/stock-requests/:id/:action - Update stock request status by action name.
 * 2-STATUS WORKFLOW only: approve -> approved, reject -> rejected,
 * delivered -> delivered (confirmed by the REQUESTING branch). Legacy
 * transferring/transit/complete actions are collapsed onto the 2-status model
 * (transferring/transit -> approved, complete -> delivered). On every status
 * change the REQUESTING branch (to_branch) is pushed a bell notification via
 * the socket service.
 */
export const updateStockRequestAction = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  const id = String(req.params.id);
  const action = String((req.params as any).action || (req as any).params?.action || '').toLowerCase();

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }
  const orgSlug = await resolveOrgSlug(tenantSlug);

  const statusMap: Record<string, string> = {
    approve: 'approved',
    approved: 'approved',
    reject: 'rejected',
    rejected: 'rejected',
    complete: 'delivered',
    completed: 'delivered',
    // Legacy 2-step "transferring / transit / In Transit" — collapsed into the
    // new 2-status flow (approved → delivered). Any leftover rows/actions that
    // say "transferring" are now treated as APPROVED (already dispatched).
    transferring: 'approved',
    transit: 'approved',
    delivered: 'delivered',
    pending: 'pending'
  };
  const status = statusMap[action];

  if (!status) {
    return res.status(400).json({ success: false, message: `Unknown stock request action: ${action}` });
  }

  try {
    // Fetch the request row first so we know who should be notified on status change.
    const reqRows: any[] = await coffinQuery(
      `SELECT request_id, tenant_id, coffin_id, coffin_name, color, size, quantity,
              requested_by, booked_for, requesting_branch, from_branch_id, to_branch_id,
              from_branch_name, to_branch_name, client_name, client_phone, deceased_name,
              service_date, notes, req_type, status
       FROM stock_requests WHERE request_id = ? AND (tenant_slug = ? OR tenant_slug LIKE CONCAT(?, '-%'))`,
      [id, orgSlug, orgSlug]
    );

    const sql = `UPDATE stock_requests SET status = ? WHERE request_id = ? AND (tenant_slug = ? OR tenant_slug LIKE CONCAT(?, '-%'))`;
    await coffinQuery(sql, [status, id, orgSlug, orgSlug]);

    // A delivered client transfer is also a reservation. Create it in the
    // receiving branch's tenant scope and link it to the request so repeated
    // clicks are idempotent and the reservation list remains populated.
    if (status === 'delivered' && String(reqRows[0]?.req_type || '').toLowerCase() === 'client') {
      const transfer = reqRows[0];
      await CoffinModel.createTransferOrder(tenantSlug, {
        source_request_id: transfer.request_id,
        tenant_id: transfer.tenant_id || (req as any).tenantId || null,
        branch_id: transfer.to_branch_id || (req as any).branchId || null,
        coffin_id: transfer.coffin_id,
        coffin_name: transfer.coffin_name,
        color: transfer.color,
        size: transfer.size,
        quantity: transfer.quantity,
        client_name: transfer.client_name || transfer.requested_by,
        booked_for: transfer.deceased_name || transfer.booked_for,
        client_phone: transfer.client_phone,
        service_date: transfer.service_date,
      });
    }

    logger.info({ msg: 'Stock request action applied', tenantSlug, requestId: id, action, status });

    // Notify the requesting/origin branch when the request moves forward.
    const prev = reqRows[0];
    if (reqRows.length > 0 && prev?.status && prev.status !== status) {
      // Resolve the involved branches' COMPLETE slugs so the notification is
      // targeted at their rooms (not broadcast org-wide). Status changes
      // matter to the requesting branch (to_branch) AND the fulfiller
      // (from_branch, e.g. approve/reject/delivered).
      let targetSlugs: string[] | undefined = undefined;
      try {
        const idList = [prev.from_branch_id, prev.to_branch_id]
          .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
          .map((v) => String(v));
        if (idList.length > 0) {
          const placeholders = idList.map(() => '?').join(',');
          const bRows: any[] = await coffinQuery(
            `SELECT branch_id, branch_slug FROM branches WHERE branch_id IN (${placeholders})`,
            idList
          );
          const slugFor = (bid: any) => {
            const m = (bRows || []).find((b) => String(b.branch_id) === String(bid));
            return m && m.branch_slug ? String(m.branch_slug).trim() : '';
          };
          const slugs = Array.from(new Set([slugFor(prev.to_branch_id), slugFor(prev.from_branch_id)].filter(Boolean)));
          if (slugs.length > 0) targetSlugs = slugs;
        }
      } catch (slugErr: any) {
        logger.warn({ msg: 'Could not resolve branch slugs for stock request notification', error: slugErr?.message });
      }

      const statusTitleMap: Record<string, string> = {
        approved: 'Transfer Approved',
        rejected: 'Transfer Rejected',
        delivered: 'Transfer Delivered',
        pending: 'Transfer Requested',
      };
      await emitSocketNotification('coffin-stock-request', {
        id: `${id}-${Date.now()}`,
        title: statusTitleMap[status] || `Transfer ${status}`,
        message: `${prev.coffin_name || 'Coffin'} (qty ${parseInt(prev.quantity) || 1}) is now ${statusTitleMap[status] || status}`,
        fullContent: `Coffin: ${prev.coffin_name || 'Coffin'}\nQuantity: ${parseInt(prev.quantity) || 1}\nFrom: ${prev.from_branch_name || 'Branch'}\nTo: ${prev.to_branch_name || 'Branch'}\nStatus: ${statusTitleMap[status] || status}\nRequest ID: ${id}`,
        requestId: id,
        coffinName: prev.coffin_name || 'Coffin',
        quantity: parseInt(prev.quantity) || 1,
        fromBranch: prev.from_branch_name || null,
        toBranch: prev.to_branch_name || null,
        status,
        priority: status === 'rejected' ? 'high' : 'medium',
      }, orgSlug, targetSlugs);
    }

    return res.status(200).json({ success: true, message: `Request ${status}`, status });
  } catch (error: any) {
    logger.error({ msg: 'Update stock request action error', tenantSlug, id, action, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const healthCheck = async (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'UP',
    service: 'coffin-service',
    timestamp: new Date().toISOString()
  });
};

export const redisHealthCheck = async (req: Request, res: Response) => {
  try {
    await serviceSet(SERVICE_NAME, 'health', '__ping__', { ok: true }, 5);
    return res.status(200).json({
      status: 'UP',
      service: 'coffin-service',
      redis: 'UP',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(200).json({
      status: 'UP',
      service: 'coffin-service',
      redis: 'DOWN',
      error: error?.message,
      timestamp: new Date().toISOString()
    });
  }
};
