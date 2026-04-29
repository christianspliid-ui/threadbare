/**
 * Phase descriptor: ambition_progress (THR-238 Land 3).
 *
 * Slot: `post-economy`. First phase in the post-settlement long-term-progress
 * cluster. Other migrated phases in this slot use `afterPhase: ['ambition_progress']`
 * (and chain) to preserve byte-equivalent execution order vs. the inline sequence.
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseAmbitionProgress } from '../ambitionTick';

export const ambitionProgressPhase: EnginePhase = {
  id: 'ambition_progress',
  slot: 'post-economy',
  run: (state) => phaseAmbitionProgress(state),
};
