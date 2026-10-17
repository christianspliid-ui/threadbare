/**
 * OmenMark — the one mark an omen draws (THR-1907, plan THR-1879 § 9: one map per class).
 *
 * `ICON_FOR_OMEN` says how each omen kind is drawn: a registry idea, its sphere's `SphereIcon`
 * (a sphere surge), or the current season's icon (a seasonal omen). `OmenIndicator` and
 * `OmenDetail` both draw through here, so the two glyph copies they each kept are gone (Law 9).
 *
 * Fail-soft (NFP #4): a kind with no rule, or a sphere surge with no sphere, draws the `omen` idea.
 */

import type { ActiveOmen } from '../../types/omen';
import { deriveSeasonAndYear } from '../../types/temporal';
import { ICON_FOR_OMEN, ICON_FOR_SEASON, SEASON_IDS } from '../../data/icons/conceptIcons';
import type { IconName } from '../../data/icons/iconRegistry';
import { Icon, type IconSize } from '../shared/Icon';
import { SphereIcon } from '../shared/SphereIcon';

/** The idea an omen draws when its kind has no rule. */
const OMEN_FALLBACK_ICON: IconName = 'omen';

/** The pixel size a sphere surge's `SphereIcon` takes, per named icon size (14 / 18 px at 1080p). */
const SPHERE_MARK_REM: Readonly<Record<'floor' | 'chip', string>> = {
  floor: '0.875rem',
  chip: '1.125rem',
};

export function OmenMark({ omen, currentTick, size = 'floor' }: {
  omen: ActiveOmen;
  currentTick: number;
  size?: Extract<IconSize, 'floor' | 'chip'>;
}) {
  const rule = (ICON_FOR_OMEN as Partial<Record<string, (typeof ICON_FOR_OMEN)[keyof typeof ICON_FOR_OMEN]>>)[omen.category];
  if (rule && 'drawnBy' in rule && rule.drawnBy === 'sphere' && omen.sphere) {
    return <SphereIcon sphere={omen.sphere} size={SPHERE_MARK_REM[size]} />;
  }
  let name: IconName = OMEN_FALLBACK_ICON;
  if (rule && 'icon' in rule) name = rule.icon;
  else if (rule && rule.drawnBy === 'season') {
    name = ICON_FOR_SEASON[SEASON_IDS[deriveSeasonAndYear(currentTick).season % SEASON_IDS.length]];
  }
  return <Icon name={name} size={size} decorative />;
}
