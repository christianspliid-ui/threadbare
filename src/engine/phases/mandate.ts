/**
 * Phase descriptor: mandate (THR-238 Land 3).
 *
 * Slot: `post-narrative`. Mandate runs after phaseNarrative captures all tick
 * events.
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseMandate } from '../phaseMandate';

export const mandatePhase: EnginePhase = {
  id: 'mandate',
  slot: 'post-narrative',
  run: (state) => phaseMandate(state),
};
