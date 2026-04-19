/**
 * Tests for phasePlaceOfPowerStreams (THR-153, PR 5).
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { EssencePool } from '../../../types/influence';
import { phasePlaceOfPowerStreams } from '../placeOfPowerStreams';
import {
  POP_STREAM_DECAY_WINDOW_TICKS,
  POP_CORRUPT_SIPHON_FRACTION,
} from '../constants';

function makePool(base = 50): EssencePool {
  return {
    chaos: base, order: base, light: base, darkness: base,
    force: base, matter: base, energy: base, life: base,
    mind: base, spirit: base, time: base, entropy: base,
  };
}

function makeState(tick = 1): GameState {
  return {
    tick,
    seed: 1,
    graph: new WorldGraph(),
    essencePool: makePool(),
    ascendantId: 'god-1',
    activeDelves: [],
    delveAdmissionQueue: [],
    pendingEmergenceDecision: undefined,
    chronicleEntries: [],
    tickEvents: [],
    recentEvents: [],
  } as unknown as GameState;
}

function addPoP(
  graph: WorldGraph,
  id: string,
  hexCol: number,
  hexRow: number,
  essencePerTick = 2,
  sphere = 'spirit',
  decayCountdown = POP_STREAM_DECAY_WINDOW_TICKS,
): void {
  graph.addNode({
    id, type: 'location', name: `PoP ${id}`,
    properties: {
      locationSubtype: 'place_of_power',
      hexCol, hexRow,
      popEssencePerTick: essencePerTick,
      popSphere: sphere,
      popStreamDecayCountdown: decayCountdown,
    },
  });
}

function addHolder(
  graph: WorldGraph,
  holderId: string,
  popId: string,
  hexCol: number,
  hexRow: number,
  corruptMark = false,
): void {
  const locId = `loc_${holderId}`;
  graph.addNode({ id: holderId, type: 'actor', name: `Holder ${holderId}`, properties: { actorType: 'individual' } });
  graph.addNode({ id: locId, type: 'location', name: `Loc ${holderId}`, properties: { hexCol, hexRow } });
  graph.addEdge({ id: `e_${holderId}`, source: holderId, target: locId, type: 'located_at', properties: {} });

  graph.addEdge({
    id: `hold_${holderId}_${popId}`,
    source: holderId,
    target: popId,
    type: 'holds_place_of_power',
    properties: {
      heldSinceTick: 1,
      holderType: 'actor',
      corruptMark,
      bargainFavor: false,
      sphere: 'spirit',
    },
  });
}

describe('phasePlaceOfPowerStreams — holder present', () => {
  it('credits essencePerTick to the PoP sphere when holder is on the same hex', () => {
    const state = makeState();
    addPoP(state.graph, 'pop-1', 3, 4, 2, 'spirit');
    addHolder(state.graph, 'agent-1', 'pop-1', 3, 4);

    const patch = phasePlaceOfPowerStreams(state);
    expect(patch.essencePool).toBeDefined();
    expect(patch.essencePool!.spirit).toBe(state.essencePool.spirit + 2);
  });

  it('resets decay countdown when holder is present', () => {
    const state = makeState();
    addPoP(state.graph, 'pop-1', 3, 4, 2, 'spirit', 3);
    addHolder(state.graph, 'agent-1', 'pop-1', 3, 4);

    phasePlaceOfPowerStreams(state);
    const node = state.graph.getNode('pop-1');
    expect(node?.properties.popStreamDecayCountdown).toBe(POP_STREAM_DECAY_WINDOW_TICKS);
  });

  it('does not credit when holder is on a different hex', () => {
    const state = makeState();
    addPoP(state.graph, 'pop-1', 3, 4, 2, 'spirit');
    addHolder(state.graph, 'agent-1', 'pop-1', 9, 9);

    const patch = phasePlaceOfPowerStreams(state);
    if (patch.essencePool) {
      expect(patch.essencePool.spirit).toBeLessThanOrEqual(state.essencePool.spirit);
    }
  });
});

describe('phasePlaceOfPowerStreams — holder absent', () => {
  it('decrements popStreamDecayCountdown when holder is not on hex', () => {
    const state = makeState();
    addPoP(state.graph, 'pop-1', 3, 4, 2, 'spirit', 5);
    addHolder(state.graph, 'agent-1', 'pop-1', 9, 9);

    phasePlaceOfPowerStreams(state);
    const node = state.graph.getNode('pop-1');
    expect(node?.properties.popStreamDecayCountdown).toBe(4);
  });

  it('prunes holder edge and marks stream dead when countdown reaches 0', () => {
    const state = makeState();
    addPoP(state.graph, 'pop-1', 3, 4, 2, 'spirit', 1);
    addHolder(state.graph, 'agent-1', 'pop-1', 9, 9);

    phasePlaceOfPowerStreams(state);
    const node = state.graph.getNode('pop-1');
    expect(node?.properties.popStreamDead).toBe(true);
    expect(node?.properties.popStreamDecayCountdown).toBe(0);
    const edges = state.graph.getOutgoingEdges('agent-1', 'holds_place_of_power');
    expect(edges).toHaveLength(0);
  });
});

describe('phasePlaceOfPowerStreams — corrupt siphon', () => {
  it('credits god darkness pool alongside holder spirit pool when corruptMark is true', () => {
    const state = makeState();
    addPoP(state.graph, 'pop-1', 3, 4, 3, 'spirit');
    addHolder(state.graph, 'agent-1', 'pop-1', 3, 4, true);

    const patch = phasePlaceOfPowerStreams(state);
    expect(patch.essencePool).toBeDefined();
    expect(patch.essencePool!.spirit).toBe(state.essencePool.spirit + 3);
    const expectedSiphon = Math.floor(3 * POP_CORRUPT_SIPHON_FRACTION);
    if (expectedSiphon > 0) {
      expect(patch.essencePool!.darkness).toBe(state.essencePool.darkness + expectedSiphon);
    }
  });
});

describe('phasePlaceOfPowerStreams — unclaimed PoP', () => {
  it('emits nothing and does not crash when PoP has no holder edge', () => {
    const state = makeState();
    addPoP(state.graph, 'pop-1', 3, 4, 2, 'spirit');

    const patch = phasePlaceOfPowerStreams(state);
    expect(Object.keys(patch)).toHaveLength(0);
  });

  it('does not crash when graph has no PoP locations at all', () => {
    const state = makeState();
    expect(() => phasePlaceOfPowerStreams(state)).not.toThrow();
  });
});
