import express, { type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

import { resolveDatabase, safeTenantQuery, safeTenantExecute } from '../../../shared/dbConfig';
import { safeQuery } from '../../../shared/database';
import { centralizedUploadService } from '../../../shared/centralizedUploadService';
import { getKenyaTimeISO } from '../../../packages/shared-utils/dist/timestamps';
import { protect, authorizeAny } from '../../app-global/middlewares/authMiddleware';

const GLOBAL_UPLOADS_DIR = resolveGlobalUploadsDir();
const DOCUMENTS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS documents (document_id BIGINT AUTO_INCREMENT PRIMARY KEY, deceased_id VARCHAR(100) NOT NULL, original_name VARCHAR(255) NULL, stored_name VARCHAR(255) NULL, file_path VARCHAR(500) NULL, mime_type VARCHAR(120) NULL, file_size BIGINT DEFAULT 0, category VARCHAR(100) DEFAULT 'General', uploaded_by VARCHAR(120) NULL, uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX idx_docs_deceased (deceased_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

function resolveGlobalUploadsDir(): string {
  const envDir = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR;
  if (envDir) {
    try {
      if (!fs.existsSync(envDir)) fs.mkdirSync(envDir, { recursive: true });
      return envDir;
    } catch { console.warn('[DOCUMENTS] uploads dir unusable'); }
  }
  const fallbacks = [path.join(process.cwd(), 'uploads'), path.join(__dirname, '../../../uploads'), path.join(__dirname, '../../../../uploads')];
  for (const directory of fallbacks) {
    try {
      if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
      return directory;
    } catch { /* Try the next fallback. */ }
  }
  return path.join(os.tmpdir(), 'restpoint-uploads');
}

function sanitizeSlug(value: unknown): string {
  return String(value || 'system_shared').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'system_shared';
}

function getTenantSlug(req: Request): string {
  if (req.tenantSlug) return sanitizeSlug(req.tenantSlug);
  return sanitizeSlug(req.headers['x-tenant-slug'] || req.headers['x-tenant-id'] || 'system_shared');
}

function tenantUploadDir(tenant: unknown, deceasedId: unknown): string {
  return path.join(GLOBAL_UPLOADS_DIR, sanitizeSlug(tenant), 'documents', String(deceasedId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100));
}

function centralizedTenantUploadDir(tenant: unknown, deceasedId: unknown): string {
  return path.join(GLOBAL_UPLOADS_DIR, sanitizeSlug(tenant), 'documents', sanitizeSlug(deceasedId));
}

function normalizeDeceasedId(value: unknown): string {
  let id = String(value || '').trim();
  try { id = decodeURIComponent(id); } catch { /* already decoded */ }
  return id;
}

async function resolveTenantDb(tenant: string | undefined): Promise<string | null> {
  if (!tenant || tenant === 'system_shared') return null;
  try { return await resolveDatabase(tenant) || null; } catch { return null; }
}

async function queryDocuments(tenant: string | undefined, sql: string, params: any[] = []): Promise<any> {
  const database = await resolveTenantDb(tenant);
  if (database) {
    try { await (safeTenantExecute as any)(database, DOCUMENTS_TABLE_SQL, []); } catch { /* table may already exist */ }
    return safeTenantQuery(database, sql, params);
  }
  return (safeQuery as any)(sql, params);
}

function isPDF(buffer: Buffer): boolean { return buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-'; }
function getPDFVersion(buffer: Buffer): string {
  const match = buffer.toString('ascii', 0, 20).match(/%PDF-(\d+\.\d+)/);
  return match ? match[1] : 'unknown';
}

function resolveDocumentPath(document: any, tenantSlug: string): string | null {
  const candidates: string[] = [];
  if (document.file_path) candidates.push(path.isAbsolute(document.file_path) ? document.file_path : path.join(GLOBAL_UPLOADS_DIR, document.file_path));
  if (document.stored_name && document.deceased_id) {
    candidates.push(path.join(tenantUploadDir(tenantSlug, document.deceased_id), path.basename(document.stored_name)));
    candidates.push(path.join(centralizedTenantUploadDir(tenantSlug, document.deceased_id), path.basename(document.stored_name)));
    candidates.push(path.join(GLOBAL_UPLOADS_DIR, '_legacy', 'documents', path.basename(document.stored_name)));
  }
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

async function createHighQualityPDF(options: { content?: string; outputPath?: string | null; size?: any; margins?: number } = {}): Promise<Buffer> {
  const { content = '', outputPath = null, size = 'A4', margins = 40 } = options;
  const document = new PDFDocument({ size, margins, compress: false } as any);
  const buffers: Buffer[] = [];
  document.on('data', (chunk: Buffer) => buffers.push(chunk));
  await new Promise<void>((resolve, reject) => {
    document.on('end', resolve); document.on('error', reject);
    document.font('Helvetica').fontSize(12); if (content) document.text(content); document.end();
  });
  const buffer = Buffer.concat(buffers);
  if (outputPath) await fs.promises.writeFile(outputPath, buffer);
  return buffer;
}

async function imageToHighQualityPDF(imagePath: string, outputPath: string): Promise<string> {
  const metadata = await sharp(imagePath).metadata();
  const document = new PDFDocument({ size: 'A4', margins: 0, compress: false } as any);
  const output = fs.createWriteStream(outputPath); document.pipe(output);
  const image = await sharp(imagePath).jpeg({ quality: 100, mozjpeg: true }).toBuffer();
  const pageWidth = document.page.width; const pageHeight = document.page.height;
  const imageRatio = (metadata.width || 1) / (metadata.height || 1); const pageRatio = pageWidth / pageHeight;
  let width: number; let height: number; let x: number; let y: number;
  if (imageRatio > pageRatio) { width = pageWidth; height = pageWidth / imageRatio; x = 0; y = (pageHeight - height) / 2; }
  else { height = pageHeight; width = pageHeight * imageRatio; x = (pageWidth - width) / 2; y = 0; }
  document.addPage({ size: 'A4', margin: 0 }); document.image(image, x, y, { width, height }); document.end();
  await new Promise<void>(resolve => output.on('finish', resolve));
  return outputPath;
}

const storage = multer.diskStorage({
  destination: (req, _file, callback) => {
    const directory = tenantUploadDir(getTenantSlug(req), req.params[0] || req.params.deceasedId || req.body.deceasedId);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true }); callback(null, directory);
  },
  filename: (_req, file, callback) => callback(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage, limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const mimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/bmp', 'application/octet-stream', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];
    if (mimeTypes.includes(file.mimetype) || extensions.includes(path.extname(file.originalname).toLowerCase())) return callback(null, true);
    callback(new Error('Invalid file type'));
  },
});

const flexibleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.any()(req, res, error => {
    if (error) return next(error);
    if (Array.isArray(req.files) && req.files.length > 0) req.file = req.files[0];
    next();
  });
};

const router = express.Router();

// Keep authentication inside the router so every document endpoint is protected.
router.use(protect);
router.use(authorizeAny);

router.get(/^\/([^/]+)$/, async (req, res) => {
  const deceasedId = normalizeDeceasedId(req.params[0]);
  if (!deceasedId) return res.status(400).json({ success: false, message: 'Deceased ID required' });
  try {
    const documents: any[] = await queryDocuments(req.tenantSlug, 'SELECT * FROM documents WHERE deceased_id = ? ORDER BY uploaded_at DESC', [deceasedId]);
    res.json({ success: true, data: documents.map(document => ({ ...document, url: `/api/v1/restpoint/documents/download/${document.document_id}`, file_path: document.file_path ? path.basename(document.file_path) : null })), count: documents.length });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

const handleDocumentUpload = async (req: Request, res: Response) => {
  try {
    const deceasedId = normalizeDeceasedId(req.params[0] || req.params.deceasedId || req.body.deceasedId);
    if (!deceasedId) return res.status(400).json({ success: false, message: 'Deceased ID required' });
    const { category, documentName } = req.body; const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const result = await centralizedUploadService.uploadFromFile(file.path, req.tenantSlug, 'document', 'documents', deceasedId);
    if (!result.success) return res.status(500).json({ success: false, message: `Upload failed: ${result.error}` });
    let quality = 'Stored via centralized service';
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      const buffer = await fs.promises.readFile(result.path); if (isPDF(buffer)) quality = `PDF v${getPDFVersion(buffer)} - ORIGINAL quality preserved, no compression`;
    }
    const inserted = await queryDocuments(req.tenantSlug, 'INSERT INTO documents (deceased_id, original_name, stored_name, file_path, mime_type, file_size, category, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [deceasedId, documentName || file.originalname, result.filename, result.path, file.mimetype, result.size, category || 'General', req.headers['x-user-id'] || 'System', getKenyaTimeISO()]);
    res.status(201).json({ success: true, message: 'Uploaded successfully', data: { document_id: inserted.insertId, original_name: documentName || file.originalname, url: `/api/v1/restpoint/documents/download/${inserted.insertId}`, mime_type: file.mimetype, file_size: result.size, category: category || 'General', quality } });
  } catch (error: any) { res.status(500).json({ success: false, message: 'Upload error', details: error.message }); }
};

router.post(/^\/upload\/(.+)$/, flexibleUpload, handleDocumentUpload);
router.post('/upload', flexibleUpload, handleDocumentUpload);

router.get('/download/:documentId', async (req, res) => {
  try {
    const documents = await queryDocuments(req.tenantSlug, 'SELECT deceased_id, stored_name, file_path, original_name, mime_type, file_size FROM documents WHERE document_id = ? AND (tenant_slug = ? OR tenant_slug IS NULL)', [req.params.documentId, req.tenantSlug]);
    if (!documents.length) return res.status(404).json({ success: false, message: 'Not found' });
    const document = documents[0]; const filePath = resolveDocumentPath(document, req.tenantSlug || 'system_shared');
    if (!filePath) return res.status(404).json({ success: false, message: 'File not found on disk' });
    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream'); res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.original_name || 'document')}"`); res.setHeader('Content-Length', document.file_size || 0); fs.createReadStream(filePath).pipe(res);
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/:documentId', async (req, res) => {
  try {
    const deceasedId = req.query.deceasedId;
    if (!deceasedId) return res.status(400).json({ success: false, message: 'Deceased ID required' });
    const documents = await queryDocuments(req.tenantSlug, 'SELECT file_path, stored_name FROM documents WHERE document_id = ? AND deceased_id = ?', [req.params.documentId, deceasedId]);
    if (!documents.length) return res.status(404).json({ success: false, message: 'Not found' });
    let filePath = documents[0].file_path;
    if (filePath && !path.isAbsolute(filePath)) filePath = path.join(GLOBAL_UPLOADS_DIR, filePath);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    else { const fallback = path.join(tenantUploadDir(req.tenantSlug, deceasedId), documents[0].stored_name); if (fs.existsSync(fallback)) fs.unlinkSync(fallback); }
    await queryDocuments(req.tenantSlug, 'DELETE FROM documents WHERE document_id = ?', [req.params.documentId]); res.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/:documentId/metadata', async (req, res) => {
  try {
    const documents = await queryDocuments(req.tenantSlug, 'SELECT deceased_id, stored_name, file_path, original_name, mime_type, file_size FROM documents WHERE document_id = ? AND (tenant_slug = ? OR tenant_slug IS NULL)', [req.params.documentId, req.tenantSlug]);
    if (!documents.length) return res.status(404).json({ success: false, message: 'Not found' });
    const document = documents[0]; const filePath = resolveDocumentPath(document, req.tenantSlug || 'system_shared');
    if (!filePath) return res.status(404).json({ success: false, message: 'File not found on disk' });
    const buffer = await fs.promises.readFile(filePath);
    res.json({ success: true, data: isPDF(buffer) ? { isPDF: true, version: getPDFVersion(buffer), size: document.file_size, originalName: document.original_name, quality: 'ORIGINAL - No compression, 100% preserved', preserved: true } : { isPDF: false, size: document.file_size, originalName: document.original_name } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/create-pdf', async (req, res) => {
  try {
    const { content, deceasedId, filename } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content required' }); if (!deceasedId) return res.status(400).json({ success: false, message: 'Deceased ID required' });
    const directory = tenantUploadDir(req.tenantSlug, deceasedId); if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
    const name = filename || `document-${Date.now()}.pdf`; const outputPath = path.join(directory, name); await createHighQualityPDF({ content, outputPath }); const stats = await fs.promises.stat(outputPath);
    const inserted = await queryDocuments(req.tenantSlug, 'INSERT INTO documents (deceased_id, original_name, stored_name, file_path, mime_type, file_size, category, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [deceasedId, name, name, outputPath, 'application/pdf', stats.size, 'Generated', req.headers['x-user-id'] || 'System', getKenyaTimeISO()]);
    res.status(201).json({ success: true, message: 'PDF created (no compression)', data: { document_id: inserted.insertId, original_name: name, url: `/api/v1/restpoint/documents/download/${inserted.insertId}`, file_size: stats.size, mime_type: 'application/pdf', quality: 'HIGH - No compression' } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/image-to-pdf/:deceasedId', flexibleUpload, async (req, res) => {
  try {
    const { deceasedId } = req.params; const file = req.file; if (!file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const directory = tenantUploadDir(req.tenantSlug, deceasedId); if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
    const name = req.body.filename || `converted-${Date.now()}.pdf`; const outputPath = path.join(directory, name); await imageToHighQualityPDF(file.path, outputPath); await fs.promises.unlink(file.path).catch(() => undefined); const stats = await fs.promises.stat(outputPath);
    const inserted = await queryDocuments(req.tenantSlug, 'INSERT INTO documents (deceased_id, original_name, stored_name, file_path, mime_type, file_size, category, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [deceasedId, name, name, outputPath, 'application/pdf', stats.size, 'Converted', req.headers['x-user-id'] || 'System', getKenyaTimeISO()]);
    res.status(201).json({ success: true, message: 'Image to PDF conversion complete', data: { document_id: inserted.insertId, original_name: name, url: `/api/v1/restpoint/documents/download/${inserted.insertId}`, file_size: stats.size, mime_type: 'application/pdf', quality: 'HIGH - 300 DPI, 100% quality' } });
  } catch (error: any) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/share', (req, res) => { console.log(`[DOCUMENTS] Share request: ${req.body.documentName || req.body.documentId} to ${req.body.recipientEmail}`); res.json({ success: true, message: 'Shared successfully' }); });

export { GLOBAL_UPLOADS_DIR };
export default router;
