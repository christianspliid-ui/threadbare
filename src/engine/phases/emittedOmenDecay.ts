/**
 * Phase descriptor: emitted_omen_decay (THR-238 Land 2 canary migration).
 *
 * Wraps the existing `phaseEmittedOmenDecay` implementation in `phaseOmenAgenda.ts`
 * — only the wiring location changes. Tests that import the function directly
 * keep working unchanged.
 *
 * Slot rationale: `post-doom` fires between phaseOmenAgenda and phaseComposition,
 * the same byte-position the inline call held before migration. Output
 * (`state.emittedOmens`) is consumed only by phaseAgentDecision much later, so
 * neighbouring phases are unaffected by the move.
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseEmittedOmenDecay } from '../phaseOmenAgenda';

export const emittedOmenDecayPhase: EnginePhase = {
  id: 'emitted_omen_decay',
  slot: 'post-doom',
  run: (state) => phaseEmittedOmenDecay(state),
};
