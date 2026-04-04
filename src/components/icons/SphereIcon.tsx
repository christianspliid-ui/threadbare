import { memo, useMemo } from 'react';
import type { SphereName } from '../../types/index';
import { SPHERE_COLORS } from './constants';

// ─── Symbol Catalog ───────────────────────────────────────────────────────────

type SymbolFn = (cx: number, cy: number, r: number, color: string) => string;

/**
 * Generates SVG symbol markup for each sphere.
 * cx, cy = center of the icon, r = usable radius for the symbol (smaller than outer circle).
 */
const SPHERE_SYMBOLS: Record<SphereName, SymbolFn> = {
  /** force: three crossing lines from center (impact) */
  force: (cx, cy, r, color) => {
    const d = r * 0.75;
    return (
      `<line x1="${cx - d}" y1="${cy}" x2="${cx + d}" y2="${cy}" stroke="${color}" stroke-width="2" stroke-linecap="round" />` +
      `<line x1="${cx}" y1="${cy - d}" x2="${cx}" y2="${cy + d}" stroke="${color}" stroke-width="2" stroke-linecap="round" />` +
      `<line x1="${cx - d * 0.7}" y1="${cy - d * 0.7}" x2="${cx + d * 0.7}" y2="${cy + d * 0.7}" stroke="${color}" stroke-width="2" stroke-linecap="round" />`
    );
  },

  /** matter: hexagon outline */
  matter: (cx, cy, r, color) => {
    const hr = r * 0.72;
    const points = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + hr * Math.cos(a)},${cy + hr * Math.sin(a)}`;
    }).join(' ');
    return `<polygon points="${points}" fill="none" stroke="${color}" stroke-width="1.8" />`;
  },

  /** energy: circle with 8 emanating rays */
  energy: (cx, cy, r, color) => {
    const innerR = r * 0.32;
    const rayStart = r * 0.44;
    const rayEnd = r * 0.72;
    const rays = Array.from({ length: 8 }, (_, i) => {
      const a = (Math.PI / 4) * i;
      return (
        `<line x1="${cx + rayStart * Math.cos(a)}" y1="${cy + rayStart * Math.sin(a)}" ` +
        `x2="${cx + rayEnd * Math.cos(a)}" y2="${cy + rayEnd * Math.sin(a)}" ` +
        `stroke="${color}" stroke-width="1.5" stroke-linecap="round" />`
      );
    }).join('');
    return `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${color}" stroke-width="1.8" />` + rays;
  },

  /** life: two teardrop/leaf curves + center dot */
  life: (cx, cy, r, color) => {
    const d = r * 0.55;
    return (
      `<path d="M${cx},${cy - d * 0.15} C${cx + d},${cy - d} ${cx + d},${cy + d * 0.5} ${cx},${cy + d * 0.4}" fill="none" stroke="${color}" stroke-width="1.8" />` +
      `<path d="M${cx},${cy - d * 0.15} C${cx - d},${cy - d} ${cx - d},${cy + d * 0.5} ${cx},${cy + d * 0.4}" fill="none" stroke="${color}" stroke-width="1.8" />` +
      `<circle cx="${cx}" cy="${cy}" r="${r * 0.12}" fill="${color}" />`
    );
  },

  /** mind: three concentric circles */
  mind: (cx, cy, r, color) => {
    return (
      `<circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5" />` +
      `<circle cx="${cx}" cy="${cy}" r="${r * 0.46}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.75" />` +
      `<circle cx="${cx}" cy="${cy}" r="${r * 0.22}" fill="none" stroke="${color}" stroke-width="1.5" />`
    );
  },

  /** spirit: six-pointed irregular polygon + center dot */
  spirit: (cx, cy, r, color) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const rd = i % 2 === 0 ? r * 0.72 : r * 0.45;
      return `${cx + rd * Math.cos(a)},${cy + rd * Math.sin(a)}`;
    }).join(' ');
    return (
      `<polygon points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" />` +
      `<circle cx="${cx}" cy="${cy}" r="${r * 0.1}" fill="${color}" />`
    );
  },

  /** time: hourglass shape (two triangles meeting at center) */
  time: (cx, cy, r, color) => {
    const hw = r * 0.55;
    const hh = r * 0.72;
    return (
      `<polygon points="${cx - hw},${cy - hh} ${cx + hw},${cy - hh} ${cx},${cy}" fill="${color}" opacity="0.7" />` +
      `<polygon points="${cx - hw},${cy + hh} ${cx + hw},${cy + hh} ${cx},${cy}" fill="${color}" opacity="0.7" />` +
      `<line x1="${cx - hw * 0.9}" y1="${cy - hh}" x2="${cx + hw * 0.9}" y2="${cy - hh}" stroke="${color}" stroke-width="1.5" />` +
      `<line x1="${cx - hw * 0.9}" y1="${cy + hh}" x2="${cx + hw * 0.9}" y2="${cy + hh}" stroke="${color}" stroke-width="1.5" />`
    );
  },

  /** entropy: scattered rotated rectangles (dissolution) */
  entropy: (cx, cy, r, color) => {
    const rects = [
      { dx: -r * 0.3, dy: -r * 0.3, rot: 15 },
      { dx: r * 0.35, dy: -r * 0.2, rot: -30 },
      { dx: -r * 0.1, dy: r * 0.35, rot: 45 },
      { dx: r * 0.25, dy: r * 0.3, rot: -15 },
    ];
    return rects.map(({ dx, dy, rot }) =>
      `<rect x="${cx + dx - r * 0.14}" y="${cy + dy - r * 0.07}" width="${r * 0.28}" height="${r * 0.14}" ` +
      `fill="${color}" transform="rotate(${rot},${cx + dx},${cy + dy})" opacity="0.85" />`
    ).join('');
  },

  /** chaos: 7 irregular radiating lines + center dot */
  chaos: (cx, cy, r, color) => {
    const angles = [0, 47, 88, 141, 190, 247, 310];
    const lines = angles.map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const len = r * (0.45 + (i % 3) * 0.12);
      return (
        `<line x1="${cx}" y1="${cy}" x2="${cx + len * Math.cos(a)}" y2="${cy + len * Math.sin(a)}" ` +
        `stroke="${color}" stroke-width="1.5" stroke-linecap="round" />`
      );
    }).join('');
    return lines + `<circle cx="${cx}" cy="${cy}" r="${r * 0.1}" fill="${color}" />`;
  },

  /** order: overlapping square + rotated square */
  order: (cx, cy, r, color) => {
    const s = r * 0.55;
    return (
      `<rect x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" fill="none" stroke="${color}" stroke-width="1.8" />` +
      `<rect x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.65" transform="rotate(45,${cx},${cy})" />`
    );
  },

  /** light: filled circle + 12 alternating rays */
  light: (cx, cy, r, color) => {
    const innerR = r * 0.28;
    const rays = Array.from({ length: 12 }, (_, i) => {
      const a = (Math.PI / 6) * i;
      const isLong = i % 2 === 0;
      const start = r * 0.38;
      const end = r * (isLong ? 0.72 : 0.57);
      return (
        `<line x1="${cx + start * Math.cos(a)}" y1="${cy + start * Math.sin(a)}" ` +
        `x2="${cx + end * Math.cos(a)}" y2="${cy + end * Math.sin(a)}" ` +
        `stroke="${color}" stroke-width="${isLong ? 2 : 1.2}" stroke-linecap="round" />`
      );
    }).join('');
    return `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="${color}" />` + rays;
  },

  /** darkness: filled circle with occluding circle offset (eclipse) */
  darkness: (cx, cy, r, color) => {
    const mainR = r * 0.5;
    const occR = r * 0.45;
    const offset = r * 0.22;
    return (
      `<circle cx="${cx}" cy="${cy}" r="${mainR}" fill="${color}" />` +
      `<circle cx="${cx + offset}" cy="${cy - offset * 0.5}" r="${occR}" fill="#0d0d14" />`
    );
  },
};

// ─── Tint Helper ─────────────────────────────────────────────────────────────

/** Returns a darkened background color at ~15% brightness of the source hex */
function tintDark(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 0xff) * 0.15;
  const g = ((n >> 8) & 0xff) * 0.15;
  const b = (n & 0xff) * 0.15;
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

// ─── SVG Generator ───────────────────────────────────────────────────────────

export function generateSphereIconSvg(sphere: SphereName, size: number): string {
  const color = SPHERE_COLORS[sphere];
  const bg = tintDark(color);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 1;
  const symbolR = outerR * 0.58;

  const symbol = SPHERE_SYMBOLS[sphere](cx, cy, symbolR, color);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${bg}" stroke="${color}" stroke-width="1.5" />` +
    symbol +
    `</svg>`
  );
}

// ─── React Component ──────────────────────────────────────────────────────────

interface SphereIconProps {
  sphere: SphereName;
  size: number;
  className?: string;
}

export const SphereIcon = memo(function SphereIcon({ sphere, size, className }: SphereIconProps) {
  const svgString = useMemo(() => generateSphereIconSvg(sphere, size), [sphere, size]);

  return (
    <span
      className={className}
      style={{ display: 'inline-block' }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
});
