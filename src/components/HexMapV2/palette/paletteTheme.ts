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
  gridLineColor:        0x5D5E66,
  elevationTickColor:   0x2a1a0a,
  fogUnexploredColor:   '#0a0a0c',
  labelLandColor:       '#1a1410',
  labelRiverColor:      '#1a4070',
  labelLocationColor:   '#1a1a1a',
  labelHaloColor:       '240,235,220',  // RGB triplet for rgba()
  labelHaloOpacity:     0.9,
  labelHaloOpacityOuter: 0.6,
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
  gridLineColor:        0x484a52,
  elevationTickColor:   0x1a1a2a,
  fogUnexploredColor:   '#08080a',
  labelLandColor:       '#c8c4b8',
  labelRiverColor:      '#70a0c0',
  labelLocationColor:   '#b8b4a8',
  labelHaloColor:       '12,12,16',  // RGB triplet for rgba()
  labelHaloOpacity:     0.85,
  labelHaloOpacityOuter: 0.5,
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
