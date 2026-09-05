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

import fs from 'fs';
import path from 'path';

const GLOBAL_UPLOADS_DIR =
  process.env.GLOBAL_UPLOADS_DIR ||
  process.env.UPLOADS_BASE_DIR ||
  process.env.UPLOAD_PATH ||
  '/opt/storage/uploads';

export interface UploadResult {
  success: boolean;
  filename: string;
  path: string;
  urlPath: string;
  size: number;
  mimeType: string;
  error?: string;
}

export interface UploadOptions {
  tenantSlug: string;
  category?: string;
  subFolder?: string;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// Standard subfolders every tenant root gets so every service lands in a
// predictable, non-overlapping place.
const TENANT_SUBDIRS = [
  'signatures', 'documents', 'images', 'logos', 'pdf', 'exports',
  'flowers', 'deceased', 'receipts', 'reports', 'contracts',
  'employees', 'chemicals', 'invoices',
];

// Mirrors generateSlug(): letters, digits, dash, underscore, dot, lowercase.
const sanitize = (name: string): string => {
  const cleaned = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned || 'system';
};

const sanitizeFilename = (name: string): string => {
  const cleaned = String(name || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
  return cleaned || 'file';
};

const mimeOf = (filename: string, fallback?: string): string => {
  if (fallback && /^[a-z]+\/[a-z0-9.+-]+$/i.test(String(fallback))) return fallback;
  const ext = path.extname(String(filename || '')).toLowerCase();
  const map: Record<string, string> = {
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
  private baseDir: string;

  constructor() {
    this.baseDir = GLOBAL_UPLOADS_DIR;
    try {
      fs.mkdirSync(this.baseDir, { recursive: true });
    } catch (err: any) {
      console.warn('[UPLOAD] Could not pre-create base uploads dir:', err && err.message);
    }
  }

  private resolveTenantDir(tenantSlug: string): string {
    return path.join(this.baseDir, sanitize(tenantSlug));
  }

  private ensureDir(dir: string): void {
    fs.mkdirSync(dir, { recursive: true });
    // Verify writability up-front so callers get a loud, clear error instead
    // of a silently lost file.
    fs.accessSync(dir, fs.constants.W_OK);
  }

  private async writeBuffer(
    buffer: Buffer,
    originalName: string,
    tenantSlug: string,
    category: string,
    subFolder?: string
  ): Promise<UploadResult> {
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
      const filename = `${timestamp}-${safeFile}`;
      const fullPath = path.join(folder, filename);
      await fs.promises.writeFile(fullPath, buffer);

      const rel = sub
        ? path.posix.join(safeSlug, safeCat, sub, filename)
        : path.posix.join(safeSlug, safeCat, filename);

      console.log(`[UPLOAD] Saved: ${fullPath}`);
      return {
        success: true,
        filename,
        path: fullPath,
        urlPath: `/uploads/${rel}`,
        size: buffer.length,
        mimeType: mimeOf(originalName),
      };
    } catch (error: any) {
      console.error('[UPLOAD] Save failed:', error && error.message);
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

  async uploadSignature(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.writeBuffer(buffer, filename, tenantSlug, 'signatures', options && options.subFolder);
  }

  async uploadDocument(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    subFolder?: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.writeBuffer(buffer, filename, tenantSlug, 'documents', subFolder || (options && options.subFolder));
  }

  async uploadImage(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    category: string = 'images',
    subFolder?: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.writeBuffer(buffer, filename, tenantSlug, category || 'images', subFolder || (options && options.subFolder));
  }

  async uploadTenantLogo(buffer: Buffer, filename: string, tenantSlug: string): Promise<UploadResult> {
    return this.writeBuffer(buffer, filename, tenantSlug, 'logos');
  }

  async uploadPDF(buffer: Buffer, filename: string, tenantSlug: string, subFolder?: string): Promise<UploadResult> {
    return this.writeBuffer(buffer, filename, tenantSlug, 'pdf', subFolder);
  }

  async uploadExcel(buffer: Buffer, filename: string, tenantSlug: string, subFolder?: string): Promise<UploadResult> {
    return this.writeBuffer(buffer, filename, tenantSlug, 'exports', subFolder);
  }

  private async uploadFile(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    category: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.writeBuffer(buffer, filename, tenantSlug, category || 'documents', options && options.subFolder);
  }

  private async uploadRawFile(
    buffer: Buffer,
    filename: string,
    tenantSlug: string,
    category: string,
    subFolder?: string
  ): Promise<UploadResult> {
    return this.writeBuffer(buffer, filename, tenantSlug, category || 'documents', subFolder);
  }

  // Ensure the standard per-tenant folder skeleton exists. Local + idempotent -
  // the old implementation POSTed to a dedicated uploads-service that does not
  // exist in production and therefore always failed.
  async createTenantFolders(tenantSlug: string): Promise<boolean> {
    try {
      const root = this.resolveTenantDir(tenantSlug);
      this.ensureDir(root);
      for (const sub of TENANT_SUBDIRS) {
        fs.mkdirSync(path.join(root, sub), { recursive: true });
      }
      return true;
    } catch (error: any) {
      console.error('Failed to create tenant folders:', error && error.message);
      return false;
    }
  }

  async tenantFolderExists(tenantSlug: string): Promise<boolean> {
    try {
      return fs.existsSync(this.resolveTenantDir(tenantSlug));
    } catch (e) {
      return false;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const safeRel = String(filePath || '')
        .replace(/^[\\/]+/, '')
        .replace(/^uploads\//, '')
        .replace(/^[\.]{1,2}(\/|$)/, '');
      if (!safeRel) return false;
      const base = path.resolve(this.baseDir);
      const full = path.resolve(base, safeRel);
      if (full !== base && !full.startsWith(base + path.sep)) return false;
      if (!fs.existsSync(full)) return false;
      await fs.promises.unlink(full);
      return true;
    } catch (error: any) {
      console.error('Failed to delete file:', error && error.message);
      return false;
    }
  }

  async uploadFromFile(
    filePath: string,
    tenantSlug: string,
    type: 'signature' | 'document' | 'image' | 'logo' | 'pdf' | 'excel',
    category?: string,
    subFolder?: string
  ): Promise<UploadResult> {
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
        default: return this.uploadFile(buffer, filename, tenantSlug, category || 'documents', { subFolder });
      }
    } catch (error: any) {
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

// Export singleton instance
export const centralizedUploadService = new CentralizedUploadService();
export default centralizedUploadService;
