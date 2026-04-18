/**
 * SphereIcon — Renders a sphere icon, delegating to the SVG-based icons/SphereIcon by default.
 *
 * The default rendering path uses the new SVG icon system for crisp, themed sphere symbols.
 * The `useImage` prop falls back to generated PNG images.
 *
 * Used in Divine Essence, Rival Gods, Agent Wheel, and other sphere-related UI.
 */

import React from 'react';
import { SphereIcon as SvgSphereIcon } from '../icons/SphereIcon';
import { getSphereImagePath } from '../../data/sphereIcons';
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
  /** CSS font size or pixel number (default: 1rem / 16px) */
  size?: string | number;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline style overrides */
  style?: React.CSSProperties;
  /** Whether to render without color (monochrome) — no-op for SVG path, kept for compat */
  monochrome?: boolean;
  /** Optional title for accessibility */
  title?: string;
  /** When true, render the generated PNG image instead of the SVG icon */
  useImage?: boolean;
  /** Which color token tier to use (default: 'bright') */
  variant?: 'base' | 'bright';
}

/**
 * Convert a size prop to a pixel number.
 * Handles: number → pass through, "24px" → 24, "1.5rem" → 24, bare "24" → 24.
 */
function toPxNumber(size: string | number | undefined): number {
  if (size === undefined) return 16;
  if (typeof size === 'number') return size;
  const px = parseFloat(size);
  if (size.endsWith('rem')) return px * 16;
  return isNaN(px) ? 16 : px;
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
  useImage = false,
  variant = 'bright',
}: SphereIconProps) {
  const resolvedName = sphereProp ?? sphereName ?? '';

  // Image rendering path — keep existing behaviour for useImage=true
  if (useImage) {
    const imagePath = getSphereImagePath(resolvedName);
    if (imagePath) {
      const imgSize = toPxNumber(size);
      return (
        <img
          src={imagePath}
          alt={title || resolvedName}
          className={className}
          width={imgSize}
          height={imgSize}
          style={{
            display: 'inline-block',
            objectFit: 'contain',
            ...style,
          }}
        />
      );
    }
  }

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
