/**
 * Regression test: tickMovement must advance at most 1 hex per call.
 *
 * The encounter log showed agents moving 2 hexes per tick on major roads.
 * Root cause: React StrictMode double-invoking the setState updater that
 * called runTick, which has side effects (graph mutation, timeline appends).
 * Fix: useSimulation.ts now calls runTick imperatively from a ref, not
 * inside setState. This test guards the invariant at the engine level.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { initMovementState, tickMovement } from '../movementExecution';

function buildRoadGraph() {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc_a', name: 'Town A', type: 'location', properties: { hexCol: 0, hexRow: 0, locationType: 'town', terrain: 'grassland' } });
  graph.addNode({ id: 'loc_b', name: 'Town B', type: 'location', properties: { hexCol: 5, hexRow: 0, locationType: 'town', terrain: 'grassland' } });
  graph.addNode({ id: 'agent_1', name: 'TestAgent', type: 'actor', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e1', source: 'agent_1', target: 'loc_a', type: 'located_at', properties: {} });
  return graph;
}

describe('road movement rate', () => {
  it('tickMovement moves exactly 1 hex per call on a major road', () => {
    const graph = buildRoadGraph();

    const roadSegments = [{
      fromId: 'loc_a',
      toId: 'loc_b',
      roadType: 'major' as const,
      hexPath: [
        { col: 0, row: 0 },
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
        { col: 4, row: 0 },
        { col: 5, row: 0 },
      ],
      discountedCost: 2.0,
    }];

    const state = initMovementState('loc_b', ['loc_b'], 0.4, 0, roadSegments, 'loc_a');
    expect(state.roadHexCost).toBe(0.4);
    expect(state.roadHexQueue).toHaveLength(5);

    // Track positions: each tick should advance exactly 1 hex
    let currentState = state;
    const hexPositions: Array<{ col: number; row: number }> = [{ col: 0, row: 0 }];

    for (let tick = 1; tick <= 10; tick++) {
      const result = tickMovement(graph, 'agent_1', currentState, tick);
      currentState = result.updatedState;

      if (result.roadHexTransition) {
        hexPositions.push(result.roadHexTransition.toHex);
      }

      if (result.arrivedAtDestination) break;
    }

    // Should have visited 6 positions: start + 5 moves (one per tick)
    expect(hexPositions).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
      { col: 5, row: 0 },
    ]);
  });
});
