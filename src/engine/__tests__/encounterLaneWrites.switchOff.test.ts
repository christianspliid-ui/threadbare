/**
 * THR-2046 — the rollback switch. With `ENCOUNTER_LANE_WRITES_ENABLED` off, `lane_threat`
 * and `lane_toll` write nothing and a lane-volume row ignores the bound lane: today's
 * busiest-lane behaviour exactly.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../data/economy-shift-constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/economy-shift-constants')>()),
  ENCOUNTER_LANE_WRITES_ENABLED: false,
}));

import { applyWorldEconomyShiftDetailed } from '../economyShift';
import { WorldGraph } from '../graph';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'town-1', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town' } });
  graph.addNode({ id: 'town-2', type: 'location', name: 'Brennock', properties: { locationSubtype: 'town' } });
  graph.addNode({ id: 'town-3', type: 'location', name: 'Carrow', properties: { locationSubtype: 'town' } });
  graph.addEdge({ id: 'lane-busy', source: 'town-1', target: 'town-2', type: 'trades_with', properties: { volume: 5 } });
  graph.addEdge({ id: 'lane-quiet', source: 'town-3', target: 'town-1', type: 'trades_with', properties: { volume: 3 } });
  return graph;
}

describe('THR-2046 — ENCOUNTER_LANE_WRITES_ENABLED off', () => {
  it('restores today\'s behaviour', () => {
    const g = buildGraph();
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_threat', amount: 1, settlementId: 'town-1', laneEdgeId: 'lane-quiet' }, 10)).toBe('no_move');
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_toll', amount: 1, settlementId: 'town-1', laneEdgeId: 'lane-quiet', actorId: 'actor-1' }, 10)).toBe('no_move');
    expect(g.getEdge('lane-quiet')!.properties.threatened).toBeUndefined();
    expect(g.getEdge('lane-quiet')!.properties.controlledBy).toBeUndefined();
    expect(applyWorldEconomyShiftDetailed(g, { quantity: 'lane_volume', amount: -1, settlementId: 'town-1', laneEdgeId: 'lane-quiet' }, 10))
      .toMatchObject({ nodeId: 'lane-busy', laneSource: 'fallback' });
  });
});
