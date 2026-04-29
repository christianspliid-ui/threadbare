/**
 * Phase descriptor: ruin_quest_hooks (THR-238 Land 3).
 *
 * Order: after `clue_decay` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseRuinQuestHooks } from '../ruins/questHooks';

export const ruinQuestHooksPhase: EnginePhase = {
  id: 'ruin_quest_hooks',
  slot: 'post-economy',
  afterPhase: ['clue_decay'],
  run: (state) => phaseRuinQuestHooks(state),
};
