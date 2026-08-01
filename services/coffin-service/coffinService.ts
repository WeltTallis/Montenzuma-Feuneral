import { Request, Response, NextFunction } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { lookupTenantDatabase, safeTenantQuery, getTenantDB } from '../../shared/dbConfig';
import logger from '@montezuma/shared-logger';
import { getKenyaTimeISO } from '@montezuma/shared-utils';
import { ICoffin, ICoffinImage, IDeceasedCoffin, ICreateCoffinDTO, IAssignCoffinDTO, ICoffinAnalytics } from '../models/Coffin';

// Extend Request with tenant and user
interface TenantRequest extends Request {
  tenantSlug?: string;
  tenant?: { id: string; slug: string; name: string };
  user?: { userId: string; email: string; role: string; name: string };
  files?: Express.Multer.File[];
}

// Image configuration
const IMAGE_CONFIG = {
  TARGET_WIDTH: 1920,
  TARGET_HEIGHT: 1080,
  QUALITY: 90,
  FORMAT: 'webp' as const,
  MAX_FILE_SIZE: 10 * 1024 * 1024,
};

// Exchange rates
const EXCHANGE_RATES = { USD: 150, KES: 1 };

// Helper functions
const generateRFID = (name: string): string => {
  const hash = crypto.createHash('md5').update(`${name}-${Date.now()}`).digest('hex').substring(0, 8);
  return `RFID-${hash.toUpperCase()}`;
};

const generateCoffinId = (tenantSlug: string): string => {
  const tenantPrefix = tenantSlug.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${tenantPrefix}-COF-${timestamp}-${random}`;
};

const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info(`Created directory: ${dirPath}`);
  }
};

const getTenantUploadPath = (tenantSlug: string): string => {
  return path.join('public', 'uploads', 'tenants', tenantSlug, 'coffins');
};

const processImage = async (
  inputBuffer: Buffer,
  outputPath: string,
  index: number,
  originalName: string
): Promise<string> => {
  const metadata = await sharp(inputBuffer).metadata();
  logger.debug(`Processing image ${index + 1}: ${originalName} (${metadata.width}x${metadata.height})`);

  await sharp(inputBuffer)
    .resize(IMAGE_CONFIG.TARGET_WIDTH, IMAGE_CONFIG.TARGET_HEIGHT, { fit: 'cover', position: 'center' })
    .webp({ quality: IMAGE_CONFIG.QUALITY, effort: 6 })
    .toFile(outputPath);

  return outputPath.replace('public/', '');
};

const processImages = async (files: Express.Multer.File[], coffinId: number, tenantSlug: string): Promise<string[]> => {
  const uploadDir = getTenantUploadPath(tenantSlug);
  await ensureDirectoryExists(uploadDir);

  const processedImages: string[] = [];
  for (let i = 0; i < Math.min(files.length, 10); i++) {
    const file = files[i];
    if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
      logger.warn(`Skipping ${file.originalname}: file too large`);
      continue;
    }

    const timestamp = Date.now();
    const imageName = `coffin-${coffinId}-${timestamp}-${i}.${IMAGE_CONFIG.FORMAT}`;
    const outputPath = path.join(uploadDir, imageName);
    
    const webPath = await processImage(file.buffer, outputPath, i, file.originalname);
    processedImages.push(webPath);
  }
  return processedImages;
};

                

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

export const createCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  let connection: any = null;
  try {
    const {
      custom_id, type, material, exact_price, currency, quantity,
      supplier, origin, color, size, category, created_by
    } = req.body;

    // Validation
    if (!type || !material || !exact_price || !currency) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const price = parseFloat(exact_price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ success: false, message: 'Invalid price' });
    }

    const finalCoffinId = custom_id || generateCoffinId(tenantSlug);
    const priceUSD = currency === 'USD' ? price : price / EXCHANGE_RATES.USD;
    const priceKES = currency === 'KES' ? price : price * EXCHANGE_RATES.USD;

    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const insertSql = `
      INSERT INTO coffins (custom_id, tenant_id, type, material, exact_price, currency, 
        price_usd, exchange_rate, quantity, supplier, origin, color, size, category, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await safeTenantQuery(dbName, insertSql, [
      finalCoffinId, tenantSlug, type.trim(), material.trim(), priceKES, currency,
      priceUSD, EXCHANGE_RATES.USD, parseInt(quantity) || 1, supplier?.trim() || null,
      origin?.trim() || null, color?.trim() || null, size?.trim() || null,
      category || 'locally_made', created_by || req.user?.userId || null
    ]);

    const coffinDbId = (result as any).insertId;

    // Process images
    let imageUrls: string[] = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await processImages(req.files, coffinDbId, tenantSlug) as string[];
      
      if (imageUrls.length > 0) {
        const imageSql = `INSERT INTO coffin_images (coffin_id, tenant_id, image_url, created_at) VALUES ?`;
        const imageValues: [number, string, string, string][] = [];
        for (const url of imageUrls) {
          imageValues.push([coffinDbId, tenantSlug, url, getKenyaTimeISO()]);
        }
        await safeTenantQuery(dbName, imageSql, [imageValues]);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Coffin created successfully',
      coffin_id: finalCoffinId,
      database_id: coffinDbId,
      images: { count: imageUrls.length, urls: imageUrls },
      pricing: { price_kes: priceKES, price_usd: priceUSD, currency }
    });

  } catch (error: any) {
    logger.error('Create coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllCoffins = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const sql = `
      SELECT c.*, u.name as created_by_name,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_id = ci.tenant_id
      WHERE c.tenant_id = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
      ORDER BY c.created_at DESC
    `;
    
    const coffins = await safeTenantQuery(dbName, sql, [tenantSlug]);
    
    const processedCoffins = coffins.map((coffin: any) => ({
      ...coffin,
      images: coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [],
      display_price: coffin.currency === 'USD' 
        ? `$${coffin.price_usd} (Ksh ${coffin.exact_price})`
        : `Ksh ${coffin.exact_price} ($${coffin.price_usd})`
    }));

    return res.status(200).json({ success: true, data: processedCoffins, count: processedCoffins.length });
  } catch (error: any) {
    logger.error('Get all coffins error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoffinById = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const sql = `
      SELECT c.*, u.name as created_by_name,
        GROUP_CONCAT(ci.image_url) as image_urls
      FROM coffins c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_id = ci.tenant_id
      WHERE (c.coffin_id = ? OR c.custom_id = ?) AND c.tenant_id = ? AND c.is_deleted = FALSE
      GROUP BY c.coffin_id
    `;
    
    const coffins = await safeTenantQuery(dbName, sql, [id, id, tenantSlug]);
    
    if (coffins.length === 0) {
      return res.status(404).json({ success: false, message: 'Coffin not found' });
    }

    const coffin = coffins[0];
    coffin.images = coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [];

    return res.status(200).json({ success: true, data: coffin });
  } catch (error: any) {
    logger.error('Get coffin by ID error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const { type, material, exact_price, currency, quantity, supplier, origin, color, size, category } = req.body;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (type) { updateFields.push('type = ?'); updateValues.push(type.trim()); }
    if (material) { updateFields.push('material = ?'); updateValues.push(material.trim()); }
    if (exact_price !== undefined) {
      const price = parseFloat(exact_price);
      if (currency === 'USD') {
        updateFields.push('exact_price = ?, price_usd = ?');
        updateValues.push(price * EXCHANGE_RATES.USD, price);
      } else {
        updateFields.push('exact_price = ?, price_usd = ?');
        updateValues.push(price, price / EXCHANGE_RATES.USD);
      }
    }
    if (currency) { updateFields.push('currency = ?'); updateValues.push(currency); }
    if (quantity !== undefined) { updateFields.push('quantity = ?'); updateValues.push(parseInt(quantity)); }
    if (supplier !== undefined) { updateFields.push('supplier = ?'); updateValues.push(supplier?.trim() || null); }
    if (origin !== undefined) { updateFields.push('origin = ?'); updateValues.push(origin?.trim() || null); }
    if (color !== undefined) { updateFields.push('color = ?'); updateValues.push(color?.trim() || null); }
    if (size !== undefined) { updateFields.push('size = ?'); updateValues.push(size?.trim() || null); }
    if (category !== undefined) { updateFields.push('category = ?'); updateValues.push(category); }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id, tenantSlug);

    if (updateFields.length > 1) {
      const updateSql = `UPDATE coffins SET ${updateFields.join(', ')} WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ? AND is_deleted = FALSE`;
      await safeTenantQuery(dbName, updateSql, [...updateValues, id, tenantSlug]);
    }

    // Handle new images
    if (req.files && req.files.length > 0) {
      const imageUrls = await processImages(req.files, parseInt(id), tenantSlug) as string[];
      if (imageUrls.length > 0) {
        const imageSql = `INSERT INTO coffin_images (coffin_id, tenant_id, image_url, created_at) VALUES ?`;
        const imageValues: [number, string, string, string][] = [];
        for (const url of imageUrls) {
          imageValues.push([parseInt(id), tenantSlug, url, getKenyaTimeISO()]);
        }
        await safeTenantQuery(dbName, imageSql, [imageValues]);
      }
    }

    return res.status(200).json({ success: true, message: 'Coffin updated successfully' });
  } catch (error: any) {
    logger.error('Update coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    // Check if coffin has assignments
    const assignments = await safeTenantQuery(dbName,
      'SELECT id FROM deceased_coffin WHERE coffin_id = ? AND tenant_id = ?',
      [id, tenantSlug]
    );
    
    if (assignments.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete coffin with existing assignments' });
    }

    await safeTenantQuery(dbName,
      'UPDATE coffins SET is_deleted = TRUE WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [id, id, tenantSlug]
    );

    return res.status(200).json({ success: true, message: 'Coffin deleted successfully' });
  } catch (error: any) {
    logger.error('Delete coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignCoffin = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const { deceased_id, coffin_id, assigned_by, assigned_date, deceased_name } = req.body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    // Check coffin availability with tenant isolation
    const [coffins] = await safeTenantQuery(dbName,
      'SELECT quantity FROM coffins WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ? FOR UPDATE',
      [coffin_id, coffin_id, tenantSlug]
    );

    if (coffins.length === 0 || coffins[0].quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Coffin not available' });
    }

    const rfid = generateRFID(deceased_name);
    const finalAssignedDate = assigned_date || new Date().toISOString().split('T')[0];

    await safeTenantQuery(dbName,
      `INSERT INTO deceased_coffin (deceased_id, coffin_id, tenant_id, assigned_by_username, assigned_date, rfid)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [deceased_id, coffin_id, tenantSlug, assigned_by || req.user?.name || 'system', finalAssignedDate, rfid]
    );

    await safeTenantQuery(dbName,
      'UPDATE coffins SET quantity = quantity - 1 WHERE (coffin_id = ? OR custom_id = ?) AND tenant_id = ?',
      [coffin_id, coffin_id, tenantSlug]
    );

    return res.status(201).json({ success: true, message: 'Coffin assigned successfully', rfid });
  } catch (error: any) {
    logger.error('Assign coffin error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCoffinAnalytics = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const [overview] = await safeTenantQuery(dbName, `
      SELECT 
        COUNT(*) AS total_coffins,
        SUM(quantity) AS total_in_stock,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
        COUNT(DISTINCT type) as unique_types,
        SUM(exact_price * quantity) AS total_inventory_value
      FROM coffins
      WHERE tenant_id = ? AND is_deleted = FALSE
    `, [tenantSlug]);

    const [typeBreakdown] = await safeTenantQuery(dbName, `
      SELECT type, COUNT(*) as models, SUM(quantity) as stock, SUM(exact_price * quantity) as value
      FROM coffins WHERE tenant_id = ? AND is_deleted = FALSE GROUP BY type ORDER BY value DESC LIMIT 10
    `, [tenantSlug]);

    return res.status(200).json({
      success: true,
      data: { overview: overview[0], by_type: typeBreakdown, tenant: tenantSlug },
      generatedAt: getKenyaTimeISO()
    });
  } catch (error: any) {
    logger.error('Get coffin analytics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// INTER-BRANCH COFFIN INVENTORY REQUESTS
// ============================================
// These functions allow branches to request coffin inventory from
// other branches they have a connection with.
// For example, Branch Y can request coffins from Branch X if they
// have an active branch connection.

/**
 * GET /coffins/branch/:branchId/connected-inventory
 * Get coffin inventory from all branches connected to the specified branch.
 * This allows a branch to see what coffins are available at partner branches.
 */
export const getConnectedBranchInventory = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const branchId = parseInt(req.params.branchId);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (!branchId) {
    return res.status(400).json({ success: false, message: 'Valid branch ID required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    // Ensure branch_connections table exists
    await safeTenantQuery(dbName, `
      CREATE TABLE IF NOT EXISTS branch_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_slug VARCHAR(255) NOT NULL,
        branch_id INT NOT NULL,
        connected_branch_id INT NOT NULL,
        connection_type ENUM('referral','transfer','partnership','parent_child') DEFAULT 'partnership',
        status ENUM('active','inactive','pending') DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_slug (tenant_slug),
        INDEX idx_branch_id (branch_id),
        INDEX idx_connected_branch_id (connected_branch_id),
        UNIQUE KEY unique_branch_connection (tenant_slug, branch_id, connected_branch_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Get all branches connected to this branch
    const connections = await safeTenantQuery(dbName, `
      SELECT bc.connected_branch_id, b.branch_name, b.branch_slug, b.branch_db_name
      FROM branch_connections bc
      INNER JOIN branches b ON bc.connected_branch_id = b.branch_id
      WHERE bc.branch_id = ? AND bc.status = 'active' AND b.is_active = TRUE
    `, [branchId]);

    if (connections.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No connected branches found. Create branch connections first.'
      });
    }

    // Get coffin inventory from each connected branch
    const connectedInventory: any[] = [];
    for (const conn of connections) {
      try {
        const branchDbName = conn.branch_db_name;
        if (!branchDbName) continue;

        // Query coffins from the connected branch's database
        const branchCoffins = await safeTenantQuery(branchDbName, `
          SELECT c.coffin_id, c.custom_id, c.type, c.material, c.exact_price, 
                 c.currency, c.price_usd, c.quantity, c.supplier, c.origin, 
                 c.color, c.size, c.category,
                 GROUP_CONCAT(DISTINCT ci.image_url) as image_urls
          FROM coffins c
          LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_id = ci.tenant_id
          WHERE c.is_deleted = FALSE AND c.quantity > 0
          GROUP BY c.coffin_id
          ORDER BY c.created_at DESC
        `);

        if (branchCoffins.length > 0) {
          connectedInventory.push({
            branch_id: conn.connected_branch_id,
            branch_name: conn.branch_name,
            branch_slug: conn.branch_slug,
            branch_db_name: conn.branch_db_name,
            coffins: branchCoffins.map((coffin: any) => ({
              ...coffin,
              images: coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [],
              display_price: coffin.currency === 'USD'
                ? `$${coffin.price_usd} (Ksh ${coffin.exact_price})`
                : `Ksh ${coffin.exact_price} ($${coffin.price_usd})`
            }))
          });
        }
      } catch (err: any) {
        logger.warn(`Failed to get inventory from branch ${conn.branch_name}: ${err.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      data: connectedInventory,
      count: connectedInventory.length,
      message: `Found inventory from ${connectedInventory.length} connected branch(es)`
    });
  } catch (error: any) {
    logger.error('Get connected branch inventory error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /coffins/branch/request-transfer
 * Request a coffin transfer from one branch to another.
 * Body: { from_branch_id, to_branch_id, coffin_id, quantity, notes }
 */
export const requestCoffinTransfer = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const { from_branch_id, to_branch_id, coffin_id, quantity, notes } = req.body;

    if (!from_branch_id || !to_branch_id || !coffin_id) {
      return res.status(400).json({ success: false, message: 'from_branch_id, to_branch_id, and coffin_id are required' });
    }

    const transferQty = parseInt(quantity) || 1;

    // Ensure branch_connections table exists
    await safeTenantQuery(dbName, `
      CREATE TABLE IF NOT EXISTS branch_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_slug VARCHAR(255) NOT NULL,
        branch_id INT NOT NULL,
        connected_branch_id INT NOT NULL,
        connection_type ENUM('referral','transfer','partnership','parent_child') DEFAULT 'partnership',
        status ENUM('active','inactive','pending') DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_slug (tenant_slug),
        INDEX idx_branch_id (branch_id),
        INDEX idx_connected_branch_id (connected_branch_id),
        UNIQUE KEY unique_branch_connection (tenant_slug, branch_id, connected_branch_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Ensure coffin_transfer_requests table exists
    await safeTenantQuery(dbName, `
      CREATE TABLE IF NOT EXISTS coffin_transfer_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_slug VARCHAR(255) NOT NULL,
        from_branch_id INT NOT NULL,
        to_branch_id INT NOT NULL,
        coffin_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        status ENUM('pending','approved','rejected','completed','cancelled') DEFAULT 'pending',
        requested_by VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_slug (tenant_slug),
        INDEX idx_from_branch (from_branch_id),
        INDEX idx_to_branch (to_branch_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Verify branches can communicate
    const [connections] = await safeTenantQuery(dbName, `
      SELECT id FROM branch_connections 
      WHERE branch_id = ? AND connected_branch_id = ? AND status = 'active'
      LIMIT 1
    `, [to_branch_id, from_branch_id]);

    if (!connections || (connections as any[]).length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Branches are not connected. Create a branch connection first.'
      });
    }

    // Create the transfer request
    const result = await safeTenantQuery(dbName, `
      INSERT INTO coffin_transfer_requests 
        (tenant_slug, from_branch_id, to_branch_id, coffin_id, quantity, status, requested_by, notes)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [tenantSlug, from_branch_id, to_branch_id, coffin_id, transferQty, req.user?.name || 'system', notes || null]);

    const transferId = (result as any).insertId;

    return res.status(201).json({
      success: true,
      data: {
        transfer_id: transferId,
        from_branch_id,
        to_branch_id,
        coffin_id,
        quantity: transferQty,
        status: 'pending',
        message: 'Coffin transfer request created. Waiting for approval from the source branch.'
      }
    });
  } catch (error: any) {
    logger.error('Request coffin transfer error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/branch/transfer-requests
 * Get all coffin transfer requests for a tenant.
 */
export const getTransferRequests = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const branchId = req.query.branch_id as string;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    // Ensure coffin_transfer_requests table exists
    await safeTenantQuery(dbName, `
      CREATE TABLE IF NOT EXISTS coffin_transfer_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_slug VARCHAR(255) NOT NULL,
        from_branch_id INT NOT NULL,
        to_branch_id INT NOT NULL,
        coffin_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        status ENUM('pending','approved','rejected','completed','cancelled') DEFAULT 'pending',
        requested_by VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_slug (tenant_slug),
        INDEX idx_from_branch (from_branch_id),
        INDEX idx_to_branch (to_branch_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    let sql = `
      SELECT ctr.*, 
             b1.branch_name as from_branch_name,
             b2.branch_name as to_branch_name,
             c.type as coffin_type, c.material as coffin_material, c.custom_id as coffin_custom_id
      FROM coffin_transfer_requests ctr
      LEFT JOIN branches b1 ON ctr.from_branch_id = b1.branch_id
      LEFT JOIN branches b2 ON ctr.to_branch_id = b2.branch_id
      LEFT JOIN coffins c ON ctr.coffin_id = c.coffin_id
    `;
    const params: any[] = [];

    if (branchId) {
      sql += ` WHERE ctr.from_branch_id = ? OR ctr.to_branch_id = ?`;
      params.push(parseInt(branchId), parseInt(branchId));
    }

    sql += ` ORDER BY ctr.created_at DESC`;

    const requests = await safeTenantQuery(dbName, sql, params);

    return res.status(200).json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error: any) {
    logger.error('Get transfer requests error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /coffins/branch/transfer-requests/:id
 * Update a transfer request status (approve, reject, complete, cancel).
 */
export const updateTransferRequest = async (req: TenantRequest, res: Response): Promise<Response> => {
  const tenantSlug = req.tenantSlug;
  const transferId = parseInt(req.params.id);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ success: false, message: 'Tenant database not found' });
    }

    const { status, approved_by } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Valid status required: ${validStatuses.join(', ')}` });
    }

    // Get the transfer request
    const [transferRows] = await safeTenantQuery(dbName, `
      SELECT * FROM coffin_transfer_requests WHERE id = ? LIMIT 1
    `, [transferId]);

    if (!transferRows || (transferRows as any[]).length === 0) {
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }

    const transfer = (transferRows as any[])[0];

    // Update the status
    await safeTenantQuery(dbName, `
      UPDATE coffin_transfer_requests SET status = ?, updated_at = NOW() WHERE id = ?
    `, [status, transferId]);

    // If completing, transfer the coffin inventory
    if (status === 'completed') {
      const [fromBranchRows] = await safeTenantQuery(dbName, `
        SELECT branch_db_name FROM branches WHERE branch_id = ? LIMIT 1
      `, [transfer.from_branch_id]);

      const [toBranchRows] = await safeTenantQuery(dbName, `
        SELECT branch_db_name FROM branches WHERE branch_id = ? LIMIT 1
      `, [transfer.to_branch_id]);

      if (fromBranchRows && (fromBranchRows as any[]).length > 0 && toBranchRows && (toBranchRows as any[]).length > 0) {
        const fromDbName = (fromBranchRows as any[])[0].branch_db_name;
        const toDbName = (toBranchRows as any[])[0].branch_db_name;

        // Reduce quantity from source branch
        await safeTenantQuery(fromDbName, `
          UPDATE coffins SET quantity = GREATEST(0, quantity - ?) WHERE coffin_id = ?
        `, [transfer.quantity, transfer.coffin_id]);

        // Check if coffin exists in destination branch
        const [destCoffins] = await safeTenantQuery(toDbName, `
          SELECT coffin_id, quantity FROM coffins WHERE custom_id = (SELECT custom_id FROM coffins WHERE coffin_id = ? LIMIT 1) LIMIT 1
        `, [transfer.coffin_id]);

        if (destCoffins && (destCoffins as any[]).length > 0) {
          await safeTenantQuery(toDbName, `
            UPDATE coffins SET quantity = quantity + ? WHERE coffin_id = ?
          `, [transfer.quantity, (destCoffins as any[])[0].coffin_id]);
        } else {
          // Copy the coffin to destination branch
          const [sourceCoffinRows] = await safeTenantQuery(fromDbName, `
            SELECT * FROM coffins WHERE coffin_id = ? LIMIT 1
          `, [transfer.coffin_id]);

          if (sourceCoffinRows && (sourceCoffinRows as any[]).length > 0) {
            const sc = (sourceCoffinRows as any[])[0];
            await safeTenantQuery(toDbName, `
              INSERT INTO coffins (custom_id, tenant_id, type, material, exact_price, currency, 
                price_usd, exchange_rate, quantity, supplier, origin, color, size, category, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [sc.custom_id, tenantSlug, sc.type, sc.material, sc.exact_price, sc.currency,
                sc.price_usd, sc.exchange_rate, transfer.quantity, sc.supplier, sc.origin,
                sc.color, sc.size, sc.category]);
          }
        }

        logger.info(`Coffin transfer completed: ${transfer.quantity} coffin(s) from branch ${transfer.from_branch_id} to branch ${transfer.to_branch_id}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Transfer request ${status} successfully`,
      data: { transfer_id: transferId, status, approved_by: approved_by || req.user?.name }
    });
  } catch (error: any) {
    logger.error('Update transfer request error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const healthCheck = async (req: Request, res: Response): Promise<Response> => {
  return res.status(200).json({ status: 'UP', service: 'coffin-service', timestamp: getKenyaTimeISO() });
};
