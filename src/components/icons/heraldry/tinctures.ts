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

function darken(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * 0.3, g * 0.3, b * 0.3);
}

export function deriveTinctures(reach: ReachDomain): TinctureSet {
  const sphere = REACH_TO_SPHERE[reach];
  const foundationSphere = SPHERE_TO_FOUNDATION[sphere];
  const primary = SPHERE_COLORS[sphere];
  const secondary = darken(primary);
  const foundation = SPHERE_COLORS[foundationSphere];
  const [r, g, b] = hexToRgb(primary);
  const lum = luminance(r, g, b);
  const charge = lum > 0.25 ? '#1a1a2e' : '#e0ddd4';
  return { primary, secondary, foundation, charge };
}
