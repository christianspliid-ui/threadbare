/**
 * Phase descriptor: delve_progression (THR-238 Land 3).
 *
 * Order: after `delve_admission` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseDelveProgression } from '../ruins/delveVariant';

export const delveProgressionPhase: EnginePhase = {
  id: 'delve_progression',
  slot: 'post-economy',
  afterPhase: ['delve_admission'],
  run: (state) => phaseDelveProgression(state),
};
