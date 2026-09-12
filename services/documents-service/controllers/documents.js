const path = require('path');
const fs = require('fs');
const { lookupTenantDatabase, safeTenantQuery } = require('../../shared/dbConfig');
const { getKenyaTimeISO } = require('../../../packages/shared-utils/dist/timestamps');
/**
 * Resolve the canonical global uploads directory, honouring the platform
 * GLOBAL_UPLOADS_DIR / UPLOADS_BASE_DIR env vars first (same logic as server.js)
 * so this controller never falls back to a repo-local path.
 */
function resolveGlobalUploadsDir() {
  for (const envDir of [process.env.GLOBAL_UPLOADS_DIR, process.env.UPLOADS_BASE_DIR].filter(Boolean)) {
    try {
      fs.mkdirSync(envDir, { recursive: true });
      return envDir;
    } catch (e) {
      console.warn(`[DOCUMENTS] GLOBAL_UPLOADS_DIR not writable (${envDir}):`, e.message);
    }
  }


  for (const basePath of [
    path.join(process.cwd(), 'uploads'),
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../../uploads'),
  ]) {
    try {
      fs.mkdirSync(basePath, { recursive: true });
      return basePath;
    } catch (e) { }
  }
  return path.join(require('os').tmpdir(), 'restpoint-uploads');
}

const GLOBAL_UPLOADS_DIR = resolveGlobalUploadsDir();

function documentsDir(tenantSlug, deceasedId) {
  const dir = path.join(GLOBAL_UPLOADS_DIR, 'documents', tenantSlug, deceasedId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function normalizeDeceasedId(value) {
  let id = String(value || '').trim();
  try { id = decodeURIComponent(id); } catch (e) { /* already decoded */ }
  return id;
}

function absoluteStoredPath(storedPath) {
  // stored_path is stored as "/uploads/documents/{tenant}/{deceased}/{file}" —
  // resolve under GLOBAL_UPLOADS_DIR by stripping the leading "/uploads" prefix.
  const rel = String(storedPath || '').replace(/^\/?(uploads[\\/])*/, '');
  return path.join(GLOBAL_UPLOADS_DIR, rel);
}
/**
 * Ensure folder exists with retry mechanism
 */
function ensureFolderExists(dir, retries = 3, delay = 100) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        resolve();
      } catch (err) {
        if (retries > 0) {
          retries--;
          setTimeout(attempt, delay);
        } else {
          reject(err);
        }
      }
    };
    attempt();
  });
}
/**
 * Convert absolute path to relative URL for browser/DB
 */
function normalizePath(filePath) {
  return filePath
    ? filePath.replace(
      /^.*[\\/]uploads[\\/]documents[\\/]/,
      '/uploads/documents/',
    )
    : null;
}

/**
 * Get tenant slug from request headers for multi-tenancy
 * Falls back to 'system_shared' if not provided
 */
function getTenantSlug(req) {
  return req.headers['x-tenant-slug'] || req.headers['x-tenant-id'] || 'system_shared';
}
/**
 * Upload a document for a deceased record
 * Multi-tenant aware: files are stored in tenant-specific folders, DB records in tenant DB
 */
const uploadDocument = async (req, res) => {
  try {
    // Get tenant slug for multi-tenancy isolation
    const tenantSlug = getTenantSlug(req);
    // Resolve tenant database
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ message: 'Tenant database not found' });
    }
    // FIX: Use deceasedId to match the route parameter name
    const deceasedId = normalizeDeceasedId(req.params.deceasedId);
    const type = req.body.type || req.body.category || 'General';
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if deceased exists in tenant database
    const lookupValue = normalizeDeceasedId(deceasedId);
    const deceasedCheck = await safeTenantQuery(
      dbName,
      'SELECT id, deceased_id FROM deceased WHERE deceased_id = ? OR admission_number = ? OR (deceased_id REGEXP "^[0-9]+$" AND id = ?) LIMIT 1',
      [lookupValue, lookupValue, lookupValue],
    );

    if (deceasedCheck.length === 0) {
      return res.status(404).json({ message: 'Deceased record not found' });
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        message: 'Invalid file type. Only PDF and image files are allowed.',
      });
    }
    // Multi-tenant folder structure: {GLOBAL_UPLOADS_DIR}/documents/{tenantSlug}/{deceasedId}/
    const canonicalDeceasedId = deceasedCheck[0].deceased_id || lookupValue;
    const uploadDir = documentsDir(tenantSlug, canonicalDeceasedId);
    await ensureFolderExists(uploadDir);

    const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 10000)}${path.extname(file.originalname)}`;
    const finalPath = path.join(uploadDir, uniqueName);

    const uploadedAt = getKenyaTimeISO();
    const createdAt = getKenyaTimeISO();

    const relativePath = normalizePath(finalPath);

    const result = await safeTenantQuery(
      dbName,
      `INSERT INTO documents 
        (deceased_id, document_type, file_name, file_path, mime_type, uploaded_at, created_at, tenant_slug) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        canonicalDeceasedId,
        type,
        file.originalname,
        relativePath,
        file.mimetype,
        uploadedAt,
        createdAt,
        tenantSlug,
      ],
    );

    return res.status(201).json({
      message: 'Document uploaded successfully',
      documentId: result.insertId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileUrl: relativePath,
      uploaded_at: uploadedAt,
      tenant: tenantSlug,
    });


  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      message: 'Server error while uploading document',
      details: error.message,
    });
  }
};

/**
 * Get documents for a deceased record (tenant-isolated)
 */
const getDocuments = async (req, res) => {
  try {
    const tenantSlug = getTenantSlug(req);
    const { deceasedId } = req.params;

    // Resolve tenant database
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ message: 'Tenant database not found' });
    }

    // Filter by both deceased_id and tenant_slug for multi-tenant isolation
    const documents = await safeTenantQuery(
      dbName,
      `SELECT 
        id,
        document_type,
        file_name as document_name,
        file_path,
        mime_type,
        uploaded_at,
        file_size
       FROM documents 
       WHERE deceased_id = ? AND (tenant_slug = ? OR tenant_slug IS NULL)
       ORDER BY uploaded_at DESC`,
      [deceasedId, tenantSlug],
    );

    return res.status(200).json({
      message: 'Documents fetched successfully',
      data: documents,
      tenant: tenantSlug,
    });
  } catch (error) {
    console.error('Get Documents Error:', error);
    return res.status(500).json({
      message: 'Server error while fetching documents',
      details: error.message,
    });
  }
};

/**
 * Download a document (tenant-isolated)
 */
const downloadDocument = async (req, res) => {
  try {
    const tenantSlug = getTenantSlug(req);
    const { documentId } = req.params;

    // Resolve tenant database
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ message: 'Tenant database not found' });
    }

    const document = await safeTenantQuery(
      dbName,
      `SELECT file_path, file_name, mime_type, tenant_slug 
       FROM documents 
               WHERE document_id = ? AND (tenant_slug = ? OR tenant_slug IS NULL)`,
      [documentId, tenantSlug],
    );

    if (document.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = document[0];
    const absolutePath = absoluteStoredPath(doc.file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${doc.file_name}"`,
    );

    const fileStream = fs.createReadStream(absolutePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download Error:', error);
    return res.status(500).json({
      message: 'Server error while downloading document',
      details: error.message,
    });
  }
};

/**
 * Delete a document (tenant-isolated)
 */
const deleteDocument = async (req, res) => {
  try {
    const tenantSlug = getTenantSlug(req);
    const { documentId } = req.params;

    // Resolve tenant database
    const dbName = await lookupTenantDatabase(tenantSlug);
    if (!dbName) {
      return res.status(404).json({ message: 'Tenant database not found' });
    }

    const document = await safeTenantQuery(
      dbName,
      `SELECT file_path FROM documents         WHERE document_id = ? AND (tenant_slug = ? OR tenant_slug IS NULL)`,
      [documentId, tenantSlug],
    );

    if (document.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = absoluteStoredPath(document[0].file_path);

    // Delete file from filesystem
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record from database
    await safeTenantQuery(dbName, `DELETE FROM documents WHERE document_id = ?`, [documentId]);

    return res.status(200).json({
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete Error:', error);
    return res.status(500).json({
      message: 'Server error while deleting document',
      details: error.message,
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  downloadDocument,
  deleteDocument,
};
