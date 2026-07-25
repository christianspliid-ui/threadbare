/**
 * The Reunion / The Road Not Taken — reunion-moment composer (THR-732)
 *
 * Pure, deterministic selection of the authored moment for a Reunite window that
 * reached one of its two endings. The third sibling of `groupParting.ts` (an ending)
 * and `groupSeeking.ts` (a beginning): this one narrates a *return*, or the failure
 * of one.
 *
 * No graph access, no `Math.random()` — takes a seeded `rng` so a replay of the same
 * state tells the same reunion (NFP #3).
 */

import {
  GROUP_REUNION_FORMED,
  GROUP_REUNION_LAPSED,
  GROUP_REUNION_FALLBACK,
  type ReunionMomentKind,
} from '../../data/group-reunite-content';

export type { ReunionMomentKind };

export interface ReunionMoment {
  kind: ReunionMomentKind;
  /** Player-facing line, `{company}` already resolved. */
  message: string;
}

/**
 * Whether a Reunite window has closed unanswered on this tick.
 *
 * The window is cleared by whoever consumes it — the formation scan on a successful
 * reunion, this check on a lapse — so a company that already lapsed has no
 * `reuniteUntilTick` left and cannot fire twice. An absent or non-numeric value is
 * simply "no window" (fail-soft, mirroring the `isGroupBlessed` guard pattern).
 */
export function reuniteWindowLapsed(
  reuniteUntilTick: unknown,
  tick: number,
): boolean {
  return typeof reuniteUntilTick === 'number' && tick >= reuniteUntilTick;
}

/**
 * Compose the authored line for a reunion or its failure. Fail-soft: an empty pool
 * falls back to the neutral line rather than throwing.
 */
export function composeReunionMoment(
  companyName: string,
  kind: ReunionMomentKind,
  rng: () => number,
): ReunionMoment {
  const pool = kind === 'reunion' ? GROUP_REUNION_FORMED : GROUP_REUNION_LAPSED;
  const template = pool.length > 0
    ? pool[Math.floor(rng() * pool.length) % pool.length]
    : GROUP_REUNION_FALLBACK;
  return { kind, message: template.replace(/\{company\}/g, companyName) };
}
