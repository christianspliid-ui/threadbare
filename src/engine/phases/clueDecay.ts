/**
 * Phase descriptor: clue_decay (THR-238 Land 3).
 *
 * Order: after `secrets_favors` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseClueDecay } from '../ruins/clueLifecycle';

export const clueDecayPhase: EnginePhase = {
  id: 'clue_decay',
  slot: 'post-economy',
  afterPhase: ['secrets_favors'],
  run: (state) => phaseClueDecay(state),
};
