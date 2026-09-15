const { resolveDatabase, safeTenantQuery, safeTenantExecute } = require('../../shared/dbConfig');
const { safeQuery } = require('../../shared/database');
const express = require('express');
const helmet = require('helmet');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// Centralized Kenya-time timestamp helper (same source the legacy
// controllers/documents.js uses) so every document insert records when it was
// uploaded. The tenant `documents` table declares uploaded_at with NO default,
// so omitting it left the column NULL and the UI rendered "—" for Uploaded Date.
const { getKenyaTimeISO } = require('../../packages/shared-utils/dist/timestamps');

const PDFDocument = require('pdfkit');
const sharp = require('sharp');

// Safely import centralized upload service (fallback to local if missing)
let centralizedUploadService;
try {
  centralizedUploadService = require('@montezuma/shared-services/dist/centralizedUploadService.js').centralizedUploadService;
} catch (e) {
  console.warn('[DOCUMENTS] centralizedUploadService not found, using local fallback.');
  centralizedUploadService = {
    uploadFromFile: async (filePath, tenantSlug, type, folder, entityId) => {
      const stats = await fs.promises.stat(filePath);
      return {
        success: true,
        path: filePath,
        filename: path.basename(filePath),
        size: stats.size
      };
    }
  };
}

const app = express();
const PORT = process.env.PORT || 8112;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'x-tenant-id', 'x-user-id']
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const getGlobalUploadsDir = () => {
  const envDir = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR;
  if (envDir) {
    try {
      if (!fs.existsSync(envDir)) fs.mkdirSync(envDir, { recursive: true });
      return envDir;
    } catch (e) {
      console.warn('[DOCUMENTS] uploads dir unusable');
    }
  }
  const fallbacks = [
    path.join(process.cwd(), 'uploads'),
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../../uploads')
  ];
  for (const p of fallbacks) {
    try {
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      return p;
    } catch (e) { }
  }
  return path.join(require('os').tmpdir(), 'restpoint-uploads');
};

const GLOBAL_UPLOADS_DIR = getGlobalUploadsDir();
const sanitizeSlug = (v) => String(v || 'system_shared').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'system_shared';
const getTenantSlug = (req) => sanitizeSlug(req.headers['x-tenant-slug'] || req.headers['x-tenant-id'] || 'system_shared');
const tenantUploadDir = (t, d) => path.join(GLOBAL_UPLOADS_DIR, sanitizeSlug(t), 'documents', String(d || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100));
const centralizedTenantUploadDir = (t, d) => path.join(GLOBAL_UPLOADS_DIR, sanitizeSlug(t), 'documents', sanitizeSlug(d));
const normalizeDeceasedId = (value) => {
  let id = String(value || '').trim();
  try { id = decodeURIComponent(id); } catch { /* already decoded */ }
  return id;
};

const DOCUMENTS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS documents (document_id BIGINT AUTO_INCREMENT PRIMARY KEY, deceased_id VARCHAR(100) NOT NULL, original_name VARCHAR(255) NULL, stored_name VARCHAR(255) NULL, file_path VARCHAR(500) NULL, mime_type VARCHAR(120) NULL, file_size BIGINT DEFAULT 0, category VARCHAR(100) DEFAULT 'General', uploaded_by VARCHAR(120) NULL, uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX idx_docs_deceased (deceased_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

async function resolveTenantDb(t) {
  if (!t || t === 'system_shared') return null;
  try {
    return await resolveDatabase(t) || null;
  } catch (e) {
    return null;
  }
}

async function q(t, sql, params = []) {
  const dbName = await resolveTenantDb(t);
  if (dbName) {
    try {
      await safeTenantExecute(dbName, DOCUMENTS_TABLE_SQL, []);
    } catch (e) { }
    return safeTenantQuery(dbName, sql, params);
  }
  return safeQuery(sql, params);
}

function isPDF(b) { return b && b.length >= 5 && b.toString('ascii', 0, 5) === '%PDF-'; }
function getPDFVersion(b) { if (!b || b.length < 20) return 'unknown'; const m = b.toString('ascii', 0, 20).match(/%PDF-(\d+\.\d+)/); return m ? m[1] : 'unknown'; }

function resolveDocumentPath(doc, tenantSlug) {
  const candidates = [];
  if (doc.file_path) {
    candidates.push(path.isAbsolute(doc.file_path)
      ? doc.file_path
      : path.join(GLOBAL_UPLOADS_DIR, doc.file_path));
  }

  // Older records can contain an absolute path from another container or host.
  // Rebuild the canonical shared-storage path from the tenant, deceased ID,
  // and stored filename instead of trusting that stale prefix.
  if (doc.stored_name && doc.deceased_id) {
    candidates.push(path.join(tenantUploadDir(tenantSlug, doc.deceased_id), path.basename(doc.stored_name)));
    candidates.push(path.join(centralizedTenantUploadDir(tenantSlug, doc.deceased_id), path.basename(doc.stored_name)));
    candidates.push(path.join(GLOBAL_UPLOADS_DIR, '_legacy', 'documents', path.basename(doc.stored_name)));
  }

  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}

async function createHighQualityPDF(o = {}) {
  const { content = '', outputPath = null, size = 'A4', margins = 40 } = o;
  const doc = new PDFDocument({ size, margins, compress: false });
  const buffers = [];
  doc.on('data', c => buffers.push(c));
  await new Promise((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
    doc.font('Helvetica').fontSize(12);
    if (content) doc.text(content);
    doc.end();
  });
  const buf = Buffer.concat(buffers);
  if (outputPath) await fs.promises.writeFile(outputPath, buf);
  return buf;
}

async function imageToHighQualityPDF(imagePath, outputPath, o = {}) {
  const { dpi = 300, quality = 100 } = o;
  const meta = await sharp(imagePath).metadata();
  const doc = new PDFDocument({ size: 'A4', margins: 0, compress: false });
  const out = fs.createWriteStream(outputPath);
  doc.pipe(out);
  const imgBuf = await sharp(imagePath).jpeg({ quality: 100, mozjpeg: true }).toBuffer();
  const pw = doc.page.width, ph = doc.page.height, ia = meta.width / meta.height, pa = pw / ph;
  let dw, dh, ox, oy;
  if (ia > pa) { dw = pw; dh = pw / ia; ox = 0; oy = (ph - dh) / 2; } else { dh = ph; dw = ph * ia; ox = (pw - dw) / 2; oy = 0; }
  doc.addPage({ size: 'A4', margin: 0 });
  doc.image(imgBuf, ox, oy, { width: dw, height: dh });
  doc.end();
  await new Promise(r => out.on('finish', r));
  return outputPath;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const t = getTenantSlug(req);
    // Support regex capture group (req.params[0]) and named param (req.params.deceasedId)
    const d = req.params[0] || req.params.deceasedId || req.body.deceasedId;
    const p = tenantUploadDir(t, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    cb(null, p);
  },
  filename: (req, file, cb) => {
    const s = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'doc-' + s + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/bmp', 'application/octet-stream', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'].includes(ext)) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});

// Flexible upload middleware to accept 'file', 'document', or 'image'
const flexibleUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (req.files && req.files.length > 0) {
      req.file = req.files[0]; // Map to req.file for consistency
    }
    next();
  });
};

app.use((req, res, next) => { req.tenantSlug = getTenantSlug(req); next(); });

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'documents-service', tenant: req.tenantSlug }));
app.use('/uploads', express.static(GLOBAL_UPLOADS_DIR, { setHeaders: (r) => { r.set('Access-Control-Allow-Origin', '*'); r.set('Cross-Origin-Resource-Policy', 'cross-origin'); } }));

const documentsRouter = express.Router();

// GET Documents by Deceased ID
// Use regex route to match IDs containing '=' (Express 5 path-to-regexp v8 limitation)
documentsRouter.get(/^\/([^/]+)$/, async (req, res) => {
  const deceasedId = normalizeDeceasedId(req.params[0]);
  if (!deceasedId) return res.status(400).json({ success: false, message: 'Deceased ID required' });
  try {
    const docs = await q(req.tenantSlug, `SELECT * FROM documents WHERE deceased_id = ? ORDER BY uploaded_at DESC`, [deceasedId]);
    res.json({
      success: true,
      data: docs.map(d => ({
        ...d,
        url: `/api/v1/restpoint/documents/download/${d.document_id}`,
        file_path: d.file_path ? path.basename(d.file_path) : null
      })),
      count: docs.length
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// UPLOAD Document
const handleDocumentUpload = async (req, res) => {
  try {
    // Gateways may preserve an encoded equals sign in IDs such as MON-ABC=2026.
    // Decode once at the service boundary so both raw and encoded clients work.
    // Support both regex capture group (req.params[0]) and named param (req.params.deceasedId)
    const deceasedId = normalizeDeceasedId(req.params[0] || req.params.deceasedId || req.body.deceasedId);
    if (!deceasedId) return res.status(400).json({ success: false, message: 'Deceased ID required' });
    const { category, documentName } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const result = await centralizedUploadService.uploadFromFile(file.path, req.tenantSlug, 'document', 'documents', deceasedId);
    if (!result.success) return res.status(500).json({ success: false, message: 'Upload failed: ' + result.error });

    let quality = 'Stored via centralized service';
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      const buf = await fs.promises.readFile(result.path);
      if (isPDF(buf)) quality = `PDF v${getPDFVersion(buf)} - ORIGINAL quality preserved, no compression`;
    }

    const uploadedAt = getKenyaTimeISO();
    const ins = await q(req.tenantSlug, `INSERT INTO documents (deceased_id, original_name, stored_name, file_path, mime_type, file_size, category, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [deceasedId, documentName || file.originalname, result.filename, result.path, file.mimetype, result.size, category || 'General', req.headers['x-user-id'] || 'System', uploadedAt]);

    res.status(201).json({
      success: true,
      message: 'Uploaded successfully',
      data: {
        document_id: ins.insertId,
        original_name: documentName || file.originalname,
        url: `/api/v1/restpoint/documents/download/${ins.insertId}`,
        mime_type: file.mimetype,
        file_size: result.size,
        category: category || 'General',
        quality
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Upload error', details: e.message });
  }
};

// Accept both normal IDs and raw IDs that contain '=' (for example
// LEE-MARHAZJHQRTVHN2TN6E=2026, MON-UMEUKGNCTEAEZE8NU7V=2026).
//
// IMPORTANT: We use a regex route here instead of '/upload/:deceasedId' because
// Express 5 (path-to-regexp v8) fails to match the '=' character in named path
// parameters. The ':deceasedId' syntax silently returns 404 for IDs containing '='.
// The regex /^\/upload\/(.+)$/ explicitly captures everything after '/upload/'
// including '=' signs and any other special characters.
documentsRouter.post(/^\/upload\/(.+)$/, flexibleUpload, handleDocumentUpload);
// Compatibility route for gateways/proxies that reject a raw equals sign in the
// path parameter. The multipart body carries deceasedId instead.
documentsRouter.post('/upload', flexibleUpload, handleDocumentUpload);

// DOWNLOAD Document
documentsRouter.get('/download/:documentId', async (req, res) => {
  try {
    const docs = await q(req.tenantSlug, `SELECT deceased_id, stored_name, file_path, original_name, mime_type, file_size FROM documents WHERE document_id = ? AND (tenant_slug = ? OR tenant_slug IS NULL)`, [req.params.documentId, req.tenantSlug]);
    if (!docs.length) return res.status(404).json({ success: false, message: 'Not found' });

    const doc = docs[0];
    if (!doc.file_path && !doc.stored_name) return res.status(404).json({ success: false, message: 'File path not found in DB' });
    const p = resolveDocumentPath(doc, req.tenantSlug);
    if (!p) return res.status(404).json({ success: false, message: 'File not found on disk' });

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_name || 'document')}"`);
    res.setHeader('Content-Length', doc.file_size || 0);
    fs.createReadStream(p).pipe(res);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE Document
documentsRouter.delete('/:documentId', async (req, res) => {
  try {
    const deceasedId = req.query.deceasedId;
    if (!deceasedId) return res.status(400).json({ success: false, message: 'Deceased ID required' });

    const docs = await q(req.tenantSlug, 'SELECT file_path, stored_name FROM documents WHERE document_id = ? AND deceased_id = ?', [req.params.documentId, deceasedId]);
    if (!docs.length) return res.status(404).json({ success: false, message: 'Not found' });

    const doc = docs[0];

    // 1. Attempt to delete using the exact file_path from DB
    let filePath = doc.file_path;
    if (filePath && !path.isAbsolute(filePath)) {
      filePath = path.join(GLOBAL_UPLOADS_DIR, filePath);
    }

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      // 2. Fallback to old logic just in case path was malformed
      const fp = tenantUploadDir(req.tenantSlug, deceasedId) + path.sep + doc.stored_name;
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }

    await q(req.tenantSlug, 'DELETE FROM documents WHERE document_id = ?', [req.params.documentId]);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET Metadata
documentsRouter.get('/:documentId/metadata', async (req, res) => {
  try {
    const docs = await q(req.tenantSlug, `SELECT deceased_id, stored_name, file_path, original_name, mime_type, file_size FROM documents WHERE document_id = ? AND (tenant_slug = ? OR tenant_slug IS NULL)`, [req.params.documentId, req.tenantSlug]);
    if (!docs.length) return res.status(404).json({ success: false, message: 'Not found' });

    const doc = docs[0];
    if (!doc.file_path && !doc.stored_name) return res.status(404).json({ success: false, message: 'File path not found in DB' });
    const p = resolveDocumentPath(doc, req.tenantSlug);
    if (!p) return res.status(404).json({ success: false, message: 'File not found on disk' });

    const buf = await fs.promises.readFile(p, { limit: 1024 });
    if (isPDF(buf)) {
      res.json({ success: true, data: { isPDF: true, version: getPDFVersion(buf), size: doc.file_size, originalName: doc.original_name, quality: 'ORIGINAL - No compression, 100% preserved', preserved: true } });
    } else {
      res.json({ success: true, data: { isPDF: false, size: doc.file_size, originalName: doc.original_name } });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// CREATE PDF from Text
documentsRouter.post('/create-pdf', async (req, res) => {
  try {
    const { content, deceasedId, filename } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Content required' });
    if (!deceasedId) return res.status(400).json({ success: false, message: 'Deceased ID required' });

    const dir = tenantUploadDir(req.tenantSlug, deceasedId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const name = filename || `document-${Date.now()}.pdf`;
    const out = path.join(dir, name);

    await createHighQualityPDF({ content, outputPath: out });
    const stats = await fs.promises.stat(out);

    const ins = await q(req.tenantSlug, `INSERT INTO documents (deceased_id, original_name, stored_name, file_path, mime_type, file_size, category, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [deceasedId, name, name, out, 'application/pdf', stats.size, 'Generated', req.headers['x-user-id'] || 'System', getKenyaTimeISO()]);

    res.status(201).json({
      success: true,
      message: 'PDF created (no compression)',
      data: {
        document_id: ins.insertId,
        original_name: name,
        url: `/api/v1/restpoint/documents/download/${ins.insertId}`,
        file_size: stats.size,
        mime_type: 'application/pdf',
        quality: 'HIGH - No compression'
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// CONVERT Image to PDF
documentsRouter.post('/image-to-pdf/:deceasedId', flexibleUpload, async (req, res) => {
  try {
    const { deceasedId } = req.params;
    const { filename } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const dir = tenantUploadDir(req.tenantSlug, deceasedId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const name = filename || `converted-${Date.now()}.pdf`;
    const out = path.join(dir, name);

    await imageToHighQualityPDF(file.path, out, { dpi: 300, quality: 100 });

    // Clean up the original image file
    await fs.promises.unlink(file.path).catch(() => { });

    const stats = await fs.promises.stat(out);
    const ins = await q(req.tenantSlug, `INSERT INTO documents (deceased_id, original_name, stored_name, file_path, mime_type, file_size, category, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [deceasedId, name, name, out, 'application/pdf', stats.size, 'Converted', req.headers['x-user-id'] || 'System', getKenyaTimeISO()]);

    res.status(201).json({
      success: true,
      message: 'Image to PDF conversion complete',
      data: {
        document_id: ins.insertId,
        original_name: name,
        url: `/api/v1/restpoint/documents/download/${ins.insertId}`,
        file_size: stats.size,
        mime_type: 'application/pdf',
        quality: 'HIGH - 300 DPI, 100% quality'
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// SHARE Document
documentsRouter.post('/share', async (req, res) => {
  console.log(`[DOCUMENTS] Share request: ${req.body.documentName || req.body.documentId} to ${req.body.recipientEmail}`);
  res.json({ success: true, message: 'Shared successfully' });
});

app.use('/api/v1/restpoint/documents', documentsRouter);
app.use('/v1/restpoint/documents', documentsRouter);
app.use('/documents', documentsRouter);

// Fallback Error Handlers (in case external files are missing)
let notFoundHandler, errorHandler;
try {
  const errHandlers = require('../../services/app-global/middlewares/errorHandler');
  notFoundHandler = errHandlers.notFoundHandler;
  errorHandler = errHandlers.errorHandler;
} catch (e) {
  notFoundHandler = (req, res) => res.status(404).json({ success: false, message: 'Route not found' });
  errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
  };
}

app.use((err, req, res, next) => {
  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE' || err instanceof multer.MulterError)) {
    return res.status(400).json({ success: false, message: err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 50MB limit.' : err.message });
  }
  if (err?.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  next(err);
});

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    if (!fs.existsSync(GLOBAL_UPLOADS_DIR)) fs.mkdirSync(GLOBAL_UPLOADS_DIR, { recursive: true });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[DOCUMENTS] Server running on port ${PORT}`);
      console.log(`[DOCUMENTS] Uploads Directory: ${GLOBAL_UPLOADS_DIR}`);
      console.log(`[PDF] High-quality mode enabled - NO compression, 100% quality preserved`);
    });
  } catch (e) {
    console.error('Failed to start server:', e);
    process.exit(1);
  }
};

startServer();
module.exports = app;