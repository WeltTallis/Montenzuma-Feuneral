// ===================== SHARED STAMPS PACKAGE =====================
/**
 * @montezuma/shared-stamps
 * Dynamic stamp & seal generator for funeral home documents.
 *
 * Provides:
 *  - generateStamp():        Generate SVG / PNG / PDFKit stamp
 *  - generateStampSVG():     Generate SVG string only
 *  - renderStampToPNG():     Convert SVG to PNG Buffer
 *  - renderStampOnPDFKit():  Draw stamp directly on a PDFKit doc
 *  - drawDynamicStamp():     Quick PDFKit wrapper
 *  - generateStampHash():    Unique verification hash
 */
import { StampConfig, StampResult } from './types';
import {
  resolveStyle,
  normalizeDate,
  generateStampHash,
} from './styles';
import { generateStampSVG } from './svgGenerator';
import { renderStampToPNG, renderStampToJPEG } from './pngRenderer';
import { renderStampOnPDFKit, drawDynamicStamp, PDFKitRenderOptions } from './pdfkitHelper';

export * from './types';
export * from './styles';
export { generateStampSVG, renderStampToPNG, renderStampToJPEG, renderStampOnPDFKit, drawDynamicStamp };
export type { PDFKitRenderOptions };

/**
 * Generate a dynamic stamp based on stamp name, funeral home name and date/time.
 *
 * Usage:
 * ```ts
 * const stamp = await generateStamp({
 *   stampName: 'Medical Examiner Certificate',
 *   funeralHomeName: 'Hearth & Heritage Funeral Home',
 *   date: new Date(),
 *   format: 'svg',
 * });
 * console.log(stamp.svg);
 * ```
 */
export async function generateStamp(config: StampConfig): Promise<StampResult> {
  const svg = generateStampSVG(config);
  const style = resolveStyle(config.stampName, config.style);
  const date = normalizeDate(config.date);

  const dateVal = date.customDate || `${date.day} ${date.month || ''}`.trim();
  const hash = generateStampHash(config.stampName, config.funeralHomeName, dateVal);

  const result: StampResult = {
    stampName: config.stampName,
    funeralHomeName: config.funeralHomeName,
    svg,
    hash,
    timestamp: new Date().toISOString(),
  };

  // PNG rendering
  if (config.format === 'png') {
    const width = config.width || 340;
    const height = config.height || 340;
    result.png = await renderStampToPNG(svg, width, height);
  }

  // PDFKit render function
  result.renderPDFKit = (doc: any, options?: Partial<PDFKitRenderOptions>) => {
    renderStampOnPDFKit(doc, config, {
      x: options?.x || 300,
      y: options?.y || 300,
      radius: options?.radius,
      rotation: options?.rotation,
      drawName: options?.drawName,
      name: options?.name,
      color: options?.color,
      date: options?.date,
    });
  };

  return result;
}