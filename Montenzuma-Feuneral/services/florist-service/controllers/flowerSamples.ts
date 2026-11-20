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
import crypto from 'crypto';
import { centralizedUploadService } from '@montezuma/shared-services/dist/centralizedUploadService.js';

// TENANT HELPERS
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
// ─── Transient DB error retry ───
// Pool warm-up / network hiccups occasionally surface transient driver errors
// (ECONNRESET, PROTOCOL_CONNECTION_LOST, lock waits…). The INSERT is retried
// so a first-click failure never turns into a phantom error that makes the
// user submit again and create duplicates.
const TRANSIENT_DB_ERRORS = new Set([
  'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE',
  'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
  'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT',
]);

const isTransientDbError = (err: any): boolean => {
  const code = err?.code || '';
  if (typeof code === 'string' && TRANSIENT_DB_ERRORS.has(code)) return true;
  return /connection lost|deadlock|lock wait timeout|connection reset/i.test(err?.message || '');
};

const safeExecuteWithRetry = async (
  sql: string,
  params: any[],
  attempts = 3
): Promise<ResultSetHeader> => {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await safeExecute(sql, params);
    } catch (err: any) {
      lastErr = err;
      if (i < attempts - 1 && isTransientDbError(err)) {
        const backoff = 250 * (i + 1);
        console.warn(`[FLOWERS] Transient DB error (${err?.code || err?.message}) — retry ${i + 1}/${attempts - 1} in ${backoff}ms`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
};

// ─── Global uploader ───
// Flower-sample images are stored through the SAME centralized upload service
// the deceased / coffin / invoice services use. It writes directly into the
// one shared uploads folder (GLOBAL_UPLOADS_DIR / UPLOADS_BASE_DIR) that is
// bind-mounted in production and served to browsers at /uploads/... by the
// tenant-service — no fragile per-service directory guessing and no
// container-local folders that vanish on rebuild. A failed upload only skips
// that image (kept in the logs) instead of failing the whole sample creation.
const saveFlowerImage = async (
  buffer: Buffer,
  filename: string,
  tenantSlug: string
): Promise<string | null> => {
  // QUALITY GUARANTEE: flower-sample images are persisted BYTE-FOR-BYTE as
  // uploaded — the centralized uploader's writeBuffer writes the original
  // buffer untouched: no resize, no re-compression, no format conversion,
  // no sharp pass. Whatever resolution/quality the florist uploads is
  // exactly what users see in the gallery, so samples stay crisp.
  //
  // Reliability: a transient disk hiccup (network mount, EBUSY, momentary
  // EACCES) is retried a couple of times with backoff before the image is
  // skipped, so a flaky first write doesn't silently drop a photo.
  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await centralizedUploadService.uploadImage(
        buffer,
        filename,
        tenantSlug,
        'flowers'
      );
      if (result && result.success && result.urlPath) {
        console.log(`[FLOWER] Image stored via global uploader (original quality, no re-compression): ${result.urlPath} (${(result.size / 1024).toFixed(1)}KB)`);
        return result.urlPath;
      }
      console.warn(`[FLOWER] Image upload failed (attempt ${i + 1}/${attempts})${i < attempts - 1 ? ' — retrying' : ''}: ${result?.error || 'unknown error'}`);
    } catch (error: any) {
      console.warn(`[FLOWER] Image upload error (attempt ${i + 1}/${attempts})${i < attempts - 1 ? ' — retrying' : ''}: ${error?.message || error}`);
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 250 * (i + 1)));
  }
  return null;
};

// ─── Helper to parse JSON strings from DB ───
const parseValue = (value: any): any => {
  if (value == null || value === '') return [];
  if (Array.isArray(value) || typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) || typeof parsed === 'object' ? parsed : [parsed];
    } catch (e) {
      return toArray(value);
    }
  }
  return [value];
};

const parseJSONFields = (record: any): any => {
  return {
    id: record.id,
    sample_id: record.arrangement_id ?? record.id,
    arrangement_id: record.arrangement_id,
    title: record.title,
    description: record.description,
    like_count: Number(record.like_count ?? 0) || 0,
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

// ─── Robust array parser handling arrays, JSON, CSV, and multipart key variants ───
const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  if (typeof value === 'string' && value.trim()) {
    const trimmed = value.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { /* non-JSON string fallthrough */ }
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
 * Self-healing guard so older installs never 500 on the like endpoint.
 * Creates `like_count` on flower_samples and the flower_sample_likes ledger
 * if the global migrations haven't applied yet. Idempotent — safe to run
 * on every like/list request.
 */
const ensureLikeSchema = async (): Promise<void> => {
  try {
    await safeExecute(
      'ALTER TABLE flower_samples ADD COLUMN IF NOT EXISTS like_count INT NOT NULL DEFAULT 0 AFTER sizes',
      []
    );
  } catch (err: any) {
    if (err?.code !== 'ER_DUP_FIELDNAME' && !/duplicate/i.test(err?.message || '')) {
      console.warn('[FLOWERS] like_count guard skipped:', err?.message);
    }
  }
  try {
    await safeExecute(
      `CREATE TABLE IF NOT EXISTS flower_sample_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        arrangement_id VARCHAR(100) NOT NULL,
        tenant_slug VARCHAR(100) NOT NULL,
        client_key VARCHAR(128) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_flower_like (arrangement_id, tenant_slug, client_key),
        INDEX idx_flower_like_arr (arrangement_id, tenant_slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      []
    );
  } catch (err: any) {
    console.warn('[FLOWERS] flower_sample_likes guard skipped:', err?.message);
  }
};

const lightFingerprintOf = (req: any): string => {
  const ip =
    (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown';
  const ua = String(req.headers?.['user-agent'] || '').slice(0, 80);
  return crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 48);
};

/**
 * CREATE - Create a new flower arrangement
 */
export const createFlowerArrangement = async (req: any, res: any): Promise<any> => {
  // Detailed Request Diagnostic Logging
  console.log('[FLOWERS CREATE] Incoming Request Headers:', JSON.stringify(req.headers || {}));
  console.log('[FLOWERS CREATE] Incoming Request Body:', JSON.stringify(req.body || {}));
  console.log('[FLOWERS CREATE] Incoming Files Count:', Array.isArray(req.files) ? req.files.length : (req.files ? Object.keys(req.files).length : 0));

  const tenantSlug = tenantSlugOf(req) || 'default';
  const tenantId = tenantIdOf(req);

  try {
    // Extract fields with multiple key variations to handle form-data naming
    const rawTitle = req.body.title || req.body.name || 'Untitled Sample';

    // description / colors / sizes were REMOVED from the arrangement form (and
    // therefore this endpoint). Only `title`, `types` and `images` are accepted.
    // The columns stay in the table so historical rows keep their values; new
    // rows simply omit them.
    const types = toArray(req.body.types || req.body['types[]']);

    const cleanTitle = String(rawTitle).trim() || 'Untitled Sample';

    console.log('[FLOWERS CREATE] Parsed Data:', { cleanTitle, types });

    // Generate unique arrangement ID
    const arrangementId = generateArrangementId();

    // Prepare images array
    let images: Image[] = [];

    // Handle uploaded files
    if (req.files && Array.isArray(req.files)) {
      const uploadedFiles = req.files as Express.Multer.File[];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const imageUrl = await saveFlowerImage(file.buffer, file.originalname, tenantSlug);
        if (!imageUrl) continue;
        images.push({
          url: imageUrl,
          alt_text: `${cleanTitle} - image ${i + 1}`,
          is_primary: i === 0,
          order: i
        });
      }
    }

    // Process JSON/provided images if available
    let providedImages = req.body.images;
    if (typeof providedImages === 'string') {
      try { providedImages = JSON.parse(providedImages); } catch (e) { providedImages = []; }
    }
    if (providedImages && Array.isArray(providedImages)) {
      providedImages.forEach((img, index) => {
        if (img && img.url) {
          images.push({
            url: img.url,
            alt_text: img.alt_text || `${cleanTitle} - image ${index + 1}`,
            is_primary: img.is_primary || (images.length === 0 && index === 0),
            order: img.order || images.length + index
          });
        }
      });
    }

    // Prepare data for DB insertion (only the fields the form still collects)
    const data = stringifyJSONFields({
      title: cleanTitle,
      types,
      images
    });

    const sql = `
      INSERT INTO flower_samples 
      (arrangement_id, title, types, images, tenant_slug, tenant_id, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    console.log('[FLOWERS CREATE] Executing SQL insertion for arrangement ID:', arrangementId);

    // Retry transient DB hiccups so the FIRST attempt doesn't fail spuriously.
    await safeExecuteWithRetry(sql, [
      arrangementId,
      cleanTitle,
      data.types,
      data.images,
      tenantSlug,
      tenantId
    ]);

    // Clear cache
    clearCache(tenantSlug);

    // Fetch the newly created record. If this post-insert read hiccups, DO
    // NOT fail the request — the row is already committed, and a 500 here
    // would make the user submit again and create a duplicate.
    let createdArrangement: any = null;
    try {
      createdArrangement = await getFlowerArrangementByIdInternal(req, arrangementId, tenantSlug);
    } catch (fetchErr: any) {
      console.warn('[FLOWERS CREATE] Post-insert read failed, returning inserted payload:', fetchErr?.message);
    }
    if (!createdArrangement) {
      createdArrangement = {
        id: null,
        arrangement_id: arrangementId,
        title: cleanTitle,
        description: '',
        types,
        colors: [],
        sizes: [],
        images,
        tenant_slug: tenantSlug,
        tenant_id: tenantId,
        created_at: new Date(),
        updated_at: new Date()
      };
    }

    console.log('[FLOWERS CREATE] Success! Arrangement Created:', arrangementId);

    return res.status(201).json({
      success: true,
      message: 'Flower arrangement created successfully',
      data: createdArrangement
    });

  } catch (error: any) {
    console.error('[FLOWERS CREATE] Error encountered during upload:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET BY ID - Get a single flower arrangement by ID
 */
export const getFlowerArrangementById = async (req: any, res: any): Promise<any> => {
  const tenantSlug = tenantSlugOf(req) || 'default';
  const { id } = req.params;

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

// ─── Column list shared by get-by-id / create / update / delete reads ───
// Kept in sync with the SELECT in getAllFlowerArrangements so every
// arrangement shape is identical across endpoints. JSON columns are CAST to
// CHAR so mysql2 returns them as strings, which parseValue handles below.
const columns = `id, arrangement_id, title, description,
  COALESCE(like_count, 0) AS like_count,
  CAST(types AS CHAR) AS types,
  CAST(colors AS CHAR) AS colors,
  CAST(sizes AS CHAR) AS sizes,
  CAST(images AS CHAR) AS images`;

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
  const sql = `
    SELECT ${columns},
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
  const tenantSlug = tenantSlugOf(req) || 'default';
  const { id } = req.params;

  try {
    const existingArrangement = await getFlowerArrangementByIdInternal(req, id, tenantSlug);
    if (!existingArrangement) {
      return res.status(404).json({
        success: false,
        message: `Flower arrangement with ID ${id} not found`
      });
    }

    const updates: any = {};
    const { title } = req.body;

    if (title) updates.title = title;
    // description / colors / sizes are no longer editable — removed from the
    // arrangement form. Only `types` (plus images/title below) can change.
    const types = toArray(req.body.types || req.body['types[]']);
    if (types.length) updates.types = JSON.stringify(types);

    let images = [...existingArrangement.images];
    let providedImages = req.body.images;
    if (typeof providedImages === 'string') {
      try { providedImages = JSON.parse(providedImages); } catch (e) { providedImages = []; }
    }
    if (providedImages && Array.isArray(providedImages)) {
      images = providedImages.map((img: any) => ({
        url: img.url,
        alt_text: img.alt_text || existingArrangement.title,
        is_primary: img.is_primary || false,
        order: img.order || 0
      }));
    }

    if (req.files && Array.isArray(req.files)) {
      const newFiles = req.files as Express.Multer.File[];
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const imageUrl = await saveFlowerImage(file.buffer, file.originalname, tenantSlug);
        if (!imageUrl) continue;
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

    if (Object.keys(updates).length > 0) {
      const updateFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const tenantScope = buildTenantScope(req);
      const updateParams = [...Object.values(updates), id, ...tenantScope.params];

      const sql = `
        UPDATE flower_samples 
        SET ${updateFields}, updated_at = NOW() 
        WHERE arrangement_id = ? AND ${tenantScope.clause}
      `;

      await safeExecuteWithRetry(sql, updateParams);
    }

    clearCache(tenantSlug);

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
  const tenantSlug = tenantSlugOf(req) || 'default';
  const { id } = req.params;

  try {
    const existingArrangement = await getFlowerArrangementByIdInternal(req, id, tenantSlug);
    if (!existingArrangement) {
      return res.status(404).json({
        success: false,
        message: `Flower arrangement with ID ${id} not found`
      });
    }

    // Remove the stored files from the shared uploads folder through the same
    // centralized upload service (safe: it resolves only inside the base dir).
    for (const image of existingArrangement.images) {
      try {
        const url = String(image.url || '').trim();
        if (!url) continue;
        await centralizedUploadService.deleteFile(url);
      } catch (err) {
        console.warn(`[FLOWER] Could not delete image: ${image.url}`);
      }
    }

    const tenantScope = buildTenantScope(req);
    const sql = `DELETE FROM flower_samples WHERE arrangement_id = ? AND ${tenantScope.clause}`;
    await safeExecuteWithRetry(sql, [id, ...tenantScope.params]);

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

// ─── Likes — one tap per client, TikTok-style ────────────────────────────────
// GET  /florist/flower-samples/likes/mine   → { liked: [arrangement_id] }
// POST /florist/flower-samples/:id/like     → { liked, like_count }
// POST /florist/flower-samples/:id/unlike   → { liked: false, like_count }
const clientKeyOf = (req: any): string => {
  const fromBody = String(req.body?.client_key || '').trim();
  const fromQuery = String(req.query?.client_key || '').trim();
  const fromHeader = String(req.headers?.['x-client-key'] || '').trim();
  return fromBody || fromQuery || fromHeader || lightFingerprintOf(req);
};

const readLikedIds = async (tenantSlug: string, clientKey: string): Promise<string[]> => {
  const rows = await safeQuery(
    'SELECT arrangement_id FROM flower_sample_likes WHERE tenant_slug = ? AND client_key = ?',
    [tenantSlug, clientKey]
  );
  return (rows || []).map((r: any) => String(r.arrangement_id));
};

const readLikeCounts = async (tenantSlug: string): Promise<Record<string, number>> => {
  const rows = await safeQuery(
    'SELECT arrangement_id, like_count FROM flower_samples WHERE tenant_slug = ?',
    [tenantSlug]
  );
  const m: Record<string, number> = {};
  for (const r of rows || []) m[String(r.arrangement_id)] = Number(r.like_count ?? 0) || 0;
  return m;
};

export const getMySampleLikes = async (req: any, res: any): Promise<any> => {
  try {
    await ensureLikeSchema();
    const tenantSlug = tenantSlugOf(req) || String(req.query?.tenant_slug || 'default');
    const clientKey = clientKeyOf(req);
    return res.status(200).json({
      success: true,
      liked: await readLikedIds(tenantSlug, clientKey),
      counts: await readLikeCounts(tenantSlug),
    });
  } catch (error: any) {
    console.error('Get flower sample likes error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const likeFlowerSample = async (req: any, res: any): Promise<any> => {
  const tenantSlug = tenantSlugOf(req) || String(req.body?.tenant_slug || req.query?.tenant_slug || 'default');
  const { id } = req.params;
  try {
    await ensureLikeSchema();
    const tenantScope = buildTenantScope(req);
    const found = await safeQuery(
      `SELECT arrangement_id FROM flower_samples WHERE arrangement_id = ? AND ${tenantScope.clause} LIMIT 1`,
      [id, ...tenantScope.params]
    );
    if (!found || found.length === 0) {
      return res.status(404).json({ success: false, message: `Flower arrangement with ID ${id} not found` });
    }
    const clientKey = clientKeyOf(req);
    const inserted = await safeExecute(
      `INSERT IGNORE INTO flower_sample_likes (arrangement_id, tenant_slug, client_key) VALUES (?, ?, ?)`,
      [id, tenantSlug, clientKey]
    );
    if ((inserted as any)?.affectedRows > 0) {
      await safeExecute(
        `UPDATE flower_samples SET like_count = like_count + 1 WHERE arrangement_id = ? AND ${tenantScope.clause}`,
        [id, ...tenantScope.params]
      );
      clearCache(tenantSlug);
    }
    const rows = await safeQuery(
      `SELECT like_count FROM flower_samples WHERE arrangement_id = ? AND ${tenantScope.clause} LIMIT 1`,
      [id, ...tenantScope.params]
    );
    return res.status(200).json({
      success: true,
      liked: true,
      like_count: Number(rows?.[0]?.like_count ?? 0) || 0,
    });
  } catch (error: any) {
    console.error('Like flower sample error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const unlikeFlowerSample = async (req: any, res: any): Promise<any> => {
  const tenantSlug = tenantSlugOf(req) || String(req.body?.tenant_slug || req.query?.tenant_slug || 'default');
  const { id } = req.params;
  try {
    await ensureLikeSchema();
    const tenantScope = buildTenantScope(req);
    const clientKey = clientKeyOf(req);
    const deleted = await safeExecute(
      `DELETE FROM flower_sample_likes WHERE arrangement_id = ? AND tenant_slug = ? AND client_key = ?`,
      [id, tenantSlug, clientKey]
    );
    if ((deleted as any)?.affectedRows > 0) {
      await safeExecute(
        `UPDATE flower_samples SET like_count = GREATEST(like_count - 1, 0) WHERE arrangement_id = ? AND ${tenantScope.clause}`,
        [id, ...tenantScope.params]
      );
      clearCache(tenantSlug);
    }
    const rows = await safeQuery(
      `SELECT like_count FROM flower_samples WHERE arrangement_id = ? AND ${tenantScope.clause} LIMIT 1`,
      [id, ...tenantScope.params]
    );
    return res.status(200).json({
      success: true,
      liked: false,
      like_count: Number(rows?.[0]?.like_count ?? 0) || 0,
    });
  } catch (error: any) {
    console.error('Unlike flower sample error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET ALL - Get all flower arrangements with optional filtering
 */
export const getAllFlowerArrangements = async (req: any, res: any): Promise<any> => {
  const tenantSlug = tenantSlugOf(req) || 'default';

  try {
    await ensureLikeSchema();
    const { color, type, size } = req.query;
    const tenantScope = buildTenantScope(req);

    const cacheKey = `all_arrangements_${tenantSlug}_${tenantScope.clause}_${tenantScope.params.join('_')}_${color || 'all'}_${type || 'all'}_${size || 'all'}`;
    let cached = getCached(cacheKey);

    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached
      });
    }

    let sql = `
    SELECT id, arrangement_id, title, description,
           CAST(types  AS CHAR) AS types,
           CAST(colors AS CHAR) AS colors,
           CAST(sizes  AS CHAR) AS sizes,
           CAST(images AS CHAR) AS images,
           COALESCE(like_count, 0) AS like_count,
           tenant_slug, tenant_id, created_at, updated_at
    FROM flower_samples WHERE ${tenantScope.clause}`;
    const params: any[] = [...tenantScope.params];

    if (color && typeof color === 'string') {
      sql += ` AND JSON_CONTAINS(colors, ?)`;
      params.push(JSON.stringify(color.toLowerCase()));
    }

    if (type && typeof type === 'string') {
      sql += ` AND JSON_CONTAINS(types, ?)`;
      params.push(JSON.stringify(type.toLowerCase()));
    }

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

export const getRecommendedFlowerArrangements = async (req: any, res: any): Promise<any> => {
  const tenantSlug = tenantSlugOf(req) || 'default';
  const limit = Math.min(8, Math.max(1, Number(req.query?.limit || 4)));

  try {
    await ensureLikeSchema();
    const tenantScope = buildTenantScope(req);
    const bookingSql = `
      SELECT arrangement_id, COUNT(*) AS booking_count
      FROM flower_bookings
      WHERE arrangement_id IS NOT NULL AND ${tenantScope.clause}
      GROUP BY arrangement_id
      ORDER BY booking_count DESC, MAX(created_at) DESC
      LIMIT ?
    `;

    const bookingRows = await safeQuery(bookingSql, [...tenantScope.params, limit]);
    const rankedIds = (bookingRows || []).map((row: any) => String(row.arrangement_id)).filter(Boolean);

    if (rankedIds.length === 0) {
      const fallbackSql = `
        SELECT arrangement_id, like_count
        FROM flower_samples
        WHERE ${tenantScope.clause}
        ORDER BY like_count DESC, created_at DESC
        LIMIT ?
      `;
      const fallbackRows = await safeQuery(fallbackSql, [...tenantScope.params, limit]);
      rankedIds.push(...(fallbackRows || []).map((row: any) => String(row.arrangement_id)).filter(Boolean));
    }

    const uniqueIds = [...new Set(rankedIds)].slice(0, limit);
    if (!uniqueIds.length) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }

    const placeholders = uniqueIds.map(() => '?').join(', ');
    const sampleSql = `
      SELECT id, arrangement_id, title, description,
             CAST(types AS CHAR) AS types,
             CAST(colors AS CHAR) AS colors,
             CAST(sizes AS CHAR) AS sizes,
             CAST(images AS CHAR) AS images,
             COALESCE(like_count, 0) AS like_count,
             tenant_slug, tenant_id, created_at, updated_at
      FROM flower_samples
      WHERE arrangement_id IN (${placeholders}) AND ${tenantScope.clause}
    `;
    const records = await safeQuery(sampleSql, [...uniqueIds, ...tenantScope.params]);
    const resultMap = new Map((records || []).map((record: any) => [String(record.arrangement_id), parseJSONFields(record)]));

    const bookingMap = new Map((bookingRows || []).map((row: any) => [String(row.arrangement_id), Number(row.booking_count) || 0]));
    const data = uniqueIds
      .map((id) => {
        const item = resultMap.get(String(id));
        if (!item) return null;
        const bookingCount = bookingMap.get(String(id)) || 0;
        return {
          ...item,
          recommendation_score: bookingCount + (Number(item.like_count || 0) / 10),
          recommendation_reason: bookingCount > 0 ? `Booked ${bookingCount} times this period` : 'Popular with florists this week',
          booking_count: bookingCount
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
      tenant_slug: tenantSlug
    });
  } catch (error: any) {
    console.error('Get recommended flower arrangements error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};