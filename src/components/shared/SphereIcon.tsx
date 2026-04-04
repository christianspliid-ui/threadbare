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

export interface SphereIconProps {
  /** Sphere name (e.g., 'force', 'mind', 'chaos') */
  sphereName: string;
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
  sphereName,
  size = '1rem',
  className,
  style,
  title,
  useImage = false,
}: SphereIconProps) {
  // Image rendering path — keep existing behaviour for useImage=true
  if (useImage) {
    const imagePath = getSphereImagePath(sphereName);
    if (imagePath) {
      const imgSize = toPxNumber(size);
      return (
        <img
          src={imagePath}
          alt={title || sphereName}
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

  // Validate that sphereName is a known SphereName
  const isValid = (SPHERE_NAMES as readonly string[]).includes(sphereName);

  if (!isValid) {
    // Gray circle fallback for unknown sphere names
    return (
      <span
        className={className}
        title={title}
        aria-label={title || sphereName}
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
      aria-label={title || sphereName}
      style={style}
    >
      <SvgSphereIcon
        sphere={sphereName as SphereName}
        size={pxSize}
        className={className}
      />
    </span>
  );
});
