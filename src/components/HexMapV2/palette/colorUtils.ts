import { createNoise2D } from 'simplex-noise';
import { mulberry32 } from '../../../lib/prng';
import { TERRAIN_PALETTE, FALLBACK_TERRAIN_COLOR } from './terrainPalette';
import { getWaterColor } from './waterPalette';

/** NFP #1: Brightness noise range (±5% per TERR-05). */
export const BRIGHTNESS_NOISE_RANGE = 0.05;

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
 * Main color lookup entry point.
 * 1. Checks water palette first (water terrain has priority).
 * 2. Falls back to terrain palette.
 * 3. Falls back to FALLBACK_TERRAIN_COLOR if terrain unknown.
 * 4. Applies per-hex brightness noise (±5%) using seeded noise sampled at (col, row).
 *
 * Returns [r, g, b] floats in [0, 1] ready for THREE.Color.
 */
export function getHexColor(
  terrain: string,
  seed: number,
  col: number,
  row: number,
): [number, number, number] {
  // Resolve base color string
  const waterColor = getWaterColor(terrain);
  const colorHex = waterColor
    ?? TERRAIN_PALETTE[terrain]
    ?? FALLBACK_TERRAIN_COLOR;

  // Parse to float RGB
  let [r, g, b] = hexToThreeColor(colorHex);

  // Apply seeded per-hex brightness noise (NFP #3: determinism via seeded PRNG)
  const noise2D = getNoise2D(seed);
  // noise2D returns [-1, 1]; scale to [-BRIGHTNESS_NOISE_RANGE, +BRIGHTNESS_NOISE_RANGE]
  const noiseFactor = noise2D(col, row) * BRIGHTNESS_NOISE_RANGE;
  [r, g, b] = applyBrightnessNoise(r, g, b, noiseFactor);

  return [r, g, b];
}
