/**
 * Phase descriptor: faction_ambitions (THR-238 Land 3).
 *
 * Wraps the void-returning `phaseFactionAmbitions` (mutates graph in place) into
 * the registry's `Partial<GameState>` contract by returning an empty delta.
 *
 * Order: must run after `ambition_progress` (matches the inline sequence).
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseFactionAmbitions } from '../factionAmbitions';

export const factionAmbitionsPhase: EnginePhase = {
  id: 'faction_ambitions',
  slot: 'post-economy',
  afterPhase: ['ambition_progress'],
  run: (state) => {
    phaseFactionAmbitions(state);
    return {};
  },
};
