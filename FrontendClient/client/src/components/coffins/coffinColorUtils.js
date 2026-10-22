/**
 * Coffin Color & Type Utilities
 * Real-time RGB detection, Funeral Casket Color Dictionary,
 * Typo Correction (e.g., 'balck' -> 'black'), and Coffin Types Catalog.
 */

// Common typos and shorthand mapping
export const TYPO_COLOR_MAP = {

/**
 * Converts a CSS style object to a string for inline style attributes
 * e.g., {color: 'red', fontSize: '14px'} -> "color: red; font-size: 14px"
 */
export const objToStr = (obj) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return Object.keys(obj).reduce((acc, key) => `${acc}${key}:${obj[key]}; `, '').trim();
};
  balck: 'black',
  blck: 'black',
  bak: 'black',
  whit: 'white',
  wht: 'white',
  wihte: 'white',
  brwn: 'brown',
  brow: 'brown',
  gld: 'gold',
  godl: 'gold',
  slvr: 'silver',
  silvr: 'silver',
  purp: 'purple',
  prple: 'purple',
  gry: 'gray',
  graey: 'gray',
  grn: 'green',
  gren: 'green',
  blu: 'blue',
  mahgony: 'mahogany',
  mahogny: 'mahogany',
  mahogani: 'mahogany',
  mahoganybrown: 'mahogany',
  walnt: 'walnut',
  walnutt: 'walnut',
  burgndy: 'burgundy',
  burgandy: 'burgundy',
  roswod: 'rosewood',
  rosewd: 'rosewood',
  ivry: 'ivory',
  chery: 'cherry',
};

// Specialized funeral coffin & casket colors with verified RGB / Hex values
export const COFFIN_SPECIALTY_COLORS = {
  black: { hex: '#111111', rgb: 'rgb(17, 17, 17)', r: 17, g: 17, b: 17, label: 'Midnight Black', code: 'BLK' },
  'pure black': { hex: '#000000', rgb: 'rgb(0, 0, 0)', r: 0, g: 0, b: 0, label: 'Pure Black', code: 'PBLK' },
  'matte black': { hex: '#1e1e1e', rgb: 'rgb(30, 30, 30)', r: 30, g: 30, b: 30, label: 'Matte Black', code: 'MBLK' },
  white: { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', r: 255, g: 255, b: 255, label: 'Crisp White', code: 'WHT' },
  'pearl white': { hex: '#F8F6F0', rgb: 'rgb(248, 246, 240)', r: 248, g: 246, b: 240, label: 'Pearl White', code: 'PWHT' },
  'antique white': { hex: '#FAEBD7', rgb: 'rgb(250, 235, 215)', r: 250, g: 235, b: 215, label: 'Antique White', code: 'AWHT' },
  ivory: { hex: '#FFFFF0', rgb: 'rgb(255, 255, 240)', r: 255, g: 255, b: 240, label: 'Ivory', code: 'IVR' },
  cream: { hex: '#FFFDD0', rgb: 'rgb(255, 253, 208)', r: 255, g: 253, b: 208, label: 'Cream', code: 'CRM' },
  mahogany: { hex: '#4A0E0E', rgb: 'rgb(74, 14, 14)', r: 74, g: 14, b: 14, label: 'Rich Mahogany', code: 'MAH' },
  'dark mahogany': { hex: '#320A0A', rgb: 'rgb(50, 10, 10)', r: 50, g: 10, b: 10, label: 'Dark Mahogany', code: 'DMAH' },
  walnut: { hex: '#4A2E18', rgb: 'rgb(74, 46, 24)', r: 74, g: 46, b: 24, label: 'Walnut Brown', code: 'WAL' },
  'dark walnut': { hex: '#2C1A0E', rgb: 'rgb(44, 26, 14)', r: 44, g: 26, b: 14, label: 'Dark Walnut', code: 'DWAL' },
  oak: { hex: '#8A6642', rgb: 'rgb(138, 102, 66)', r: 138, g: 102, b: 66, label: 'Natural Oak', code: 'OAK' },
  'golden oak': { hex: '#B8860B', rgb: 'rgb(184, 134, 11)', r: 184, g: 134, b: 11, label: 'Golden Oak', code: 'GOAK' },
  cherry: { hex: '#661A1D', rgb: 'rgb(102, 26, 29)', r: 102, g: 26, b: 29, label: 'Cherry Red', code: 'CHRY' },
  'dark cherry': { hex: '#420D0F', rgb: 'rgb(66, 13, 15)', r: 66, g: 13, b: 15, label: 'Dark Cherry', code: 'DCHR' },
  rosewood: { hex: '#65000B', rgb: 'rgb(101, 0, 11)', r: 101, g: 0, b: 11, label: 'Deep Rosewood', code: 'ROSE' },
  gold: { hex: '#D4AF37', rgb: 'rgb(212, 175, 55)', r: 212, g: 175, b: 55, label: 'Metallic Gold', code: 'GLD' },
  silver: { hex: '#C0C0C0', rgb: 'rgb(192, 192, 192)', r: 192, g: 192, b: 192, label: 'Brushed Silver', code: 'SLV' },
  bronze: { hex: '#8C6239', rgb: 'rgb(140, 98, 57)', r: 140, g: 98, b: 57, label: 'Antique Bronze', code: 'BRNZ' },
  copper: { hex: '#B87333', rgb: 'rgb(184, 115, 51)', r: 184, g: 115, b: 51, label: 'Polished Copper', code: 'CPR' },
  navy: { hex: '#0A192F', rgb: 'rgb(10, 25, 47)', r: 10, g: 25, b: 47, label: 'Navy Blue', code: 'NAV' },
  'navy blue': { hex: '#0A192F', rgb: 'rgb(10, 25, 47)', r: 10, g: 25, b: 47, label: 'Navy Blue', code: 'NAV' },
  'royal blue': { hex: '#1E3A8A', rgb: 'rgb(30, 58, 138)', r: 30, g: 58, b: 138, label: 'Royal Blue', code: 'RBLU' },
  burgundy: { hex: '#800020', rgb: 'rgb(128, 0, 32)', r: 128, g: 0, b: 32, label: 'Burgundy Wine', code: 'BRG' },
  wine: { hex: '#722F37', rgb: 'rgb(114, 47, 55)', r: 114, g: 47, b: 55, label: 'Deep Wine', code: 'WIN' },
  'forest green': { hex: '#1E3F20', rgb: 'rgb(30, 63, 32)', r: 30, g: 63, b: 32, label: 'Forest Green', code: 'FGRN' },
  charcoal: { hex: '#262626', rgb: 'rgb(38, 38, 38)', r: 38, g: 38, b: 38, label: 'Charcoal Grey', code: 'CHRC' },
  brown: { hex: '#5C381E', rgb: 'rgb(92, 56, 30)', r: 92, g: 56, b: 30, label: 'Classic Brown', code: 'BRN' },
  grey: { hex: '#6B7280', rgb: 'rgb(107, 114, 128)', r: 107, g: 114, b: 128, label: 'Slate Grey', code: 'GRY' },
  gray: { hex: '#6B7280', rgb: 'rgb(107, 114, 128)', r: 107, g: 114, b: 128, label: 'Slate Grey', code: 'GRY' },
  purple: { hex: '#581C87', rgb: 'rgb(88, 28, 135)', r: 88, g: 28, b: 135, label: 'Royal Purple', code: 'PUR' },
  red: { hex: '#B91C1C', rgb: 'rgb(185, 28, 28)', r: 185, g: 28, b: 28, label: 'Ruby Red', code: 'RED' },
  blue: { hex: '#1D4ED8', rgb: 'rgb(29, 78, 216)', r: 29, g: 78, b: 216, label: 'Sapphire Blue', code: 'BLU' },
};

// Popular palette for quick one-click adding
export const COFFIN_POPULAR_PALETTE = [
  { name: 'Black', hex: '#111111', rgb: 'rgb(17, 17, 17)' },
  { name: 'White', hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)' },
  { name: 'Mahogany', hex: '#4A0E0E', rgb: 'rgb(74, 14, 14)' },
  { name: 'Walnut', hex: '#4A2E18', rgb: 'rgb(74, 46, 24)' },
  { name: 'Oak', hex: '#8A6642', rgb: 'rgb(138, 102, 66)' },
  { name: 'Gold', hex: '#D4AF37', rgb: 'rgb(212, 175, 55)' },
  { name: 'Silver', hex: '#C0C0C0', rgb: 'rgb(192, 192, 192)' },
  { name: 'Rosewood', hex: '#65000B', rgb: 'rgb(101, 0, 11)' },
  { name: 'Dark Cherry', hex: '#420D0F', rgb: 'rgb(66, 13, 15)' },
  { name: 'Navy Blue', hex: '#0A192F', rgb: 'rgb(10, 25, 47)' },
  { name: 'Burgundy', hex: '#800020', rgb: 'rgb(128, 0, 32)' },
  { name: 'Ivory', hex: '#FFFFF0', rgb: 'rgb(255, 255, 240)' },
];

/**
 * Detects RGB and Hex from any typed color input (name, hex, rgb, typo)
 * @param {string} rawInput 
 * @returns {object} { isValid, rawInput, resolvedName, hex, rgbStr, r, g, b, isDark }
 */
export function detectColorRGB(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      isValid: false,
      rawInput: '',
      resolvedName: '',
      hex: '#cccccc',
      rgbStr: 'rgb(204, 204, 204)',
      r: 204,
      g: 204,
      b: 204,
      isDark: false,
    };
  }

  const clean = rawInput.trim();
  const lower = clean.toLowerCase();

  // 1. Check typo dictionary first (e.g. 'balck' -> 'black')
  const correctedKey = TYPO_COLOR_MAP[lower] || lower;

  // 2. Check specialized coffin colors
  if (COFFIN_SPECIALTY_COLORS[correctedKey]) {
    const spec = COFFIN_SPECIALTY_COLORS[correctedKey];
    const isDark = (spec.r * 299 + spec.g * 587 + spec.b * 114) / 1000 < 140;
    return {
      isValid: true,
      rawInput: clean,
      resolvedName: capitalize(spec.label || correctedKey),
      hex: spec.hex,
      rgbStr: spec.rgb,
      r: spec.r,
      g: spec.g,
      b: spec.b,
      isDark,
    };
  }

  // 3. Check Hex format (#fff, #ffffff, etc.)
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(clean)) {
    let hex = clean;
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 140;
    return {
      isValid: true,
      rawInput: clean,
      resolvedName: clean.toUpperCase(),
      hex: hex.toUpperCase(),
      rgbStr: `rgb(${r}, ${g}, ${b})`,
      r,
      g,
      b,
      isDark,
    };
  }

  // 4. Check rgb(r, g, b)
  const rgbMatch = clean.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = Math.min(255, parseInt(rgbMatch[1], 10));
    const g = Math.min(255, parseInt(rgbMatch[2], 10));
    const b = Math.min(255, parseInt(rgbMatch[3], 10));
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 140;
    return {
      isValid: true,
      rawInput: clean,
      resolvedName: clean,
      hex,
      rgbStr: `rgb(${r}, ${g}, ${b})`,
      r,
      g,
      b,
      isDark,
    };
  }

  // 5. Browser canvas evaluation fallback (handles all CSS named colors e.g. 'maroon', 'goldenrod', 'cyan')
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillStyle = correctedKey;
      const computedHex = ctx.fillStyle; // returns '#rrggbb' or rgb(...)

      if (computedHex && computedHex.startsWith('#')) {
        const r = parseInt(computedHex.slice(1, 3), 16);
        const g = parseInt(computedHex.slice(3, 5), 16);
        const b = parseInt(computedHex.slice(5, 7), 16);
        const isDark = (r * 299 + g * 587 + b * 114) / 1000 < 140;
        return {
          isValid: true,
          rawInput: clean,
          resolvedName: capitalize(correctedKey),
          hex: computedHex.toUpperCase(),
          rgbStr: `rgb(${r}, ${g}, ${b})`,
          r,
          g,
          b,
          isDark,
        };
      }
    } catch {
      // ignore
    }
  }

  // If incomplete or unknown typing
  return {
    isValid: false,
    rawInput: clean,
    resolvedName: clean,
    hex: '#71717A',
    rgbStr: 'rgb(113, 113, 122)',
    r: 113,
    g: 113,
    b: 122,
    isDark: true,
  };
}

/**
 * Capitalizes first letter of words
 */
function capitalize(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Generate a consistent SKU based on Type name and Color name
 * e.g. ("Doom", "White") -> "DOOM-WHT"
 */
export function generateVariantSku(typeName, colorName) {
  const tCode = String(typeName || 'COF')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5) || 'COF';

  const colorLower = String(colorName || 'VAR').toLowerCase().trim();
  const matchedSpec = COFFIN_SPECIALTY_COLORS[colorLower] || COFFIN_SPECIALTY_COLORS[TYPO_COLOR_MAP[colorLower]];
  const cCode = matchedSpec?.code ||
    String(colorName || 'VAR')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 3) || 'VAR';

  return `${tCode}-${cCode}`;
}

/**
 * Load Registered Coffin Types Catalog from localStorage
 */
export function loadCoffinTypesCatalog() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('coffinTypesCatalog');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  // Default clean seed catalog if none registered yet
  const defaults = [
    {
      id: 'type-doom',
      name: 'Doom',
      description: 'Classic dome-top funeral casket with contoured rails',
      colors: [
        { name: 'White', hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', sku: 'DOOM-WHT' },
        { name: 'Midnight Black', hex: '#111111', rgb: 'rgb(17, 17, 17)', sku: 'DOOM-BLK' },
        { name: 'Rich Mahogany', hex: '#4A0E0E', rgb: 'rgb(74, 14, 14)', sku: 'DOOM-MAH' },
        { name: 'Walnut Brown', hex: '#4A2E18', rgb: 'rgb(74, 46, 24)', sku: 'DOOM-WAL' },
        { name: 'Metallic Gold', hex: '#D4AF37', rgb: 'rgb(212, 175, 55)', sku: 'DOOM-GLD' },
      ],
    },
    {
      id: 'type-president',
      name: 'Presidential Heritage',
      description: 'Solid hardwood with premium velvet interior and dual-tone finish',
      colors: [
        { name: 'Midnight Black', hex: '#111111', rgb: 'rgb(17, 17, 17)', sku: 'PRES-BLK' },
        { name: 'Deep Rosewood', hex: '#65000B', rgb: 'rgb(101, 0, 11)', sku: 'PRES-ROSE' },
        { name: 'Rich Mahogany', hex: '#4A0E0E', rgb: 'rgb(74, 14, 14)', sku: 'PRES-MAH' },
        { name: 'Pearl White', hex: '#F8F6F0', rgb: 'rgb(248, 246, 240)', sku: 'PRES-PWHT' },
      ],
    },
    {
      id: 'type-executive',
      name: 'Executive Oak',
      description: 'Crafted American oak casket with swing bar hardware',
      colors: [
        { name: 'Natural Oak', hex: '#8A6642', rgb: 'rgb(138, 102, 66)', sku: 'EXEC-OAK' },
        { name: 'Golden Oak', hex: '#B8860B', rgb: 'rgb(184, 134, 11)', sku: 'EXEC-GOAK' },
        { name: 'Walnut Brown', hex: '#4A2E18', rgb: 'rgb(74, 46, 24)', sku: 'EXEC-WAL' },
      ],
    },
  ];

  try {
    localStorage.setItem('coffinTypesCatalog', JSON.stringify(defaults));
    syncLegacyStores(defaults);
  } catch {
    // ignore
  }

  return defaults;
}

/**
 * Save Coffin Types Catalog to localStorage and sync legacy stores
 */
export function saveCoffinTypesCatalog(catalog) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('coffinTypesCatalog', JSON.stringify(catalog));
    syncLegacyStores(catalog);
  } catch (e) {
    console.error('Error saving coffin types catalog:', e);
  }
}

/**
 * Synchronize legacy localStorage keys ('coffinTypes' and 'coffinColors')
 * so that any legacy code / dropdown in other files continues to work smoothly.
 */
function syncLegacyStores(catalog) {
  if (!Array.isArray(catalog)) return;
  try {
    const types = [...new Set(catalog.map((t) => t.name).filter(Boolean))].sort();
    const colors = [
      ...new Set(
        catalog.flatMap((t) => (t.colors || []).map((c) => c.name)).filter(Boolean)
      ),
    ].sort();

    localStorage.setItem('coffinTypes', JSON.stringify(types));
    localStorage.setItem('coffinColors', JSON.stringify(colors));
  } catch {
    // ignore
  }
}

/**
 * Load Registered Coffin Colors Catalog from localStorage
 */
export function loadRegisteredColors() {
  if (typeof window === 'undefined') return COFFIN_POPULAR_PALETTE;
  try {
    const raw = localStorage.getItem('coffinColorsCatalog');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }

  // Default clean seed of funeral casket colors
  const defaults = COFFIN_POPULAR_PALETTE.map((p) => {
    const det = detectColorRGB(p.name);
    return {
      name: p.name,
      hex: p.hex || det.hex,
      rgb: p.rgb || det.rgbStr,
      isDark: det.isDark,
    };
  });

  try {
    localStorage.setItem('coffinColorsCatalog', JSON.stringify(defaults));
    localStorage.setItem('coffinColors', JSON.stringify(defaults.map((c) => c.name)));
  } catch {
    // ignore
  }

  return defaults;
}

/**
 * Save Registered Coffin Colors Catalog to localStorage
 */
export function saveRegisteredColors(colors) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('coffinColorsCatalog', JSON.stringify(colors));
    localStorage.setItem('coffinColors', JSON.stringify(colors.map((c) => c.name)));
  } catch (e) {
    console.error('Error saving coffin colors catalog:', e);
  }
}

/**
 * Register a new color (with automatic RGB / Hex resolution or optional custom Hex)
 */
export function addRegisteredColor(colorName, customHex = null) {
  if (!colorName || !colorName.trim()) return loadRegisteredColors();
  const current = loadRegisteredColors();
  const cleanName = colorName.trim();
  const existingIndex = current.findIndex(
    (c) => c.name.toLowerCase() === cleanName.toLowerCase()
  );

  const detected = detectColorRGB(customHex || cleanName);
  const newColorEntry = {
    name: detected.resolvedName || cleanName,
    hex: customHex || detected.hex,
    rgb: detected.rgbStr,
    isDark: detected.isDark,
  };

  let updated;
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = newColorEntry;
  } else {
    updated = [newColorEntry, ...current];
  }

  saveRegisteredColors(updated);
  return updated;
}

/**
 * Remove a registered color
 */
export function removeRegisteredColor(colorName) {
  if (!colorName) return loadRegisteredColors();
  const current = loadRegisteredColors();
  const updated = current.filter(
    (c) => c.name.toLowerCase() !== colorName.trim().toLowerCase()
  );
  saveRegisteredColors(updated);
  return updated;
}

/**
 * Add or update a coffin type in the catalog
 */
export function addCoffinType({ name, description = '', colors = [] }) {
  if (!name || !name.trim()) return loadCoffinTypesCatalog();
  const current = loadCoffinTypesCatalog();
  const cleanName = name.trim();
  const id = `type-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
  
  const existingIdx = current.findIndex(
    (t) => t.name.toLowerCase() === cleanName.toLowerCase()
  );

  const newEntry = {
    id: existingIdx >= 0 ? current[existingIdx].id : id,
    name: cleanName,
    description: description.trim(),
    colors: colors.map((c) => {
      const det = detectColorRGB(c.hex || c.name);
      return {
        name: c.name || det.resolvedName,
        hex: c.hex || det.hex,
        rgb: c.rgb || det.rgbStr,
        sku: generateVariantSku(cleanName, c.name),
      };
    }),
  };

  let updated;
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = newEntry;
  } else {
    updated = [...current, newEntry];
  }

  saveCoffinTypesCatalog(updated);
  return updated;
}

/**
 * Remove a coffin type from the catalog
 */
export function removeCoffinType(typeIdOrName) {
  if (!typeIdOrName) return loadCoffinTypesCatalog();
  const current = loadCoffinTypesCatalog();
  const target = String(typeIdOrName).toLowerCase();
  const updated = current.filter(
    (t) => t.id.toLowerCase() !== target && t.name.toLowerCase() !== target
  );
  saveCoffinTypesCatalog(updated);
  return updated;
}

/**
 * Cleanly formats a branch name or branch slug into a human-friendly branch name
 * e.g., 'restpoint-thika' -> 'Thika', 'restpoint_co_ke_thika' -> 'Thika', 'thika' -> 'Thika'
 */
export function formatBranchDisplayName(rawName, rawSlug) {
  let val = String(rawName || rawSlug || '').trim();
  if (!val) return 'Main Branch';

  // If it's a UUID, return 'Main Branch'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
    return 'Main Branch';
  }

  // Remove web domains like .co.ke, .com, etc.
  val = val.replace(/\.co\.ke|\.com|\.org|\.net/gi, '');

  // Strip known tenant prefixes e.g. "restpoint-", "restpoint_", "tenant-"
  val = val.replace(/^(restpoint|tenant|rest_point|restpoint_co_ke|restpoint-co-ke)[_\-\s]+/i, '');
  val = val.replace(/^(branch)[_\-\s]+/i, '');

  // Strip trailing _branch, -branch, _db, -db
  val = val.replace(/[_\-\s]+(branch|db|database)$/i, '');

  // Strip leading and trailing punctuation
  val = val.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

  // Replace underscores and dashes with spaces
  val = val.replace(/[_\-]+/g, ' ').trim();

  // If after stripping it's empty or just "main", return "Main Branch"
  if (!val || val.toLowerCase() === 'main') {
    return 'Main Branch';
  }

  // Proper Title Case, preserving acronyms like CBD
  return val
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (word.toUpperCase() === 'CBD') return 'CBD';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}
