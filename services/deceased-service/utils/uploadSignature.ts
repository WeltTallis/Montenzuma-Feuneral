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
        maxWidth = 600,
        maxHeight = 250,
        compressionLevel = 9, // Max compression for PNG
    } = options || {};

    // ─── INK-BLUE NORMALIZATION ─────────────────────────────────────────
    // Every signature must render in ink blue. Client pads draw with
    // penColor #0f33e7, but sharpening + palette-quantised PNG encoding
    // were darkening the blue ink to black. Rebuild the image
    // pixel-by-pixel so the stored signature is ALWAYS pure ink blue:
    //   • ink intensity = alpha × darkness (works for ink on white OR transparent)
    //   • RGB forced to the platform ink blue (#0f33e7)
    //   • transparent background, palette-free PNG
    const INK_BLUE = { r: 15, g: 51, b: 231 }; // #0f33e7 — same as the signature pad

    const { data, info } = await sharp(inputBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const normalized = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3] / 255;
        const luminance = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
        // Darkness of the stroke: white background → 0, full ink → 1.
        // Gamma boost keeps the core strokes at (near) full opacity.
        const ink = alpha * Math.pow(1 - luminance, 0.45);
        normalized[i] = INK_BLUE.r;
        normalized[i + 1] = INK_BLUE.g;
        normalized[i + 2] = INK_BLUE.b;
        normalized[i + 3] = Math.round(Math.min(1, Math.max(0, ink)) * 255);
    }

    const inkBuffer = await sharp(normalized, {
        raw: { width: info.width, height: info.height, channels: 4 },
    })
        .png({ compressionLevel: 9 })
        .toBuffer();

    // Step 2: Resize to fit within the max dimensions — never enlarges and
    // keeps the transparent background. NO sharpening: it is what turned
    // the blue ink black, and no `quality` option: libvips turns PNGs into
    // palette-quantised images when quality < 100 (also darkened the ink).
    let finalBuffer;
    finalBuffer = await sharp(inkBuffer)
        .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .png({
            compressionLevel: compressionLevel,
            adaptiveFiltering: true,
        })
        .toBuffer();

    // Step 3: Save PNG directly to global uploads folder
    // IMPORTANT: Always use PNG format for signatures
    // We write directly to avoid the uploads-service converting to webp
    const fs = await import('fs');
    const path = await import('path');
    
    // Get global uploads directory from environment or use default
    const globalUploadsDir = process.env.GLOBAL_UPLOADS_DIR || process.env.UPLOADS_BASE_DIR || '/opt/storage/uploads';
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