/**
 * Phase descriptor: delve_admission (THR-238 Land 3).
 *
 * Order: after `ruin_quest_hooks` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseDelveAdmission } from '../ruins/delveVariant';

export const delveAdmissionPhase: EnginePhase = {
  id: 'delve_admission',
  slot: 'post-economy',
  afterPhase: ['ruin_quest_hooks'],
  run: (state) => phaseDelveAdmission(state),
};
