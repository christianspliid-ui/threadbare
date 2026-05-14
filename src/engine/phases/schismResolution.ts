/**
 * Phase descriptor: schism_resolution (THR-430).
 *
 * Wraps the void-returning `phaseSchismResolution` (mutates graph + recentEvents
 * in place) into the registry's `Partial<GameState>` contract.
 *
 * Order: must run after `faction_actions` so the same-tick faction internal
 * moves (dissent decay, stir-dissent thresholds) have already settled before
 * the resolution evaluator reads dissent.
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseSchismResolution } from '../phaseSchismResolution';

export const schismResolutionPhase: EnginePhase = {
  id: 'schism_resolution',
  slot: 'post-economy',
  afterPhase: ['faction_actions'],
  run: (state) => {
    phaseSchismResolution(state);
    return {};
  },
};
