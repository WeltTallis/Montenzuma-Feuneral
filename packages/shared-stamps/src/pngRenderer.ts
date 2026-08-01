// ===================== PNG RENDERER =====================
import sharp from 'sharp';

/**
 * Convert an SVG stamp string to a PNG Buffer
 */
export async function renderStampToPNG(svg: string, width = 340, height = 340, background: string = 'transparent'): Promise<Buffer> {
  try {
    let image = sharp(Buffer.from(svg), { density: 300 })
      .resize(width, height);

    if (background === 'transparent') {
      image = image.png();
    } else {
      image = image.flatten({ background })
        .png();
    }

    return await image.toBuffer();
  } catch (error) {
    // Fallback: try rendering larger then resize for better quality
    const higherRes = await sharp(Buffer.from(svg), { density: 600 })
      .resize(width, height)
      .png()
      .toBuffer();
    return higherRes;
  }
}

/**
 * Render stamp to JPEG (white background)
 */
export async function renderStampToJPEG(svg: string, width = 340, height = 340, background = '#ffffff'): Promise<Buffer> {
  return await sharp(Buffer.from(svg), { density: 300 })
    .resize(width, height)
    .flatten({ background })
    .jpeg({ quality: 92 })
    .toBuffer();
}