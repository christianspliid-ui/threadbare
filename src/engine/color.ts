import { FORCE_NAMES, type ForceVector, type ForceName } from '../types';

export const FORCE_COLORS: Record<ForceName, { primary: string; secondary: string; accent: string }> = {
  aether:   { primary: '#8B7EC8', secondary: '#B8CCE0', accent: '#E8E0FF' },
  verdance: { primary: '#5A7A3B', secondary: '#8BAF5A', accent: '#D4E8C4' },
  ignis:    { primary: '#C45A3C', secondary: '#D4956A', accent: '#F0D8C8' },
  umbra:    { primary: '#6B4A7A', secondary: '#3A2A4A', accent: '#C8A0D0' },
  terra:    { primary: '#B8963A', secondary: '#8B6914', accent: '#E8D8B0' },
};

export interface RGB { r: number; g: number; b: number }

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex(rgb: RGB): string {
  const r = Math.round(Math.min(255, Math.max(0, rgb.r)));
  const g = Math.round(Math.min(255, Math.max(0, rgb.g)));
  const b = Math.round(Math.min(255, Math.max(0, rgb.b)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function blendForceColors(fv: ForceVector): string {
  let r = 0, g = 0, b = 0;
  for (const f of FORCE_NAMES) {
    const rgb = hexToRgb(FORCE_COLORS[f].primary);
    const w = fv[f];
    r += rgb.r * w;
    g += rgb.g * w;
    b += rgb.b * w;
  }
  return rgbToHex({ r, g, b });
}

export function darkenColor(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  return rgbToHex({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor });
}

export function forceOverlayColor(force: ForceName, intensity: number): string {
  const rgb = hexToRgb(FORCE_COLORS[force].primary);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity * 0.7})`;
}
