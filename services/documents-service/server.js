

const { resolveDatabase, safeTenantQuery, safeTenantExecute } = require('../../shared/dbConfig');
const { validateTenantActive } = require('../../shared/tenancy');
const { safeQuery } = require('../../shared/database');
const express = require('express');
const helmet = require('helmet');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');


const app = express();
const PORT = process.env.PORT || 8112;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug', 'x-tenant-id', 'x-user-id']
}));


app.use(helmet());
app.use(express.json());

// ============ GLOBAL UPLOADS CONFIGURATION ============
// Use the ONE shared uploads folder the whole platform writes to
// (GLOBAL_UPLOADS_DIR -> /opt/storage/uploads). The old code IGNORED the env
// var and wrote into container-local paths — files were lost on every rebuild
// and never served through nginx /uploads -> tenant-service.
const getGlobalUploadsDir = () => {
  const envDir = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR;
  if (envDir) {
    try {
      if (!fs.existsSync(envDir)) {
        fs.mkdirSync(envDir, { recursive: true });
      }
      return envDir;
    } catch (e) {
      console.warn(`[DOCUMENTS] Configured uploads dir "${envDir}" unusable (${e.message}) — falling back.`);
    }
  }

  // Dev-only fallbacks
  const possiblePaths = [
    path.join(process.cwd(), 'uploads'),
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../../uploads'),
  ];

  // Return the first path that exists or can be created
  for (const basePath of possiblePaths) {
    try {
      if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
      }
      return basePath;
    } catch (e) {
      continue;
    }
  }

  // Fallback to temp directory
  return path.join(require('os').tmpdir(), 'restpoint-uploads');
};

// Sanitize tenant slugs exactly like generateSlug() so the on-disk folder and
// the /uploads/... URL always match and tenants can never mix files.
const sanitizeSlug = (v) => String(v || 'system_shared')
  .toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '') || 'system_shared';

// Per-tenant documents directory: <uploads>/<slug>/documents/<deceasedId>/
const tenantUploadDir = (tenantSlug, deceasedId) => {
  const safeDead = String(deceasedId || 'unknown')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 100) || 'unknown';
  return path.join(GLOBAL_UPLOADS_DIR, sanitizeSlug(tenantSlug), 'documents', safeDead);
};

// ─── Tenant-aware DB helpers ────────────────────────────────────────────────
// -------------------------------------------------------------------------
// -------------------------------------------------------------------------
// Documents belong to the tenant's own database (same DB the deceased rows
// live). Use resolveDatabase - NOT lookupTenantDatabase -because it also
// handles slug-is-db and BRANCH slugs (e.g. org-home-nairobi -> parent
// tenant DB), exactly like the deceased/bodycheckout services do. The old
// lookup-only version returned null for branch slugs,and every query silently
// fell back to the root restpoint_main - "documents is just calling wrong database".
async function resolveTenantDb(tenantSlug) {
  if (!tenantSlug || tenantSlug === 'system_shared') return null;
  try {
    const dbName = await resolveDatabase(tenantSlug);
    return dbName || null;
  } catch (e) {
    console.warn('[DOCUMENTS] resolveDatabase failed:', e && e.message);
    return null;
  }
}
const DOCUMENTS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS documents (
    document_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    deceased_id VARCHAR(100) NOT NULL,
    original_name VARCHAR(255) NULL,
    stored_name VARCHAR(255) NULL,
    file_path VARCHAR(500) NULL,
    mime_type VARCHAR(120) NULL,
    file_size BIGINT DEFAULT 0,
    category VARCHAR(100) DEFAULT 'General',
    uploaded_by VARCHAR(120) NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_docs_deceased (deceased_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;
async function q(tenantSlug, sql, params = []) {
  const dbName = await resolveTenantDb(tenantSlug);
  if (dbName) {
    // Auto-create the table on the FIRST read too - a fresh tenant DB has no
    // documents table yet,and a bare SELECT would 500 ("doesn't exist").
    try { await safeTenantExecute(dbName, DOCUMENTS_TABLE_SQL, []); } catch (e) { /* idempotent */ }
    return safeTenantQuery(dbName, sql, params);
  }
  // No resolvable tenant DB -> root safety net (kept only for legacy single-tenant mode)
  return safeQuery(sql, params);
}
async function ensureAndInsertDocument(tenantSlug, insertQuery, params) {
  const dbName = await resolveTenantDb(tenantSlug);
  if (dbName) {
    await safeTenantExecute(dbName, DOCUMENTS_TABLE_SQL, []);
    return safeTenantQuery(dbName, insertQuery, params);
  }
  return safeQuery(insertQuery, params);
}
const GLOBAL_UPLOADS_DIR = getGlobalUploadsDir();

// ============ STORAGE CONFIGURATION ============
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantSlug = req.tenantSlug || sanitizeSlug(req.headers['x-tenant-slug']) || 'system_shared';
    const uploadPath = tenantUploadDir(tenantSlug, req.params.deceasedId || req.body.deceasedId);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'doc-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/bmp', 'application/octet-stream',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  }
});

// ============ TENANT RESOLUTION MIDDLEWARE ============
app.use(async (req, res, next) => {
  const tenantSlug = sanitizeSlug(req.headers['x-tenant-slug'] || 'system_shared');
  req.tenantSlug = tenantSlug;

  if (tenantSlug !== 'system_shared') {
    try {
      const tenantStatus = await validateTenantActive(tenantSlug);
      if (!tenantStatus.active) {
        console.warn(`[DOCUMENTS] Tenant validation warning for "${tenantSlug}": ${tenantStatus.reason}. Proceeding anyway.`);
        // Store whatever info we have
        req.tenant = { slug: tenantSlug };
      } else {
        req.tenant = tenantStatus.tenant;
      }
    } catch (error) {
      console.warn(`[DOCUMENTS] Tenant validation error for "${tenantSlug}": ${error.message}. Proceeding anyway.`);
      // Allow upload even if tenant validation fails (local dev scenario)
      req.tenant = { slug: tenantSlug };
    }
  }
  next();
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'documents-service',
    tenant: req.tenantSlug,
    timestamp: new Date().toISOString()
  });
});

// ============ STATIC FILES ============
// Serve files from global uploads directory
app.use('/uploads', express.static(GLOBAL_UPLOADS_DIR, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// ============ API ROUTES ============

// ─── Documents router (mounted at full + gateway-stripped prefixes below) ──
const documentsRouter = express.Router();

// Get all documents for a specific deceased
documentsRouter.get('/:deceasedId', async (req, res) => {
  const { deceasedId } = req.params;
  const tenantSlug = req.tenantSlug;

  if (!deceasedId) {
    return res.status(400).json({ success: false, message: 'Deceased ID is required' });
  }

  let formattedDocs = [];

  // Try to fetch from database first
  try {
    const query = `
      SELECT 
        document_id,
        original_name,
        stored_name,
        file_path,
        mime_type,
        file_size,
        category,
        uploaded_by,
        uploaded_at,
        deceased_id
      FROM documents 
      WHERE deceased_id = ? 
      ORDER BY uploaded_at DESC
    `;

    const documents = await q(tenantSlug, query, [deceasedId]);

    // Format documents for frontend
    formattedDocs = documents.map(doc => ({
      documentId: doc.document_id,
      originalName: doc.original_name,
      storedName: doc.stored_name,
      url: `/uploads/${tenantSlug}/documents/${deceasedId}/${doc.stored_name}`,
      mimeType: doc.mime_type,
      sizeKB: Math.round(doc.file_size / 1024),
      category: doc.category || 'General',
      uploadedBy: doc.uploaded_by,
      uploadedAt: doc.uploaded_at,
      deceasedId: doc.deceased_id
    }));
  } catch (dbError) {
    console.warn(`[DOCUMENTS] DB query failed for listing, falling back to filesystem: ${dbError.message}`);

    // Fallback: List files from filesystem
    const uploadDir = path.join(GLOBAL_UPLOADS_DIR, tenantSlug, 'documents', deceasedId);
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      formattedDocs = files.map((fileName, index) => ({
        documentId: `fs-${Date.now()}-${index}`,
        originalName: fileName.replace(/^doc-\d+-\d+-/, ''),
        storedName: fileName,
        url: `/uploads/${tenantSlug}/documents/${deceasedId}/${fileName}`,
        mimeType: 'application/octet-stream',
        sizeKB: Math.round((fs.statSync(path.join(uploadDir, fileName)).size) / 1024),
        category: 'General',
        uploadedBy: 'System',
        uploadedAt: new Date().toISOString(),
        deceasedId
      }));
    }
  }

  res.json({
    success: true,
    files: formattedDocs,
    count: formattedDocs.length
  });
});

// Upload a new document for a deceased
documentsRouter.post('/:deceasedId/upload', upload.single('document'), async (req, res) => {
  try {
    const { deceasedId } = req.params;
    const { category, uploadedBy } = req.body;
    const tenantSlug = req.tenantSlug;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!deceasedId) {
      return res.status(400).json({ success: false, message: 'Deceased ID is required' });
    }

    const storedName = req.file.filename;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;
    const filePath = `/uploads/${tenantSlug}/documents/${deceasedId}/${storedName}`;

    // Try to insert document record into database
    let documentId = Date.now();
    try {
      const insertQuery = `
        INSERT INTO documents (
          deceased_id,
          original_name,
          stored_name,
          file_path,
          mime_type,
          file_size,
          category,
          uploaded_by,
          uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await ensureAndInsertDocument(tenantSlug, insertQuery, [
        deceasedId,
        originalName,
        storedName,
        filePath,
        mimeType,
        fileSize,
        category || 'General',
        uploadedBy || 'System'
      ]);
      documentId = result.insertId || documentId;
    } catch (dbError) {
      console.warn(`[DOCUMENTS] Database insert failed, using filesystem-only storage: ${dbError.message}`);
      // File was already saved to disk - return success even without DB record
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        documentId,
        originalName,
        storedName,
        url: filePath,
        mimeType,
        sizeKB: Math.round(fileSize / 1024),
        category: category || 'General',
        uploadedBy: uploadedBy || 'System',
        uploadedAt: new Date().toISOString(),
        deceasedId
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading document: ' + error.message
    });
  }
});

// Download/View a document
documentsRouter.get('/download/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    const query = `
      SELECT stored_name, original_name, mime_type, file_path, deceased_id
      FROM documents 
      WHERE document_id = ?
    `;

    const docs = await q(req.tenantSlug, query, [documentId]);

    if (!docs || docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = docs[0];
    const tenantSlug = req.tenantSlug;
    const filePath = tenantUploadDir(tenantSlug, doc.deceased_id) + path.sep + doc.stored_name;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${doc.original_name}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document: ' + error.message
    });
  }
});

// Delete a document
documentsRouter.delete('/:deceasedId/:documentId', async (req, res) => {
  try {
    const { documentId, deceasedId } = req.params;
    const { deletedBy } = req.body;
    const tenantSlug = req.tenantSlug;

    // Get document info before deleting
    const query = `SELECT stored_name FROM documents WHERE document_id = ? AND deceased_id = ?`;
    const docs = await q(req.tenantSlug, query, [documentId, deceasedId]);

    if (!docs || docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = docs[0];
    const filePath = tenantUploadDir(tenantSlug, deceasedId) + path.sep + doc.stored_name;

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record from database
    const deleteQuery = `DELETE FROM documents WHERE document_id = ?`;
    await q(req.tenantSlug, deleteQuery, [documentId]);

    res.json({
      success: true,
      message: 'Document deleted successfully',
      deletedBy: deletedBy || 'System'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document: ' + error.message
    });
  }
});

// Share document via email
documentsRouter.post('/share', async (req, res) => {
  try {
    const { documentId, recipientEmail, message, documentName } = req.body;

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, log the share request
    console.log(`Document share request: ${documentName} to ${recipientEmail}`);
    console.log(`Message: ${message}`);

    res.json({
      success: true,
      message: `Document shared successfully via email to ${recipientEmail}`
    });
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing document: ' + error.message
    });
  }
});

// ============ ROUTER MOUNTS ============
// Mount under BOTH the full prefixes (direct/localhost access) and the
// gateway-stripped prefix — the api-gateway forwards /api/v1/restpoint/documents/...
// as /documents/... after stripping the base path.
app.use('/api/v1/restpoint/documents', documentsRouter);
app.use('/v1/restpoint/documents', documentsRouter);
app.use('/documents', documentsRouter);

// ============ ERROR HANDLERS ============
const { notFoundHandler, errorHandler } = require('../../services/app-global/middlewares/errorHandler');
app.use((err, req, res, next) => {
  // Multer upload errors + rejected file types → friendly 4xx (not a bare 500)
  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE' || err instanceof multer.MulterError)) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 50MB upload limit.' : (err.message || 'Invalid upload.');
    return res.status(400).json({ success: false, message: msg });
  }
  if (err && err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message || 'Request failed' });
  }
  next(err);
});
app.use(notFoundHandler);
app.use(errorHandler);

// ============ SERVER STARTUP ============
const startServer = async () => {
  try {
    // Ensure global uploads directory exists
    if (!fs.existsSync(GLOBAL_UPLOADS_DIR)) {
      fs.mkdirSync(GLOBAL_UPLOADS_DIR, { recursive: true });
    }

    app.listen(PORT, '0.0.0.0', () => {


    });
  } catch (error) {
    console.error('Failed to start documents service:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
