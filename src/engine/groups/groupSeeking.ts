/**
 * Seeking Companions — formation-moment composer (THR-74)
 *
 * Pure, deterministic selection of the authored founding moment for a *threaded*
 * company. Non-threaded companies never reach here — their founding stays the
 * silent systemic line (see `phaseGroups`). The variant is a function of the
 * starting cohesion the formation scan assigned (its formation-quality read); the
 * exact line is a seeded pick from the matching pool.
 *
 * Sibling of `groupParting.ts` / `groupFray.ts`: no graph access, no
 * `Math.random()` — takes a seeded `rng` so a replay of the same state tells the
 * same founding (NFP #3).
 */

import { GROUP_SEEKING_EAGER_MIN_COHESION } from '../../data/group-constants';
import {
  GROUP_SEEKING_EAGER,
  GROUP_SEEKING_WARY,
  GROUP_SEEKING_FALLBACK,
  type SeekingVariant,
} from '../../data/group-formation-content';

export type { SeekingVariant };

export interface SeekingMoment {
  variant: SeekingVariant;
  /** Player-facing line, `{company}` already resolved. */
  message: string;
}

/**
 * Choose the register a founding is told in. A company that formed at or above the
 * neutral start base gathered eagerly; one below it, warily. The scan sets starting
 * cohesion from mean pairwise compatibility, so this reads that same signal.
 */
export function selectSeekingVariant(startingCohesion: number): SeekingVariant {
  return startingCohesion >= GROUP_SEEKING_EAGER_MIN_COHESION ? 'eager' : 'wary';
}

/**
 * Compose the authored founding line for a company. Fail-soft: an empty pool falls
 * back to the neutral line rather than throwing.
 */
export function composeSeekingMoment(
  companyName: string,
  startingCohesion: number,
  rng: () => number,
): SeekingMoment {
  const variant = selectSeekingVariant(startingCohesion);
  const pool = variant === 'eager' ? GROUP_SEEKING_EAGER : GROUP_SEEKING_WARY;
  const template = pool.length > 0
    ? pool[Math.floor(rng() * pool.length) % pool.length]
    : GROUP_SEEKING_FALLBACK;
  const message = template.replace(/\{company\}/g, companyName);
  return { variant, message };
}
