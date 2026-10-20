import { createNoise2D } from 'simplex-noise';
import { mulberry32 } from '../../../lib/prng';
import { TERRAIN_PALETTE, FALLBACK_TERRAIN_COLOR } from './terrainPalette';
import { getWaterColor, WATER_PALETTE, WATER_TERRAIN_KEYS } from './waterPalette';
import { getActivePalette } from './activePalette';

/** NFP #1: Brightness noise range (±5% per TERR-05). */
export const BRIGHTNESS_NOISE_RANGE = 0.05;

/**
 * Ocean terrain types that support depth band coloring.
 * Lakes and rivers use their own palette entry rather than depth bands.
 */
const DEPTH_BAND_TERRAINS = new Set(['ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'reef']);

/**
 * Parses a `#RRGGBB` hex color string into normalized [r, g, b] float components.
 * Returns [0.533, 0.533, 0.533] (grey) on malformed input (fail-soft per NFP #4).
 */
export function hexToThreeColor(hex: string): [number, number, number] {
  const match = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
  if (!match) {
    return [0.533, 0.533, 0.533]; // fallback grey, fail-soft
  }
  return [
    parseInt(match[1], 16) / 255,
    parseInt(match[2], 16) / 255,
    parseInt(match[3], 16) / 255,
  ];
}

/**
 * Multiplies each RGB channel by (1 + noiseFactor), clamped to [0, 1].
 * noiseFactor is expected in range [-BRIGHTNESS_NOISE_RANGE, +BRIGHTNESS_NOISE_RANGE].
 */
export function applyBrightnessNoise(
  r: number,
  g: number,
  b: number,
  noiseFactor: number,
): [number, number, number] {
  const factor = 1 + noiseFactor;
  return [
    Math.min(1, Math.max(0, r * factor)),
    Math.min(1, Math.max(0, g * factor)),
    Math.min(1, Math.max(0, b * factor)),
  ];
}

// Cache noise generators by seed to avoid re-creating on every call.
const noiseCache = new Map<number, ReturnType<typeof createNoise2D>>();

function getNoise2D(seed: number): ReturnType<typeof createNoise2D> {
  if (!noiseCache.has(seed)) {
    noiseCache.set(seed, createNoise2D(mulberry32(seed)));
  }
  return noiseCache.get(seed)!;
}

/**
 * The active palette's flat colour (#RRGGBB) for a terrain, before per-hex noise — the
 * lookup `getHexColor` paints with, shared with the minimap's family tones (THR-1901), so
 * the two can never disagree about what colour a terrain is.
 *
 * Priority: a lake hex → lake; ocean depth-band terrain → deep ocean; other water → its
 * water colour; land → theme override, base palette, then the theme's fallback.
 */
export function resolveTerrainColorHex(terrain: string, lakeId?: number): string {
  const theme = getActivePalette();
  const tOverrides = theme.terrainOverrides;
  const wOverrides = theme.waterOverrides;
  const fallback = theme.fallbackTerrainColor;
  const waterColor = (key: string): string => wOverrides[key] ?? WATER_PALETTE[key] ?? fallback;

  // A lake hex uses the lake colour regardless of terrain.
  if (lakeId !== undefined && lakeId >= 0) return waterColor('lake');
  // Ocean terrain → uniform deep_ocean colour; organic contour fills layer the depth on top.
  if (DEPTH_BAND_TERRAINS.has(terrain)) return waterColor('deep_ocean');
  if (WATER_TERRAIN_KEYS.has(terrain)) return getWaterColor(terrain, wOverrides) ?? fallback;
  return tOverrides[terrain] ?? TERRAIN_PALETTE[terrain] ?? fallback;
}

/**
 * Main color lookup entry point.
 *
 * Priority order:
 * 1. If lakeId >= 0 → use WATER_PALETTE.lake (lake hex, overrides terrain)
 * 2. If ocean terrain AND elevation provided → use getDepthBandColor(elevation) for 3-band depth gradient
 * 3. If other water terrain → use flat water palette
 * 4. Terrain palette
 * 5. FALLBACK_TERRAIN_COLOR if unknown
 * 6. Applies per-hex brightness noise (±5%) via seeded noise at (col, row)
 *
 * NFP #3: Deterministic — colors derived from seeded noise + elevation, same inputs = same output.
 * NFP #4: Fail-soft — any terrain/elevation combo returns a valid color, no throws.
 *
 * Returns [r, g, b] floats in [0, 1] ready for THREE.Color.
 */
export function getHexColor(
  terrain: string,
  seed: number,
  col: number,
  row: number,
  options?: {
    /** Elevation value for ocean depth band coloring (0-1 range). */
    elevation?: number;
    /** Lake ID from lakeIds array. >= 0 means this hex is part of a lake. */
    lakeId?: number;
  },
): [number, number, number] {
  const { lakeId } = options ?? {};
  const colorHex = resolveTerrainColorHex(terrain, lakeId);

  // Parse to float RGB
  let [r, g, b] = hexToThreeColor(colorHex);

  // Apply seeded per-hex brightness noise (NFP #3: determinism via seeded PRNG)
  const noise2D = getNoise2D(seed);
  // noise2D returns [-1, 1]; scale to [-BRIGHTNESS_NOISE_RANGE, +BRIGHTNESS_NOISE_RANGE]
  const noiseFactor = noise2D(col, row) * BRIGHTNESS_NOISE_RANGE;
  [r, g, b] = applyBrightnessNoise(r, g, b, noiseFactor);

  return [r, g, b];
}
