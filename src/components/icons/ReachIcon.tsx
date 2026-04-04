import { memo, useMemo } from 'react';
import type { ReachDomain } from '../../types/traits';
import { SPHERE_COLORS, REACH_TO_SPHERE } from './constants';
import { renderCharge } from './heraldry/charges';

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

export function generateReachIconSvg(reach: ReachDomain, size: number): string {
  const sphere = REACH_TO_SPHERE[reach];
  const color = SPHERE_COLORS[sphere];
  const bg = tintDark(color);

  // Rounded rectangle corner radius = ~11% of size
  const rx = Math.round(size * 0.11);
  const cx = size / 2;
  const cy = size / 2;

  // Scale charge to fit within the icon (charge shapes are drawn at radius ~18 in a 72px space)
  const scale = size / 72;

  const charge = renderCharge(reach, color, scale, cx, cy);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${rx}" ry="${rx}" fill="${bg}" stroke="${color}" stroke-width="1.5" />` +
    charge +
    `</svg>`
  );
}

// ─── React Component ──────────────────────────────────────────────────────────

interface ReachIconProps {
  reach: ReachDomain;
  size: number;
  className?: string;
}

export const ReachIcon = memo(function ReachIcon({ reach, size, className }: ReachIconProps) {
  const svgString = useMemo(() => generateReachIconSvg(reach, size), [reach, size]);

  return (
    <span
      className={className}
      style={{ display: 'inline-block' }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
});
