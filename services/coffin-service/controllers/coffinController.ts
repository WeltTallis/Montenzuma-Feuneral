import { Request, Response } from 'express';
import CoffinModel from '../models/coffinModel.js';
import { resolveDatabase, lookupTenantDatabase, safeTenantQuery } from '../../../shared/dbConfig.js';
import { serviceGet, serviceSet, serviceDel, clearServiceCache } from '@montezuma/shared-services';
import { publishTask } from '@montezuma/shared-services';
import { centralizedUploadService } from '@montezuma/shared-services/dist/centralizedUploadService';
import logger from '@montezuma/shared-logger';

const SERVICE_NAME = 'coffin-service';
const CACHE_TTL = 300; // 5 minutes

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

    const modelType = (type || name || '').toString().trim();
    const modelPrice = parseFloat(exact_price ?? price) || 0;
    const modelQty = parseInt(quantity) || 0;

    if (!modelType) {
      return res.status(400).json({ success: false, message: 'Missing required field: Model (name) is required' });
    }
    if (!modelPrice || modelPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Missing required field: Price must be greater than 0' });
    }

    const dbName = await resolveDatabase(tenantSlug);
    if (dbName) {
      const existing: any[] = await safeTenantQuery(dbName,
        'SELECT coffin_id FROM coffins WHERE type = ? AND color = ? AND size = ? AND tenant_slug = ? AND is_deleted = FALSE',
        [modelType, (color || '').trim(), (size || '').trim(), tenantSlug]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Coffin with same name, color, and size already exists'
        });
      }
    }

    const result = await CoffinModel.create(tenantSlug, {
      type: modelType,
      exact_price: modelPrice,
      quantity: modelQty,
      color,
      size
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

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    if (branchSlug) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const tenantDbName = await lookupTenantDatabase(tenantSlug);
      if (!tenantDbName) {
        return res.status(200).json({ success: true, data: [], count: 0 });
      }

      const branchQuery = `SELECT branch_db_name FROM branches WHERE branch_slug = ? AND is_active = TRUE LIMIT 1`;
      const branchResult: any[] = await safeTenantQuery(tenantDbName, branchQuery, [branchSlug]);

      if (!branchResult || branchResult.length === 0) {
        return res.status(200).json({ success: true, data: [], count: 0 });
      }

      const branchDbName = branchResult[0].branch_db_name;

      const sql = `
        SELECT c.coffin_id, c.type, c.exact_price, c.quantity, c.color, c.size, c.created_at,
          GROUP_CONCAT(ci.image_url) as image_urls
        FROM coffins c
        LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
        WHERE c.tenant_slug = ? AND c.is_deleted = FALSE
        GROUP BY c.coffin_id
        ORDER BY c.created_at DESC
      `;

      const rows: any[] = await safeTenantQuery(branchDbName, sql, [branchSlug]);

      const coffins = rows.map(row => CoffinModel.mapRow(row));

      return res.status(200).json({ success: true, data: coffins, count: coffins.length });
    }

    if (branchId) {
      const branchDbName = await resolveDatabase(String(branchId));

      if (!branchDbName) {
        return res.status(200).json({ success: true, data: [], count: 0 });
      }

      const sql = `
        SELECT c.coffin_id, c.type, c.exact_price, c.quantity, c.color, c.size, c.created_at,
          GROUP_CONCAT(ci.image_url) as image_urls
        FROM coffins c
        LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
        WHERE c.tenant_slug = ? AND c.is_deleted = FALSE
        GROUP BY c.coffin_id
        ORDER BY c.created_at DESC
      `;

      const rows: any[] = await safeTenantQuery(branchDbName, sql, [tenantSlug]);

      const coffins = rows.map(row => CoffinModel.mapRow(row));

      return res.status(200).json({ success: true, data: coffins, count: coffins.length });
    }

    // Fetch all coffins (with caching)
    const cacheKey = 'allCoffins';
    let coffins: any = await getCached(tenantSlug, cacheKey);

    if (!coffins) {
      coffins = await CoffinModel.getAll(tenantSlug); // already mapped (name, price, stock, ...)
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
    const parentDbName = await lookupTenantDatabase(String(parentSlug));
    if (!parentDbName) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }

    const branches: any[] = await safeTenantQuery(parentDbName, `
      SELECT branch_id, branch_name, branch_slug, branch_db_name
      FROM branches
      ORDER BY branch_name
    `);

    const branchCoffinsPromises = branches.map(async (branch) => {
      try {
        const branchDbName = branch.branch_db_name;
        if (!branchDbName) return [];

        const sql = `
          SELECT c.coffin_id, c.type, c.exact_price, c.quantity, c.color, c.size, c.created_at,
            GROUP_CONCAT(ci.image_url) as image_urls
          FROM coffins c
          LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id
          WHERE c.tenant_slug = ? AND c.is_deleted = FALSE
          GROUP BY c.coffin_id
          ORDER BY c.created_at DESC
        `;

        const rows: any[] = await safeTenantQuery(branchDbName, sql, [branch.branch_slug]);

        return rows.map(row => ({
          ...CoffinModel.mapRow(row),
          branch_id: branch.branch_id,
          branch_name: branch.branch_name,
          branch_slug: branch.branch_slug
        }));
      } catch (err: any) {
        logger.warn({ msg: 'Error fetching coffins from branch', branch: branch.branch_name, error: err.message });
        return [];
      }
    });

    const allCoffinsArrays = await Promise.all(branchCoffinsPromises);
    const allCoffins = allCoffinsArrays.flat();

    return res.status(200).json({
      success: true,
      data: allCoffins,
      count: allCoffins.length,
      branches: branches.length
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
    const cacheKey = `coffin_${id}`;
    let coffin: any = await getCached(tenantSlug, cacheKey);

    if (!coffin) {
      coffin = await CoffinModel.getById(tenantSlug, id); // already mapped (name, price, stock, ...)
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

    await CoffinModel.update(tenantSlug, id, {
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
    });

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

    logger.info({ msg: 'Coffin updated', tenantSlug, id });

    return res.status(200).json({ success: true, message: 'Coffin updated successfully' });
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
      booked_by, booked_for, client_name, deceased_name
    } = (req as any).body;

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

    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    // Resolve the coffin: by id when available (its details auto-fill name/color/size),
    // otherwise by name with optional color/size filters.
    let coffin: any = null;
    if (coffinIdRaw) {
      const rows: any[] = await safeTenantQuery(dbName,
        'SELECT coffin_id, type, color, size, quantity FROM coffins WHERE coffin_id = ? AND tenant_slug = ? AND is_deleted = FALSE FOR UPDATE',
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
      sql += ' AND tenant_slug = ? AND is_deleted = FALSE FOR UPDATE';
      params.push(tenantSlug);
      const rows: any[] = await safeTenantQuery(dbName, sql, params);
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
      const existingOrder: any[] = await safeTenantQuery(dbName,
        `SELECT order_id FROM coffin_orders
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
      booked_for: finalBookedFor
    });

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin order created', tenantSlug, orderId: result.order_id, booked_for: finalBookedFor });

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

  try {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }

    const sql = `
      SELECT order_id, coffin_name, color, size, quantity, booked_by, booked_for, status, created_at
      FROM coffin_orders
      WHERE tenant_slug = ?
      ORDER BY created_at DESC
    `;

    const orders: any[] = await safeTenantQuery(dbName, sql, [tenantSlug]);

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
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const sql = `
      SELECT order_id, coffin_name, color, size, quantity, booked_by, booked_for, status, created_at, updated_at
      FROM coffin_orders
      WHERE order_id = ? AND tenant_slug = ?
    `;

    const orders: any[] = await safeTenantQuery(dbName, sql, [id, tenantSlug]);
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
  const { status } = (req as any).body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be: active, completed, or cancelled' });
  }

  try {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    // If cancelling, return stock to inventory
    if (status === 'cancelled') {
      const order: any[] = await safeTenantQuery(dbName,
        'SELECT coffin_name, color, size, quantity FROM coffin_orders WHERE order_id = ? AND tenant_slug = ?',
        [id, tenantSlug]
      );

      if (order.length > 0) {
        await safeTenantQuery(dbName,
          'UPDATE coffins SET quantity = quantity + ? WHERE type = ? AND color = ? AND size = ? AND tenant_slug = ?',
          [order[0].quantity, order[0].coffin_name, order[0].color, order[0].size, tenantSlug]
        );
      }
    }

    const sql = `UPDATE coffin_orders SET status = ?, updated_at = NOW() WHERE order_id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, sql, [status, id, tenantSlug]);

    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Order status updated', tenantSlug, orderId: id, status });

    return res.status(200).json({ success: true, message: `Order ${status} successfully` });
  } catch (error: any) {
    logger.error({ msg: 'Update order status error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── STOCK REQUESTS ──────────────────────────────────────────────────────

/**
 * POST /coffins/stock-requests - Request stock from another branch
 */
export const createStockRequest = async (req: Request, res: Response) => {
  const tenantSlug = (req as any).tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const { coffin_id, coffin_name, color, size, requested_by, booked_for, requesting_branch, client_name, deceased_name } = (req as any).body;

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
      const dbName = await resolveDatabase(tenantSlug);
      if (dbName) {
        const rows: any[] = await safeTenantQuery(dbName,
          'SELECT type, color, size FROM coffins WHERE coffin_id = ? AND tenant_slug = ? AND is_deleted = FALSE LIMIT 1',
          [coffinIdRaw, tenantSlug]
        );
        if (rows.length > 0) {
          resolvedName = resolvedName || rows[0].type || 'Coffin';
          resolvedColor = resolvedColor || rows[0].color || null;
          resolvedSize = resolvedSize || rows[0].size || null;
        }
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

    const result = await CoffinModel.requestStock(tenantSlug, {
      coffin_name: resolvedName || 'Coffin',
      color: resolvedColor,
      size: resolvedSize,
      requested_by: (requested_by || '').toString().trim() || (client_name || '').toString().trim() || null,
      booked_for: (booked_for || '').toString().trim() || (deceased_name || '').toString().trim() || null,
      requesting_branch: (requesting_branch || '').toString().trim() || null,
      image_url: imageUrl
    });

    logger.info({ msg: 'Stock request created', tenantSlug, requestId: result.request_id });

    return res.status(201).json({
      success: true,
      message: 'Stock request created successfully',
      data: {
        request_id: result.request_id,
        coffin_name: resolvedName,
        color: resolvedColor,
        size: resolvedSize,
        requested_by: (requested_by || '').toString().trim() || (client_name || '').toString().trim() || null,
        booked_for: (booked_for || '').toString().trim() || (deceased_name || '').toString().trim() || null,
        requesting_branch: (requesting_branch || '').toString().trim() || null,
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

  try {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }

    const sql = `
      SELECT request_id, coffin_name, color, size, requested_by, booked_for, requesting_branch, image_url, status, created_at
      FROM stock_requests
      WHERE tenant_slug = ?
      ORDER BY created_at DESC
    `;

    const requests: any[] = await safeTenantQuery(dbName, sql, [tenantSlug]);

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

  try {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const sql = `
      SELECT request_id, coffin_name, color, size, requested_by, booked_for, requesting_branch, image_url, status, created_at, updated_at
      FROM stock_requests
      WHERE request_id = ? AND tenant_slug = ?
    `;

    const requests: any[] = await safeTenantQuery(dbName, sql, [id, tenantSlug]);
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
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const sql = `UPDATE stock_requests SET status = ?, updated_at = NOW() WHERE request_id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, sql, [status, id, tenantSlug]);

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
export const healthCheck = async (req: Request, res: Response) => {
  return res.status(200).json({
    status: 'UP',
    service: 'coffin-service',
    timestamp: new Date().toISOString()
  });
};
