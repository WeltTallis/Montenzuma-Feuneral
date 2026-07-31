import sharp from 'sharp';
import { imageUploadService } from '../../../packages/shared-services/src/imageUploadService';

/**
 * Process and save a signature buffer as an optimized image.
 * Uses the centralized image upload service with sharp for compression.
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
        format = 'png'
    } = options || {};

    // Step 1: Pre-process to enhance signature
    let processedBuffer = await sharp(inputBuffer)
        // Remove background noise
        .threshold(128) // Convert to pure black/white (reduces size dramatically)
        .normalize()
        .sharpen({
            sigma: 1.2,
            m1: 1.0,
            m2: 0.5,
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
                palette: true, // Reduce colors for smaller size
                colours: 2, // Black and white only
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

    // Step 3: Upload to storage
    const result = await imageUploadService.uploadImage(
        finalBuffer,
        `${filename}.${finalFormat}`,
        'signatures',
        tenantSlug || 'system',
        undefined,
        {
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            quality: quality,
            format: finalFormat,
            stripMetadata: true,
        }
    );

    return result.urlPath;
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