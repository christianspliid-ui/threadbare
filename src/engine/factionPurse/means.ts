/**
 * The faction purse — Means band (THR-1931 § Resolution 3). Pure.
 *
 * One ladder (Law 43): the five words `getWealthTier` gives a mortal. A faction that
 * fields armies is banded by days of upkeep in hand; one that fields none, by coin. A
 * faction with an army unpaid today is Destitute whatever the division says, so the
 * chip, the broke line and the desertion chronicle cannot disagree (Law 45).
 */

import {
  MEANS_BANDS_DAYS,
  MEANS_BANDS_ABSOLUTE,
  MEANS_BAND_ORDER,
  type MeansBand,
} from '../../data/faction-purse-constants';

/** Days of upkeep the purse holds, or null when the faction fields no army. */
export function daysInHand(wealth: number, upkeepPerDay: number): number | null {
  return upkeepPerDay > 0 ? wealth / upkeepPerDay : null;
}

export function meansBand(wealth: number, upkeepPerDay: number, anyArmyUnpaid: boolean): MeansBand {
  if (anyArmyUnpaid) return 'Destitute';
  const days = daysInHand(wealth, upkeepPerDay);
  const bands = days === null ? MEANS_BANDS_ABSOLUTE : MEANS_BANDS_DAYS;
  const measure = days ?? wealth;
  return (bands.find(b => measure < b.below) ?? bands[bands.length - 1]).band;
}

/** Ordinal of a band on the ladder (Destitute = 0). Unknown words read as Destitute. */
export function meansRank(band: string | undefined): number {
  const i = MEANS_BAND_ORDER.indexOf(band as MeansBand);
  return i < 0 ? 0 : i;
}

export function isMeansBand(v: unknown): v is MeansBand {
  return typeof v === 'string' && MEANS_BAND_ORDER.includes(v as MeansBand);
}
