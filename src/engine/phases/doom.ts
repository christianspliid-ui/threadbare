/**
 * Phase descriptor: doom (THR-238 Land 3).
 *
 * Slot rationale: `pre-doom` is the earliest hook; phaseDoom is conventionally
 * the first piece of work each tick. Anchor sits at the same byte position the
 * inline `phaseDoom` call held, so this migration is byte-equivalent.
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseDoom } from '../phaseDoom';

export const doomPhase: EnginePhase = {
  id: 'doom',
  slot: 'pre-doom',
  run: (state) => phaseDoom(state),
};
