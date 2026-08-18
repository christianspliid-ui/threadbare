/**
 * The Parting — dissolution-moment composer (THR-74)
 *
 * Pure, deterministic selection of the authored dissolution moment for a
 * *threaded* company. Non-threaded companies never reach here — their end stays
 * the silent systemic line (see `phaseGroups`). The variant is a function of the
 * dissolution reason and the cohesion the company held when it ended; the exact
 * line is a seeded pick from the matching pool.
 *
 * No graph access, no `Math.random()` — takes a seeded `rng` so a replay of the
 * same state tells the same parting (NFP #3).
 */

import type { DissolutionReason } from './groupQueries';
import { GROUP_FRAY_THRESHOLD } from '../../data/group-constants';
import {
  GROUP_PARTING_BITTERSWEET,
  GROUP_PARTING_BITTER,
  GROUP_PARTING_BETRAYED,
  GROUP_PARTING_FALLBACK,
  type PartingVariant,
} from '../../data/group-parting-content';

export type { PartingVariant };

export interface PartingMoment {
  variant: PartingVariant;
  /** Player-facing line, `{company}` already resolved. */
  message: string;
}

/**
 * Choose the register a parting is told in.
 *
 *  - `goal_complete` — the company met its errand and dispersed intact → bittersweet.
 *  - `betrayal` — one of them was bought → betrayed, its own register (THR-1174).
 *  - `cohesion_floor` — the bond itself wore through → bitter.
 *  - `undersize` / `leader_death` — ambiguous: a company that still stood together
 *    (cohesion at or above the fray line) parts warmly; one already fraying parts cold.
 *
 * `betrayal` used to fold into `bitter`, which was defensible only while nothing
 * produced it. Now that `findCompanyBetrayer` does, the two need telling apart: a
 * bitter parting is an argument everyone had, and a betrayed one is a fact the
 * company never got. Same coldness, different thing withheld.
 */
export function selectPartingVariant(
  reason: DissolutionReason,
  finalCohesion: number,
): PartingVariant {
  if (reason === 'goal_complete') return 'bittersweet';
  if (reason === 'betrayal') return 'betrayed';
  if (reason === 'cohesion_floor') return 'bitter';
  return finalCohesion >= GROUP_FRAY_THRESHOLD ? 'bittersweet' : 'bitter';
}

/**
 * Compose the authored parting line for a company. Fail-soft: an empty pool falls
 * back to the neutral line rather than throwing.
 */
export function composePartingMoment(
  companyName: string,
  reason: DissolutionReason,
  finalCohesion: number,
  rng: () => number,
): PartingMoment {
  const variant = selectPartingVariant(reason, finalCohesion);
  const pool = variant === 'bittersweet'
    ? GROUP_PARTING_BITTERSWEET
    : variant === 'betrayed'
      ? GROUP_PARTING_BETRAYED
      : GROUP_PARTING_BITTER;
  const template = pool.length > 0
    ? pool[Math.floor(rng() * pool.length) % pool.length]
    : GROUP_PARTING_FALLBACK;
  const message = template.replace(/\{company\}/g, companyName);
  return { variant, message };
}
