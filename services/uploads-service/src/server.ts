import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5012;
const UPLOADS_BASE_DIR = process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Ensure base directory exists
fs.ensureDirSync(UPLOADS_BASE_DIR);

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// ============================================
// TENANT FOLDER MANAGEMENT
// ============================================

/**
 * Create tenant folder structure
 * Structure: /opt/storage/uploads/{tenant-slug}/
 *            ├── signatures/
 *            ├── documents/
 *            ├── images/
 *            ├── deceased/
 *            ├── coffins/
 *            ├── hearses/
 *            ├── workshops/
 *            ├── invoices/
 *            └── general/
 */
app.post('/api/tenants/:tenantSlug/folders', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const sanitizedSlug = sanitizeFolderName(tenantSlug);
    const tenantRoot = path.join(UPLOADS_BASE_DIR, sanitizedSlug);

    // Create main tenant folder
    await fs.ensureDir(tenantRoot);

    // Create subdirectories
    const subdirs = [
      'signatures',
      'documents',
      'images',
      'deceased',
      'coffins',
      'hearses',
      'workshops',
      'invoices',
      'general',
      'logos',
      'receipts',
      'reports',
      'contracts',
      'employees',
      'chemicals'
    ];

    for (const subdir of subdirs) {
      await fs.ensureDir(path.join(tenantRoot, subdir));
    }

    console.log(`✅ Created tenant folders for: ${sanitizedSlug}`);
    
    res.json({
      success: true,
      message: 'Tenant folders created successfully',
      path: tenantRoot,
      folders: subdirs
    });
  } catch (error: any) {
    console.error('Error creating tenant folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tenant folders',
      error: error.message
    });
  }
});

/**
 * Check if tenant folder exists
 */
app.get('/api/tenants/:tenantSlug/folders/exists', async (req, res) => {
  try {
    const { tenantSlug } = req.params;
    const sanitizedSlug = sanitizeFolderName(tenantSlug);
    const tenantRoot = path.join(UPLOADS_BASE_DIR, sanitizedSlug);
    
    const exists = await fs.pathExists(tenantRoot);
    
    res.json({
      exists,
      path: tenantRoot
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to check tenant folder',
      error: error.message
    });
  }
});

// ============================================
// FILE UPLOAD ENDPOINTS
// ============================================

/**
 * Upload signature
 */
app.post('/api/upload/signature', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { tenantSlug, category = 'signatures' } = req.body;
    if (!tenantSlug) {
      return res.status(400).json({ success: false, message: 'tenantSlug is required' });
    }

    const result = await processAndSaveFile(
      req.file.buffer,
      req.file.originalname,
      tenantSlug,
      category,
      { quality: 85, maxWidth: 800, maxHeight: 300, format: 'webp' }
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Signature upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload signature',
      error: error.message
    });
  }
});

/**
 * Upload document
 */
app.post('/api/upload/document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { tenantSlug, subFolder, category = 'documents' } = req.body;
    if (!tenantSlug) {
      return res.status(400).json({ success: false, message: 'tenantSlug is required' });
    }

    const result = await processAndSaveFile(
      req.file.buffer,
      req.file.originalname,
      tenantSlug,
      category,
      { quality: 90, format: 'jpeg' },
      subFolder
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

/**
 * Upload image
 */
app.post('/api/upload/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { tenantSlug, subFolder, category = 'images' } = req.body;
    if (!tenantSlug) {
      return res.status(400).json({ success: false, message: 'tenantSlug is required' });
    }

    const result = await processAndSaveFile(
      req.file.buffer,
      req.file.originalname,
      tenantSlug,
      category,
      { quality: 85, format: 'webp' },
      subFolder
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
});

/**
 * Upload multiple files
 */
app.post('/api/upload/multiple', upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { tenantSlug, category = 'general' } = req.body;

    if (!tenantSlug) {
      return res.status(400).json({ success: false, message: 'tenantSlug is required' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const results = await Promise.all(
      files.map(file =>
        processAndSaveFile(
          file.buffer,
          file.originalname,
          tenantSlug,
          category,
          { quality: 85, format: 'webp' }
        )
      )
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload files',
      error: error.message
    });
  }
});

// ============================================
// FILE MANAGEMENT
// ============================================

/**
 * Delete file
 */
app.delete('/api/files', async (req, res) => {
  try {
    const { filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'filePath is required' });
    }

    const fullPath = path.join(UPLOADS_BASE_DIR, filePath as string);
    
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

/**
 * Get file info
 */
app.get('/api/files/info', async (req, res) => {
  try {
    const { filePath } = req.query;
    
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'filePath is required' });
    }

    const fullPath = path.join(UPLOADS_BASE_DIR, filePath as string);
    
    if (await fs.pathExists(fullPath)) {
      const stats = await fs.stat(fullPath);
      res.json({
        success: true,
        data: {
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to get file info',
      error: error.message
    });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'uploads-service',
    version: '1.0.0',
    uploadsBaseDir: UPLOADS_BASE_DIR,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'uploads-service',
    version: '1.0.0'
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Process and save file with Sharp optimization
 */
async function processAndSaveFile(
  buffer: Buffer,
  originalName: string,
  tenantSlug: string,
  category: string,
  options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {},
  subFolder?: string
): Promise<{
  filename: string;
  path: string;
  urlPath: string;
  size: number;
  mimeType: string;
}> {
  const {
    quality = 85,
    maxWidth = null,
    maxHeight = null,
    format = 'webp'
  } = options;

  const sanitizedSlug = sanitizeFolderName(tenantSlug);
  const sanitizedCategory = sanitizeFolderName(category);
  
  // Build directory path
  let dirPath = path.join(UPLOADS_BASE_DIR, sanitizedSlug, sanitizedCategory);
  if (subFolder) {
    dirPath = path.join(dirPath, sanitizeFolderName(subFolder));
  }

  // Ensure directory exists
  await fs.ensureDir(dirPath);

  // Generate unique filename
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(8).toString('hex');
  const ext = format === 'jpeg' ? '.jpg' : `.${format}`;
  const storedName = `${timestamp}-${randomHex}${ext}`;
  const absolutePath = path.join(dirPath, storedName);

  // Process with Sharp
  let pipeline = sharp(buffer);

  // Resize if dimensions provided
  if (maxWidth || maxHeight) {
    const resizeOptions: any = {
      fit: 'inside',
      withoutEnlargement: true,
    };
    if (maxWidth) resizeOptions.width = maxWidth;
    if (maxHeight) resizeOptions.height = maxHeight;
    pipeline = pipeline.resize(resizeOptions);
  }

  // Apply format-specific output
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality, effort: 6 });
      break;
    case 'png':
      pipeline = pipeline.png({ 
        quality, 
        compressionLevel: 9, 
        palette: true, 
        adaptiveFiltering: true 
      });
      break;
  }

  // Save to disk
  await pipeline.toFile(absolutePath);

  // Get file stats
  const stats = await fs.stat(absolutePath);

  // Build URL path
  const relativePath = path.relative(UPLOADS_BASE_DIR, absolutePath);
  const urlPath = `/uploads/${relativePath.replace(/\\/g, '/')}`;

  return {
    filename: storedName,
    path: absolutePath,
    urlPath,
    size: stats.size,
    mimeType: `image/${format === 'jpeg' ? 'jpeg' : format}`
  };
}

/**
 * Sanitize folder name
 */
function sanitizeFolderName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Uploads Service running on port ${PORT}`);
  console.log(`📁 Uploads base directory: ${UPLOADS_BASE_DIR}`);
});

export default app;