/**
 * activePalette — Singleton module for the current palette theme.
 *
 * On first import, reads the `palette` URL search param (e.g., `?palette=dark-parchment`).
 * Thereafter, consumers call `getActivePalette()` for the current theme
 * or `setActivePalette()` to swap at runtime (triggers full scene rebuild via callback).
 *
 * NFP #1: Theme selection is a single named constant (the active ID).
 * NFP #3: Deterministic — URL param at load time, explicit set thereafter.
 * NFP #4: Fail-soft — invalid URL param falls back to golden-hour.
 */

import {
  type PaletteTheme,
  type PaletteThemeId,
  PALETTE_THEMES,
  DEFAULT_PALETTE_THEME_ID,
  resolvePaletteThemeId,
} from './paletteTheme';

// ── State ────────────────────────────────────────────────────────────────────

let currentId: PaletteThemeId = DEFAULT_PALETTE_THEME_ID;

// Read URL param at module load time
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  currentId = resolvePaletteThemeId(params.get('palette'));
}

// ── Change listeners ─────────────────────────────────────────────────────────

type PaletteChangeListener = (theme: PaletteTheme) => void;
const listeners = new Set<PaletteChangeListener>();

/**
 * Subscribe to palette changes. Returns an unsubscribe function.
 */
export function onPaletteChange(listener: PaletteChangeListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Returns the currently active palette theme. */
export function getActivePalette(): PaletteTheme {
  return PALETTE_THEMES[currentId];
}

/** Returns the current palette theme ID. */
export function getActivePaletteId(): PaletteThemeId {
  return currentId;
}

/**
 * Switches the active palette at runtime.
 * Notifies all listeners (used by HexMapV2 to trigger a full scene rebuild).
 *
 * NFP #4: Invalid IDs are silently resolved to the default.
 */
export function setActivePalette(id: string): void {
  const resolved = resolvePaletteThemeId(id);
  if (resolved === currentId) return;
  currentId = resolved;
  const theme = PALETTE_THEMES[currentId];
  for (const listener of listeners) {
    listener(theme);
  }
}

// ── Label halo helpers ───────────────────────────────────────────────────────

/**
 * Builds a CSS text-shadow halo string from the active palette's label halo values.
 * Used by RegionLabelOverlay and LocationLabelOverlay.
 */
export function buildLandHalo(theme?: PaletteTheme): string {
  const t = theme ?? getActivePalette();
  const c = t.labelHaloColor;
  const a1 = t.labelHaloOpacity;
  const a2 = t.labelHaloOpacityOuter;
  return [
    `1px 0 0 rgba(${c},${a1})`,
    `-1px 0 0 rgba(${c},${a1})`,
    `0 1px 0 rgba(${c},${a1})`,
    `0 -1px 0 rgba(${c},${a1})`,
    `2px 0 0 rgba(${c},${a2})`,
    `-2px 0 0 rgba(${c},${a2})`,
  ].join(', ');
}

/**
 * Builds a river-variant halo with slightly reduced primary opacity.
 */
export function buildRiverHalo(theme?: PaletteTheme): string {
  const t = theme ?? getActivePalette();
  const c = t.labelHaloColor;
  // River halo uses slightly reduced opacity for the inner ring
  const a1 = Math.max(0, t.labelHaloOpacity - 0.05);
  const a2 = t.labelHaloOpacityOuter;
  return [
    `1px 0 0 rgba(${c},${a1})`,
    `-1px 0 0 rgba(${c},${a1})`,
    `0 1px 0 rgba(${c},${a1})`,
    `0 -1px 0 rgba(${c},${a1})`,
    `2px 0 0 rgba(${c},${a2})`,
    `-2px 0 0 rgba(${c},${a2})`,
  ].join(', ');
}
