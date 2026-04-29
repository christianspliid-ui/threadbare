/**
 * Phase descriptor: secrets_favors (THR-238 Land 3).
 *
 * Order: after `faction_actions` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseSecretsFavors } from '../phaseSecretsFavors';

export const secretsFavorsPhase: EnginePhase = {
  id: 'secrets_favors',
  slot: 'post-economy',
  afterPhase: ['faction_actions'],
  run: (state) => phaseSecretsFavors(state),
};
