/**
 * Death-site haunting target (THR-1925) — pure read of how much unrest a place's
 * recent dead press on it. Constants and rationale: `src/data/death-site-unrest-constants.ts`.
 *
 * The last death is the latest of three stamps: `lastDeathTick` (every death, written
 * by `markMortalDead`), `lastFightTick` and `lastBattleTick` (THR-1528 / THR-1574).
 * A place with a `deathCount` but no stamp (its dead predate the stamp) is not haunted:
 * an old death never holds a town in unrest.
 */
import {
  DEATH_SITE_UNREST_TARGET_SCALE,
  DEATH_SITE_UNREST_TARGET_MAX,
  DEATH_SITE_HAUNTING_WINDOW_TICKS,
  LAST_DEATH_TICK_PROPERTY,
} from '../data/death-site-unrest-constants';
import { LAST_BATTLE_TICK_PROPERTY, LAST_FIGHT_TICK_PROPERTY } from './phaseLocationTraits';

/** The tick of the most recent death, fight or battle at the place, or undefined. */
export function readLastDeathTick(props: Record<string, unknown>): number | undefined {
  let latest: number | undefined;
  for (const key of [LAST_DEATH_TICK_PROPERTY, LAST_FIGHT_TICK_PROPERTY, LAST_BATTLE_TICK_PROPERTY]) {
    const v = props[key];
    if (typeof v === 'number' && Number.isFinite(v) && (latest === undefined || v > latest)) latest = v;
  }
  return latest;
}

/**
 * The unrest a place's dead hold it toward right now: `bonus × SCALE`, capped at
 * `MAX`, fading linearly to 0 over the window since the last death. 0 when the
 * identity has no bonus, the place has no dead, or the window has passed.
 */
export function computeDeathSiteUnrestTarget(
  props: Record<string, unknown>,
  deathSiteUnrestBonus: number,
  tick: number,
): number {
  if (!(deathSiteUnrestBonus > 0)) return 0;
  const deathCount = typeof props.deathCount === 'number' ? props.deathCount : 0;
  if (deathCount <= 0) return 0;
  const last = readLastDeathTick(props);
  if (last === undefined) return 0;
  const elapsed = Math.max(0, tick - last);
  if (elapsed >= DEATH_SITE_HAUNTING_WINDOW_TICKS) return 0;
  const peak = Math.min(DEATH_SITE_UNREST_TARGET_MAX, deathSiteUnrestBonus * DEATH_SITE_UNREST_TARGET_SCALE);
  return peak * (1 - elapsed / DEATH_SITE_HAUNTING_WINDOW_TICKS);
}
