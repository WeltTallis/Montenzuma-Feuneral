

/**
 * RestPoint Dashboard — single source of truth for the entire dashboard theme.
 *
 * All colour, border, text and surface tokens used across the calendar views,
 * KPI cards, charts, filter sidebar, panels, top bar and nav drawer are defined
 * here and imported by components. Mirrors the refined shadcn-style dark design
 * language of the shipped TSX prototypes.
 */

// ─── Page / surface hierarchy (dark, layered) ────────────────────────────────
export const BG0 = "#0a0f1d"; // app background
export const BG1 = "#0f1524"; // primary card surface
export const BG2 = "#0d1420"; // inset / calendar cell surface
export const BG3 = "#17233a"; // raised chip / toolbar / hover
export const SIDE = "#0d1220"; // filter sidebar surface

// ─── Borders ─────────────────────────────────────────────────────────────────
export const BDR = "rgba(148,163,184,0.10)";  // strong border
export const BDR2 = "rgba(148,163,184,0.07)"; // subtle border

// ── Text (typography hierarchy) ──────────────────────────────────────────────
export const TEXT1 = "#e2e8f0"; // primary text
export const TEXT2 = "#cbd5e1"; // body text
export const TEXT3 = "#94a3b8"; // muted text
export const TEXT4 = "#64748b"; // faint / supporting text
export const HEAD = "#334155"; // small uppercase section captions
export const CAP = "#475569";  // overline / tabular captions

// ── Elevation ────────────────────────────────────────────────────────────────
export const CARD_GRAD = "linear-gradient(180deg, #131c30 0%, #0f1628 100%)"; // card lighter than page so the grid reads
export const CARD_SHADOW = "0 18px 40px rgba(0, 0, 0, 0.4)";
export const PANEL_SHADOW = "0 10px 26px rgba(0, 0, 0, 0.3)";

// ── Brand accent (indigo) ────────────────────────────────────────────────────
export const ACCENT = "#818cf8";
export const ACCENT_SOFT = "rgba(129,140,248,0.16)";
export const FOCUS = "rgba(129,140,248,0.5)";
export const TODAY_FILL = "rgba(129,140,248,0.13)";