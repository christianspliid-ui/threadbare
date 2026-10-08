/**
 * Beat grant bookkeeping (THR-1747) — a leaf module so both the Ascendant Beat
 * Director (`ascendantBeat.ts`, investment-beat retirement) and
 * `phaseAscendantProgression` (milestone skip) can read it without an import cycle.
 */

import type { GameState } from '../types/gameState';
import type { BeatDefinition } from '../types/ascendantBeat';

/**
 * True when the beat grants at least one card and the god already holds every one
 * of them. A beat that grants nothing is never "all held" — it has other jobs.
 */
export function allGrantsHeld(
  beat: Pick<BeatDefinition, 'grantsActionIds'>,
  state: Pick<GameState, 'unlockedActionIds'>,
): boolean {
  const grants = beat.grantsActionIds ?? [];
  if (grants.length === 0) return false;
  const held = state.unlockedActionIds ?? [];
  return grants.every(id => held.includes(id));
}
