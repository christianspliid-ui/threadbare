/**
 * ActivityIcon — a mortal's current activity, drawn from the carved registry.
 *
 * A thin wrapper over `Icon` (THR-1906, plan THR-1879 § 9): the activity class has one vocabulary,
 * `ICON_FOR_ACTIVITY` in `src/data/icons/conceptIcons.ts`, and this component no longer draws
 * its own paths. The export and props are kept so callers do not move. A kind with no entry draws
 * the fallback mark and warns once (Law 4, Law 58).
 */

import { ICON_CLASSES, iconForKey } from '../../data/icons/conceptIcons';
import { Icon } from './Icon';

export type ActivityKind =
  | 'boot'
  | 'swords'
  | 'coin'
  | 'hammer'
  | 'bandage'
  | 'hourglass'
  // THR-418 — sustained-control category icons (Hexes / Sources / folded-in Locations)
  | 'hex-claim'
  | 'source-bound'
  | 'claim-flag';

export interface ActivityIconProps {
  kind: ActivityKind;
  /** Edge length in px. */
  size?: number;
  color?: string;
}

export function ActivityIcon({ kind, size = 18, color = 'var(--text-secondary)' }: ActivityIconProps): JSX.Element {
  return (
    <Icon
      name={iconForKey(ICON_CLASSES.activity, kind)}
      decorative
      style={{ width: size, height: size, color }}
    />
  );
}
