import type { ReachDomain } from '../../../types/traits';
import { SPHERE_COLORS, REACH_TO_SPHERE, SPHERE_TO_FOUNDATION } from '../constants';

export interface TinctureSet {
  primary: string;    // Sphere canonical color
  secondary: string;  // Primary at 30% brightness
  foundation: string; // Foundation quadrant color
  charge: string;     // Contrasting color for charge visibility
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Threadbare heraldic register (THR-638).
 *
 * STYLE.md is explicit: the world's value range is 10–40% brightness, "the
 * world absorbs light; only magic emits it", and pastels are excluded outright.
 * A coat of arms is a *physical object* — cloth and dye — so the field must sit
 * in the world's dark, worn range and the sphere's colour must appear as the
 * charge: the device that reads at distance, the thread breaking through.
 *
 * The generator originally did the inverse — a vivid sphere colour as the whole
 * shield field with a near-black charge on top — which rendered as bright flat
 * pastels (mint, salmon, sky blue). Tolerable at 16 px on the hex map, a direct
 * style violation at detail-surface size. These constants invert it.
 *
 * NFP #1 (tunability): the whole register is these three numbers plus the base.
 */

/** Cold near-black the field is mixed toward — the STYLE.md twilight/charcoal floor. */
const HERALDIC_DARK_BASE = '#14141c';
/** How far the primary field is crushed toward the dark base (0 = pure sphere hue, 1 = black). */
const FIELD_DARKNESS = 0.82;
/** The division/secondary field sits darker still, so divisions read as tonal, not as colour blocks. */
const DIVISION_DARKNESS = 0.9;

/** Mix `hex` toward `HERALDIC_DARK_BASE` by `amount` (0..1). */
function crush(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [br, bg, bb] = hexToRgb(HERALDIC_DARK_BASE);
  const k = 1 - amount;
  return rgbToHex(r * k + br * amount, g * k + bg * amount, b * k + bb * amount);
}

/** Neutral fallback tinctures when reach/sphere lookup fails */
const FALLBACK_TINCTURES: TinctureSet = {
  primary: '#2a2a30',
  secondary: '#1c1c22',
  foundation: '#33333a',
  charge: '#b8b0a0',
};

export function deriveTinctures(reach: ReachDomain): TinctureSet {
  const sphere = REACH_TO_SPHERE[reach];
  if (!sphere) return FALLBACK_TINCTURES;
  const foundationSphere = SPHERE_TO_FOUNDATION[sphere];
  const sphereColor = SPHERE_COLORS[sphere];
  if (!sphereColor) return FALLBACK_TINCTURES;

  // Field + division: the sphere hue crushed into the world's dark value range.
  const primary = crush(sphereColor, FIELD_DARKNESS);
  const secondary = crush(sphereColor, DIVISION_DARKNESS);
  const foundation = crush(SPHERE_COLORS[foundationSphere] ?? '#666666', FIELD_DARKNESS);

  // Charge: the sphere colour itself, undimmed. Against a field this dark it
  // always clears contrast, so the old luminance flip is no longer needed —
  // one register for every sphere instead of two.
  const charge = sphereColor;

  return { primary, secondary, foundation, charge };
}

/** Retained for callers that still want a raw luminance read of a tincture. */
export function tinctureLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return luminance(r, g, b);
}
