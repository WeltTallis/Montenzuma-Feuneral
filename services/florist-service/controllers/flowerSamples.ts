// flowerSample.controller.ts
// @ts-ignore
import type { Request, Response } from 'express';
import type { ResultSetHeader } from 'mysql2';
import type {
  FlowerSample,
  FlowerSampleRecord,
  CreateFlowerSampleDTO,
  Image
} from '../models/flowerSamplesModel.ts';

// Import your local database utilities (direct restpoint_operations pool)
import { safeQuery, safeExecute } from '../database.ts';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import os from 'os';

// Fix __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================
// TENANT HELPERS
//   Flower samples are scoped by TENANT ID ONLY (no branches). The tenant id
//   comes from the `x-tenant-id` header sent by the UI (read from localStorage
//   after login). tenant_slug is the legacy fallback for rows that have no
//   tenant_id yet.
// ============================================

const tenantIdOf = (req: any): string | null =>
  req.tenantId || req.headers?.['x-tenant-id'] || req.headers?.['x-tenant_id'] || null;

const tenantSlugOf = (req: any): string | null =>
  req.tenantSlug || req.tenant?.tenant_slug || null;

/**
 * Build a tenant WHERE fragment. Uses ONLY the tenant id when available.
 */
const buildTenantScope = (req: any): { clause: string; params: any[] } => {
  const tenantId = tenantIdOf(req);
  const tenantSlug = tenantSlugOf(req);

  if (tenantId) {
    return { clause: 'tenant_id = ?', params: [tenantId] };
  }
  if (tenantSlug && tenantSlug !== 'system_shared') {
    return { clause: 'tenant_slug = ?', params: [tenantSlug] };
  }
  return { clause: '1=1', params: [] };
};

// ============================================
// CONFIGURATION
// ============================================

// In-memory cache
const arrangementCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getCached = (key: string): any => {
  const cached = arrangementCache.get(key);
  if (cached && cached.expiry > Date.now()) return cached.data;
  arrangementCache.delete(key);
  return null;
};

const setCached = (key: string, data: any): void => {
  arrangementCache.set(key, { data, expiry: Date.now() + CACHE_TTL });
};

const clearCache = (pattern?: string): void => {
  if (pattern) {
    for (const key of arrangementCache.keys()) {
      if (key.includes(pattern)) arrangementCache.delete(key);
    }
  } else {
    arrangementCache.clear();
  }
};

const generateArrangementId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ARR-${timestamp}-${random}`;
};

// ─── Upload path resolution ───
// Canonical per-tenant layout (production):
//   /opt/storage/uploads/<tenant-slug>/flowers/<file>.webp
//   → browser URL  /uploads/<tenant-slug>/flowers/<file>.webp
// Each tenant gets its OWN folder; legacy layouts are tried as fallbacks so
// existing deployments keep working during the transition.
// Sanitize the slug exactly like generateSlug() so the on-disk folder and the
// /uploads/... URL always match and tenant files can never mix.
const sanitizeSlug = (name: string): string => {
  const cleaned = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'system_shared';
};

const getUploadDirs = (tenantSlug: string): { dir: string; urlPrefix: string }[] => {
  const slug = sanitizeSlug(tenantSlug);
  const globalDir = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
  return [
    { dir: path.join(globalDir, slug, 'flowers'), urlPrefix: `/uploads/${slug}/flowers` },
    { dir: path.join(globalDir, 'FlowerSamples', slug), urlPrefix: `/uploads/FlowerSamples/${slug}` },
    { dir: path.join(__dirname, '../../uploads/FlowerSamples', slug), urlPrefix: `/uploads/FlowerSamples/${slug}` },
    { dir: path.join(process.cwd(), 'uploads/FlowerSamples', slug), urlPrefix: `/uploads/FlowerSamples/${slug}` },
    { dir: path.join('/app/uploads/FlowerSamples', slug), urlPrefix: `/uploads/FlowerSamples/${slug}` },
  ];
};

const ensureUploadDir = async (tenantSlug: string): Promise<{ dir: string; urlPrefix: string }> => {
  for (const candidate of getUploadDirs(tenantSlug)) {
    try {
      await fs.mkdir(candidate.dir, { recursive: true });
      const testFile = path.join(candidate.dir, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      console.log(`[FLOWER] Upload dir set: ${candidate.dir}`);
      return candidate;
    } catch (e: any) {
      console.warn(`[FLOWER] Cannot use upload path: ${candidate.dir} - ${e.message}`);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    // NEVER silently write to a container-local / temp dir in production: the
    // stored URL would 404 for every client. Fail the request loudly instead so
    // the operator immediately sees the real cause (missing bind mount or wrong
    // ownership on /opt/storage).
    const globalDir = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
    throw new Error(
      '[FLOWER] No writable upload directory. The shared uploads folder (' + globalDir + ') must be ' +
      'writable by the container user (uid 1001). On the server run: ' +
      'bash /opt/restpoint/scripts/setup-production-storage.sh'
    );
  }

  const dir = path.join(os.tmpdir(), 'flower-uploads', tenantSlug);
  await fs.mkdir(dir, { recursive: true });
  console.warn(`[FLOWER] DEV fallback temp upload dir: ${dir} — images will NOT be served (dev only)`);
  return { dir, urlPrefix: `/uploads/${tenantSlug}/flowers` };
};

// ─── Image compression ───
const compressAndSaveImage = async (
  buffer: Buffer,
  filename: string,
  tenantSlug: string
): Promise<string> => {
  const { dir, urlPrefix } = await ensureUploadDir(tenantSlug);

  const safeName = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.[^.]+$/, '')
    .slice(0, 50);

  const webpName = `${safeName}-${Date.now()}.webp`;
  const outputPath = path.join(dir, webpName);

  try {
    const metadata = await sharp(buffer).metadata();
    console.log(`[FLOWER] Image metadata: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

    await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .sharpen({
        sigma: 2.5
      })
      .modulate({
        brightness: 1.05,
        saturation: 1.1
      })
      .webp({
        quality: 92,
        effort: 6,
        lossless: false
      })
      .toFile(outputPath);

    const stats = await fs.stat(outputPath);
    console.log(`[FLOWER] Image saved: ${webpName} (${(stats.size / 1024).toFixed(1)}KB)`);

    return `${urlPrefix}/${webpName}`;
  } catch (err) {
    console.error(`[FLOWER] Image processing error:`, err);
    throw err;
  }
};

// ─── Helper to parse JSON strings from DB ───
// Helper to parse JSON values from DB.
// mysql2 already parses `json`-typed columns into arrays/objects, so only
// attempt JSON.parse when the value is still a string.
const parseValue = (value: any): any => {
  if (value == null || value === '') return [];
  if (Array.isArray(value) || typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) || typeof parsed === 'object' ? parsed : [parsed];
    } catch (e) {
      // Not valid JSON - fall back to comma-separated parsing
      return toArray(value);
    }
  }
  return [value];
};

const parseJSONFields = (record: any): any => {
  return {
    id: record.id,
    arrangement_id: record.arrangement_id,
    title: record.title,
    description: record.description,
    price: record.price ?? null,
    types: parseValue(record.types),
    colors: parseValue(record.colors),
    sizes: parseValue(record.sizes),
    images: parseValue(record.images),
    tenant_slug: record.tenant_slug,
    tenant_id: record.tenant_id,
    created_at: record.created_at,
    updated_at: record.updated_at
  };
};

// ─── Helper to stringify JSON for DB ───
const stringifyJSONFields = (data: Partial<CreateFlowerSampleDTO>): any => {
  const result: any = { ...data };
  if (data.types) result.types = JSON.stringify(data.types);
  if (data.colors) result.colors = JSON.stringify(data.colors);
  if (data.sizes) result.sizes = JSON.stringify(data.sizes);
  if (data.images) result.images = JSON.stringify(data.images);
  return result;
};

// ─── Helper to normalize comma-separated / JSON strings into arrays ───
// Multipart/form-data delivers fields as strings, so a value like
// "Wreath, Spray, Bouquet" must become ["Wreath","Spray","Bouquet"].
const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    // Accept a JSON array like '["Wreath","Spray"]'
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* not JSON — fall through */ }
    // Otherwise treat as comma-separated
    return trimmed
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return [];
};

// ============================================
// CONTROLLER FUNCTIONS
// ============================================

/**
 * Existing tenant databases were created before the price column existed.
 * Idempotent (MariaDB supports ADD COLUMN IF NOT EXISTS) - no-op when present.
 */
const ensurePriceColumn = async (req: any): Promise<void> => {
  try {
    await safeExecute('ALTER TABLE flower_samples ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) DEFAULT NULL AFTER sizes', []);
  } catch (err: any) {
    // ER_DUP_FIELDNAME means the column already exists - safe to ignore
    if (err?.code !== 'ER_DUP_FIELDNAME' && !/duplicate/i.test(err?.message || '')) {
      console.warn('[FLOWERS] price column guard skipped:', err?.message);
    }
  }
};

/**
 * CREATE - Create a new flower arrangement
 */
export const createFlowerArrangement = async (req: any, res: any): Promise<any> => {
  const tenantSlug = req.tenantSlug;
  const tenantId = tenantIdOf(req);

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const {
      title,
      description,
      images: providedImages
    }: CreateFlowerSampleDTO = req.body;

    // Multipart form fields arrive as comma-separated (or JSON) strings —
    // normalize them into the arrays the table expects.
    const types = toArray(req.body.types);
    const colors = toArray(req.body.colors);
    const sizes = toArray(req.body.sizes);

    // Validate required fields
    if (!title || !description || !types || !colors || !sizes) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, types, colors, sizes'
      });
    }

    // Validate arrays
    if (!Array.isArray(types) || types.length === 0) {
      return res.status(400).json({ success: false, message: 'Types must be a non-empty array' });
    }
    if (!Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({ success: false, message: 'Colors must be a non-empty array' });
    }
    if (!Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({ success: false, message: 'Sizes must be a non-empty array' });
    }

    // Generate unique arrangement ID
    const arrangementId = generateArrangementId();

    // Prepare images array
    let images: Image[] = [];

    // Handle uploaded files
    if (req.files && Array.isArray(req.files)) {
      const uploadedFiles = req.files as Express.Multer.File[];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const imageUrl = await compressAndSaveImage(file.buffer, file.originalname, tenantSlug);
        images.push({
          url: imageUrl,
          alt_text: `${title} - image ${i + 1}`,
          is_primary: i === 0,
          order: i
        });
      }
    }

    // If images were provided in the DTO, use them
    if (providedImages && Array.isArray(providedImages)) {
      providedImages.forEach((img, index) => {
        if (img.url) {
          images.push({
            url: img.url,
            alt_text: img.alt_text || `${title} - image ${index + 1}`,
            is_primary: img.is_primary || index === 0,
            order: img.order || index
          });
        }
      });
    }

    // Prepare data for insertion
    const data = stringifyJSONFields({
      title,
      description,
      types,
      colors,
      sizes,
      images
    });

    const sql = `
    INSERT INTO flower_samples 
    (arrangement_id, title, description, types, colors, sizes, images, tenant_slug, tenant_id, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

    await safeExecute(sql, [
      arrangementId,
      title,
      description,
      data.types,
      data.colors,
      data.sizes,
      data.images,
      tenantSlug,
      tenantId
    ]);

    // Clear cache for this tenant
    clearCache(tenantSlug);

    // Clear cache
    clearCache(tenantSlug);

    // Fetch the created record
    const createdArrangement = await getFlowerArrangementByIdInternal(req, arrangementId, tenantSlug);

    return res.status(201).json({
      success: true,
      message: 'Flower arrangement created successfully',
      data: createdArrangement
    });

  } catch (error: any) {
    console.error('Create flower sample error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET BY ID - Get a single flower arrangement by ID
 */
export const getFlowerArrangementById = async (req: any, res: any): Promise<any> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const arrangement = await getFlowerArrangementByIdInternal(req, id, tenantSlug);

    if (!arrangement) {
      return res.status(404).json({
        success: false,
        message: `Flower arrangement with ID ${id} not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: arrangement
    });

  } catch (error: any) {
    console.error('Get flower arrangement by ID error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Internal helper to get arrangement by ID
const getFlowerArrangementByIdInternal = async (
  req: any,
  id: string,
  tenantSlug: string
): Promise<any | null> => {
  const cacheKey = `arrangement_${tenantSlug}_${id}`;
  let cached = getCached(cacheKey);

  if (cached) {
    return cached;
  }

  const tenantScope = buildTenantScope(req);
  // CAST json columns to CHAR - legacy rows may hold non-JSON text
  const sql = `
    SELECT id, arrangement_id, title, description,
           CAST(types  AS CHAR) AS types,
           CAST(colors AS CHAR) AS colors,
           CAST(sizes  AS CHAR) AS sizes,
           CAST(images AS CHAR) AS images,
           tenant_slug, tenant_id, created_at, updated_at
    FROM flower_samples WHERE arrangement_id = ? AND ${tenantScope.clause} LIMIT 1`;
  const records = await safeQuery(sql, [id, ...tenantScope.params]);

  if (!records || records.length === 0) {
    return null;
  }

  const arrangement = parseJSONFields(records[0]);
  setCached(cacheKey, arrangement);

  return arrangement;
};

/**
 * UPDATE - Update a flower arrangement
 */
export const updateFlowerArrangement = async (req: any, res: any): Promise<any> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    // Check if arrangement exists
    const existingArrangement = await getFlowerArrangementByIdInternal(req, id, tenantSlug);
    if (!existingArrangement) {
      return res.status(404).json({
        success: false,
        message: `Flower arrangement with ID ${id} not found`
      });
    }

    // Ensure the price column exists on older tenant databases
    await ensurePriceColumn(req);

    const updates: any = {};
    const { title, description, images: providedImages } = req.body;

    if (title) updates.title = title;
    if (description) updates.description = description;
    if (req.body.price !== undefined && req.body.price !== null && req.body.price !== '') {
      const parsedPrice = parseFloat(req.body.price);
      if (!isNaN(parsedPrice)) updates.price = parsedPrice;
    }
    const types = toArray(req.body.types);
    const colors = toArray(req.body.colors);
    const sizes = toArray(req.body.sizes);
    if (types.length) updates.types = JSON.stringify(types);
    if (colors.length) updates.colors = JSON.stringify(colors);
    if (sizes.length) updates.sizes = JSON.stringify(sizes);

    // Handle image updates
    let images = [...existingArrangement.images];
    if (providedImages && Array.isArray(providedImages)) {
      images = providedImages.map((img: any) => ({
        url: img.url,
        alt_text: img.alt_text || existingArrangement.title,
        is_primary: img.is_primary || false,
        order: img.order || 0
      }));
    }

    // Handle new image uploads
    if (req.files && Array.isArray(req.files)) {
      const newFiles = req.files as Express.Multer.File[];
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const imageUrl = await compressAndSaveImage(file.buffer, file.originalname, tenantSlug);
        images.push({
          url: imageUrl,
          alt_text: `${existingArrangement.title} - new image ${i + 1}`,
          is_primary: images.length === 0 && i === 0,
          order: images.length + i
        });
      }
    }

    if (images.length > 0) {
      updates.images = JSON.stringify(images);
    }

    // Build update query
    const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const tenantScope = buildTenantScope(req);
    const updateParams = [...Object.values(updates), id, ...tenantScope.params];

    const sql = `
      UPDATE flower_samples 
      SET ${updateFields}, updated_at = NOW() 
      WHERE arrangement_id = ? AND ${tenantScope.clause}
    `;

    await safeExecute(sql, updateParams);

    // Clear cache
    clearCache(tenantSlug);

    // Fetch updated arrangement
    const updatedArrangement = await getFlowerArrangementByIdInternal(req, id, tenantSlug);

    return res.status(200).json({
      success: true,
      message: 'Flower arrangement updated successfully',
      data: updatedArrangement
    });

  } catch (error: any) {
    console.error('Update flower sample error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE - Delete a flower arrangement
 */
export const deleteFlowerArrangement = async (req: any, res: any): Promise<any> => {
  const tenantSlug = req.tenantSlug;
  const { id } = req.params;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    // Check if arrangement exists
    const existingArrangement = await getFlowerArrangementByIdInternal(req, id, tenantSlug);
    if (!existingArrangement) {
      return res.status(404).json({
        success: false,
        message: `Flower arrangement with ID ${id} not found`
      });
    }

    // Delete associated images from the shared filesystem (supports both the
    // canonical /uploads/<slug>/flowers/... and legacy /uploads/FlowerSamples/
    // layouts).
    const globalUploadsDir = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
    for (const image of existingArrangement.images) {
      try {
        const rel = String(image.url || '').replace(/^\/uploads\//, '');
        if (!rel) continue;
        const candidates = [
          path.join(globalUploadsDir, rel),
          path.join(globalUploadsDir, 'FlowerSamples', rel.split('/').pop() || ''),
        ];
        for (const p of candidates) {
          await fs.unlink(p).catch(() => { /* file already gone */ });
        }
      } catch (err) {
        console.warn(`[FLOWER] Could not delete image: ${image.url}`);
      }
    }

    // Delete from database
    const tenantScope = buildTenantScope(req);
    const sql = `DELETE FROM flower_samples WHERE arrangement_id = ? AND ${tenantScope.clause}`;
    await safeExecute(sql, [id, ...tenantScope.params]);

    // Clear cache
    clearCache(tenantSlug);

    return res.status(200).json({
      success: true,
      message: `Flower arrangement with ID ${id} deleted successfully`
    });

  } catch (error: any) {
    console.error('Delete flower sample error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET ALL - Get all flower arrangements with optional filtering
 * GET /api/flower-arrangements
 * Query params:
 *   - color: Filter by color (e.g., "red", "white", "pink", "mixed")
 *   - type: Filter by type (e.g., "casket sprays", "standing wreaths", "bouquets", "sympathy baskets")
 *   - size: Filter by size (optional)
 */
export const getAllFlowerArrangements = async (req: any, res: any): Promise<any> => {
  const tenantSlug = req.tenantSlug;

  if (!tenantSlug) {
    return res.status(403).json({ success: false, message: 'Valid tenant required' });
  }

  try {
    const { color, type, size } = req.query;

    // Build cache key based on filters
    const cacheKey = `all_arrangements_${tenantSlug}_${color || 'all'}_${type || 'all'}_${size || 'all'}`;
    let cached = getCached(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached
      });
    }

    // Build query with filters
    const tenantScope = buildTenantScope(req);
    // CAST json columns to CHAR so mysql2 never wire-parses them - legacy rows
    // may contain non-JSON text, which would otherwise throw inside the driver.
    let sql = `
    SELECT id, arrangement_id, title, description,
           CAST(types  AS CHAR) AS types,
           CAST(colors AS CHAR) AS colors,
           CAST(sizes  AS CHAR) AS sizes,
           CAST(images AS CHAR) AS images,
           tenant_slug, tenant_id, created_at, updated_at
    FROM flower_samples WHERE ${tenantScope.clause}`;
    const params: any[] = [...tenantScope.params];

    // Filter by color - check if the color exists in the JSON array
    if (color && typeof color === 'string') {
      sql += ` AND JSON_CONTAINS(colors, ?)`;
      params.push(JSON.stringify(color.toLowerCase()));
    }

    // Filter by type - check if the type exists in the JSON array
    if (type && typeof type === 'string') {
      sql += ` AND JSON_CONTAINS(types, ?)`;
      params.push(JSON.stringify(type.toLowerCase()));
    }

    // Filter by size - check if the size exists in the JSON array
    if (size && typeof size === 'string') {
      const sizeNum = parseFloat(size as string);
      if (!isNaN(sizeNum)) {
        sql += ` AND JSON_CONTAINS(sizes, CAST(? AS JSON))`;
        params.push(sizeNum.toString());
      }
    }

    sql += ' ORDER BY created_at DESC';

    const records = await safeQuery(sql, params);

    const arrangements = records.map(record => parseJSONFields(record));

    // Cache the results
    setCached(cacheKey, arrangements);

    return res.status(200).json({
      success: true,
      count: arrangements.length,
      data: arrangements
    });

  } catch (error: any) {
    console.error('Get all flower arrangements error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
