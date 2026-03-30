/**
 * Render layer ordering for the Three.js hex renderer.
 * All layers are established here as named constants.
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
  GEO_BORDERS:    6,
  BORDERS:        7,
  SIGNIFIERS:     8,
  LOCATIONS:      9,
  AGENTS:         10,
  EVENTS:         11,
  LABELS:         12,
  FOG:            13,
} as const;

export type RenderLayerName = keyof typeof RENDER_ORDER;

/** Z-positions for each layer. Monotonic with RENDER_ORDER.
 *  All meshes MUST use these values instead of local Z constants. */
export const LAYER_Z = {
  HEX_FILL:        0.000,
  COASTLINE:       0.010,
  GRID:            0.015,
  ELEVATION_TICKS: 0.020,
  RIVERS:          0.025,
  ROADS:           0.030,
  GEO_BORDERS:     0.032,
  BORDERS:         0.035,
  SIGNIFIERS:      0.070,
  LOCATIONS:       0.080,
  TRAILS:          0.085,
  ARMIES:          0.090,  // Army shield sprites — just above movement trails, below 3D geometry
  AGENTS:          6.000,  // Above 3D model geometry (city towers extend ~5 units above base)
  BATTLE_INDICATOR: 6.050, // Battle crossed-swords — between agents (6.000) and events (6.100)
  EVENTS:          6.100,
} as const;
