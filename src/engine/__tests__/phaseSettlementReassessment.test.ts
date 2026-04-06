// src/engine/__tests__/phaseSettlementReassessment.test.ts
import { describe, it, expect } from 'vitest';
import { phaseSettlementReassessment } from '../phaseSettlementReassessment';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import { PROMOTION_REASSESSMENT_DELAY } from '../settlementGenome/constants';

function makeMinimalGameState(overrides: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_1', type: 'location', name: 'Test Town',
    properties: { locationSubtype: 'town' },
  });

  return {
    tick: 100,
    seed: 42,
    graph,
    tickEvents: [],
    ...overrides,
  } as unknown as GameState;
}

describe('phaseSettlementReassessment', () => {
  it('returns empty when no settlements need reassessment', () => {
    const state = makeMinimalGameState();
    const result = phaseSettlementReassessment(state);
    expect(result.tickEvents?.length ?? 0).toBe(0);
  });

  it('triggers reassessment when settlement has pendingReassessment flag', () => {
    const state = makeMinimalGameState();
    const loc = state.graph.getNode('loc_1');
    if (loc) {
      loc.properties.pendingReassessment = true;
      loc.properties.reassessmentTick = state.tick - (PROMOTION_REASSESSMENT_DELAY + 1);
    }

    phaseSettlementReassessment(state);
    expect(loc!.properties.pendingReassessment).toBeFalsy();
  });

  it('skips reassessment when delay has not elapsed', () => {
    const state = makeMinimalGameState();
    const loc = state.graph.getNode('loc_1');
    if (loc) {
      loc.properties.pendingReassessment = true;
      loc.properties.reassessmentTick = state.tick - 1; // Only 1 tick ago, not enough
    }

    phaseSettlementReassessment(state);
    // Flag should still be set since delay not met
    expect(loc!.properties.pendingReassessment).toBe(true);
  });

  it('stores genome result on location properties', () => {
    const state = makeMinimalGameState();
    const loc = state.graph.getNode('loc_1');
    if (loc) {
      loc.properties.pendingReassessment = true;
      loc.properties.reassessmentTick = state.tick - (PROMOTION_REASSESSMENT_DELAY + 1);
    }

    phaseSettlementReassessment(state);
    expect(loc!.properties.genomeResult).toBeTruthy();
  });

  it('skips non-settlement locations', () => {
    const state = makeMinimalGameState();
    const loc = state.graph.getNode('loc_1');
    if (loc) {
      loc.properties.locationSubtype = 'dungeon';
      loc.properties.pendingReassessment = true;
      loc.properties.reassessmentTick = state.tick - (PROMOTION_REASSESSMENT_DELAY + 1);
    }

    phaseSettlementReassessment(state);
    // genomeResult should not be set for non-settlement
    expect(loc!.properties.genomeResult).toBeUndefined();
  });

  it('processes all eligible settlement subtypes', () => {
    const subtypes = ['hamlet', 'town', 'city', 'capital'];
    for (const subtype of subtypes) {
      const state = makeMinimalGameState();
      const loc = state.graph.getNode('loc_1');
      if (loc) {
        loc.properties.locationSubtype = subtype;
        loc.properties.pendingReassessment = true;
        loc.properties.reassessmentTick = state.tick - (PROMOTION_REASSESSMENT_DELAY + 1);
      }

      phaseSettlementReassessment(state);
      expect(loc!.properties.pendingReassessment).toBeFalsy();
      expect(loc!.properties.genomeResult).toBeTruthy();
    }
  });
});
