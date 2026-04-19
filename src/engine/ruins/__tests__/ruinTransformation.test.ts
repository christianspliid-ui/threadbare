/**
 * Tests for ruinTransformation.ts (THR-153, PR 5).
 *
 * Acceptance criteria verified:
 *   1. All 7 outcome-matrix rows produce correct graph mutations
 *   2. Essence reward: transformed=full, consumed=half, catastrophic=quarter
 *   3. Backward-compat: computeElderEssenceReward still returns the same result
 *   4. Fail-soft: missing ruin node → failed result, pendingEmergenceDecision cleared
 *   5. Claim choice debits essence from pool; corrupt debits up-front cost
 *   6. Corrupt siphon and bargain-favor flags stored on holder edge
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { EssencePool } from '../../../types/influence';
import { transformRuinConsequence } from '../ruinTransformation';
import { computeElderEssenceReward } from '../../elderEssenceReward';
import {
  ELDER_SITE_ESSENCE_REWARD,
} from '../../../data/agent-behavior-constants';
import {
  TRANSFORMED_ELDER_ESSENCE_MULTIPLIER,
  CONSUMED_ELDER_ESSENCE_MULTIPLIER,
  CATASTROPHIC_ELDER_ESSENCE_MULTIPLIER,
  POP_CLAIM_COST_MULTIPLIER,
  POP_CORRUPT_UP_FRONT_COST,
} from '../constants';

function makeEssencePool(base = 100): EssencePool {
  return {
    chaos: base, order: base, light: base, darkness: base,
    force: base, matter: base, energy: base, life: base,
    mind: base, spirit: base, time: base, entropy: base,
  };
}

function makeState(tick = 10, overrides: Partial<GameState> = {}): GameState {
  return {
    tick,
    seed: 42,
    graph: new WorldGraph(),
    essencePool: makeEssencePool(),
    ascendantId: 'god-1',
    activeDelves: [],
    delveAdmissionQueue: [],
    pendingEmergenceDecision: undefined,
    chronicleEntries: [],
    tickEvents: [],
    recentEvents: [],
    ...overrides,
  } as unknown as GameState;
}

function addRuin(
  graph: WorldGraph,
  id: string,
  magnitude = 0.5,
  sphere = 'spirit',
  archetype = 'vault',
  hexCol = 5,
  hexRow = 5,
): void {
  graph.addNode({
    id, type: 'location', name: `Ruin ${id}`,
    properties: {
      locationType: 'elder_ruin',
      locationSubtype: 'elder_ruin',
      hexCol, hexRow,
      ruinMagnitude: magnitude,
      sphereAlignment: sphere,
      archetype,
    },
  });
}

function addAgent(graph: WorldGraph, id: string, hexCol = 5, hexRow = 5): void {
  const locId = `loc_${id}`;
  graph.addNode({ id, type: 'actor', name: `Agent ${id}`, properties: { actorType: 'individual' } });
  graph.addNode({ id: locId, type: 'location', name: `Loc ${id}`, properties: { hexCol, hexRow } });
  graph.addEdge({ id: `e_${id}`, source: id, target: locId, type: 'located_at', properties: {} });
}

function baseInput(overrides: Partial<Parameters<typeof transformRuinConsequence>[1]> = {}) {
  return {
    ruinId: 'ruin-1',
    delveId: 'delve-1',
    agentId: 'agent-1',
    emergenceChoice: 'let' as const,
    consequenceRoll: 'transformed' as const,
    ruinMagnitude: 0.5,
    sphereAlignment: 'spirit',
    actingGodId: 'god-1',
    ...overrides,
  };
}

describe('transformRuinConsequence — outcome matrix', () => {
  let state: GameState;

  beforeEach(() => {
    state = makeState();
    addRuin(state.graph, 'ruin-1');
    addAgent(state.graph, 'agent-1');
  });

  it('catastrophic → consumed: spawns scar sublocation, quarter essence', () => {
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'catastrophic',
      emergenceChoice: 'let',
    }));
    expect(result.failed).toBeUndefined();
    expect(result.newScarSublocationId).toBeDefined();
    expect(result.newLocationId).toBeUndefined();
    expect(result.totalEssence).toBeCloseTo(
      ELDER_SITE_ESSENCE_REWARD * CATASTROPHIC_ELDER_ESSENCE_MULTIPLIER, 5,
    );
  });

  it('scarred → consumed: spawns scar sublocation, half essence', () => {
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'scarred',
      emergenceChoice: 'let',
    }));
    expect(result.newScarSublocationId).toBeDefined();
    expect(result.newLocationId).toBeUndefined();
    expect(result.totalEssence).toBeCloseTo(
      ELDER_SITE_ESSENCE_REWARD * CONSUMED_ELDER_ESSENCE_MULTIPLIER, 5,
    );
  });

  it('marked → consumed: spawns scar, half essence', () => {
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'marked',
      emergenceChoice: 'corrupt',
    }));
    expect(result.newScarSublocationId).toBeDefined();
    expect(result.totalEssence).toBeCloseTo(
      ELDER_SITE_ESSENCE_REWARD * CONSUMED_ELDER_ESSENCE_MULTIPLIER, 5,
    );
  });

  it('triumphant with claim → fallback to let: no PoP, no holder', () => {
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'triumphant',
      emergenceChoice: 'claim',
    }));
    expect(result.newLocationId).toBeUndefined();
    expect(result.holderId).toBeUndefined();
    expect(result.totalEssence).toBeCloseTo(
      ELDER_SITE_ESSENCE_REWARD * TRANSFORMED_ELDER_ESSENCE_MULTIPLIER, 5,
    );
  });

  it('transformed + let → PoP created, agent is holder, full essence', () => {
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'transformed',
      emergenceChoice: 'let',
    }));
    expect(result.newLocationId).toBe('ruin-1');
    expect(result.holderId).toBe('agent-1');
    expect(result.essenceCost).toBe(0);
    expect(result.totalEssence).toBeCloseTo(
      ELDER_SITE_ESSENCE_REWARD * TRANSFORMED_ELDER_ESSENCE_MULTIPLIER, 5,
    );
    const node = state.graph.getNode('ruin-1');
    expect(node?.properties.locationSubtype).toBe('place_of_power');
  });

  it('transformed + claim → PoP created, god is holder, claim cost debited', () => {
    const magnitude = 0.5;
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'transformed',
      emergenceChoice: 'claim',
      ruinMagnitude: magnitude,
    }));
    expect(result.holderId).toBe('god-1');
    const expectedCost = magnitude * POP_CLAIM_COST_MULTIPLIER;
    expect(result.essenceCost).toBeGreaterThan(0);
    expect(result.essenceCost).toBeCloseTo(expectedCost, 1);
    expect(result.patch.essencePool).toBeDefined();
  });

  it('transformed + bargain → PoP created, agent holder, no essence cost, bargainFavor edge', () => {
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'transformed',
      emergenceChoice: 'bargain',
    }));
    expect(result.holderId).toBe('agent-1');
    expect(result.essenceCost).toBe(0);
    const edges = state.graph.getOutgoingEdges('agent-1', 'holds_place_of_power');
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.bargainFavor).toBe(true);
    expect(edges[0].properties.corruptMark).toBe(false);
  });

  it('transformed + corrupt → PoP created, agent holder, up-front cost, corruptMark edge', () => {
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'transformed',
      emergenceChoice: 'corrupt',
    }));
    expect(result.holderId).toBe('agent-1');
    expect(result.essenceCost).toBeCloseTo(POP_CORRUPT_UP_FRONT_COST, 1);
    const edges = state.graph.getOutgoingEdges('agent-1', 'holds_place_of_power');
    expect(edges[0].properties.corruptMark).toBe(true);
    expect(edges[0].properties.bargainFavor).toBe(false);
  });
});

describe('transformRuinConsequence — essence distribution', () => {
  let state: GameState;

  beforeEach(() => {
    state = makeState();
    addRuin(state.graph, 'ruin-1', 0.5, 'chaos');
    addAgent(state.graph, 'agent-1');
  });

  it('transformed path distributes across 4 foundation spheres', () => {
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'transformed',
      emergenceChoice: 'let',
      sphereAlignment: 'chaos',
    }));
    const keys = Object.keys(result.essenceDeltas);
    expect(keys).toContain('chaos');
    expect(keys).toContain('order');
    expect(keys).toContain('light');
    expect(keys).toContain('darkness');
    const perSphere = result.totalEssence / 4;
    for (const sphere of ['chaos', 'order', 'light', 'darkness']) {
      expect((result.essenceDeltas as Record<string, number>)[sphere]).toBeCloseTo(perSphere, 5);
    }
  });

  it('consumed path credits single sphere', () => {
    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'scarred',
      emergenceChoice: 'let',
    }));
    const keys = Object.keys(result.essenceDeltas);
    expect(keys).toContain('spirit');
    expect(keys).not.toContain('chaos');
  });
});

describe('transformRuinConsequence — fail-soft', () => {
  it('missing ruin node → failed=true, clears pendingEmergenceDecision', () => {
    const state = makeState();
    addAgent(state.graph, 'agent-1');

    const result = transformRuinConsequence(state, baseInput());
    expect(result.failed).toBe(true);
    expect(result.patch.pendingEmergenceDecision).toBeUndefined();
    expect(result.totalEssence).toBe(0);
  });

  it('NaN ruinMagnitude → no crash, zero essence', () => {
    const state = makeState();
    addRuin(state.graph, 'ruin-1');
    addAgent(state.graph, 'agent-1');

    const result = transformRuinConsequence(state, baseInput({ ruinMagnitude: NaN }));
    expect(result.failed).toBeUndefined();
    expect(Number.isFinite(result.totalEssence)).toBe(true);
  });
});

describe('transformRuinConsequence — patch shape', () => {
  it('patch includes pendingEmergenceDecision = undefined to clear it', () => {
    const state = makeState();
    addRuin(state.graph, 'ruin-1');
    addAgent(state.graph, 'agent-1');

    const result = transformRuinConsequence(state, baseInput());
    expect('pendingEmergenceDecision' in result.patch).toBe(true);
    expect(result.patch.pendingEmergenceDecision).toBeUndefined();
  });

  it('chronicle entry is produced for transformed path', () => {
    const state = makeState();
    addRuin(state.graph, 'ruin-1');
    addAgent(state.graph, 'agent-1');

    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'transformed',
      emergenceChoice: 'let',
    }));
    expect(result.chronicleEntry).toBeDefined();
    expect(result.chronicleEntry!.title).toContain('Place of Power');
  });

  it('chronicle entry is produced for consumed path', () => {
    const state = makeState();
    addRuin(state.graph, 'ruin-1');
    addAgent(state.graph, 'agent-1');

    const result = transformRuinConsequence(state, baseInput({
      consequenceRoll: 'scarred',
      emergenceChoice: 'let',
    }));
    expect(result.chronicleEntry).toBeDefined();
    expect(result.chronicleEntry!.title).toContain('Scar');
  });
});

describe('computeElderEssenceReward — backward compat', () => {
  it('elder site distributes across 4 foundation spheres', () => {
    const result = computeElderEssenceReward(
      { sublocationId: 's1', sublocationName: 'Test Site', hexCol: 0, hexRow: 0, hasElderMagic: true },
      5,
      makeEssencePool(),
    );
    expect(result.totalReward).toBe(ELDER_SITE_ESSENCE_REWARD);
    for (const sphere of ['chaos', 'order', 'light', 'darkness']) {
      expect((result.deltas as Record<string, number>)[sphere]).toBeCloseTo(
        ELDER_SITE_ESSENCE_REWARD / 4, 5,
      );
    }
  });

  it('non-elder site credits spirit only', () => {
    const result = computeElderEssenceReward(
      { sublocationId: 's2', sublocationName: 'Cave', hexCol: 0, hexRow: 0, hasElderMagic: false },
      5,
      makeEssencePool(),
    );
    const keys = Object.keys(result.deltas);
    expect(keys).toContain('spirit');
    expect(keys).not.toContain('chaos');
  });
});
