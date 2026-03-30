/**
 * RivalIcon — Composites 2-3 sphere colors to create a unique rival god indicator
 *
 * Each rival god has associated sphere affinities. This component renders
 * those as overlapping colored glyphs/circles representing the rival's magical nature.
 */

import React from 'react';
import { getSphereColor } from '../../data/sphereIcons';

export interface RivalIconProps {
  /** List of 2-3 sphere names defining the rival's affinities */
  spheres: string[];
  /** CSS size (default: '1.5rem') */
  size?: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional style overrides */
  style?: React.CSSProperties;
  /** Optional title for accessibility */
  title?: string;
}

/**
 * RivalIcon — renders overlapping colored circles for rival sphere affinities
 *
 * If 2 spheres: side-by-side circles
 * If 3+ spheres: triangular arrangement
 *
 * Example:
 * <RivalIcon spheres={['force', 'chaos']} />
 */
export const RivalIcon = React.memo(function RivalIcon({
  spheres,
  size = '1.5rem',
  className,
  style,
  title,
}: RivalIconProps) {
  const sphereList = spheres.slice(0, 3); // Max 3 spheres

  if (sphereList.length === 0) {
    return <span className={className} title={title}>●</span>;
  }

  if (sphereList.length === 1) {
    // Single sphere: just a colored circle
    const color = getSphereColor(sphereList[0]);
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          color,
          ...style,
        }}
        title={title}
      >
        ●
      </span>
    );
  }

  // 2-3 spheres: overlapping circles in a flex container
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: size,
        height: size,
        ...style,
      }}
      title={title}
    >
      {sphereList.map((sphere, idx) => {
        const color = getSphereColor(sphere);
        const offset = idx * 6; // Slight offset for stacking effect

        return (
          <span
            key={`${sphere}-${idx}`}
            style={{
              position: 'absolute',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: size,
              color,
              opacity: 0.8 + idx * 0.1, // Slight opacity variation for depth
              transform: `translate(${offset}px, ${offset}px)`,
              lineHeight: 1,
            }}
          >
            ●
          </span>
        );
      })}
    </span>
  );
});
