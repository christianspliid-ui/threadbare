/**
 * Phase descriptor: reputation_decay (THR-238 Land 2 canary migration).
 *
 * Wraps `phaseReputationDecay` (extracted to its own module in this same
 * landing — see `src/engine/phaseReputationDecay.ts`).
 *
 * Slot rationale: `pre-economy` was added in Land 2 so the decay/control
 * cluster between `post-decision` and `post-economy` has a natural home.
 * The orchestrator anchor for `pre-economy` sits at the exact byte position
 * the inline call held, so this migration preserves byte-equivalent output.
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseReputationDecay } from '../phaseReputationDecay';

export const reputationDecayPhase: EnginePhase = {
  id: 'reputation_decay',
  slot: 'pre-economy',
  run: (state) => phaseReputationDecay(state),
};
