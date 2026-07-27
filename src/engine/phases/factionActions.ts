/**
 * Phase descriptor: faction_actions (THR-238 Land 3).
 *
 * `phaseFactionActions` mutates the graph in place; since THR-815 it also returns a
 * `Partial<GameState>` delta carrying the tick events from off-screen member work
 * (promotions). Pass the delta straight through — returning `{}` here, as this wrapper
 * did while the phase was void, would silently drop those events.
 *
 * Order: must run after `faction_ambitions` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseFactionActions } from '../phaseFactionActions';

export const factionActionsPhase: EnginePhase = {
  id: 'faction_actions',
  slot: 'post-economy',
  afterPhase: ['faction_ambitions'],
  run: (state) => phaseFactionActions(state),
};
