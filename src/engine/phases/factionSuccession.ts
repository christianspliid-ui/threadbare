/**
 * Phase descriptor: faction_succession (THR-432).
 *
 * Wraps the void-returning `phaseFactionSuccession` (mutates graph in place) into
 * the registry's `Partial<GameState>` contract. Mutating `pendingEncounterSeeds`
 * happens by direct assignment on the state object inside the phase, then the
 * registry merges the empty delta — this matches the pattern used by
 * `factionActionsPhase` and `schismResolutionPhase`.
 *
 * Order: post-narrative slot — runs after `phaseAgentLifecycle` (deaths this
 * tick already applied) and after `phaseNarrative`. Sits alongside `mandate`.
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseFactionSuccession } from '../phaseFactionSuccession';

export const factionSuccessionPhase: EnginePhase = {
  id: 'faction_succession',
  slot: 'post-narrative',
  run: (state) => {
    phaseFactionSuccession(state);
    return {};
  },
};
