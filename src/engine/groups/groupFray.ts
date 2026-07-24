/**
 * The Shared Spoils / Old Wounds — fray-moment composer (THR-74)
 *
 * Pure, deterministic selection of the authored fray moment for a company whose
 * cohesion just crossed below the fray line. The counterpart to `groupParting.ts`:
 * where The Parting narrates an *ending*, this narrates the *turn* — the first tick
 * a company slips from `holding` into `frayed`. Only *threaded* companies reach the
 * composer; an untethered company's fray stays the silent systemic line (see
 * `phaseGroups`).
 *
 * No graph access, no `Math.random()` — takes a seeded `rng` so a replay of the
 * same state tells the same fraying (NFP #3).
 */

import type { CohesionState } from './groupQueries';
import {
  GROUP_FRAY_SHARED_SPOILS,
  GROUP_FRAY_OLD_WOUNDS,
  GROUP_FRAY_FALLBACK,
  type FrayMomentKind,
} from '../../data/group-fray-content';

export type { FrayMomentKind };

export interface FrayMoment {
  kind: FrayMomentKind;
  /** Player-facing line, `{company}` already resolved. */
  message: string;
}

/**
 * Whether cohesion crossed *below* the fray line this tick.
 *
 * The trigger is the transition, not the state: a company already sitting in
 * `frayed` does not re-fire every tick it stays there. `prev === undefined` (a
 * company observed for the first time) never counts as a crossing — the caller
 * seeds the stored state silently on first sight.
 *
 * `breaking` is included on the "below" side for completeness, though a survivor of
 * the dissolution check is never in it (cohesion below the dissolution floor
 * disbands the company that same tick).
 */
export function crossedIntoFray(
  prev: CohesionState | undefined,
  now: CohesionState,
): boolean {
  if (prev === undefined) return false;
  const wasAbove = prev === 'bound' || prev === 'holding';
  const nowBelow = now === 'frayed' || now === 'breaking';
  return wasAbove && nowBelow;
}

/** Seeded choice of which register the fray is told in. */
export function selectFrayMomentKind(rng: () => number): FrayMomentKind {
  return rng() < 0.5 ? 'shared_spoils' : 'old_wounds';
}

/**
 * Compose the authored fray line for a company. Fail-soft: an empty pool falls back
 * to the neutral line rather than throwing.
 */
export function composeFrayMoment(companyName: string, rng: () => number): FrayMoment {
  const kind = selectFrayMomentKind(rng);
  const pool = kind === 'shared_spoils' ? GROUP_FRAY_SHARED_SPOILS : GROUP_FRAY_OLD_WOUNDS;
  const template = pool.length > 0
    ? pool[Math.floor(rng() * pool.length) % pool.length]
    : GROUP_FRAY_FALLBACK;
  const message = template.replace(/\{company\}/g, companyName);
  return { kind, message };
}
