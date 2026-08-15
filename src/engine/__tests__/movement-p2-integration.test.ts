import { describe, it, expect } from 'vitest';
import { TRAIL_HISTORY_TICKS } from '../../types/movement';
import { WorldGraph } from '../graph';
import { initMovementState, tickMovement } from '../movementExecution';

// THR-1089: the ghost-dot cases that lived here were deleted with `src/engine/ghostDots.ts`,
// which had zero production importers. `GHOST_DOT_DECAY_TICKS` stays pinned by
// `src/data/__tests__/agent-visual-content.test.ts`, so no constant lost its coverage.
describe('P2 integration', () => {
  it('trail history ticks matches design spec', () => {
    expect(TRAIL_HISTORY_TICKS).toBe(6);
  });

  it('movement history entries include hex coordinates for trail rendering', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'hex_a', type: 'location', name: 'A', properties: { terrain: 'grassland', hexCol: 0, hexRow: 0 } });
    graph.addNode({ id: 'hex_b', type: 'location', name: 'B', properties: { terrain: 'grassland', hexCol: 1, hexRow: 0 } });
    graph.addNode({ id: 'hex_c', type: 'location', name: 'C', properties: { terrain: 'grassland', hexCol: 2, hexRow: 0 } });
    graph.addNode({ id: 'agent_1', type: 'actor', name: 'Agent', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'a_adj_b', source: 'hex_a', target: 'hex_b', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'b_adj_c', source: 'hex_b', target: 'hex_c', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'agent_1_at', source: 'agent_1', target: 'hex_a', type: 'located_at', properties: {} });

    // 2-edge model: grassland→grassland = 2 ticks per hop
    let state = initMovementState('hex_c', ['hex_b', 'hex_c'], 2, 0);

    // Tick 1: accumulate toward hex_b (need 2 ticks)
    const r0 = tickMovement(graph, 'agent_1', state, 1);
    expect(r0.moved).toBe(false);
    state = r0.updatedState;

    // Tick 2: move to hex_b
    const r1 = tickMovement(graph, 'agent_1', state, 2);
    expect(r1.moved).toBe(true);
    expect(r1.updatedState.movementHistory[0]).toEqual({ nodeId: 'hex_b', tick: 2, hexCol: 1, hexRow: 0 });
    state = r1.updatedState;

    // Tick 3: accumulate toward hex_c (need 2 ticks)
    const r2a = tickMovement(graph, 'agent_1', state, 3);
    expect(r2a.moved).toBe(false);
    state = r2a.updatedState;

    // Tick 4: move to hex_c
    const r2 = tickMovement(graph, 'agent_1', state, 4);
    expect(r2.moved).toBe(true);
    expect(r2.updatedState.movementHistory[0]).toEqual({ nodeId: 'hex_c', tick: 4, hexCol: 2, hexRow: 0 });
    expect(r2.updatedState.movementHistory).toHaveLength(2);

    // Both entries have hex coords — trail renderer can draw lines
    for (const entry of r2.updatedState.movementHistory) {
      expect(entry.hexCol).toBeDefined();
      expect(entry.hexRow).toBeDefined();
    }
  });
});
