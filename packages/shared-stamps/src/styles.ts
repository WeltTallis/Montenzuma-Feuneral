// ===================== STYLE PRESETS & HELPERS =====================
import { DateTime } from 'luxon';
import crypto from 'crypto';
import { StampConfig, StampDate, StampStyle, StampTextConfig } from './types';

/**
 * Default color palette
 */
export const PALETTE = {
  ROYAL_BLUE: '#1e40af',
  SOLID_BLACK: '#000000',
  CRIMSON_RED: '#991b1b',
  DEEP_NAVY: '#170C79',
  GOLD: '#D4AF37',
  DARK_GREEN: '#14532d',
  PURPLE: '#4c1d95',
} as const;

/**
 * Default text style presets
 */
export const DEFAULT_OUTER_TEXT: StampTextConfig = {
  enabled: true,
  color: PALETTE.ROYAL_BLUE,
  fontFamily: 'Cinzel, Georgia, serif',
  fontWeight: 700,
  letterSpacing: 3,
  fontSize: 17,
};

export const DEFAULT_BOTTOM_TEXT: StampTextConfig = {
  enabled: true,
  color: PALETTE.SOLID_BLACK,
  fontFamily: 'Montserrat, Arial, sans-serif',
  fontWeight: 600,
  letterSpacing: 5,
  fontSize: 11,
};

export const DEFAULT_CENTER_LABEL: StampTextConfig & { text: string } = {
  enabled: true,
  color: PALETTE.ROYAL_BLUE,
  fontFamily: 'Cinzel, Georgia, serif',
  fontWeight: 700,
  letterSpacing: 3,
  fontSize: 15,
  text: 'OFFICIAL',
};

/**
 * Style preset resolution result
 */
export interface ResolvedStyle {
  style: StampStyle;
  centerLabel: string;
  bottomText: string;
}

/**
 * Resolve a style preset from the stamp name
 */
export function resolveStyle(stampName: string, style?: StampStyle): ResolvedStyle {
  const normalized = stampName.toLowerCase();

  if (style) {
    return getStylePreset(style, stampName);
  }

  if (normalized.includes('medical') || normalized.includes('examiner') || normalized.includes('autopsy') || normalized.includes('postmortem')) {
    return getStylePreset('medical-examiner', stampName);
  }
  if (normalized.includes('release') || normalized.includes('checkout') || normalized.includes('discharge')) {
    return getStylePreset('release', stampName);
  }
  if (normalized.includes('certif') || normalized.includes('burial') || normalized.includes('cremation')) {
    return getStylePreset('certified', stampName);
  }
  if (normalized.includes('verify') || normalized.includes('examination')) {
    return getStylePreset('verified', stampName);
  }
  if (normalized.includes('approv') || normalized.includes('payment') || normalized.includes('invoice')) {
    return getStylePreset('approved', stampName);
  }
  if (normalized.includes('confid') || normalized.includes('private')) {
    return getStylePreset('confidential', stampName);
  }
  return getStylePreset('funeral-official', stampName);
}

function getStylePreset(style: StampStyle, stampName: string): ResolvedStyle {
  switch (style) {
    case 'medical-examiner':
      return {
        style,
        centerLabel: stampName || 'CERTIFIED',
        bottomText: 'MEDICAL EXAMINER OFFICIAL RECORD',
      };
    case 'release':
      return {
        style,
        centerLabel: stampName || 'RELEASED',
        bottomText: 'OFFICIAL BODY RELEASE PERMIT',
      };
    case 'certified':
      return {
        style,
        centerLabel: stampName || 'CERTIFIED',
        bottomText: 'OFFICIAL CERTIFICATION RECORD',
      };
    case 'verified':
      return {
        style,
        centerLabel: stampName || 'VERIFIED',
        bottomText: 'OFFICIAL EXAMINATION RECORD',
      };
    case 'approved':
      return {
        style,
        centerLabel: stampName || 'APPROVED',
        bottomText: 'OFFICIAL PAYMENT / INVOICE RECORD',
      };
    case 'confidential':
      return {
        style,
        centerLabel: stampName || 'CONFIDENTIAL',
        bottomText: 'PRIVATE & CONFIDENTIAL DOCUMENT',
      };
    case 'funeral-official':
    default:
      return {
        style: 'funeral-official',
        centerLabel: stampName || 'OFFICIAL',
        bottomText: 'OFFICIAL FUNERAL HOME RECORD',
      };
  }
}

/**
 * Normalize date input to StampDate
 */
export function normalizeDate(date: StampDate | Date | string): StampDate {
  if (typeof date === 'object' && date !== null && 'day' in date) {
    return date as StampDate;
  }

  const jsDate = typeof date === 'string' || date instanceof Date
    ? (date instanceof Date ? date : new Date(date))
    : new Date();

  const nairobi = DateTime.fromJSDate(jsDate).setZone('Africa/Nairobi');
  return {
    day: nairobi.day,
    month: nairobi.toFormat('MMM yyyy').toUpperCase(),
    color: PALETTE.CRIMSON_RED,
  };
}

/**
 * Generate a deterministic stamp hash
 */
export function generateStampHash(stampName: string, funeralHomeName: string, dateVal: string, prefix = 'STAMP'): string {
  const raw = `${stampName}|${funeralHomeName}|${dateVal}|${Date.now()}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 12).toUpperCase();
  return `${prefix}-${hash}`;
}

/**
 * Escape XML special characters for SVG text
 * Uses char codes so the formatter cannot corrupt the entities
 */
const AMP = String.fromCharCode(38) + 'amp;';
const LT = String.fromCharCode(38) + 'lt;';
const GT = String.fromCharCode(38) + 'gt;';
const QUOT = String.fromCharCode(38) + 'quot;';
const APOS = String.fromCharCode(38) + 'apos;';

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, APOS);
}

/**
 * Merge partial styling config with defaults
 */
export function mergeTextConfig(defaults: StampTextConfig, overrides?: Partial<StampTextConfig>): StampTextConfig {
  return { ...defaults, ...overrides };
}