"use strict";
/**
 * Centralized Upload Service - DIRECT-TO-DISK implementation.
 *
 * Writes every file straight into the ONE shared uploads folder all services
 * bind-mount in production (/opt/storage/uploads) and that the tenant-service
 * serves to browsers at /uploads/...
 *
 *   /opt/storage/uploads/<tenant-slug>/<category>[/<subFolder>]/<file>
 *
 * Guarantees:
 *   - per-tenant isolation: the sanitized tenant slug is part of the path, so
 *     tenants can never mix files;
 *   - no dependency on a separate "uploads-service" container (there is NO
 *     such container in docker-compose.prod.yml);
 *   - failures are returned as { success:false, error } - never thrown away.
 */

const fs = require('fs');
const path = require('path');

const GLOBAL_UPLOADS_DIR = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || process.env.UPLOAD_PATH || '/opt/storage/uploads';

// Standard subfolders every tenant root gets so every service lands in a
// predictable, non-overlapping place.
const TENANT_SUBDIRS = [
  'signatures', 'documents', 'images', 'logos', 'pdf', 'exports',
  'flowers', 'deceased', 'receipts', 'reports', 'contracts',
  'employees', 'chemicals', 'invoices',
];

// Mirrors generateSlug(): letters, digits, dash, underscore, dot, lowercase.
const sanitize = (name) => {
  const cleaned = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'system';
};

const sanitizeFilename = (name) => {
  const cleaned = String(name || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
  return cleaned || 'file';
};

const mimeOf = (filename, fallback) => {
  if (fallback && /^[a-z]+\/[a-z0-9.+-]+$/i.test(String(fallback))) return fallback;
  const ext = path.extname(String(filename || '')).toLowerCase();
  const map = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf', '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv', '.txt': 'text/plain', '.zip': 'application/zip',
  };
  return map[ext] || 'application/octet-stream';
};

class CentralizedUploadService {
  constructor() {
    this.baseDir = GLOBAL_UPLOADS_DIR;
    try {
      fs.mkdirSync(this.baseDir, { recursive: true });
    } catch (err) {
      console.warn('[UPLOAD] Could not pre-create base uploads dir:', err && err.message);
    }
  }

  resolveTenantDir(tenantSlug) {
    return path.join(this.baseDir, sanitize(tenantSlug));
  }

  ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
    // Verify writability up-front so callers get a loud, clear error instead
    // of a silently lost file.
    fs.accessSync(dir, fs.constants.W_OK);
  }

  async writeBuffer(buffer, originalName, tenantSlug, category, subFolder) {
    try {
      const safeSlug = sanitize(tenantSlug);
      const safeCat = sanitize(category) || 'documents';
      const sub = subFolder ? sanitize(subFolder) : null;
      const folder = sub
        ? path.join(this.baseDir, safeSlug, safeCat, sub)
        : path.join(this.baseDir, safeSlug, safeCat);

      this.ensureDir(folder);

      const timestamp = Date.now();
      const safeFile = sanitizeFilename(originalName);
      // Prefix with a timestamp so identical filenames never collide/overwrite.
      const filename = timestamp + '-' + safeFile;
      const fullPath = path.join(folder, filename);
      await fs.promises.writeFile(fullPath, buffer);

      const rel = sub
        ? path.posix.join(safeSlug, safeCat, sub, filename)
        : path.posix.join(safeSlug, safeCat, filename);

      console.log('[UPLOAD] Saved: ' + fullPath);
      return {
        success: true,
        filename: filename,
        path: fullPath,
        urlPath: '/uploads/' + rel,
        size: buffer.length,
        mimeType: mimeOf(originalName),
      };
    } catch (error) {
      console.error('[UPLOAD] Save failed:', error && error.message);
      return {
        success: false,
        filename: '',
        path: '',
        urlPath: '',
        size: 0,
        mimeType: '',
        error: (error && error.code ? error.code + ' ' : '') + (error && error.message ? error.message : String(error)),
      };
    }
  }

  async uploadSignature(buffer, filename, tenantSlug, options) {
    return this.writeBuffer(buffer, filename, tenantSlug, 'signatures', options && options.subFolder);
  }

  async uploadDocument(buffer, filename, tenantSlug, subFolder, options) {
    return this.writeBuffer(buffer, filename, tenantSlug, 'documents', subFolder || (options && options.subFolder));
  }

  async uploadImage(buffer, filename, tenantSlug, category, subFolder, options) {
    return this.writeBuffer(buffer, filename, tenantSlug, category || 'images', subFolder || (options && options.subFolder));
  }

  async uploadTenantLogo(buffer, filename, tenantSlug) {
    return this.writeBuffer(buffer, filename, tenantSlug, 'logos');
  }

  async uploadPDF(buffer, filename, tenantSlug, subFolder) {
    return this.writeBuffer(buffer, filename, tenantSlug, 'pdf', subFolder);
  }

  async uploadExcel(buffer, filename, tenantSlug, subFolder) {
    return this.writeBuffer(buffer, filename, tenantSlug, 'exports', subFolder);
  }

  async uploadExcelFromFile(sourcePath, filename, tenantSlug, subFolder) {
    let destinationPath = null;
    try {
      const safeSlug = sanitize(tenantSlug);
      const safeCat = 'exports';
      const sub = subFolder ? sanitize(subFolder) : null;
      const folder = sub
        ? path.join(this.baseDir, safeSlug, safeCat, sub)
        : path.join(this.baseDir, safeSlug, safeCat);
      this.ensureDir(folder);

      const safeFile = sanitizeFilename(filename);
      const storedFilename = `${Date.now()}-${safeFile}`;
      destinationPath = path.join(folder, storedFilename);
      await fs.promises.copyFile(sourcePath, destinationPath);
      const stat = await fs.promises.stat(destinationPath);
      const rel = sub
        ? path.posix.join(safeSlug, safeCat, sub, storedFilename)
        : path.posix.join(safeSlug, safeCat, storedFilename);

      console.log(`[UPLOAD] Saved: ${destinationPath}`);
      return {
        success: true,
        filename: storedFilename,
        path: destinationPath,
        urlPath: `/uploads/${rel}`,
        size: stat.size,
        mimeType: mimeOf(filename),
      };
    } catch (error) {
      if (destinationPath) {
        await fs.promises.unlink(destinationPath).catch(() => undefined);
      }
      console.error('[UPLOAD] Streamed Excel save failed:', error && error.message);
      return {
        success: false,
        filename: '',
        path: '',
        urlPath: '',
        size: 0,
        mimeType: '',
        error: `${error && error.code ? error.code + ' ' : ''}${error && error.message ? error.message : String(error)}`,
      };
    }
  }

  async uploadFile(buffer, filename, tenantSlug, category, options) {
    return this.writeBuffer(buffer, filename, tenantSlug, category || 'documents', options && options.subFolder);
  }

  async uploadRawFile(buffer, filename, tenantSlug, category, subFolder) {
    return this.writeBuffer(buffer, filename, tenantSlug, category || 'documents', subFolder);
  }

  // Ensure the standard per-tenant folder skeleton exists. Local, idempotent -
  // the old implementation POSTed to a dedicated uploads-service that does not
  // exist in production and therefore always failed.
  async createTenantFolders(tenantSlug) {
    try {
      const root = this.resolveTenantDir(tenantSlug);
      this.ensureDir(root);
      for (const sub of TENANT_SUBDIRS) {
        fs.mkdirSync(path.join(root, sub), { recursive: true });
      }
      return true;
    } catch (error) {
      console.error('Failed to create tenant folders:', error && error.message);
      return false;
    }
  }

  async tenantFolderExists(tenantSlug) {
    try {
      return fs.existsSync(this.resolveTenantDir(tenantSlug));
    } catch (e) {
      return false;
    }
  }

  async deleteFile(filePath) {
    try {
      const safeRel = String(filePath || '')
        .replace(/^\\+/, '')
        .replace(/^uploads\//, '')
        .replace(/^\.{1,2}(\/|$)/, '');
      if (!safeRel) return false;
      const base = path.resolve(this.baseDir);
      const full = path.resolve(base, safeRel);
      if (full !== base && !full.startsWith(base + path.sep)) return false;
      if (!fs.existsSync(full)) return false;
      await fs.promises.unlink(full);
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error && error.message);
      return false;
    }
  }

  async uploadFromFile(filePath, tenantSlug, type, category, subFolder) {
    try {
      const buffer = await fs.promises.readFile(filePath);
      const filename = path.basename(filePath);
      switch (type) {
        case 'signature': return this.uploadSignature(buffer, filename, tenantSlug);
        case 'document': return this.uploadDocument(buffer, filename, tenantSlug, subFolder);
        case 'image': return this.uploadImage(buffer, filename, tenantSlug, category || 'images', subFolder);
        case 'logo': return this.uploadTenantLogo(buffer, filename, tenantSlug);
        case 'pdf': return this.uploadPDF(buffer, filename, tenantSlug, subFolder);
        case 'excel': return this.uploadExcel(buffer, filename, tenantSlug, subFolder);
        default: return this.uploadFile(buffer, filename, tenantSlug, category || 'documents', { subFolder: subFolder });
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        path: '',
        urlPath: '',
        size: 0,
        mimeType: '',
        error: error && error.message ? error.message : String(error),
      };
    }
  }
}

exports.centralizedUploadService = new CentralizedUploadService();
exports.default = exports.centralizedUploadService;
