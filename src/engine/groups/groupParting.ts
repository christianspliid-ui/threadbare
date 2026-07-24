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
 *  - `cohesion_floor` / `betrayal` — the bond itself failed → bitter.
 *  - `undersize` / `leader_death` — ambiguous: a company that still stood together
 *    (cohesion at or above the fray line) parts warmly; one already fraying parts cold.
 */
export function selectPartingVariant(
  reason: DissolutionReason,
  finalCohesion: number,
): PartingVariant {
  if (reason === 'goal_complete') return 'bittersweet';
  if (reason === 'cohesion_floor' || reason === 'betrayal') return 'bitter';
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
  const pool = variant === 'bittersweet' ? GROUP_PARTING_BITTERSWEET : GROUP_PARTING_BITTER;
  const template = pool.length > 0
    ? pool[Math.floor(rng() * pool.length) % pool.length]
    : GROUP_PARTING_FALLBACK;
  const message = template.replace(/\{company\}/g, companyName);
  return { variant, message };
}
