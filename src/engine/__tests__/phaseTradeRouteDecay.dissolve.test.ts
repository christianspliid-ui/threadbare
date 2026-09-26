/**
 * THR-1615 — the two defects on the trade-lane dissolve path.
 *
 * 1. A dissolved lane's Route identity node outlived its `trades_with` edge and
 *    stayed claimable (`isRouteObject` tested the subtype alone).
 * 2. The trade-route-lost prosperity shock walked `located_at` out of each end —
 *    a shape no settlement carries — so it never fired.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseTradeRouteDecay, tradeRouteShockTargets } from '../phaseTradeRouteDecay';
import { TRADE_ROUTE_FRESHNESS_WINDOW } from '../tradeRoute';
import { SHOCK_TRADE_ROUTE_LOST } from '../phaseProsperity';
import { ROUTE_IDENTITY_SUBTYPE } from '../../data/strategic-action-constants';
import {
  enumerateObjectHandles,
  getUndertakingObjectType,
  isObjectOfType,
} from '../../data/undertaking-objects';
import type { GameState } from '../../types/gameState';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';

function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    tick, cycle: 0, seed: 42, graph, phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] }, tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 }, ascendantId: 'asc_1', essencePool: {},
    mandateDefinition: null, mandateState: null, rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'], doomClock: {} as GameState['doomClock'],
    tickEvents: [], recentEvents: [], chronicleEntries: [], stealthExposure: 0,
    visibilityMap: new Map(), familiarityMap: new Map(), culturalInsightMap: new Map(),
    encounterProgress: [], actionsInProgress: [], worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [], echoStates: [], chronicle: { cycles: [], totalEntries: 0 },
  };
}

/** Two settlements joined by a lane about to die, its identity node, and a holder who owns it. */
function seedDyingLane(graph: WorldGraph): void {
  graph.addNode({ id: 'loc.a', type: 'location', name: 'Ashford', properties: { hexCol: 1, hexRow: 1 } });
  graph.addNode({ id: 'loc.b', type: 'location', name: 'Brindle', properties: { hexCol: 4, hexRow: 1 } });
  graph.addNode({ id: 'actor.holder', type: 'actor', name: 'Holder', properties: {} });
  graph.addEdge({
    id: 'route.ab', source: 'loc.a', target: 'loc.b', type: 'trades_with',
    properties: { volume: 1, lastTraded: 1, established: 1 },
  });
  graph.addNode({
    id: 'loc_trade_route_loc.a_loc.b', type: 'location', name: 'Ashford–Brindle Road',
    properties: {
      locationSubtype: ROUTE_IDENTITY_SUBTYPE, hexCol: 1, hexRow: 1,
      routeSourceId: 'loc.a', routeTargetId: 'loc.b', routeEdgeId: 'route.ab',
    },
  });
  graph.addEdge({ id: 'owns.holder.road', source: 'actor.holder', target: 'loc_trade_route_loc.a_loc.b', type: 'owns', properties: {} });
}

const DEATH_TICK = 1 + TRADE_ROUTE_FRESHNESS_WINDOW + 1;
const ROUTE = getUndertakingObjectType('route')!;

describe('THR-1615 — a dissolved lane', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
    seedDyingLane(graph);
  });

  it('sends the trade-route-lost shock to both settlements it joined', () => {
    const result = phaseTradeRouteDecay(makeState(graph, DEATH_TICK));
    const shocks = (result.prosperityShocks ?? []).filter(s => s.causeType === 'trade_route_lost');
    expect(shocks.map(s => s.locationId).sort()).toEqual(['loc.a', 'loc.b']);
    for (const s of shocks) {
      expect(s.delta).toBe(SHOCK_TRADE_ROUTE_LOST);
      expect(s.causeId).toBe('route.ab');
    }
  });

  it('removes the Route identity node with its lane, and the holding on it', () => {
    phaseTradeRouteDecay(makeState(graph, DEATH_TICK));
    expect(graph.getEdge('route.ab')).toBeUndefined();
    expect(graph.getNode('loc_trade_route_loc.a_loc.b')).toBeUndefined();
    expect(graph.getEdge('owns.holder.road')).toBeUndefined();
    const trace = getTraces().find(t => t.category === 'trade_route_dissolved') as { identityNodeIds?: string[] } | undefined;
    expect(trace?.identityNodeIds).toEqual(['loc_trade_route_loc.a_loc.b']);
  });

  it('leaves a living lane and its identity alone', () => {
    const result = phaseTradeRouteDecay(makeState(graph, 2));
    expect(graph.getEdge('route.ab')).toBeDefined();
    expect(graph.getNode('loc_trade_route_loc.a_loc.b')).toBeDefined();
    expect(result.prosperityShocks ?? []).toHaveLength(0);
  });
});

describe('THR-1615 — tradeRouteShockTargets', () => {
  it('resolves a Place end up to its Location and collapses duplicates', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'place.a1', type: 'location', name: 'A Market', properties: { parentLocationId: 'loc.a' } });
    graph.addNode({ id: 'place.a2', type: 'location', name: 'A Docks', properties: { parentLocationId: 'loc.a' } });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    expect(tradeRouteShockTargets(graph, 'place.a1', 'loc.b')).toEqual(['loc.a', 'loc.b']);
    expect(tradeRouteShockTargets(graph, 'place.a1', 'place.a2')).toEqual(['loc.a']);
    expect(tradeRouteShockTargets(graph, 'missing', 'loc.b')).toEqual(['loc.b']);
  });
});

describe('THR-1615 — isRouteObject requires a live lane', () => {
  it('accepts an identity whose edge stands, and rejects one whose edge is gone', () => {
    const graph = new WorldGraph();
    seedDyingLane(graph);
    const handle = { kind: 'node' as const, nodeId: 'loc_trade_route_loc.a_loc.b' };
    expect(isObjectOfType(graph, ROUTE, handle)).toBe(true);
    expect(enumerateObjectHandles(graph, ROUTE)).toEqual([handle]);

    // The lane goes without its identity (the pre-fix shape the dissolve path left behind).
    graph.removeEdge('route.ab');
    expect(isObjectOfType(graph, ROUTE, handle)).toBe(false);
    expect(enumerateObjectHandles(graph, ROUTE)).toEqual([]);
  });

  it('rejects an identity that never recorded its lane', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'orphan', type: 'location', name: 'Orphan Road',
      properties: { locationSubtype: ROUTE_IDENTITY_SUBTYPE, routeSourceId: 'x', routeTargetId: 'y' },
    });
    expect(isObjectOfType(graph, ROUTE, { kind: 'node', nodeId: 'orphan' })).toBe(false);
  });
});
