// ===================== PDFKIT STAMP RENDERER =====================
import { StampConfig, StampDate } from './types';
import {
  PALETTE,
  resolveStyle,
  normalizeDate,
} from './styles';

export interface PDFKitRenderOptions {
  /** X position (center of stamp) */
  x: number;
  /** Y position (center of stamp) */
  y: number;
  /** Stamp radius in PDF points */
  radius?: number;
  /** Rotation angle in degrees */
  rotation?: number;
  /** Whether to draw the official stamp seal */
  drawStamp?: boolean;
  /** Whether to draw the examiner/staff name below */
  drawName?: boolean;
  /** Name to draw below the stamp */
  name?: string;
  /** Color for the stamp */
  color?: string;
  /** Optional date to display */
  date?: StampDate | Date | string;
}

/**
 * Render a dynamic circular stamp directly onto a PDFKit document.
 * This mirrors the existing manual stamp used in autopsyControl.ts
 * but makes it fully dynamic.
 */
export function renderStampOnPDFKit(
  doc: any,
  config: StampConfig,
  options: PDFKitRenderOptions
): void {
  const {
    x,
    y,
    radius = 38,
    rotation = -8,
    drawStamp = true,
    drawName = false,
    name = '',
    color = PALETTE.DEEP_NAVY,
  } = options;

  const date = normalizeDate(options.date || config.date);
  const style = resolveStyle(config.stampName, config.style);
  const centerLabel = (config.centerLabel || style.centerLabel).toUpperCase();
  const subtitle = config.subtitle ? config.subtitle.toUpperCase() : undefined;
  const bottomText = (config.bottomText || style.bottomText).toUpperCase();

  doc.save();

  // Translate + rotate
  doc.translate(x, y);
  doc.rotate(rotation);

  // Outer circle
  doc.strokeColor(color).lineWidth(2.2).circle(0, 0, radius).stroke();

  // Inner thin circle
  if (config.ring?.showInner !== false) {
    const innerOffset = config.ring?.innerOffset || 8;
    doc.strokeColor(color).lineWidth(1).circle(0, 0, radius - innerOffset).stroke();
  }

  // Center label
  doc.fillColor(color).font('Helvetica-Bold').fontSize(9);
  doc.text(centerLabel, -radius, -(radius * 0.55), { width: radius * 2, align: 'center' });

  // Subtitle
  if (subtitle) {
    doc.font('Helvetica').fontSize(6.5);
    doc.text(subtitle, -radius, -(radius * 0.35), { width: radius * 2, align: 'center' });
  }

  // Date - Day (large)
  const dayText = date.customDate ? date.customDate : String(date.day);
  doc.font('Helvetica-Bold').fontSize(13).fillColor(date.color);
  doc.text(dayText, -radius, -(radius * 0.15), { width: radius * 2, align: 'center' });

  // Date - Month
  if (date.month) {
    doc.font('Helvetica').fontSize(5.5).fillColor(date.color);
    doc.text(date.month, -radius, radius * 0.12, { width: radius * 2, align: 'center' });
  }

  // Bottom text (small, under date)
  doc.font('Helvetica').fontSize(4.5).fillColor(color);
  doc.text(bottomText, -radius, radius * 0.32, { width: radius * 2, align: 'center', lineBreak: false });

  doc.restore();

  // Draw name below the stamp
  if (drawName && name) {
    doc.save();
    doc.translate(x, y + radius + 5);
    doc.rotate(rotation);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(color);
    doc.text(name, -(radius * 0.9), 0, { width: radius * 1.8, align: 'center' });
    doc.restore();
  }
}

/**
 * Render stamp placed with coordinates in a PDF document.
 * Convenience wrapper around renderStampOnPDFKit.
 */
export function drawDynamicStamp(
  doc: any,
  config: StampConfig,
  x: number,
  y: number,
  radius?: number,
  rotation?: number,
  name?: string,
  color?: string
): void {
  renderStampOnPDFKit(doc, config, {
    x,
    y,
    radius,
    rotation,
    drawName: !!name,
    name,
    color,
  });
}