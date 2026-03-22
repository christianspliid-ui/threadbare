/**
 * Render layer ordering for the Three.js hex renderer.
 * All 13 layers are established here as named constants.
 * Phase 1 activates layers 0 (HEX_FILL) and 2 (GRID).
 * Remaining layers are scaffold-only — constants exist, geometry populated in later phases.
 *
 * NFP #1: Every render order value is named — no magic numbers in mesh setup.
 */
export const RENDER_ORDER = {
  STENCIL_WRITE:  -1,  // Stencil buffer write pass — must render before stencil-tested geometry
  HEX_FILL:       0,
  COASTLINE:      1,
  GRID:           2,
  ELEVATION_TICKS:3,
  RIVERS:         4,
  ROADS:          5,
  BORDERS:        6,
  SIGNIFIERS:     7,
  LOCATIONS:      8,
  AGENTS:         9,
  EVENTS:         10,
  LABELS:         11,
  FOG:            12,
} as const;

export type RenderLayerName = keyof typeof RENDER_ORDER;
