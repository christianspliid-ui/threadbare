/**
 * Phase descriptor: planted_compulsion_decay (THR-886).
 *
 * Sibling of `emitted_omen_decay` and deliberately in the same `post-doom` slot:
 * both sweep expired aftermath-planted state, and both produce something
 * `phaseAgentDecision` reads much later in the tick, so neither can disturb the
 * other or its neighbours. Registering here rather than editing `orchestrator.ts`
 * is the registry's whole point (THR-238).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phasePlantedCompulsionDecay } from '../plantedCompulsion';

export const plantedCompulsionDecayPhase: EnginePhase = {
  id: 'planted_compulsion_decay',
  slot: 'post-doom',
  run: (state) => phasePlantedCompulsionDecay(state),
};
