import sharp from 'sharp';

/**
 * Process and save a signature buffer as an optimized image.
 * Uses the centralized upload service with sharp for compression.
 * Enhances signature visibility by increasing boldness and contrast.
 *
 * @param inputBuffer - Raw image buffer from signature pad
 * @param filename - Unique filename identifier
 * @param tenantSlug - Tenant identifier for organization
 * @param options - Optional processing options
 * @returns The relative URL path to the saved file
 */
export async function processSignature(
    inputBuffer: Buffer,
    filename: string,
    tenantSlug?: string,
    options?: {
        quality?: number;
        maxWidth?: number;
        maxHeight?: number;
        compressionLevel?: number;
        format?: 'png' | 'jpeg' | 'webp';
    }
): Promise<string> {
    // Default options optimized for signatures
    const {
        quality = 85,
        maxWidth = 600,
        maxHeight = 250,
        compressionLevel = 9, // Max compression for PNG
        format = 'png' // Always use PNG for signatures
    } = options || {};

    // Step 1: Pre-process - DO NOT change colors, just slightly enhance quality
    let processedBuffer = await sharp(inputBuffer)
        .sharpen({
            sigma: 0.8,
            m1: 0.5,
            m2: 0.2,
        })
        .toBuffer();

    // Step 2: Convert to desired format with optimal settings
    let finalBuffer;
    let finalFormat = format;

    if (format === 'png') {
        finalBuffer = await sharp(processedBuffer)
            .resize(maxWidth, maxHeight, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .png({
                quality: quality,
                compressionLevel: compressionLevel,
                adaptiveFiltering: true,
            })
            .toBuffer();
    } else if (format === 'jpeg') {
        finalBuffer = await sharp(processedBuffer)
            .resize(maxWidth, maxHeight, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255 }
            })
            .jpeg({
                quality: quality,
                progressive: true,
                mozjpeg: true,
                chromaSubsampling: '4:4:4', // Better for text
            })
            .toBuffer();
    } else if (format === 'webp') {
        finalBuffer = await sharp(processedBuffer)
            .resize(maxWidth, maxHeight, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({
                quality: quality,
                lossless: false,
                alphaQuality: 100,
                smartSubsample: true,
            })
            .toBuffer();
    } else {
        // Fallback to PNG
        finalBuffer = await sharp(processedBuffer)
            .png({
                quality: quality,
                compressionLevel: compressionLevel,
            })
            .toBuffer();
    }

    // Step 3: Save PNG directly to global uploads folder
    // IMPORTANT: Always use PNG format for signatures
    // We write directly to avoid the uploads-service converting to webp
    const fs = await import('fs');
    const path = await import('path');
    
    // Get global uploads directory from environment or use default
    const globalUploadsDir = process.env.GLOBAL_UPLOADS_DIR || 'C:\\Users\\User\\Downloads\\uploads';
    const signatureDir = path.join(globalUploadsDir, tenantSlug || 'system', 'signatures');
    
    // Ensure directory exists
    await fs.promises.mkdir(signatureDir, { recursive: true });
    
    // Save the PNG file
    const pngFilename = `${filename}.png`;
    const fullPath = path.join(signatureDir, pngFilename);
    await fs.promises.writeFile(fullPath, finalBuffer);
    
    // Create the URL path (relative path for database storage)
    const urlPath = `/uploads/${tenantSlug || 'system'}/signatures/${pngFilename}`;
    
    console.log('[UPLOAD SIGNATURE] Saved PNG directly:', {
        filename: pngFilename,
        path: fullPath,
        urlPath: urlPath,
        size: finalBuffer.length,
        mimeType: 'image/png'
    });
    
    return urlPath;
}

/**
 * Get signature size breakdown for a buffer
 */
export async function getSignatureSizeInfo(buffer: Buffer): Promise<{
    originalSize: number;
    processedSize: number;
    compressionRatio: number;
    sizeSaved: number;
}> {
    // This would need to be implemented with actual processing
    // Just a placeholder for demonstration
    return {
        originalSize: buffer.length,
        processedSize: buffer.length * 0.15, // 85% reduction
        compressionRatio: 0.15,
        sizeSaved: buffer.length * 0.85,
    };
}

/**
 * Batch process multiple signatures
 */
export async function processMultipleSignatures(
    signatures: Array<{ buffer: Buffer; filename: string; tenantSlug?: string }>,
    options?: any
): Promise<Array<{ filename: string; url: string; size: number }>> {
    const results = [];
    for (const sig of signatures) {
        try {
            const url = await processSignature(
                sig.buffer,
                sig.filename,
                sig.tenantSlug,
                options
            );
            results.push({
                filename: sig.filename,
                url: url,
                size: sig.buffer.length,
            });
        } catch (error) {
            console.error(`Failed to process signature ${sig.filename}:`, error);
            results.push({
                filename: sig.filename,
                url: '',
                size: 0,
            });
        }
    }
    return results;
}