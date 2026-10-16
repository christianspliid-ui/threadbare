/**
 * RivalIcon — a rival god's sphere affinities as a row of small sphere marks.
 *
 * Law 9 (THR-1906, plan THR-1879 § 10 icons 1): spheres have one vocabulary, `SphereIcon`.
 * The rival mark used to draw its own coloured dots; it now draws up to three small
 * `SphereIcon`s, so a rival's spheres read with the same shapes as everywhere else.
 * No affinities → the `fallback` mark, never an empty span (Law 4).
 */

import React from 'react';
import { SphereIcon } from './SphereIcon';
import { Icon } from './Icon';

/** Most sphere marks a rival shows. */
export const RIVAL_ICON_MAX_SPHERES = 3;

export interface RivalIconProps {
  /** List of 2-3 sphere names defining the rival's affinities */
  spheres: string[];
  /** CSS size of each sphere mark (default: '1.5rem') */
  size?: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional style overrides */
  style?: React.CSSProperties;
  /** Optional title for accessibility */
  title?: string;
}

export const RivalIcon = React.memo(function RivalIcon({
  spheres,
  size = '1.5rem',
  className,
  style,
  title,
}: RivalIconProps) {
  const sphereList = spheres.slice(0, RIVAL_ICON_MAX_SPHERES);

  return (
    <span
      className={className}
      title={title}
      data-testid="rival-icon"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        height: size,
        ...style,
      }}
    >
      {sphereList.length === 0 ? (
        <Icon name="fallback" size="chip" label={title ?? 'No sphere affinities'} />
      ) : (
        sphereList.map((sphere, idx) => (
          <SphereIcon key={`${sphere}-${idx}`} sphere={sphere} size={size} />
        ))
      )}
    </span>
  );
});
