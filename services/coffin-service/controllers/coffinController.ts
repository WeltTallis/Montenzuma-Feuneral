

import { centralizedUploadService } from '@montezuma/shared-services/dist/centralizedUploadService';
import { serviceGet, serviceSet, serviceDel, clearServiceCache } from '@montezuma/shared-services';
import { publishTask } from '@montezuma/shared-services';
import CoffinModel from '../models/coffinModel.js';
import logger from '@montezuma/shared-logger';
import { Request, Response } from 'express';
import { coffinQuery } from '../db.js';
import axios from 'axios';


const SERVICE_NAME = 'coffin-service';
const CACHE_TTL = 300; // 5 minutes

// ─── Notification Emission via Socket.IO service 
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

// ─── Image Processing via RabbitMQ ──────────────────────────────────────

async function processImagesAsync(files: any[], coffinId: string, tenantSlug: string) {
  const imageBuffers = files.map(f => ({
    buffer: f.buffer.toString('base64'),
    originalname: f.originalname,
    size: f.size,
    mimetype: f.mimetype
  }));

  const result = await publishTask(tenantSlug, 'coffin.image.process', {
    coffinId,
    images: imageBuffers,
    tenantSlug
  }, 'normal');

  if (result.queued) {
    logger.info({ msg: 'Coffin images queued for async processing', tenantSlug, coffinId, taskId: result.taskId });
    return { queued: true, taskId: result.taskId };
  }

  // Fallback: process inline using global uploader
  logger.warn({ msg: 'RabbitMQ unavailable - processing images inline', tenantSlug });
  return processImagesInline(files, coffinId, tenantSlug);
}

async function processImagesInline(files: any[], coffinId: string, tenantSlug: string) {
  const imageUrls: string[] = [];
  for (let i = 0; i < Math.min(files.length, 10); i++) {
    const file = files[i];
    if (file.size > 10 * 1024 * 1024) {
      logger.warn({ msg: 'Skipping oversized image', filename: file.originalname, size: file.size });
      continue;
    }
    try {
      const uploadResult = await centralizedUploadService.uploadImage(
        file.buffer,
        file.originalname,
        tenantSlug,
        'coffins',
        `coffin-${coffinId}`
      );
      if (uploadResult.success) {
        imageUrls.push(uploadResult.urlPath);
      } else {
        logger.error({ msg: 'Image upload failed', filename: file.originalname, error: uploadResult.error });
      }
    } catch (err: any) {
      logger.error({ msg: 'Image processing error', filename: file.originalname, error: err.message });
    }
  }
  return { queued: false, imageUrls };
}

// ─── CONTROLLER FUNCTIONS ──────────────────────────────────────────────

/**
 * POST /coffins - Create a new coffin
 * Required: name, color, size, quantity, price
 */
export const createCoffin = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const {
      type, name, exact_price, price,
      quantity, color, size
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
    const modelPrice = parseFloat(exact_price ?? price) || 0;
    const modelQty = parseInt(quantity) || 0;

    if (!modelType) {
      return res.status(400).json({ success: false, message: 'Missing required field: Model (name) is required' });
    }
    if (!modelPrice || modelPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Missing required field: Price must be greater than 0' });
    }

    const existing: any[] = await coffinQuery(
      'SELECT coffin_id FROM coffins WHERE type = ? AND color = ? AND size = ? AND tenant_slug = ? AND is_deleted = FALSE',
      [modelType, (color || '').trim(), (size || '').trim(), tenantSlug]
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
      color,
      size,
      tenant_id: tenantIdVal,
      branch_id: branchIdVal
    });

    let imageResult: any = { queued: false, imageUrls: [] };
    if ((req as any).files && (req as any).files.length > 0) {
      imageResult = await processImagesAsync((req as any).files, result.coffin_id, tenantSlug);
      if (!imageResult.queued && imageResult.imageUrls.length > 0) {
        await CoffinModel.addImages(tenantSlug, result.coffin_id, imageResult.imageUrls);
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

    // ─── CACHE — read on EVERY path ────────────────────────────────────────
    // The frontend ALWAYS sends x-branch-id / x-branch-slug for multi-branch
    // tenants, and both branch-specific paths below used to `return` BEFORE
    // reaching the cache lookup at the bottom of this function. The result:
    // `service:coffin-service:*` keys were never written, so the Inventory
    // page never produced a cache hit — the Redis "hit rate" only ever showed
    // BullMQ/notification traffic. One entry per tenant + branch (the tenant is
    // already part of the Redis key namespace) and create/update/delete wipe
    // the whole namespace through clearCoffinCache(), so this stays correct.
    const cacheKey = effectiveBranchId ? `branchCoffins_${effectiveBranchId}` : 'allCoffins';

    const noStore = () => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    };

    const cachedCoffins: any = await getCached(tenantSlug, cacheKey);
    if (cachedCoffins) {
      logger.info({ msg: 'Coffins served from Redis', tenantSlug, cacheKey, count: cachedCoffins.length });
      if (effectiveBranchSlug || effectiveBranchId) noStore();
      return res.status(200).json({ success: true, data: cachedCoffins, count: cachedCoffins.length });
    }

    if (effectiveBranchSlug) {
      noStore();

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
        SELECT c.coffin_id, c.tenant_id, c.branch_id, c.type, c.exact_price, c.quantity, c.color, c.size, c.created_at,
          GROUP_CONCAT(ci.image_url) as image_urls
        FROM coffins c
        LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
        WHERE ${tenantClause} AND c.is_deleted = FALSE ${branchClause}
        GROUP BY c.coffin_id
        ORDER BY c.created_at DESC
      `;

      const rows: any[] = await coffinQuery(sql, params);

      const coffins = rows.map(row => CoffinModel.mapRow(row));

      await setCached(tenantSlug, cacheKey, coffins);

      return res.status(200).json({ success: true, data: coffins, count: coffins.length });
    }

    if (effectiveBranchId) {
      const sql = `
        SELECT c.coffin_id, c.tenant_id, c.branch_id, c.type, c.exact_price, c.quantity, c.color, c.size, c.created_at,
          GROUP_CONCAT(ci.image_url) as image_urls
        FROM coffins c
        LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
        WHERE ${tenantClause} AND (c.branch_id = ? OR c.branch_id IS NULL) AND c.is_deleted = FALSE
        GROUP BY c.coffin_id
        ORDER BY c.created_at DESC
      `;

      const rows: any[] = await coffinQuery(sql, [...tenantParams, String(effectiveBranchId)]);

      const coffins = rows.map(row => CoffinModel.mapRow(row));

      await setCached(tenantSlug, cacheKey, coffins);

      return res.status(200).json({ success: true, data: coffins, count: coffins.length });
    }

    // No branch context at all (single-branch tenants + the dashboard):
    // whole tenant inventory, already mapped (name, price, stock, ...).
    // Branch-aware requests were served above — with the cache — so this is
    // the only path that still needs a DB round trip here.
    const coffins: any[] = await CoffinModel.getAll(tenantSlug, tenantParam);

    await setCached(tenantSlug, cacheKey, coffins);

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

    // ── REDIS CACHE ─────────────────────────────────────────────────────
    // The inventory page hits THIS endpoint on every load (the /coffins
    // fallbacks are already cached — this one was not). The namespace must be
    // the same tenant slug clearCoffinCache() wipes on every coffin/order write,
    // so create/update/delete invalidate this key automatically. The key carries
    // parent_slug + tenant id because the SQL below filters on both.
    const cacheTenantSlug = (req as any).tenantSlug || String(parentSlug);
    const cacheKey = `allBranches:${parentSlug}:${tenantParam || 'none'}`;
    const cachedPayload: any = await getCached(cacheTenantSlug, cacheKey);
    if (cachedPayload) {
      logger.info({ msg: 'All-branch coffins served from Redis', tenantSlug: cacheTenantSlug, cacheKey, count: cachedPayload.count });
      return res.status(200).json(cachedPayload);
    }

    const rows: any[] = await coffinQuery(`
      SELECT c.coffin_id, c.tenant_id, c.branch_id, c.type, c.exact_price, c.quantity, c.color, c.size, c.created_at,
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

    const payload = {
      success: true,
      data: allCoffins,
      count: allCoffins.length,
      branches: 1
    };
    await setCached(cacheTenantSlug, cacheKey, payload);

    return res.status(200).json(payload);
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

  try {
    const {
      type, name, material, exact_price, price,
      quantity, supplier, origin, color, size, category, currency
    } = (req as any).body;

    // Same tenant/branch context the create + read paths use, so the UPDATE
    // resolves the same row the inventory list showed.
    const headerOf = (name: string): string | null => {
      const v = (req.headers as any)[name];
      return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
    };
    const tenantIdVal = (() => {
      const v = headerOf('x-tenant-id') || (req as any).tenantId || (req as any).body?.tenant_id || null;
      return (v != null && String(v).trim() !== '') ? String(v).trim() : null;
    })();

    const affectedRows = await CoffinModel.update(tenantSlug, id, {
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
    }, tenantIdVal);

    // 0 rows means the id did not resolve to a coffin this tenant can write.
    // Previously this fell through to a 200 "updated successfully", so the UI
    // showed "Added N units" and then re-read the SAME unchanged quantity —
    // which is exactly the "says out of stock after adding" symptom.
    if (affectedRows === 0) {
      logger.warn({ msg: 'Coffin update matched no row', tenantSlug, id, tenantId: tenantIdVal });
      return res.status(404).json({
        success: false,
        message: 'Coffin not found for this branch — the quantity was not changed. Refresh the inventory and try again.'
      });
    }

    // Handle new images
    if ((req as any).files && (req as any).files.length > 0) {
      const coffin = await CoffinModel.getById(tenantSlug, id);
      if (coffin) {
        const imageResult: any = await processImagesAsync((req as any).files, coffin.coffin_id, tenantSlug);
        if (!imageResult.queued && imageResult.imageUrls.length > 0) {
          await CoffinModel.addImages(tenantSlug, coffin.coffin_id, imageResult.imageUrls);
        }
      }
    }

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin updated', tenantSlug, id, affectedRows });

    return res.status(200).json({ success: true, message: 'Coffin updated successfully', quantity: quantity !== undefined ? parseInt(quantity) : undefined });
  } catch (error: any) {
    logger.error({ msg: 'Update coffin error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
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
    // Accept both the legacy field set and the inventory booking field set.
    // The inventory UI sends: { coffin_id, client_name, client_phone, deceased_name, service_date, notes, paid }
    // The legacy clients send: { coffin_name, color, size, quantity, booked_by, booked_for }.
    // color/size/booked_by/booked_for/deceased are all OPTIONAL — details are auto-filled
    // from the selected coffin so users don't have to re-enter them.
    const {
      coffin_id, coffin_name, color, size, quantity,
      booked_by, booked_for, client_name, deceased_name,
      service_date
    } = (req as any).body;

    // Tenant/branch context — prefer the auth headers the frontend sends
    // (x-tenant-id / x-branch-id), then req.tenant, then request body.
    const headerOf = (name: string): string | null => {
      const v = (req.headers as any)[name];
      return Array.isArray(v) ? (v[0] as string) : (v ? String(v) : null);
    };
    const rTenantId = headerOf('x-tenant-id') || (req as any).tenant?.id || (req as any).tenant?.tenant_id || (req as any).tenantId || (req as any).body?.tenant_id || (req as any).body?.tenantId || null;
    const rBranchId = headerOf('x-branch-id') || (req as any).branchId || (req as any).body?.branch_id || (req as any).body?.branchId || null;

    const parsedQuantity = parseInt(quantity);
    if (quantity !== undefined && quantity !== '' && quantity !== null && (isNaN(parsedQuantity) || parsedQuantity <= 0)) {
      return res.status(400).json({ success: false, message: 'Invalid quantity' });
    }
    const finalQuantity = isNaN(parsedQuantity) || parsedQuantity <= 0 ? 1 : parsedQuantity;

    const coffinIdRaw = (coffin_id || '').toString().trim();
    const coffinNameRaw = (coffin_name || '').toString().trim();

    // A coffin must be identifiable by id OR name. Everything else is optional.
    if (!coffinIdRaw && !coffinNameRaw) {
      return res.status(400).json({
        success: false,
        message: 'Please select a coffin to book (coffin_id or coffin_name is required)'
      });
    }

    // Resolve the coffin: by id when available (its details auto-fill name/color/size),
    // otherwise by name with optional color/size filters.
    let coffin: any = null;
    if (coffinIdRaw) {
      const rows: any[] = await coffinQuery(
        'SELECT coffin_id, type, color, size, quantity FROM coffins WHERE coffin_id = ? AND tenant_slug = ? AND is_deleted = FALSE',
        [coffinIdRaw, tenantSlug]
      );
      if (rows.length > 0) coffin = rows[0];
    } else {
      let sql = 'SELECT coffin_id, type, color, size, quantity FROM coffins WHERE type = ?';
      const params: any[] = [coffinNameRaw];
      const colorTrim = (color || '').toString().trim();
      const sizeTrim = (size || '').toString().trim();
      if (colorTrim) { sql += ' AND color = ?'; params.push(colorTrim); }
      if (sizeTrim) { sql += ' AND size = ?'; params.push(sizeTrim); }
      sql += ' AND tenant_slug = ? AND is_deleted = FALSE';
      params.push(tenantSlug);
      const rows: any[] = await coffinQuery(sql, params);
      if (rows.length > 0) coffin = rows[0];
    }

    if (!coffin) {
      return res.status(404).json({
        success: false,
        message: 'Coffin not found. Please select a valid coffin from the list.'
      });
    }

    if (parseInt(coffin.quantity) < finalQuantity) {
      return res.status(409).json({
        success: false,
        message: `Insufficient stock. Available: ${coffin.quantity}, Requested: ${finalQuantity}`
      });
    }

    // Auto-fill details from the selected coffin; let an explicit value override it.
    const finalName = coffinNameRaw || coffin.type || 'Coffin';
    const finalColor = (color || '').toString().trim() || coffin.color || null;
    const finalSize = (size || '').toString().trim() || coffin.size || null;
    const finalBookedBy = (booked_by || '').toString().trim() || (client_name || '').toString().trim() || null;
    const finalBookedFor = (booked_for || '').toString().trim() || (deceased_name || '').toString().trim() || null;

    // Avoid double-booking the same coffin for the same person when booked_for is given.
    if (finalBookedFor) {
      const existingOrder: any[] = await coffinQuery(
        `SELECT order_id FROM coffin_bookings
         WHERE coffin_id = ? AND tenant_slug = ?
         AND status = 'active' AND booked_for = ?`,
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
      coffin_id: coffin.coffin_id,
      coffin_name: finalName,
      color: finalColor,
      size: finalSize,
      quantity: finalQuantity,
      booked_by: finalBookedBy,
      booked_for: finalBookedFor,
      client_phone: ((req as any).body?.client_phone || '').toString().trim() || null,
      service_time: ((req as any).body?.service_time || '').toString().trim() || null,
      paid: !!((req as any).body?.paid),
      // Reservation note typed in the "New Reservation" sidebar — must be
      // persisted or the detail sidebar has nothing to show after refresh.
      notes: ((req as any).body?.notes || '').toString().trim() || null,
      service_date: service_date || null,
      tenant_id: rTenantId,
      branch_id: rBranchId
    });

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin order created', tenantSlug, orderId: result.order_id, booked_for: finalBookedFor });

    // Notify the tenant (incl. any branch rooms) that a new coffin reservation was created.
    await emitSocketNotification('coffin-booking-created', {
      id: result.order_id || `booking-${Date.now()}`,
      title: 'New Coffin Reservation',
      message: `${finalBookedBy || 'Client'} reserved ${finalName} (qty ${finalQuantity})`,
      fullContent: `Coffin: ${finalName}\nClient: ${finalBookedBy || 'N/A'}\nDeceased: ${finalBookedFor || 'N/A'}\nQuantity: ${finalQuantity}\nBooking ID: ${result.order_id}`,
      orderId: result.order_id,
      coffinName: finalName,
      clientName: finalBookedBy,
      quantity: finalQuantity,
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
        status: 'active'
      }
    });

  } catch (error: any) {
    logger.error({ msg: 'Create order error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
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

  // ── Month scoping ──────────────────────────────────────────────────────
  // The reservations dashboard now fetches ONE month at a time instead of the
  // whole booking history. `from`/`to` are inclusive ISO dates (YYYY-MM-DD);
  // without them the endpoint still returns everything, so any other caller
  // keeps working unchanged.
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  const rawFrom = String(req.query.from ?? '').trim();
  const rawTo = String(req.query.to ?? '').trim();
  let fromDate = ISO_DATE.test(rawFrom) ? rawFrom : null;
  let toDate = ISO_DATE.test(rawTo) ? rawTo : null;
  // A reversed range (from > to) would silently match nothing; flip it so the
  // caller still gets the month it asked for.
  if (fromDate && toDate && fromDate > toDate) {
    const swap = fromDate; fromDate = toDate; toDate = swap;
  }

  try {
    // ── REDIS CACHE ─────────────────────────────────────────────────────
    // The reservations dashboard polls this on every render; it was hitting
    // MySQL each time. The key carries the branch scope BECAUSE the SQL below
    // filters on it, and it must equally carry the date range — without the
    // range in the key, navigating from September to October would serve the
    // September rows straight out of Redis.
    // The namespace is the same tenant slug clearCoffinCache() wipes, so
    // createOrder/updateOrderStatus (and the stock-request paths that
    // synthesize transfer rows) invalidate this key.
    const rangeKey = fromDate && toDate ? `:${fromDate}_${toDate}` : '';
    const cacheKey = `orders:list:branch:${branchId || 'all'}${rangeKey}`;
    const cachedOrders: any = await getCached(tenantSlug, cacheKey);
    if (cachedOrders) {
      logger.info({ msg: 'Orders served from Redis', tenantSlug, cacheKey, count: cachedOrders.length });
      return res.status(200).json({ success: true, data: cachedOrders, count: cachedOrders.length });
    }

    const params: any[] = [tenantSlug];
    let branchClause = '';
    if (branchId) {
      branchClause = ' AND (cb.branch_id = ? OR cb.branch_id IS NULL)';
      params.push(String(branchId));
    }

    // Filter on the RAW service_date column, not the DATE_FORMAT() alias in the
    // SELECT list — comparing a formatted string is both slower and unreliable
    // across locales. COALESCE(service_date, DATE(created_at)) mirrors the
    // value the UI actually displays, so a booking with no explicit service
    // date still lands in the month its creation date falls in rather than
    // vanishing from the calendar.
    let dateClause = '';
    if (fromDate && toDate) {
      dateClause = ' AND DATE(COALESCE(cb.service_date, cb.created_at)) BETWEEN ? AND ?';
      params.push(fromDate, toDate);
    }

    const sql = `
      SELECT order_id, order_id AS id, coffin_id, coffin_name, color, size, quantity,
             booked_by, booked_for,
             booked_by AS client_name, booked_for AS deceased_name,
             client_phone,
             branch_id,
             status,
             paid,
             DATE_FORMAT(COALESCE(service_date, DATE(created_at)), '%Y-%m-%d') AS service_date,
             service_time,
             notes,
             created_at
      FROM coffin_bookings cb
      WHERE cb.tenant_slug = ?${branchClause}${dateClause}
      ORDER BY cb.created_at DESC
    `;

    const orders: any[] = await coffinQuery(sql, params);

    // ── Inter-branch transfer requests → pending reservations ──────────────
    // When THIS branch requests a coffin from another branch (req_type =
    // 'client'), the request must show up in Reservations immediately — not
    // only after delivery. Synthesize pending reservation rows from the
    // branch's OUTGOING stock requests that are still pending/approved. Once
    // the transfer is delivered, the real coffin_bookings row (created by
    // createTransferOrder on the delivered action) replaces the synthesized
    // one: delivered/rejected requests drop out of this query, so a transfer
    // can never appear twice.
    try {
      const orgSlugForTransfers = await resolveOrgSlug(tenantSlug);
      const transferParams: any[] = [orgSlugForTransfers, orgSlugForTransfers];
      let transferBranchClause = '';
      if (branchId) {
        transferBranchClause = ' AND sr.to_branch_id = ?';
        transferParams.push(String(branchId));
      }
      // Synthesized transfer rows must obey the SAME month window as real
      // bookings, otherwise navigating to October would still surface a
      // September transfer as a phantom reservation.
      let transferDateClause = '';
      if (fromDate && toDate) {
        transferDateClause = ' AND DATE(COALESCE(sr.service_date, sr.created_at)) BETWEEN ? AND ?';
        transferParams.push(fromDate, toDate);
      }
      const transferRows: any[] = await coffinQuery(
        `SELECT sr.request_id, sr.coffin_id, sr.coffin_name, sr.color, sr.size, sr.quantity,
                sr.client_name, sr.client_phone, sr.deceased_name,
                DATE_FORMAT(COALESCE(sr.service_date, DATE(sr.created_at)), '%Y-%m-%d') AS service_date,
                sr.notes, sr.from_branch_name, sr.status, sr.created_at
         FROM stock_requests sr
         WHERE (sr.tenant_slug = ? OR sr.tenant_slug LIKE CONCAT(?, '-%'))
           AND sr.req_type = 'client'
           AND sr.status IN ('pending', 'approved')${transferBranchClause}${transferDateClause}
         ORDER BY sr.created_at DESC`,
        transferParams
      );

      // Dedupe against real bookings that already exist for the same transfer
      // (e.g. the inter-branch reservation flow creates BOTH a booking and a
      // stock request): same coffin + client + service date = same order.
      const existingKeys = new Set(
        orders.map((o) =>
          `${String(o.coffin_id ?? '')}|${String(o.client_name ?? o.booked_by ?? '').toLowerCase().trim()}|${String(o.service_date ?? '')}`,
        ),
      );

      for (const t of transferRows) {
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

    await setCached(tenantSlug, cacheKey, orders);

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
             DATE_FORMAT(COALESCE(service_date, DATE(created_at)), '%Y-%m-%d') AS service_date,
             service_time,
             notes,
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
  const { status, paid } = (req as any).body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (status === undefined && paid === undefined) {
    return res.status(400).json({ success: false, message: 'No update provided (status or paid required)' });
  }

  if (status !== undefined && !['active', 'booked', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be: active, booked, completed, or cancelled' });
  }

  const updates: string[] = [];
  const values: any[] = [];

  try {
    // If cancelling, return stock to inventory
    if (status === 'cancelled') {
      const order: any[] = await coffinQuery(
        'SELECT coffin_name, color, size, quantity FROM coffin_bookings WHERE order_id = ? AND tenant_slug = ?',
        [id, tenantSlug]
      );

      if (order.length > 0) {
        await coffinQuery(
          'UPDATE coffins SET quantity = quantity + ? WHERE type = ? AND color = ? AND size = ? AND tenant_slug = ?',
          [order[0].quantity, order[0].coffin_name, order[0].color, order[0].size, tenantSlug]
        );
      }
    }

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (paid !== undefined) {
      updates.push('paid = ?');
      values.push(paid ? 1 : 0);
    }

    updates.push('updated_at = NOW()');

    const sql = `UPDATE coffin_bookings SET ${updates.join(', ')} WHERE order_id = ? AND tenant_slug = ?`;
    values.push(id, tenantSlug);
    await coffinQuery(sql, values);

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Order status updated', tenantSlug, orderId: id, status, paid });
    return res.status(200).json({ success: true, message: 'Order updated successfully' });
  } catch (error: any) {
    logger.error({ msg: 'Update order status error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
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
      from_branch_id: fromId,
      to_branch_id: toId,
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

    // getAllOrders() synthesizes pending transfer reservations FROM
    // stock_requests, so a new request must drop the cached orders list.
    await clearCoffinCache(tenantSlug);

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

    // Pending transfer reservations in getAllOrders() are derived from
    // stock_requests — a status change must drop the cached orders list.
    await clearCoffinCache(tenantSlug);

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
      `SELECT request_id, coffin_name, quantity, requested_by, requesting_branch,
              from_branch_id, to_branch_id, from_branch_name, to_branch_name, status
       FROM stock_requests WHERE request_id = ? AND (tenant_slug = ? OR tenant_slug LIKE CONCAT(?, '-%'))`,
      [id, orgSlug, orgSlug]
    );

    const sql = `UPDATE stock_requests SET status = ? WHERE request_id = ? AND (tenant_slug = ? OR tenant_slug LIKE CONCAT(?, '-%'))`;
    await coffinQuery(sql, [status, id, orgSlug, orgSlug]);

    // Pending transfer reservations in getAllOrders() are derived from
    // stock_requests — an action (approve/reject/delivered) must drop the
    // cached orders list so the synthesized rows refresh immediately.
    await clearCoffinCache(tenantSlug);

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

/**
 * GET /coffins/health/redis — is the Redis cache reachable from THIS container?
 *
 * Inventory reads are cached under `service:coffin-service:tenant:<slug>:*`
 * (see getAllCoffins). When the shared client cannot connect, serviceGet()
 * returns null and the endpoint silently serves from MySQL on every request,
 * which looks exactly like "Redis is not working". This reports the live state.
 */
export const redisHealthCheck = async (req: Request, res: Response) => {
  try {
    const { redisHealth } = require('@montezuma/shared-services');
    const redis = await redisHealth();
    return res.status(redis.status === 'UP' ? 200 : 503).json({
      service: SERVICE_NAME,
      redis
    });
  } catch (error: any) {
    return res.status(500).json({
      service: SERVICE_NAME,
      redis: { status: 'ERROR', error: error?.message || String(error) }
    });
  }
};
