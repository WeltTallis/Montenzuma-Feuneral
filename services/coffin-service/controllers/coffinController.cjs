/**
 * Coffin Controller - Uses global Redis cache, global uploader, and RabbitMQ for async image processing
 */
const CoffinModel = require('../models/coffinModel.cjs');
const { resolveDatabase, safeTenantQuery } = require('../../../shared/dbConfig');
const { serviceGet, serviceSet, serviceDel, clearServiceCache } = require('../../../packages/shared-services/src/redisService');
const { publishTask } = require('../../../packages/shared-services/src/rabbitmqService');
const { centralizedUploadService } = require('../../../packages/shared-services/src/centralizedUploadService');
const logger = require('../../../packages/shared-logger/dist/index').default;

const SERVICE_NAME = 'coffin-service';
const CACHE_TTL = 300; // 5 minutes

// ─── Cache Helpers ──────────────────────────────────────────────────────

async function getCached(tenantSlug, key) {
  return serviceGet(SERVICE_NAME, tenantSlug, key);
}

async function setCached(tenantSlug, key, value, ttl = CACHE_TTL) {
  return serviceSet(SERVICE_NAME, tenantSlug, key, value, ttl);
}

async function clearCoffinCache(tenantSlug) {
  await clearServiceCache(SERVICE_NAME, tenantSlug);
}

// ─── Image Processing via RabbitMQ ──────────────────────────────────────

/**
 * Queue image processing to RabbitMQ for async processing with Sharp
 * Falls back to inline processing if RabbitMQ is unavailable
 */
async function processImagesAsync(files, coffinId, tenantSlug) {
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

/**
 * Inline fallback: upload images via global centralized uploader
 */
async function processImagesInline(files, coffinId, tenantSlug) {
  const imageUrls = [];
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
    } catch (err) {
      logger.error({ msg: 'Image processing error', filename: file.originalname, error: err.message });
    }
  }
  return { queued: false, imageUrls };
}

// ─── Controller Functions ───────────────────────────────────────────────

/**
 * POST /coffins - Create a new coffin
 */
exports.createCoffin = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const {
      custom_id, name, quantity, exact_price, size, color, created_by
    } = req.body;

    if (!name || !quantity || !exact_price) {
      logger.warn({ 
        msg: 'Missing required fields for coffin creation', 
        tenantSlug, 
        received: { name: !!name, quantity: !!quantity, exact_price: !!exact_price }
      });
      return res.status(400).json({ success: false, message: 'Missing required fields: name, quantity, and price are required' });
    }

    const price = parseFloat(exact_price);
    if (isNaN(price) || price < 0) {
      logger.warn({ msg: 'Invalid price for coffin creation', tenantSlug, exact_price });
      return res.status(400).json({ success: false, message: 'Invalid price' });
    }

    const finalCoffinId = custom_id || `COF-${Date.now().toString().slice(-6)}-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`;

    const result = await CoffinModel.create(tenantSlug, {
      custom_id: finalCoffinId, name, quantity, exact_price, size, color, created_by
    });

    // Process images asynchronously via RabbitMQ
    let imageResult = { queued: false, imageUrls: [] };
    if (req.files && req.files.length > 0) {
      imageResult = await processImagesAsync(req.files, result.insertId, tenantSlug);
      if (!imageResult.queued && imageResult.imageUrls.length > 0) {
        await CoffinModel.addImages(tenantSlug, result.insertId, imageResult.imageUrls);
      }
    }

    // Clear cache
    await clearCoffinCache(tenantSlug);

    // Emit notification event
    try {
      await publishTask(tenantSlug, 'notification.create', {
        type: 'coffin.created',
        title: 'New Coffin Added',
        message: `Coffin "${name}" has been added to inventory`,
        data: { coffin_id: finalCoffinId, name, price, stock: quantity },
        priority: 'normal'
      }, 'normal');
    } catch (notifError) {
      logger.warn({ msg: 'Failed to emit coffin creation notification', error: notifError.message });
    }

    logger.info({ msg: 'Coffin created', tenantSlug, coffinId: finalCoffinId, dbId: result.insertId });

    return res.status(201).json({
      success: true,
      message: 'Coffin created successfully',
      coffin_id: finalCoffinId,
      database_id: result.insertId,
      images: imageResult.queued ? { queued: true, taskId: imageResult.taskId } : { count: imageResult.imageUrls.length, urls: imageResult.imageUrls },
      price: price
    });

  } catch (error) {
    logger.error({ msg: 'Create coffin error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins - Get all coffins (cached)
 */
exports.getAllCoffins = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const branchId = req.query.branch_id;
  const branchSlug = req.query.branch_slug;
  
  console.log('[COFFINS] Fetching coffins for tenant:', tenantSlug, 'branch_id:', branchId, 'branch_slug:', branchSlug);
  
  if (!tenantSlug) {
    console.warn('[COFFINS] No tenant slug provided');
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    // If branch_slug is provided, fetch coffins for that specific branch
    if (branchSlug) {
      console.log('[COFFINS] Fetching coffins for specific branch slug:', branchSlug);
      
      // Disable caching for branch-specific queries
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Resolve the branch database name from the slug
      // First, get the tenant database
      const tenantDbName = await lookupTenantDatabase(tenantSlug);
      console.log('[COFFINS] Tenant database:', tenantDbName);
      
      if (!tenantDbName) {
        console.warn('[COFFINS] Tenant database not found for:', tenantSlug);
        return res.status(200).json({ success: true, data: [], count: 0 });
      }
      
      // Query the branches table to get the specific branch database name
      const branchQuery = `SELECT branch_db_name FROM branches WHERE branch_slug = ? AND is_active = TRUE LIMIT 1`;
      const branchResult = await safeTenantQuery(tenantDbName, branchQuery, [branchSlug]);
      console.log('[COFFINS] Branch lookup result:', branchResult);
      
      if (!branchResult || branchResult.length === 0) {
        console.warn('[COFFINS] Branch not found for slug:', branchSlug);
        return res.status(200).json({ success: true, data: [], count: 0 });
      }
      
      const branchDbName = branchResult[0].branch_db_name;
      console.log('[COFFINS] Resolved branch database:', branchDbName);
      
      // Query the branch-specific database
      // IMPORTANT: Use branchSlug as tenant_slug since that's what's stored in the branch database
      const sql = `
        SELECT c.*, c.created_by as created_by_name,
          GROUP_CONCAT(ci.image_url) as image_urls
        FROM coffins c
        LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_slug = ci.tenant_slug
        WHERE c.tenant_slug = ? AND c.is_deleted = FALSE
        GROUP BY c.coffin_id
        ORDER BY c.created_at DESC
      `;
      
      const rows = await safeTenantQuery(branchDbName, sql, [branchSlug]);
      console.log('[COFFINS] Database returned', rows.length, 'coffins for branch', branchSlug, 'from database', branchDbName);
      
      const coffins = rows.map(coffin => ({
        coffin_id: coffin.coffin_id,
        name: coffin.name || 'Unnamed Coffin',
        sku: coffin.sku || coffin.coffin_id,
        price: parseFloat(coffin.price || 0),
        stock: parseInt(coffin.stock || 0),
        branch_id: coffin.branch_id || 1,
        images: coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [],
        display_price: `Ksh ${parseFloat(coffin.price || 0).toLocaleString()}`,
        type: coffin.type || 'Traditional',
        color: coffin.color || '',
        size: coffin.size || '',
        category: coffin.category || 'standard',
        is_active: coffin.is_active !== undefined ? coffin.is_active : 1,
        tenant_slug: coffin.tenant_slug,
        created_at: coffin.created_at,
        updated_at: coffin.updated_at
      }));
      
      console.log('[COFFINS] Sending response for branch', branchSlug, ':', coffins.length, 'coffins from', branchDbName);
      return res.status(200).json({ success: true, data: coffins, count: coffins.length });
    }
    
    // Fallback to branch_id for backward compatibility
    if (branchId) {
      console.log('[COFFINS] Fetching coffins for specific branch ID:', branchId);
      
      // Get branch database name using lookupTenantDatabase
      // Note: This assumes branchId is actually a branch slug in the current architecture
      const { resolveDatabase } = require('../../../shared/dbConfig');
      const branchDbName = await resolveDatabase(branchId);
      console.log('[COFFINS] Branch database name:', branchDbName);
      
      if (!branchDbName) {
        console.warn('[COFFINS] Branch database not found for branch:', branchId);
        return res.status(200).json({ success: true, data: [], count: 0 });
      }
      
      // Query the branch-specific database
      const sql = `
        SELECT c.*, c.created_by as created_by_name,
          GROUP_CONCAT(ci.image_url) as image_urls
        FROM coffins c
        LEFT JOIN coffin_images ci ON c.coffin_id = ci.coffin_id AND c.tenant_slug = ci.tenant_slug
        WHERE c.tenant_slug = ? AND c.is_deleted = FALSE
        GROUP BY c.coffin_id
        ORDER BY c.created_at DESC
      `;
      
    const rows = await safeTenantQuery(branchDbName, sql, [tenantSlug]);
    console.log('[COFFINS] Database returned', rows.length, 'coffins for branch', branchId);
    
    const coffins = rows.map(coffin => ({
      coffin_id: coffin.coffin_id,
      name: coffin.name || 'Unnamed Coffin',
      sku: coffin.sku || coffin.coffin_id,
      price: parseFloat(coffin.price || 0),
      stock: parseInt(coffin.stock || 0),
      branch_id: coffin.branch_id || 1,
      images: coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [],
      display_price: `Ksh ${parseFloat(coffin.price || 0).toLocaleString()}`,
      type: coffin.type || 'Traditional',
      color: coffin.color || '',
      size: coffin.size || '',
      category: coffin.category || 'standard',
      is_active: coffin.is_active !== undefined ? coffin.is_active : 1,
      tenant_slug: coffin.tenant_slug,
      created_at: coffin.created_at,
      updated_at: coffin.updated_at
    }));
      
      console.log('[COFFINS] Sending response for branch', branchId, ':', coffins.length, 'coffins');
      return res.status(200).json({ success: true, data: coffins, count: coffins.length });
    }

    // Otherwise, fetch all coffins (with caching)
    const cacheKey = 'allCoffins';
    let coffins = await getCached(tenantSlug, cacheKey);
    console.log('[COFFINS] Cache hit:', !!coffins, 'Count:', coffins?.length || 0);

    if (!coffins) {
      console.log('[COFFINS] Cache miss, querying database...');
      const rows = await CoffinModel.getAll(tenantSlug);
      console.log('[COFFINS] Database returned', rows.length, 'coffins');
      // Map backend model fields to frontend-compatible field names
      coffins = rows.map(coffin => ({
        coffin_id: coffin.coffin_id,
        name: coffin.name || 'Unnamed Coffin',
        sku: coffin.sku || coffin.coffin_id,
        price: parseFloat(coffin.price || 0),
        stock: parseInt(coffin.stock || 0),
        branch_id: coffin.branch_id || 1,
        images: coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [],
        display_price: `Ksh ${parseFloat(coffin.price || 0).toLocaleString()}`,
        type: coffin.type || 'Traditional',
        color: coffin.color || '',
        size: coffin.size || '',
        category: coffin.category || 'standard',
        is_active: coffin.is_active !== undefined ? coffin.is_active : 1,
        tenant_slug: coffin.tenant_slug,
        created_at: coffin.created_at,
        updated_at: coffin.updated_at
      }));
      console.log('[COFFINS] Mapped', coffins.length, 'coffins, caching...');
      await setCached(tenantSlug, cacheKey, coffins);
    }

    console.log('[COFFINS] Sending response:', coffins.length, 'coffins');
    return res.status(200).json({ success: true, data: coffins, count: coffins.length });
  } catch (error) {
    console.error('[COFFINS] Error fetching coffins:', error);
    logger.error({ msg: 'Get all coffins error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/:id - Get coffin by ID (cached)
 */
exports.getCoffinById = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;
  
  console.log('[COFFIN] Fetching coffin by ID:', id, 'for tenant:', tenantSlug);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const cacheKey = `coffin_${id}`;
    let coffin = await getCached(tenantSlug, cacheKey);

    if (!coffin) {
      console.log('[COFFIN] Cache miss, querying database for ID:', id);
      coffin = await CoffinModel.getById(tenantSlug, id);
      if (!coffin) {
        console.warn('[COFFIN] NOT FOUND in database - ID:', id, 'tenant:', tenantSlug);
        return res.status(404).json({ success: false, message: 'Coffin not found' });
      }
      coffin.images = coffin.image_urls ? coffin.image_urls.split(',').slice(0, 10) : [];
      await setCached(tenantSlug, cacheKey, coffin);
      console.log('[COFFIN] Found and cached:', coffin.name);
    } else {
      console.log('[COFFIN] Cache hit:', coffin.name);
    }

    return res.status(200).json({ success: true, data: coffin });
  } catch (error) {
    console.error('[COFFIN] Error fetching coffin:', error);
    logger.error({ msg: 'Get coffin by ID error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /coffins/:id - Update coffin
 */
exports.updateCoffin = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const { name, exact_price, quantity, size, color } = req.body;

    await CoffinModel.update(tenantSlug, id, {
      name, exact_price, quantity, size, color
    });

    // Handle new images
    if (req.files && req.files.length > 0) {
      const coffin = await CoffinModel.getById(tenantSlug, id);
      if (coffin) {
        const imageResult = await processImagesAsync(req.files, coffin.coffin_id, tenantSlug);
        if (!imageResult.queued && imageResult.imageUrls.length > 0) {
          await CoffinModel.addImages(tenantSlug, coffin.coffin_id, imageResult.imageUrls);
        }
      }
    }

    // Clear cache
    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin updated', tenantSlug, id });

    return res.status(200).json({ success: true, message: 'Coffin updated successfully' });
  } catch (error) {
    logger.error({ msg: 'Update coffin error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /coffins/:id - Soft delete coffin
 */
exports.deleteCoffin = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    await CoffinModel.delete(tenantSlug, id);

    // Clear cache
    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin deleted', tenantSlug, id });

    return res.status(200).json({ success: true, message: 'Coffin deleted successfully' });
  } catch (error) {
    logger.error({ msg: 'Delete coffin error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /coffins/assign - Assign coffin to deceased
 */
exports.assignCoffin = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { deceased_id, coffin_id, assigned_by, assigned_date, deceased_name } = req.body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (!deceased_id || !coffin_id || !deceased_name) {
    logger.warn({ 
      msg: 'Missing required fields for coffin assignment', 
      tenantSlug, 
      received: { deceased_id: !!deceased_id, coffin_id: !!coffin_id, deceased_name: !!deceased_name }
    });
    return res.status(400).json({ success: false, message: 'Missing required fields: deceased_id, coffin_id, deceased_name' });
  }

  try {
    const rfid = await CoffinModel.assign(tenantSlug, {
      deceased_id, coffin_id, assigned_by, assigned_date, deceased_name
    });

    // Clear cache
    await clearCoffinCache(tenantSlug);

    logger.info({ msg: 'Coffin assigned', tenantSlug, deceasedId: deceased_id, coffinId: coffin_id, rfid });

    return res.status(201).json({
      success: true,
      message: 'Coffin assigned successfully',
      rfid
    });
  } catch (error) {
    logger.error({ msg: 'Assign coffin error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/analytics/dashboard - Get coffin analytics (cached)
 */
exports.getCoffinAnalytics = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const cacheKey = 'coffinAnalytics';
    let analytics = await getCached(tenantSlug, cacheKey);

    if (!analytics) {
      analytics = await CoffinModel.getAnalytics(tenantSlug);
      await setCached(tenantSlug, cacheKey, analytics);
    }

    return res.status(200).json({
      success: true,
      data: analytics,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ msg: 'Get coffin analytics error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/health - Health check
 */
exports.healthCheck = async (req, res) => {
  return res.status(200).json({
    status: 'UP',
    service: 'coffin-service',
    timestamp: new Date().toISOString()
  });
};

// ============================================================
// BOOKINGS
// ============================================================

/**
 * GET /coffins/bookings - Get all bookings
 */
exports.getAllBookings = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  console.log('[BOOKINGS] Fetching all bookings for tenant:', tenantSlug);
  
  if (!tenantSlug) {
    console.warn('[BOOKINGS] No tenant slug provided');
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await resolveDatabase(tenantSlug);
    console.log('[BOOKINGS] Resolved database:', dbName);
    
    if (!dbName) {
      console.error('[BOOKINGS] Tenant database not found for:', tenantSlug);
      return res.status(200).json({ success: true, data: [], count: 0 });
    }

    const sql = `
      SELECT b.*, c.name as coffin_name, c.price as coffin_price, c.coffin_id, c.custom_id
      FROM bookings b
      LEFT JOIN coffins c ON b.coffin_id = c.coffin_id AND b.tenant_slug = c.tenant_slug
      WHERE b.tenant_slug = ?
      ORDER BY b.created_at DESC
    `;

    console.log('[BOOKINGS] Executing query with tenantSlug:', tenantSlug);
    const bookings = await safeTenantQuery(dbName, sql, [tenantSlug]);
    console.log('[BOOKINGS] Query returned', bookings.length, 'bookings');
    console.log('[BOOKINGS] Sample booking:', bookings[0] ? { 
      id: bookings[0].id, 
      booking_id: bookings[0].booking_id,
      coffin_id: bookings[0].coffin_id, 
      custom_id: bookings[0].custom_id,
      coffin_name: bookings[0].coffin_name 
    } : 'none');
    
    const response = { success: true, data: bookings, count: bookings.length };
    console.log('[BOOKINGS] Sending response:', response);
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('[BOOKINGS] Error fetching bookings:', error);
    logger.error({ msg: 'Get all bookings error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/bookings/:id - Get booking by ID
 */
exports.getBookingById = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    const sql = `
      SELECT b.*, c.name as coffin_name, c.price as coffin_price
      FROM bookings b
      LEFT JOIN coffins c ON b.coffin_id = c.coffin_id AND b.tenant_slug = c.tenant_slug
      WHERE b.id = ? AND b.tenant_slug = ?
    `;

    const bookings = await safeTenantQuery(dbName, sql, [id, tenantSlug]);
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    return res.status(200).json({ success: true, data: bookings[0] });
  } catch (error) {
    logger.error({ msg: 'Get booking by ID error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /coffins/bookings - Create a new booking
 */
exports.createBooking = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const {
      client_name, client_phone, deceased_name, coffin_id, service_date, notes, paid, specifications
    } = req.body;

    if (!client_name || !deceased_name || !coffin_id || !service_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields: client_name, deceased_name, coffin_id, service_date' });
    }

    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    // Generate booking_id
    const bookingId = `BK-${Date.now().toString().slice(-6)}-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`;

    const sql = `
      INSERT INTO bookings (booking_id, tenant_slug, branch_id, client_name, client_phone, deceased_name, coffin_id, service_date, notes, paid, specifications, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    const result = await safeTenantQuery(dbName, sql, [
      bookingId,
      tenantSlug,
      req.body.branch_id || 1,
      client_name,
      client_phone || null,
      deceased_name,
      coffin_id,
      service_date,
      notes || null,
      paid || false,
      specifications ? JSON.stringify(specifications) : null
    ]);

    // Emit notification event via RabbitMQ
    try {
      await publishTask(tenantSlug, 'notification.create', {
        type: 'booking.created',
        title: 'New Booking Created',
        message: `Booking for ${deceased_name} by ${client_name} has been created`,
        data: { booking_id: bookingId, client_name, deceased_name, coffin_id, service_date },
        priority: 'high'
      }, 'normal');
    } catch (notifError) {
      logger.warn({ msg: 'Failed to emit booking creation notification', error: notifError.message });
    }

    // Emit real-time notification via Socket.IO service to tenant room
    try {
      const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
      const axios = require('axios');
      await axios.post(`${socketioServiceUrl}/emit/coffin-booking-created`, {
        tenantSlug,
        type: 'coffin-booking-created',
        title: 'New Coffin Reservation',
        message: `New reservation for ${deceased_name} by ${client_name}`,
        fullContent: `Coffin reservation #${bookingId} created for ${deceased_name}. Client: ${client_name}. Service date: ${service_date || 'N/A'}.`,
        priority: 'high',
        data: { booking_id: bookingId, client_name, deceased_name, coffin_id, service_date },
        timestamp: new Date().toISOString()
      }, { timeout: 5000 });
    } catch (emitError) {
      logger.warn({ msg: 'Failed to emit socket notification for booking', error: emitError.message });
    }

    logger.info({ msg: 'Booking created', tenantSlug, bookingId, dbId: result.insertId });

    return res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking_id: bookingId,
      id: result.insertId
    });
  } catch (error) {
    logger.error({ msg: 'Create booking error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /coffins/bookings/:id/status - Update booking status
 */
exports.updateBookingStatus = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;
  const { status } = req.body;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    const sql = `UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, sql, [status, id, tenantSlug]);

    logger.info({ msg: 'Booking status updated', tenantSlug, bookingId: id, status });

    return res.status(200).json({ success: true, message: `Booking ${status}` });
  } catch (error) {
    logger.error({ msg: 'Update booking status error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /coffins/bookings/:id/payment - Mark booking as paid
 */
exports.markBookingPaid = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    const sql = `UPDATE bookings SET paid = TRUE, updated_at = NOW() WHERE id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, sql, [id, tenantSlug]);

    logger.info({ msg: 'Booking marked as paid', tenantSlug, bookingId: id });

    return res.status(200).json({ success: true, message: 'Booking marked as paid' });
  } catch (error) {
    logger.error({ msg: 'Mark booking as paid error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================
// STOCK REQUESTS
// ============================================================

/**
 * GET /coffins/stock-requests - Get all stock requests
 */
exports.getAllStockRequests = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await resolveDatabase(tenantSlug);
    if (!dbName) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }

    const sql = `
      SELECT sr.*, c.name as coffin_name
      FROM stock_requests sr
      LEFT JOIN coffins c ON sr.coffin_id = c.coffin_id AND sr.tenant_slug = c.tenant_slug
      WHERE sr.tenant_slug = ?
      ORDER BY sr.created_at DESC
    `;

    const requests = await safeTenantQuery(dbName, sql, [tenantSlug]);
    return res.status(200).json({ success: true, data: requests, count: requests.length });
  } catch (error) {
    logger.error({ msg: 'Get all stock requests error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /coffins/stock-requests/:id - Get stock request by ID
 */
exports.getStockRequestById = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    const sql = `
      SELECT sr.*, c.name as coffin_name
      FROM stock_requests sr
      LEFT JOIN coffins c ON sr.coffin_id = c.coffin_id AND sr.tenant_slug = c.tenant_slug
      WHERE sr.id = ? AND sr.tenant_slug = ?
    `;

    const requests = await safeTenantQuery(dbName, sql, [id, tenantSlug]);
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock request not found' });
    }

    return res.status(200).json({ success: true, data: requests[0] });
  } catch (error) {
    logger.error({ msg: 'Get stock request by ID error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /coffins/stock-requests - Create a new stock request
 */
exports.createStockRequest = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  if (!tenantSlug || tenantSlug === 'system_shared') {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const {
      from_branch_id, to_branch_id, coffin_id, quantity, client_name, client_phone, deceased_name, service_date, notes, req_type
    } = req.body;

    // Auto-populate tenant_slug from authenticated user
    const finalTenantSlug = tenantSlug;

    // Auto-populate requested_by from logged-in user's email (if available)
    const requestedBy = req.user?.email || req.body.requested_by || null;

    // Validate required fields with specific error messages
    const missingFields = [];
    if (!from_branch_id) missingFields.push('from_branch_id (your branch)');
    if (!to_branch_id) missingFields.push('to_branch_id (requesting to branch)');
    if (!coffin_id) missingFields.push('coffin_id');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missing_fields: missingFields
      });
    }

    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    // Generate request_id
    const requestId = `SR-${Date.now().toString().slice(-6)}-${require('crypto').randomBytes(3).toString('hex').toUpperCase()}`;

    const sql = `
      INSERT INTO stock_requests (request_id, tenant_slug, from_branch_id, to_branch_id, coffin_id, quantity, client_name, client_phone, deceased_name, service_date, notes, req_type, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `;

    const result = await safeTenantQuery(dbName, sql, [
      requestId,
      finalTenantSlug,
      from_branch_id,
      to_branch_id,
      coffin_id,
      quantity || 1,
      client_name || null,
      client_phone || null,
      deceased_name || null,
      service_date || null,
      notes || null,
      req_type || 'replenishment'
    ]);

    // Emit real-time notification via Socket.IO service to specific branch rooms
    try {
      const socketioServiceUrl = process.env.SOCKETIO_SERVICE_URL || 'http://localhost:5018';
      const axios = require('axios');
      const isClientRequest = req_type === 'client';
      
      // Emit to the RECEIVING branch (to_branch_id) - they need to approve/process the request
      await axios.post(`${socketioServiceUrl}/emit/coffin-stock-request`, {
        tenantSlug,
        branchId: to_branch_id,  // Send to the branch receiving the request
        type: 'coffin-stock-request',
        title: isClientRequest ? 'New Coffin Transfer Request' : 'Stock Replenishment Request',
        message: isClientRequest
          ? `Transfer request for ${deceased_name} from branch ${from_branch_id} to your branch (${to_branch_id})`
          : `Stock request from branch ${from_branch_id} to your branch (${to_branch_id})`,
        fullContent: `Coffin transfer request #${requestId} created. ${isClientRequest ? `Client: ${client_name || 'N/A'}. Deceased: ${deceased_name}.` : `Quantity: ${quantity || 1}.`} From branch ${from_branch_id} to your branch (${to_branch_id}).`,
        priority: 'high',
        data: { request_id: requestId, from_branch_id, to_branch_id, coffin_id, quantity, client_name, deceased_name, req_type },
        timestamp: new Date().toISOString()
      }, { timeout: 5000 });
      
      // Also emit to the SENDING branch (from_branch_id) - confirm their request was sent
      await axios.post(`${socketioServiceUrl}/emit/coffin-stock-request`, {
        tenantSlug,
        branchId: from_branch_id,  // Send to the branch that created the request
        type: 'coffin-stock-request-sent',
        title: 'Transfer Request Sent',
        message: `Your transfer request to branch ${to_branch_id} has been sent successfully`,
        fullContent: `Coffin transfer request #${requestId} has been sent to branch ${to_branch_id}. ${isClientRequest ? `Client: ${client_name || 'N/A'}. Deceased: ${deceased_name}.` : `Quantity: ${quantity || 1}.`}`,
        priority: 'normal',
        data: { request_id: requestId, from_branch_id, to_branch_id, coffin_id, quantity, client_name, deceased_name, req_type, status: 'sent' },
        timestamp: new Date().toISOString()
      }, { timeout: 5000 });
    } catch (emitError) {
      logger.warn({ msg: 'Failed to emit socket notification for stock request', error: emitError.message });
    }

    logger.info({ msg: 'Stock request created', tenantSlug, requestId, dbId: result.insertId });

    return res.status(201).json({
      success: true,
      message: 'Stock request created successfully',
      request_id: requestId,
      id: result.insertId
    });
  } catch (error) {
    logger.error({ msg: 'Create stock request error', tenantSlug, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /coffins/stock-requests/:id/approve - Approve stock request
 */
exports.approveStockRequest = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    // Get stock request details
    const requestSql = `SELECT * FROM stock_requests WHERE id = ? AND tenant_slug = ?`;
    const requests = await safeTenantQuery(dbName, requestSql, [id, tenantSlug]);
    
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock request not found' });
    }

    const stockRequest = requests[0];

    // Check if sending branch has enough stock
    const coffinSql = `SELECT stock FROM coffins WHERE coffin_id = ? AND branch_id = ? AND tenant_slug = ? AND is_deleted = FALSE`;
    const coffins = await safeTenantQuery(dbName, coffinSql, [stockRequest.coffin_id, stockRequest.from_branch_id, tenantSlug]);
    
    if (coffins.length === 0 || coffins[0].stock < stockRequest.quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock in sending branch' });
    }

    // Reserve the stock (decrement from sending branch)
    const updateSql = `UPDATE coffins SET stock = stock - ? WHERE coffin_id = ? AND branch_id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, updateSql, [stockRequest.quantity, stockRequest.coffin_id, stockRequest.from_branch_id, tenantSlug]);

    // Update stock request status
    const statusSql = `UPDATE stock_requests SET status = 'approved', updated_at = NOW() WHERE id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, statusSql, [id, tenantSlug]);

    logger.info({ msg: 'Stock request approved and stock reserved', tenantSlug, requestId: id, quantity: stockRequest.quantity });

    return res.status(200).json({ success: true, message: 'Stock request approved and reserved' });
  } catch (error) {
    logger.error({ msg: 'Approve stock request error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /coffins/stock-requests/:id/reject - Reject stock request
 */
exports.rejectStockRequest = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    const sql = `UPDATE stock_requests SET status = 'rejected', updated_at = NOW() WHERE id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, sql, [id, tenantSlug]);

    logger.info({ msg: 'Stock request rejected', tenantSlug, requestId: id });

    return res.status(200).json({ success: true, message: 'Stock request rejected' });
  } catch (error) {
    logger.error({ msg: 'Reject stock request error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /coffins/stock-requests/:id/transferring - Mark stock request as transferring
 */
exports.markStockRequestTransferring = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    const sql = `UPDATE stock_requests SET status = 'transferring', updated_at = NOW() WHERE id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, sql, [id, tenantSlug]);

    logger.info({ msg: 'Stock request marked as transferring', tenantSlug, requestId: id });

    return res.status(200).json({ success: true, message: 'Stock request marked as transferring' });
  } catch (error) {
    logger.error({ msg: 'Mark stock request as transferring error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /coffins/stock-requests/:id/delivered - Mark stock request as delivered
 */
exports.markStockRequestDelivered = async (req, res) => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) throw new Error('Tenant database not found');

    // Get stock request details
    const requestSql = `SELECT * FROM stock_requests WHERE id = ? AND tenant_slug = ?`;
    const requests = await safeTenantQuery(dbName, requestSql, [id, tenantSlug]);
    
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock request not found' });
    }

    const stockRequest = requests[0];

    // Add stock to receiving branch
    const updateSql = `UPDATE coffins SET stock = stock + ? WHERE coffin_id = ? AND branch_id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, updateSql, [stockRequest.quantity, stockRequest.coffin_id, stockRequest.to_branch_id, tenantSlug]);

    // Update stock request status
    const statusSql = `UPDATE stock_requests SET status = 'delivered', updated_at = NOW() WHERE id = ? AND tenant_slug = ?`;
    await safeTenantQuery(dbName, statusSql, [id, tenantSlug]);

    logger.info({ msg: 'Stock request delivered and inventory updated', tenantSlug, requestId: id, quantity: stockRequest.quantity });

    return res.status(200).json({ success: true, message: 'Stock request marked as delivered and inventory updated' });
  } catch (error) {
    logger.error({ msg: 'Mark stock request as delivered error', tenantSlug, id, error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};
