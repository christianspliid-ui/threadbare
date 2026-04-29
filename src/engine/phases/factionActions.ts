/**
 * Phase descriptor: faction_actions (THR-238 Land 3).
 *
 * Wraps the void-returning `phaseFactionActions` (mutates graph in place) into
 * the registry's `Partial<GameState>` contract by returning an empty delta.
 *
 * Order: must run after `faction_ambitions` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseFactionActions } from '../phaseFactionActions';

export const factionActionsPhase: EnginePhase = {
  id: 'faction_actions',
  slot: 'post-economy',
  afterPhase: ['faction_ambitions'],
  run: (state) => {
    phaseFactionActions(state);
    return {};
  },
};
