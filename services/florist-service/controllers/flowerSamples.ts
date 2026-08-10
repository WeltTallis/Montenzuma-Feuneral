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

// Import your database utilities
import { query, execute } from '../../../shared/dbConfig.js';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import sharp from 'sharp';
import os from 'os';

// Fix __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// ─── Upload path fallbacks ───
const getUploadBaseDir = (): string[] => {
  return [
    path.join(__dirname, '../../uploads/FlowerSamples'),
    path.join(__dirname, '../../../uploads/FlowerSamples'),
    path.join(process.cwd(), 'uploads/FlowerSamples'),
    '/app/uploads/FlowerSamples',
  ];
};

const ensureUploadDir = async (tenantSlug: string): Promise<string> => {
  const possiblePaths = getUploadBaseDir();
  let dir: string | null = null;

  for (const basePath of possiblePaths) {
    const candidate = path.join(basePath, tenantSlug);
    try {
      await fs.mkdir(candidate, { recursive: true });
      const testFile = path.join(candidate, '.write-test');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      dir = candidate;
      console.log(`[FLOWER] Upload dir set: ${dir}`);
      break;
    } catch (e: any) {
      console.warn(`[FLOWER] Cannot use upload path: ${candidate} - ${e.message}`);
    }
  }

  if (!dir) {
    dir = path.join(os.tmpdir(), 'flower-uploads', tenantSlug);
    await fs.mkdir(dir, { recursive: true });
    console.log(`[FLOWER] Using temp upload dir: ${dir}`);
  }

  return dir;
};

// ─── Image compression ───
const compressAndSaveImage = async (
  buffer: Buffer, 
  filename: string, 
  tenantSlug: string
): Promise<string> => {
  const dir = await ensureUploadDir(tenantSlug);

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

    return `/uploads/FlowerSamples/${tenantSlug}/${webpName}`;
  } catch (err) {
    console.error(`[FLOWER] Image processing error:`, err);
    throw err;
  }
};

// ─── Helper to parse JSON strings from DB ───
const parseJSONFields = (record: any): any => {
  return {
    id: record.id,
    arrangement_id: record.arrangement_id,
    title: record.title,
    description: record.description,
    types: JSON.parse(record.types),
    colors: JSON.parse(record.colors),
    sizes: JSON.parse(record.sizes),
    images: JSON.parse(record.images),
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
 * CREATE - Create a new flower arrangement
 */
export const createFlowerArrangement = async (req: any, res: any): Promise<any> => {
  const tenantSlug = req.tenantSlug;

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
    (arrangement_id, title, description, types, colors, sizes, images, tenant_slug, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  await execute(req, sql, [
    arrangementId,
    title,
    description,
    data.types,
    data.colors,
    data.sizes,
    data.images,
    tenantSlug
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

  const sql = 'SELECT * FROM flower_samples WHERE arrangement_id = ? AND tenant_slug = ?';
  const records = await query(req, sql, [id, tenantSlug]);
  
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

    const updates: any = {};
    const { title, description, images: providedImages } = req.body;

    if (title) updates.title = title;
    if (description) updates.description = description;
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
    const updateParams = [...Object.values(updates), id, tenantSlug];

    const sql = `
      UPDATE flower_samples 
      SET ${updateFields}, updated_at = NOW() 
      WHERE arrangement_id = ? AND tenant_slug = ?
    `;

    await execute(req, sql, updateParams);

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

    // Delete associated images from filesystem
    for (const image of existingArrangement.images) {
      try {
        const imagePath = path.join(process.cwd(), 'public', image.url);
        await fs.unlink(imagePath).catch(() => {});
      } catch (err) {
        console.warn(`[FLOWER] Could not delete image: ${image.url}`);
      }
    }

    // Delete from database
    const sql = 'DELETE FROM flower_samples WHERE arrangement_id = ? AND tenant_slug = ?';
    await execute(req, sql, [id, tenantSlug]);

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
    let sql = 'SELECT * FROM flower_samples WHERE tenant_slug = ?';
    const params: any[] = [tenantSlug];

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

    const records = await query(req, sql, params);
    
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
