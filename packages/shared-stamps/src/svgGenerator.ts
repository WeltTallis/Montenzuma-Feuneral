// ===================== SVG STAMP GENERATOR =====================
import {
  StampConfig,
  StampRing,
} from './types';
import {
  PALETTE,
  DEFAULT_OUTER_TEXT,
  DEFAULT_BOTTOM_TEXT,
  DEFAULT_CENTER_LABEL,
  resolveStyle,
  normalizeDate,
  escapeXml,
  mergeTextConfig,
} from './styles';

/**
 * Default ring configuration
 */
const DEFAULT_RING: StampRing = {
  outerColor: PALETTE.ROYAL_BLUE,
  outerWidth: 5,
  innerColor: PALETTE.ROYAL_BLUE,
  innerWidth: 2,
  innerOffset: 42,
  showInner: true,
};

/**
 * Generate a dynamic SVG stamp based on the provided config.
 * Mirrors the classic funeral home seal design with:
 *  - Outer & inner circles
 *  - Top arc (funeral home name)
 *  - Bottom arc (official record text)
 *  - Center label + subtitle
 *  - Large day + month/date
 *  - Star separators
 *  - Optional ink drips
 *  - Slight rotation for realistic press look
 */
export function generateStampSVG(config: StampConfig): string {
  const width = config.width || 340;
  const height = config.height || 340;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 10;

  // Resolve style preset from stamp name
  const style = resolveStyle(config.stampName, config.style);
  const centerLabelText = (config.centerLabel || style.centerLabel).toUpperCase();
  const bottomText = (config.bottomText || style.bottomText).toUpperCase();
  const subtitle = config.subtitle ? config.subtitle.toUpperCase() : undefined;

  // Normalize date
  const date = normalizeDate(config.date);

  // Merge configs
  const outerText = mergeTextConfig(DEFAULT_OUTER_TEXT, config.outerText);
  const bottomTextStyle = mergeTextConfig(DEFAULT_BOTTOM_TEXT, config.bottomTextStyle);
  const centerLabelStyle = { ...DEFAULT_CENTER_LABEL, ...config.centerLabelStyle };

  // Ring config
  const ring: StampRing = { ...DEFAULT_RING, ...config.ring };
  const innerRadius = outerRadius - ring.innerOffset;

  // Rotation
  const rotation = config.rotation || { angle: -4 };
  const rotX = centerX;
  const rotY = centerY;

  // Opacity
  const opacity = config.opacity ?? 0.95;
  const inkDrips = config.inkDrips !== false;

  // Arc paths
  const arcOffset = 4;
  const topArcD = `M ${centerX - outerRadius + arcOffset},${centerY} A ${outerRadius - arcOffset},${outerRadius - arcOffset} 0 0 1 ${centerX + outerRadius - arcOffset},${centerY}`;
  const bottomArcD = `M ${centerX - innerRadius - 4},${centerY} A ${innerRadius + 4},${innerRadius + 4} 0 0 0 ${centerX + innerRadius + 4},${centerY}`;

  // Star separators positioned at left/right mid
  const starY = centerY;
  const starLeftX = centerX - outerRadius + 22;
  const starRightX = centerX + outerRadius - 22;

  // Date display
  const dayText = date.customDate ? date.customDate : String(date.day);
  const monthText = date.month || '';

  // ===== Build SVG parts =====
  const parts: string[] = [];

  // SVG header
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`
  );

  // Defs with arc paths
  parts.push('<defs>');
  parts.push(`<style>`);
  parts.push(`.outer-text { font-family: '${outerText.fontFamily}'; font-size: ${outerText.fontSize}px; font-weight: ${outerText.fontWeight}; fill: ${outerText.color}; letter-spacing: ${outerText.letterSpacing}px; text-transform: uppercase; }`);
  parts.push(`.bottom-text { font-family: '${bottomTextStyle.fontFamily}'; font-size: ${bottomTextStyle.fontSize}px; font-weight: ${bottomTextStyle.fontWeight}; fill: ${bottomTextStyle.color}; letter-spacing: ${bottomTextStyle.letterSpacing}px; text-transform: uppercase; }`);
  parts.push(`.center-label { font-family: '${centerLabelStyle.fontFamily}'; font-size: ${centerLabelStyle.fontSize}px; font-weight: ${centerLabelStyle.fontWeight}; fill: ${centerLabelStyle.color}; letter-spacing: ${centerLabelStyle.letterSpacing}px; }`);
  parts.push(`.date-day { font-family: 'Playfair Display', serif; font-size: ${Math.round(outerRadius * 0.42)}px; font-weight: 900; fill: ${date.color}; }`);
  parts.push(`.date-month { font-family: 'Montserrat', sans-serif; font-size: ${Math.round(outerRadius * 0.11)}px; font-weight: 700; fill: ${date.color}; letter-spacing: 4px; }`);
  parts.push(`.star { fill: ${ring.outerColor}; font-size: 18px; font-family: 'Arial', sans-serif; }`);
  parts.push(`</style>`);
  parts.push(`<path id="topArc" d="${topArcD}" fill="none" />`);
  parts.push(`<path id="bottomArc" d="${bottomArcD}" fill="none" />`);
  parts.push('</defs>');

  // Main stamp group with rotation + opacity
  const transform = `transform="rotate(${rotation.angle} ${rotX} ${rotY})"`;
  parts.push(`<g ${transform} opacity="${opacity}">`);

  // Outer thick circle
  parts.push(`<circle cx="${centerX}" cy="${centerY}" r="${outerRadius}" fill="none" stroke="${ring.outerColor}" stroke-width="${ring.outerWidth}" />`);

  // Inner thin circle
  if (ring.showInner) {
    parts.push(`<circle cx="${centerX}" cy="${centerY}" r="${innerRadius}" fill="none" stroke="${ring.innerColor}" stroke-width="${ring.innerWidth}" />`);
  }

  // Top arc text - Funeral home name
  if (outerText.enabled) {
    const homeName = escapeXml(config.funeralHomeName.toUpperCase());
    parts.push(
      `<text class="outer-text">`,
      `<textPath href="#topArc" startOffset="50%" text-anchor="middle">${homeName}</textPath>`,
      `</text>`
    );
  }

  // Bottom arc text
  if (bottomTextStyle.enabled) {
    const bottom = escapeXml(bottomText);
    parts.push(
      `<text class="bottom-text">`,
      `<textPath href="#bottomArc" startOffset="50%" text-anchor="middle">${bottom}</textPath>`,
      `</text>`
    );
  }

  // Star separators
  parts.push(`<text x="${starLeftX}" y="${starY}" class="star" text-anchor="middle" dominant-baseline="middle">&#10022;</text>`);
  parts.push(`<text x="${starRightX}" y="${starY}" class="star" text-anchor="middle" dominant-baseline="middle">&#10022;</text>`);

  // Center label
  if (centerLabelStyle.enabled) {
    const labelY = centerY - outerRadius * 0.36;
    parts.push(`<text x="${centerX}" y="${labelY}" class="center-label" text-anchor="middle">${escapeXml(centerLabelText)}</text>`);
  }

  // Subtitle
  if (subtitle) {
    const subY = centerY - outerRadius * 0.22;
    parts.push(`<text x="${centerX}" y="${subY}" class="center-label" text-anchor="middle" font-size="${Math.round(outerRadius * 0.09)}px" letter-spacing="2">${escapeXml(subtitle)}</text>`);
  }

  // Date - Day (large red numerals)
  const dayY = centerY + outerRadius * 0.18;
  parts.push(`<text x="${centerX}" y="${dayY}" class="date-day" text-anchor="middle" dominant-baseline="middle">${escapeXml(dayText)}</text>`);

  // Date - Month
  if (monthText) {
    const monthY = centerY + outerRadius * 0.42;
    parts.push(`<text x="${centerX}" y="${monthY}" class="date-month" text-anchor="middle">${escapeXml(monthText)}</text>`);
  }

  // Custom SVG injection
  if (config.customSvg) {
    parts.push(config.customSvg);
  }

  parts.push('</g>');

  // Ink drips group (subtle realistic ink slips)
  if (inkDrips) {
    parts.push(`<g fill="${ring.outerColor}" opacity="${opacity}">`);
    // Drip 1: bottom left
    const dlx = centerX - outerRadius * 0.6;
    const dly = centerY + outerRadius * 0.75;
    parts.push(`<path d="M ${dlx},${dly} Q ${dlx + 1},${dly + 5} ${dlx - 1},${dly + 8} Q ${dlx - 3},${dly + 5} ${dlx},${dly} Z" />`);
    parts.push(`<circle cx="${dlx - 1}" cy="${dly + 10}" r="1.5" />`);

    // Drip 2: top right
    const dtx = centerX + outerRadius * 0.55;
    const dty = centerY - outerRadius * 0.75;
    parts.push(`<path d="M ${dtx},${dty} Q ${dtx + 2},${dty + 5} ${dtx},${dty + 8} Q ${dtx - 2},${dty + 5} ${dtx},${dty} Z" />`);
    parts.push(`<circle cx="${dtx}" cy="${dty + 10}" r="1.5" />`);

    // Drip 3: bottom right
    const drx = centerX + outerRadius * 0.55;
    const dry = centerY + outerRadius * 0.55;
    parts.push(`<path d="M ${drx},${dry} Q ${drx + 2},${dry + 7} ${drx},${dry + 11} Q ${drx - 2},${dry + 7} ${drx},${dry} Z" />`);
    parts.push(`<circle cx="${drx}" cy="${dry + 14}" r="2" />`);

    // Drip 4: top left (small smudge)
    const dlx2 = centerX - outerRadius * 0.55;
    const dly2 = centerY - outerRadius * 0.65;
    parts.push(`<path d="M ${dlx2},${dly2} Q ${dlx2 + 2},${dly2 + 4} ${dlx2},${dly2 + 6} Q ${dlx2 - 2},${dly2 + 4} ${dlx2},${dly2} Z" />`);
    parts.push(`<circle cx="${dlx2}" cy="${dly2 + 8}" r="1" />`);
    parts.push('</g>');
  }

  parts.push('</svg>');

  return parts.join('\n');
}