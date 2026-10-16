/**
 * SphereIcon — Renders a sphere icon, delegating to the SVG-based icons/SphereIcon by default.
 *
 * The one sphere vocabulary (Law 9). The PNG path (`useImage`) is gone (THR-1906); the PNGs in
 * `public/icons/spheres` stay only as assets of the static `public/the-game.html` page.
 *
 * Used in Divine Essence, Rival Gods, Agent Wheel, and other sphere-related UI.
 */

import React from 'react';
import { SphereIcon as SvgSphereIcon } from '../icons/SphereIcon';
import { remToPx } from './layoutContract';
import { SPHERE_NAMES } from '../../types/index';
import type { SphereName } from '../../types/index';
import { REACH_TO_SPHERE as _REACH_TO_SPHERE, sphereFromReach as _sphereFromReach } from '../icons/constants';

export const REACH_TO_SPHERE: Record<string, SphereName> = _REACH_TO_SPHERE;

export function sphereFromReach(reach: string | null | undefined): SphereName | null {
  return _sphereFromReach(reach);
}

export interface SphereIconProps {
  /** Sphere name — primary prop (e.g., 'force', 'mind', 'chaos') */
  sphere?: SphereName | string;
  /** Legacy alias for sphere — accepted for backward compat */
  sphereName?: string;
  /** CSS font size or pixel number (default: 1rem — 16px at 1080p, 18px at 1440p) */
  size?: string | number;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline style overrides */
  style?: React.CSSProperties;
  /** Whether to render without color (monochrome) — no-op for SVG path, kept for compat */
  monochrome?: boolean;
  /** Optional title for accessibility */
  title?: string;
  /** Which color token tier to use (default: 'bright') */
  variant?: 'base' | 'bright';
}

/**
 * Convert a size prop to a pixel number.
 * Handles: number → pass through, "24px" → 24, "1.5rem" → 24 at a 16px root, bare "24" → 24.
 * rem reads the live root size (THR-1819: the root steps to 18px at 1440p), never `* 16`.
 */
function toPxNumber(size: string | number | undefined): number {
  if (size === undefined) return remToPx(1);
  if (typeof size === 'number') return size;
  const px = parseFloat(size);
  if (size.endsWith('rem')) return isNaN(px) ? remToPx(1) : remToPx(px);
  return isNaN(px) ? remToPx(1) : px;
}

/**
 * SphereIcon component — renders a sphere icon using the SVG icon system.
 *
 * Example usage:
 * <SphereIcon sphereName="force" size="1.5rem" />
 * <SphereIcon sphereName="mind" size={24} className="inline-block" />
 */
export const SphereIcon = React.memo(function SphereIcon({
  sphere: sphereProp,
  sphereName,
  size = '1rem',
  className,
  style,
  title,
  variant = 'bright',
}: SphereIconProps) {
  const resolvedName = sphereProp ?? sphereName ?? '';

  const pxSize = toPxNumber(size);

  const isValid = (SPHERE_NAMES as readonly string[]).includes(resolvedName);

  if (!isValid) {
    return (
      <span
        className={className}
        title={title}
        aria-label={title || resolvedName}
        style={{
          display: 'inline-block',
          width: pxSize,
          height: pxSize,
          borderRadius: '50%',
          backgroundColor: '#555',
          ...style,
        }}
      />
    );
  }

  return (
    <span
      title={title}
      aria-label={title || resolvedName}
      style={style}
    >
      <SvgSphereIcon
        sphere={resolvedName as SphereName}
        size={pxSize}
        className={className}
        variant={variant}
      />
    </span>
  );
});
