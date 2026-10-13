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
  HEX_PULSE:      7.5,  // Ambient glow for tense/volatile hexes — below signifiers
  SIGNIFIERS:     8,
  ANOMALY_SHIMMER:8.2,   // Between signifiers and locations — undiscovered hint glow
  ANOMALY_HALO:   8.5,   // Between shimmer and locations — discovered ground ring
  LOCATION_RARITY_SIGNIFIER: 8.7, // Between anomaly halo and locations — rarity halo ring
  REACH_SIGNATURE_SIGNIFIER: 8.8, // Ascendant reach-signature footprints (warhost/rift/wonder) — above rarity ring, below locations
  DOMINION_DIM:   8.95,  // THR-1750 Dominion lens — dim + Hostile hatch, below location icons
  DOMINION_GLOW:  8.96,  // THR-1750 Sovereign glow (the lens's only hue)
  LOCATIONS:      9,
  DOMINION_FRONTIER: 9.2, // THR-1750 gold frontier line — above locations, below threads
  THREADS:           9.5,   // Relationship thread lines — below agent sprites
  COMPANY_CLUSTER:   9.6,   // Company enclosing ring + bond glyph — below agent dots (THR-74)
  AGENTS:            10,
  ARMIES:            10.5,  // Above agents (10), below events (11)
  BATTLE_INDICATORS: 10.8,  // Above armies, below events
  ACTIVITY_ICONS:    10.9,  // Reach micro-icons — above combat indicators, below events
  DOMINION_DROP_BADGE: 10.95, // THR-1750 band-drop badge (broken gold ring)
  EVENTS:            11,
  LABELS:            12,
  FOG:               13,
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
  HEX_PULSE:       0.060,  // Ambient glow for tense/volatile hexes — below signifiers
  SIGNIFIERS:      0.070,
  ANOMALY_SHIMMER: 0.071,   // Just above signifiers — undiscovered hint glow
  ANOMALY_HALO:    0.075,   // Between signifiers and locations — discovered ground ring
  LOCATION_RARITY_SIGNIFIER: 0.077, // Between anomaly halo and locations — rarity halo ring
  REACH_SIGNATURE_SIGNIFIER: 0.078, // Ascendant reach-signature footprints — above rarity ring, below locations
  DOMINION_DIM:    0.0785, // THR-1750 — below location icons
  DOMINION_GLOW:   0.0788, // THR-1750
  LOCATIONS:       0.080,
  TRAILS:          0.085,
  DOMINION_FRONTIER: 0.090, // THR-1750 — above locations, below threads
  THREADS:           5.500,  // Relationship thread lines — below agent sprites
  COMPANY_CLUSTER:   5.550,  // Company ring + bond glyph — below agent dots (THR-74)
  AGENTS:            6.000,  // Above 3D model geometry (city towers extend ~5 units above base)
  ARMIES:            6.050,  // Above agents but below events
  BATTLE_INDICATORS: 6.080,  // Above armies, below events
  ACTIVITY_ICONS:    6.090,  // Reach micro-icons — above combat indicators, below events
  DOMINION_DROP_BADGE: 6.095, // THR-1750 band-drop badge
  PARTICLE_BURST:    6.060,  // Sphere-colored particle effects above battles, below events
  EVENTS:            6.100,
  FOG_OVERLAY:      12.000,  // Parchment fog overlay — must clear tallest 3D model spires
} as const;
