/**
 * Phase 6.5 — Reputation Decay.
 *
 * Extracted from `orchestrator.ts` in THR-238 Land 2 so the registry descriptor
 * file can import the implementation without creating an `orchestrator → phases →
 * orchestrator` cycle. Behavior unchanged.
 */
import type { GameState } from '../types/gameState';
import { decayReputation } from './disposition';
import { DEFAULT_REPUTATION } from '../types/disposition';
import { decayAllTrust } from './trustMechanics';

export function phaseReputationDecay(state: GameState): Partial<GameState> {
  const graph = state.graph;

  // Iterate all individual actors — decay legacy reputationScore
  const actors = graph.getNodesByType('actor')
    .filter(node => node.properties?.actorType === 'individual');

  for (const actor of actors) {
    const currentRep = actor.properties?.reputationScore ?? DEFAULT_REPUTATION;
    const decayedRep = decayReputation(currentRep);
    actor.properties.reputationScore = decayedRep;
  }

  // Decay trust on all relates_to edges (social fabric)
  decayAllTrust(graph);

  return {};
}
