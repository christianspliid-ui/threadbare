/**
 * PaletteTheme — Feature-flagged color scheme system for HexMapV2.
 *
 * Every hardcoded color in the hex renderer is consolidated into themed palettes.
 * Two shipped themes: "golden-hour" (warm default) and "dark-parchment" (cool/dark alt).
 *
 * NFP #1: Every color is named and tunable per-theme.
 * NFP #3: Theme selection is deterministic — URL param or explicit set, never random.
 * NFP #4: Unknown theme IDs fall back to golden-hour.
 */

// ─── Theme Type ──────────────────────────────────────────────────────────────

export type PaletteThemeId = 'golden-hour' | 'dark-parchment';

/**
 * Complete color vocabulary for the hex renderer.
 * Every color used by scene meshes, overlays, and fog must come from here.
 */
export interface PaletteTheme {
  readonly id: PaletteThemeId;
  readonly displayName: string;

  // ── Scene ────────────────────────────────────────────────────────────────
  /** Canvas/scene background (THREE.Color hex int) */
  readonly sceneBackground: number;

  // ── Roads ────────────────────────────────────────────────────────────────
  /** Major road color (#RRGGBB) */
  readonly roadMajor: string;
  /** Trail/minor road color (#RRGGBB) */
  readonly roadTrail: string;

  // ── Borders & Capitals ───────────────────────────────────────────────────
  /** Political border color (THREE.Color hex int) */
  readonly borderColor: number;
  /** Capital marker color (THREE.Color hex int) — usually matches borderColor */
  readonly capitalColor: number;
  /** Capital ring overlay color (#RRGGBB) for canvas texture */
  readonly capitalRingColor: string;
  /** Geographic region border color (THREE.Color hex int) — dim, historical */
  readonly geoBorderColor: number;

  // ── Grid ─────────────────────────────────────────────────────────────────
  /** Hex grid line color (THREE.Color hex int) */
  readonly gridLineColor: number;

  // ── Elevation ────────────────────────────────────────────────────────────
  /** Elevation tick mark color (THREE.Color hex int) */
  readonly elevationTickColor: number;

  // ── Fog ──────────────────────────────────────────────────────────────────
  /** Unexplored hex fill color (#RRGGBB) — should match sceneBackground visually */
  readonly fogUnexploredColor: string;

  // ── Labels (CSS) ─────────────────────────────────────────────────────────
  /** Land label text color */
  readonly labelLandColor: string;
  /** River label text color */
  readonly labelRiverColor: string;
  /** Location label text color */
  readonly labelLocationColor: string;
  /** Label halo/outline color (rgba string for text-shadow) */
  readonly labelHaloColor: string;
  /** Label halo opacity (primary — 1px offset) */
  readonly labelHaloOpacity: number;
  /** Label halo opacity (secondary — 2px offset) */
  readonly labelHaloOpacityOuter: number;

  // ── Terrain & Water Overrides ──────────────────────────────────────────
  /**
   * Per-terrain color overrides (#RRGGBB). Keys match terrainPalette.ts.
   * Missing keys fall through to the base TERRAIN_PALETTE.
   */
  readonly terrainOverrides: Readonly<Record<string, string>>;
  /**
   * Per-water-type color overrides (#RRGGBB). Keys match waterPalette.ts.
   * Missing keys fall through to the base WATER_PALETTE.
   */
  readonly waterOverrides: Readonly<Record<string, string>>;
  /** Fallback color for unknown terrain types (#RRGGBB). */
  readonly fallbackTerrainColor: string;
}

// ─── Theme Definitions ───────────────────────────────────────────────────────

/**
 * Golden Hour — warm, sunlit parchment. The default theme.
 * Warm-shifted greens, ivory halos, earth-tone roads, red political borders.
 */
export const GOLDEN_HOUR: PaletteTheme = {
  id: 'golden-hour',
  displayName: 'Golden Hour',

  sceneBackground:      0x0a0a0c,
  roadMajor:            '#6b5a40',
  roadTrail:            '#4a3d2c',
  borderColor:          0xC83030,
  capitalColor:         0xC83030,
  capitalRingColor:     '#cc3333',
  geoBorderColor:       0x000000,   // black — crisp historical borders
  gridLineColor:        0x5D5E66,
  elevationTickColor:   0x2a1a0a,
  fogUnexploredColor:   '#0a0a0c',
  labelLandColor:       '#1a1410',
  labelRiverColor:      '#1a4070',
  labelLocationColor:   '#1a1a1a',
  labelHaloColor:       '240,235,220',  // RGB triplet for rgba()
  labelHaloOpacity:     0.9,
  labelHaloOpacityOuter: 0.6,
  terrainOverrides:     {},  // Golden Hour uses base terrainPalette as-is
  waterOverrides:       {},  // Golden Hour uses base waterPalette as-is
  fallbackTerrainColor: '#888888',
} as const;

/**
 * Dark Parchment — cool, moonlit cartography. Alternate theme.
 * Desaturated blues, silver halos, slate roads, teal political borders.
 */
export const DARK_PARCHMENT: PaletteTheme = {
  id: 'dark-parchment',
  displayName: 'Dark Parchment',

  sceneBackground:      0x08080a,
  roadMajor:            '#4a5060',
  roadTrail:            '#333a48',
  borderColor:          0x3088A0,
  capitalColor:         0x3088A0,
  capitalRingColor:     '#3090a8',
  geoBorderColor:       0x000000,   // black — crisp historical borders
  gridLineColor:        0x484a52,
  elevationTickColor:   0x1a1a2a,
  fogUnexploredColor:   '#08080a',
  labelLandColor:       '#c8c4b8',
  labelRiverColor:      '#70a0c0',
  labelLocationColor:   '#b8b4a8',
  labelHaloColor:       '12,12,16',  // RGB triplet for rgba()
  labelHaloOpacity:     0.85,
  labelHaloOpacityOuter: 0.5,
  // Dark Parchment: cool-shifted, desaturated moonlit terrain
  terrainOverrides: {
    // Lowland — muted sage/steel greens
    grassland:       '#6A7A58',
    savanna:         '#7A7854',
    steppe:          '#8A9068',
    floodplain:      '#5E6E50',
    // Forest — deep blue-greens
    light_forest:    '#5A7048',
    woodland:        '#4C6240',
    temperate_forest:'#3E5436',
    dense_forest:    '#344A30',
    boreal_forest:   '#3E5436',
    tropical_forest: '#2E4A38',
    // Wet — dark olive/slate
    marsh:           '#5E6450',
    swamp:           '#4E5A3C',
    moor_bog:        '#5A7A64',
    // Highland — cool stone/slate
    hills:           '#8A7A58',
    forested_hills:  '#4A5C3C',
    mountains:       '#6A5A40',
    high_mountains:  '#686468',
    plateau:         '#7A6A48',
    mountain_pass:   '#6E6448',
    // Desert — dusty lavender/grey
    sand_desert:     '#A0906A',
    sand_dunes:      '#968858',
    rocky_desert:    '#8A7050',
    hardened_clay:   '#907060',
    badlands:        '#7A5844',
    // Cold — blue-grey ice
    tundra:          '#B0B4B8',
    snow_fields:     '#A8ACB0',
    glacier:         '#909CA8',
    // Volcanic — charcoal/ember
    volcanic:        '#585458',
    volcano:         '#5C3430',
    lava:            '#8A4830',
    // Special
    broken_lands:    '#6A6460',
    dead_forest:     '#606060',
  },
  waterOverrides: {
    shallows:   '#4A7A90',
    ocean:      '#305878',
    deep_ocean: '#1E4060',
    lake:       '#2A5878',
    river:      '#4A7A90',
  },
  fallbackTerrainColor: '#606060',
} as const;

// ─── Registry ────────────────────────────────────────────────────────────────

export const PALETTE_THEMES: Record<PaletteThemeId, PaletteTheme> = {
  'golden-hour': GOLDEN_HOUR,
  'dark-parchment': DARK_PARCHMENT,
} as const;

export const DEFAULT_PALETTE_THEME_ID: PaletteThemeId = 'golden-hour';

/**
 * Resolves a string to a valid PaletteThemeId, falling back to the default.
 * NFP #4: Never throws — unknown IDs silently resolve to golden-hour.
 */
export function resolvePaletteThemeId(raw: string | null | undefined): PaletteThemeId {
  if (raw && raw in PALETTE_THEMES) {
    return raw as PaletteThemeId;
  }
  return DEFAULT_PALETTE_THEME_ID;
}
