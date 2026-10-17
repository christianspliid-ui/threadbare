/**
 * Seizing a route tolls the route seized (THR-1883).
 *
 * `control:seize` used to call `executeTaxTradeRoute`, which picks the busiest
 * untolled lane at the caster's own durable location. A seizer standing at town A
 * who took the B–C road therefore stamped `controlledBy` on A's busiest lane and
 * left B–C free. The fixture puts the seizer at A with a busier untolled lane there
 * than B–C, so the old code fails it in the passing direction.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { mintRouteIdentity, tollTradeRouteEdge } from '../tradeRouteOps';
import { getUndertakingObjectType } from '../../data/undertaking-objects';
import type { ObjectVerbContext } from '../../data/undertaking-objects';
import type { GameState } from '../../types/gameState';
import type { GraphOp } from '../../types/graphOp';

const SEIZER = 'actor_seizer';

function town(g: WorldGraph, id: string, col: number, row: number): void {
  g.addNode({ id, name: id, type: 'location', properties: { locationSubtype: 'town', hexCol: col, hexRow: row } });
}

function lane(g: WorldGraph, id: string, from: string, to: string, volume: number): void {
  g.addEdge({ id, source: from, target: to, type: 'trades_with', properties: { volume } });
}

function world(): { graph: WorldGraph; roadId: string } {
  const graph = new WorldGraph();
  town(graph, 'town_a', 2, 2);
  town(graph, 'town_b', 8, 2);
  town(graph, 'town_c', 11, 2);
  town(graph, 'town_d', 2, 6);
  graph.addNode({ id: SEIZER, name: 'Brann Holt', type: 'actor', properties: {} });
  graph.addEdge({ id: 'e_at', source: SEIZER, target: 'town_a', type: 'located_at', properties: {} });
  // A's lane is the busier one, so an actor-anchored toll would pick it.
  lane(graph, 'lane_ad', 'town_a', 'town_d', 9);
  lane(graph, 'lane_bc', 'town_b', 'town_c', 2);
  const minted = mintRouteIdentity(graph, 'town_b', 'town_c', 'lane_bc', 'worldgen', 0);
  expect(minted.success).toBe(true);
  return { graph, roadId: minted.createdId! };
}

describe('control:seize on a route (THR-1883)', () => {
  it('tolls the seized lane B–C, and no lane at the town the seizer stands in', () => {
    const { graph, roadId } = world();
    const seize = getUndertakingObjectType('route')!.verbs['control:seize'];
    expect(typeof seize).toBe('function');
    const ctx: ObjectVerbContext = {
      state: {} as GameState,
      graph,
      actorId: SEIZER,
      handle: { kind: 'node', nodeId: roadId },
      tick: 40,
    };
    const result = (seize as (c: ObjectVerbContext) => { success: boolean })(ctx);
    expect(result.success).toBe(true);

    expect(graph.getEdge('lane_bc')!.properties.controlledBy).toBe(SEIZER);
    expect(graph.getEdge('lane_bc')!.properties.taxRate).toBeGreaterThan(0);
    expect(graph.getEdge('lane_ad')!.properties.controlledBy).toBeUndefined();
  });
});

describe('tollTradeRouteEdge', () => {
  const op = { op: 'tax_trade_route' } as unknown as GraphOp;

  it('refuses an edge that is not a lane and writes nothing', () => {
    const { graph } = world();
    expect(tollTradeRouteEdge(graph, op, 'e_at', SEIZER).success).toBe(false);
    expect(graph.getEdge('e_at')!.properties.controlledBy).toBeUndefined();
    expect(tollTradeRouteEdge(graph, op, 'no_such_edge', SEIZER).success).toBe(false);
  });
});
