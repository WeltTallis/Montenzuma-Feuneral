
import multer from 'multer';
import sharp from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';


const generateDatedCheckoutId = (): string => {
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(2) +
        String(date.getMonth() + 1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `RLS-${dateStr}-${random}`;
};

// Configure multer for memory storage (process in memory before Sharp)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, WEBP, GIF)'));
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: fileFilter,
});

// Signature processing function with high-quality compression
// NOTE: signatures are ALWAYS stored as ink blue (#0f33e7) on a transparent
// background inside the ONE global uploads folder
// (/opt/storage/uploads/<tenant>/signatures) — no local paths, no options
// that could change the colour or location.
const processSignature = async (
    file: Express.Multer.File,
    tenantSlug?: string,
    options?: {
        maxWidth?: number;
        maxHeight?: number;
    }
): Promise<{
    filename: string;
    path: string;
    size: number;
    width: number;
    height: number;
    format: string;
    hash: string;
}> => {
    const {
        maxWidth = 1200,
        maxHeight = 800,
    } = options || {};

    // Generate unique filename
    const id = generateDatedCheckoutId();
    const timestamp = Date.now();
    const filename = `signature_${id}_${timestamp}.png`;

    // ─── INK-BLUE ENFORCEMENT ───────────────────────────────────────────
    // Signatures must always be stored as ink blue (#0f33e7) on a
    // transparent background — flatten/grayscale/palette encoding could
    // render the ink black. Normalize the pixels first.
    const INK_BLUE = { r: 15, g: 51, b: 231 }; // #0f33e7 — same as the signature pad
    const { data: raw, info: rawInfo } = await sharp(file.buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const normalized = Buffer.alloc(raw.length);
    for (let i = 0; i < raw.length; i += 4) {
        const alpha = raw[i + 3] / 255;
        const luminance = (raw[i] * 0.299 + raw[i + 1] * 0.587 + raw[i + 2] * 0.114) / 255;
        const ink = alpha * Math.min(1, Math.pow(1 - luminance, 0.45) * 1.13);
        normalized[i] = INK_BLUE.r;
        normalized[i + 1] = INK_BLUE.g;
        normalized[i + 2] = INK_BLUE.b;
        normalized[i + 3] = Math.round(Math.min(1, Math.max(0, ink)) * 255);
    }

    // Process image with Sharp
    let sharpInstance = sharp(normalized, {
        raw: { width: rawInfo.width, height: rawInfo.height, channels: 4 },
    });

    // Get metadata before processing
    const metadata = await sharpInstance.metadata();

    // Resize if dimensions exceed max
    if (metadata.width && metadata.height) {
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
            sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }
    }

    // Compress and save as PNG (lossless, palette-free — keeps the blue ink)
    sharpInstance = sharpInstance.png({
        compressionLevel: 9, // 0-9, 9 is highest compression
        adaptiveFiltering: true,
        palette: false,
    });

    // Save to disk
    const processedBuffer = await sharpInstance.toBuffer();

    // Get processed image metadata
    const processedMetadata = await sharp(processedBuffer).metadata();

    // Calculate hash for integrity
    const hash = crypto
        .createHash('sha256')
        .update(processedBuffer)
        .digest('hex')
        .slice(0, 16);

    // Save directly to global uploads folder (single shared place,
    // scoped per tenant so every signature lives at
    // /opt/storage/uploads/<tenant>/signatures/)
    const globalUploadsDir = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
    // Sanitize the slug exactly like generateSlug() so the on-disk folder and
    // the /uploads/... URL always match and tenant signatures never mix.
    const safeSlug = String(tenantSlug || 'system')
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'system';
    const signatureDir = path.join(globalUploadsDir, safeSlug, 'signatures');

    // Ensure directory exists
    await fs.promises.mkdir(signatureDir, { recursive: true });

    // Save the PNG file
    const fullPath = path.join(signatureDir, filename);
    await fs.promises.writeFile(fullPath, processedBuffer);

    // Return file info
    return {
        filename,
        path: fullPath,
        size: processedBuffer.length,
        width: processedMetadata.width || 0,
        height: processedMetadata.height || 0,
        format: 'png',
        hash,
    };
};

// Middleware for single signature upload
const uploadCheckOutSignature = async (req: any, res: any, next: any) => {
    try {
        // Use multer to handle file upload
        const uploadSingle = upload.single('signature'); // Expect field name 'signature'

        uploadSingle(req, res, async (err: any) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err.message,
                });
            }

            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message: 'No signature file uploaded',
                });
            }

            try {
                // Resolve the tenant so the signature lands in the GLOBAL
                // uploads folder: /opt/storage/uploads/<tenant>/signatures
                const tenantSlug: string | undefined =
                    req.tenantSlug ||
                    req.headers['x-tenant-slug'] ||
                    req.headers['x-slug'] ||
                    req.body?.tenantSlug ||
                    undefined;

                // Process the signature (always stored ink blue in the global uploads)
                const result = await processSignature(req.file, tenantSlug, {
                    maxWidth: 1500,
                    maxHeight: 1000,
                });

                // Add signature info to request for further processing
                req.signature = {
                    ...result,
                    originalName: req.file.originalname,
                    originalSize: req.file.size,
                    mimetype: req.file.mimetype,
                };

                // Log success
                console.log('Signature uploaded successfully:', {
                    filename: result.filename,
                    size: result.size,
                    dimensions: `${result.width}x${result.height}`,
                    hash: result.hash,
                });

                next();
            } catch (processingError) {
                return res.status(500).json({
                    success: false,
                    message: 'Error processing signature',
                    error: processingError instanceof Error ? processingError.message : 'Unknown error',
                });
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

// Function to get signature info
const getSignatureInfo = async (filePath: string) => {
    try {
        const metadata = await sharp(filePath).metadata();
        const stats = fs.statSync(filePath);

        return {
            path: filePath,
            size: stats.size,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            hasAlpha: metadata.hasAlpha,
            channels: metadata.channels,
        };
    } catch (error) {
        throw new Error('Error reading signature file');
    }
};

// Function to delete signature
const deleteSignature = (filePath: string): boolean => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting signature:', error);
        return false;
    }
};

// Express route handler with full response
const handleSignatureUpload = async (req: any, res: any) => {
    try {
        // This would be used after uploadCheckOutSignature middleware
        const signature = req.signature;

        // Here you can save signature info to database
        // const savedSignature = await saveToDatabase(signature);

        return res.status(200).json({
            success: true,
            message: 'Signature uploaded successfully',
            data: {
                filename: signature.filename,
                path: signature.path,
                size: `${(signature.size / 1024).toFixed(2)} KB`,
                dimensions: `${signature.width}x${signature.height}`,
                hash: signature.hash,
                originalName: signature.originalName,
                compressionRatio: ((1 - signature.size / signature.originalSize) * 100).toFixed(2) + '%',
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error saving signature',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

// Enhanced version with additional features
const uploadEnhancedSignature = async (req: any, res: any, next: any) => {
    try {
        const uploadSingle = upload.single('signature');

        uploadSingle(req, res, async (err: any) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: 'File upload error',
                    error: err.message,
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No signature file uploaded',
                });
            }

            try {
                // Resolve the tenant for the GLOBAL uploads folder
                const tenantSlug: string | undefined =
                    req.tenantSlug ||
                    req.headers['x-tenant-slug'] ||
                    req.headers['x-slug'] ||
                    req.body?.tenantSlug ||
                    undefined;

                // Process with the global-uploads pipeline (ink blue, no local paths)
                const result = await processSignature(req.file, tenantSlug, {
                    maxWidth: 1600,
                    maxHeight: 1200,
                });

                // Generate thumbnail as well
                const thumbnailPath = path.join(
                    path.dirname(result.path),
                    `thumb_${result.filename}`
                );

                await sharp(result.path)
                    .resize(200, 150, { fit: 'inside' })
                    .png({ compressionLevel: 9 })
                    .toFile(thumbnailPath);

                req.signature = {
                    ...result,
                    thumbnail: thumbnailPath,
                    originalName: req.file.originalname,
                    originalSize: req.file.size,
                    mimetype: req.file.mimetype,
                };

                next();
            } catch (processingError) {
                return res.status(500).json({
                    success: false,
                    message: 'Error processing signature',
                    error: processingError instanceof Error ? processingError.message : 'Unknown error',
                });
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export {
    upload,
    uploadCheckOutSignature,
    uploadEnhancedSignature,
    processSignature,
    getSignatureInfo,
    deleteSignature,
    handleSignatureUpload,
    generateDatedCheckoutId,
};