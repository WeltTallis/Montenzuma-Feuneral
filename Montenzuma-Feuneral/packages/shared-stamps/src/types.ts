// ===================== TYPES & INTERFACES =====================

/**
 * Style presets for the stamp design
 */
export type StampStyle =
  | 'funeral-official'
  | 'medical-examiner'
  | 'certified'
  | 'verified'
  | 'approved'
  | 'confidential'
  | 'release';

/**
 * Output format for the stamp
 */
export type StampFormat = 'svg' | 'png' | 'pdfkit';

/**
 * Rotation for the stamp (physical press look)
 */
export interface StampRotation {
  /** Rotation angle in degrees (e.g. -8 or -4 for left tilt, 6 for right tilt) */
  angle: number;
  /** Rotation origin X (percentage 0-100, default 50) */
  originX?: number;
  /** Rotation origin Y (percentage 0-100, default 50) */
  originY?: number;
}

/**
 * Circle / ring configuration
 */
export interface StampRing {
  /** Outer ring stroke color */
  outerColor: string;
  /** Outer ring stroke width */
  outerWidth: number;
  /** Inner ring stroke color */
  innerColor: string;
  /** Inner ring stroke width */
  innerWidth: number;
  /** Inner ring radius offset from outer ring */
  innerOffset: number;
  /** Whether to draw inner thin circle */
  showInner: boolean;
}

/**
 * Date display configuration
 */
export interface StampDate {
  /** Day value displayed in large numerals (e.g. 26) */
  day: string | number;
  /** Month displayed above/below (e.g. NOV 2024) */
  month?: string;
  /** Full custom date line (overrides day/month if provided) */
  customDate?: string;
  /** Date color (e.g. deep red) */
  color: string;
}

/**
 * Text element configuration for the stamp
 */
export interface StampTextConfig {
  /** Whether to show the text */
  enabled: boolean;
  /** Text color */
  color: string;
  /** Font family for SVG/CSS */
  fontFamily: string;
  /** Font weight (normal/bold/900 etc) */
  fontWeight: string | number;
  /** Letter spacing in px */
  letterSpacing: number;
  /** Font size in px */
  fontSize: number;
}

/**
 * Center label configuration
 */
export interface StampCenterLabel extends StampTextConfig {
  /** The label text (e.g. VERIFIED, CERTIFIED, RELEASED) */
  text: string;
}

/**
 * Configuration for the dynamic stamp
 */
export interface StampConfig {
  /** Name of the stamp — used to auto-select style and text */
  stampName: string;
  /** Funeral home / tenant name displayed on the top arc */
  funeralHomeName: string;
  /** Bottom arc text (e.g. "Official Examination Record", "Body Release Permit") */
  bottomText?: string;
  /** Center display label (e.g. VERIFIED, CERTIFIED) */
  centerLabel?: string;
  /** Optional sub-title under the center label */
  subtitle?: string;
  /** Date to display on the stamp */
  date: StampDate | Date | string;
  /** Style preset — auto-derived from stampName if not provided */
  style?: StampStyle;
  /** Output format */
  format?: StampFormat;
  /** Rotation config (default -4deg for realistic press) */
  rotation?: StampRotation;
  /** Ring / circle styling */
  ring?: Partial<StampRing>;
  /** Outer arc text styling */
  outerText?: Partial<StampTextConfig>;
  /** Bottom arc text styling */
  bottomTextStyle?: Partial<StampTextConfig>;
  /** Center label styling */
  centerLabelStyle?: Partial<StampCenterLabel>;
  /** Whether to add realistic ink drips */
  inkDrips?: boolean;
  /** Background transparency (0-1) — 0.95 looks like real ink */
  opacity?: number;
  /** Custom SVG extra content (raw elements injected) */
  customSvg?: string;
  /** Width of the generated SVG in px (default 340) */
  width?: number;
  /** Height of the generated SVG in px (default 340) */
  height?: number;
}

/**
 * Result object returned by generateStamp()
 */
export interface StampResult {
  /** The stamp name */
  stampName: string;
  /** Funeral home name */
  funeralHomeName: string;
  /** SVG string (always populated) */
  svg: string;
  /** PNG Buffer (only if format='png') */
  png?: Buffer;
  /** PDFKit renderer function — call with a PDFDocument instance */
  renderPDFKit?: (doc: any) => void;
  /** Unique stamp hash for verification */
  hash: string;
  /** Generated timestamp (ISO) */
  timestamp: string;
}