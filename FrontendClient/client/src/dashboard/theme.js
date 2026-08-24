/**
 * RestPoint Dashboard — single source of truth for the entire dashboard theme.
 *
 * All colour, border, text and surface tokens used across the calendar views,
 * KPI cards, charts, filter sidebar, panels, top bar and nav drawer are defined
 * here and imported by components. Light shadcn-style design language matching
 * the store & coffin-reservation modules (soft slate surfaces, hairline borders,
 * indigo accent).
 */

// ─── Page / surface hierarchy (light, layered) ───────────────────────────────
export const BG0 = "#F4F6F8"; // app background
export const BG1 = "#FFFFFF"; // primary card surface
export const BG2 = "#FFFFFF"; // inset / calendar cell surface
export const BG3 = "#F1F5F9"; // raised chip / toolbar / hover
export const SIDE = "#FAFBFD"; // filter sidebar surface

// ─── Borders ─────────────────────────────────────────────────────────────────
export const BDR = "rgba(15,23,42,0.10)";  // strong border
export const BDR2 = "rgba(15,23,42,0.06)"; // subtle border

// ── Text (typography hierarchy) ──────────────────────────────────────────────
export const TEXT1 = "#0F172A"; // primary text
export const TEXT2 = "#334155"; // body text
export const TEXT3 = "#64748B"; // muted text
export const TEXT4 = "#94A3B8"; // faint / supporting text
export const HEAD = "#94A3B8";  // small uppercase section captions
export const CAP = "#64748B";   // overline / tabular captions

// ── Elevation ────────────────────────────────────────────────────────────────
export const CARD_GRAD = "linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 100%)"; // flat white cards
export const CARD_SHADOW = "0 4px 16px rgba(15, 23, 42, 0.06)";
export const PANEL_SHADOW = "0 10px 26px rgba(15, 23, 42, 0.10)";

// ── Brand accent (indigo) ────────────────────────────────────────────────────
export const ACCENT = "#6366f1";
export const ACCENT_SOFT = "rgba(99,102,241,0.10)";
export const FOCUS = "rgba(99,102,241,0.45)";
export const TODAY_FILL = "rgba(99,102,241,0.08)";
