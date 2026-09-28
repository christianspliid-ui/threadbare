/**
 * THR-1646 — the line the chronicle carries on the tick the doom clock wakes.
 *
 * The clock sleeps until the player bonds The First (plan
 * `Docs/plans/2026-09-27-thr-1605-the-opening.md` § S2), so this line is the
 * first moment the player learns the world has an ending. One line per doom
 * archetype, in the voice of `src/data/doom/*.json`: GM narration, told to the
 * god, never from inside a mortal's head.
 */
import type { DoomClockArchetype } from '../types/doomClock';

export const DOOM_WAKES_LINES: Readonly<Record<DoomClockArchetype, string>> = {
  breach: 'Far below the world, something that was sleeping turns over.',
  convergence: 'Every current in the world leans a hair toward one distant place, and does not lean back.',
  changing: 'A law of the world, older than the mountains, begins quietly to loosen.',
  sundering: 'Deep in the bedrock, a seam that has held since the making gives its first small crack.',
  failing: 'The light of creation dims by a degree too small for mortals to notice. You notice.',
  ascension: 'Somewhere, a thing that was only mortal takes its first step toward being more.',
  reckoning: 'An old ledger opens. What the world owes is about to be counted.',
};

/** Fail-soft: an archetype with no authored line still wakes, with this one. */
export const DOOM_WAKES_FALLBACK_LINE = 'Something that was sleeping beneath the world has woken.';
