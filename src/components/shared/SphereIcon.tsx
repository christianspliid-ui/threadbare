/**
 * SphereIcon — Renders a sphere-colored Unicode glyph
 *
 * Replaces emoji icons with proper CSS-based sphere colors and non-emoji Unicode symbols.
 * Used in Divine Essence, Rival Gods, Agent Wheel, and other sphere-related UI.
 */

import React from 'react';
import { getSphereColor, getSphereSymbol } from '../../data/sphereIcons';

export interface SphereIconProps {
  /** Sphere name (e.g., 'force', 'mind', 'chaos') */
  sphereName: string;
  /** CSS font size (default: 1rem) */
  size?: string | number;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline style overrides */
  style?: React.CSSProperties;
  /** Whether to render without color (monochrome) */
  monochrome?: boolean;
  /** Optional title for accessibility */
  title?: string;
}

/**
 * SphereIcon component — renders a colored Unicode glyph representing a sphere
 *
 * Example usage:
 * <SphereIcon sphereName="force" size="1.5rem" />
 * <SphereIcon sphereName="mind" className="text-2xl" />
 */
export const SphereIcon = React.memo(function SphereIcon({
  sphereName,
  size = '1rem',
  className,
  style,
  monochrome = false,
  title,
}: SphereIconProps) {
  const color = getSphereColor(sphereName);
  const symbol = getSphereSymbol(sphereName);

  const fontSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        color: monochrome ? 'currentColor' : color,
        lineHeight: 1,
        ...style,
      }}
      title={title}
      aria-label={title || sphereName}
    >
      {symbol}
    </span>
  );
});
