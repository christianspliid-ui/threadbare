import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseTradeRouteDecay } from '../phaseTradeRouteDecay';
import {
  TRADE_ROUTE_DECAY_RATE,
  TRADE_ROUTE_FRESHNESS_WINDOW,
  TRADE_ROUTE_MAX_VOLUME,
} from '../tradeRoute';
import type { GameState } from '../../types/gameState';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';

// ─── Minimal GameState factory ─────────────────────────────────────────────

function makeState(graph: WorldGraph, tick = 1): GameState {
  return {
    tick,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc_1',
    essencePool: {},
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as GameState['doomDefinition'],
    doomClock: {} as GameState['doomClock'],
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('phaseTradeRouteDecay', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    clearTraces();
  });

  // ── Fail-soft: no trades_with edges ────────────────────────────────────

  it('does nothing when there are no trades_with edges', () => {
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    phaseTradeRouteDecay(makeState(graph));
    expect(graph.getAllEdges()).toHaveLength(0);
  });

  // ── Fresh route: no decay ───────────────────────────────────────────────

  it('does NOT decay a fresh route (lastTraded within freshness window)', () => {
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.1',
      source: 'actor.a',
      target: 'actor.b',
      type: 'trades_with',
      properties: { volume: 5, lastTraded: 1, established: 1 },
    });

    const tick = 1 + TRADE_ROUTE_FRESHNESS_WINDOW; // exactly at window edge — still fresh
    phaseTradeRouteDecay(makeState(graph, tick));

    const edge = graph.getEdgeById ? graph.getEdgeById('route.1') : graph.getAllEdges().find(e => e.id === 'route.1');
    expect(edge).toBeDefined();
    expect((edge!.properties as Record<string, unknown>).volume).toBe(5);
  });

  // ── Stale route: decays volume ──────────────────────────────────────────

  it('decays volume by TRADE_ROUTE_DECAY_RATE on a stale route', () => {
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    const initialVolume = 5;
    graph.addEdge({
      id: 'route.1',
      source: 'actor.a',
      target: 'actor.b',
      type: 'trades_with',
      properties: { volume: initialVolume, lastTraded: 1, established: 1 },
    });

    const tick = 1 + TRADE_ROUTE_FRESHNESS_WINDOW + 1; // one tick past window
    phaseTradeRouteDecay(makeState(graph, tick));

    const edge = graph.getAllEdges().find(e => e.id === 'route.1');
    expect(edge).toBeDefined();
    expect((edge!.properties as Record<string, unknown>).volume).toBe(initialVolume - TRADE_ROUTE_DECAY_RATE);
  });

  // ── Route dies: edge removed ────────────────────────────────────────────

  it('removes the edge when volume decays to 0', () => {
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.1',
      source: 'actor.a',
      target: 'actor.b',
      type: 'trades_with',
      properties: { volume: 1, lastTraded: 1, established: 1 },
    });

    // volume 1 - TRADE_ROUTE_DECAY_RATE (1) = 0 → dies
    const tick = 1 + TRADE_ROUTE_FRESHNESS_WINDOW + 1;
    phaseTradeRouteDecay(makeState(graph, tick));

    const edge = graph.getAllEdges().find(e => e.id === 'route.1');
    expect(edge).toBeUndefined();
  });

  it('removes the edge when volume would go below 0', () => {
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    // Legacy edge with no volume field — readTradeRouteProps defaults to 1
    graph.addEdge({
      id: 'route.1',
      source: 'actor.a',
      target: 'actor.b',
      type: 'trades_with',
      properties: { lastTraded: 0, established: 0 },
    });

    const tick = TRADE_ROUTE_FRESHNESS_WINDOW + 2;
    phaseTradeRouteDecay(makeState(graph, tick));

    const edge = graph.getAllEdges().find(e => e.id === 'route.1');
    expect(edge).toBeUndefined();
  });

  // ── Trace emission ──────────────────────────────────────────────────────

  it('emits a trade_route_volume_change trace on decay', () => {
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.1',
      source: 'actor.a',
      target: 'actor.b',
      type: 'trades_with',
      properties: { volume: 5, lastTraded: 1, established: 1 },
    });

    const tick = 1 + TRADE_ROUTE_FRESHNESS_WINDOW + 1;
    phaseTradeRouteDecay(makeState(graph, tick));

    const traces = getTraces().filter(t => t.category === 'trade_route_volume_change');
    expect(traces).toHaveLength(1);
    const trace = traces[0] as any;
    expect(trace.edgeId).toBe('route.1');
    expect(trace.cause).toBe('decayed');
    expect(trace.previousVolume).toBe(5);
    expect(trace.newVolume).toBe(5 - TRADE_ROUTE_DECAY_RATE);
  });

  it('emits a trade_route_dissolved trace when route dies', () => {
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.1',
      source: 'actor.a',
      target: 'actor.b',
      type: 'trades_with',
      properties: { volume: 1, lastTraded: 1, established: 1 },
    });

    const tick = 1 + TRADE_ROUTE_FRESHNESS_WINDOW + 1;
    phaseTradeRouteDecay(makeState(graph, tick));

    const dissolved = getTraces().filter(t => t.category === 'trade_route_dissolved');
    expect(dissolved).toHaveLength(1);
    const trace = dissolved[0] as any;
    expect(trace.edgeId).toBe('route.1');
    expect(trace.causeOfDeath).toBe('decay');
    expect(trace.peakVolume).toBe(1);
  });

  // ── Multiple routes ─────────────────────────────────────────────────────

  it('handles multiple routes independently', () => {
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    graph.addNode({ id: 'actor.c', type: 'actor', name: 'C', properties: {} });

    const freshTick = 10;
    const currentTick = freshTick + TRADE_ROUTE_FRESHNESS_WINDOW + 1;

    // Fresh route — should not decay
    graph.addEdge({
      id: 'route.fresh',
      source: 'actor.a',
      target: 'actor.b',
      type: 'trades_with',
      properties: { volume: 5, lastTraded: currentTick, established: 1 },
    });
    // Stale route — should decay
    graph.addEdge({
      id: 'route.stale',
      source: 'actor.b',
      target: 'actor.c',
      type: 'trades_with',
      properties: { volume: 3, lastTraded: 1, established: 1 },
    });

    phaseTradeRouteDecay(makeState(graph, currentTick));

    const freshEdge = graph.getAllEdges().find(e => e.id === 'route.fresh');
    const staleEdge = graph.getAllEdges().find(e => e.id === 'route.stale');

    expect(freshEdge).toBeDefined();
    expect((freshEdge!.properties as Record<string, unknown>).volume).toBe(5); // unchanged

    expect(staleEdge).toBeDefined();
    expect((staleEdge!.properties as Record<string, unknown>).volume).toBe(3 - TRADE_ROUTE_DECAY_RATE);
  });

  // ── Fail-soft: missing endpoint ─────────────────────────────────────────

  it('does not crash when an endpoint node is removed after edge was created', () => {
    // Add both nodes first (WorldGraph enforces referential integrity at addEdge time)
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.gone', type: 'actor', name: 'Gone', properties: {} });
    graph.addEdge({
      id: 'route.orphan',
      source: 'actor.a',
      target: 'actor.gone',
      type: 'trades_with',
      properties: { volume: 3, lastTraded: 0, established: 0 },
    });
    // Simulate endpoint removal after route was established
    graph.removeNode('actor.gone');

    expect(() => {
      phaseTradeRouteDecay(makeState(graph, TRADE_ROUTE_FRESHNESS_WINDOW + 2));
    }).not.toThrow();
  });
});

// ─── Constants contract ────────────────────────────────────────────────────

describe('tradeRoute decay constants', () => {
  it('TRADE_ROUTE_FRESHNESS_WINDOW is >= 1', () => {
    expect(TRADE_ROUTE_FRESHNESS_WINDOW).toBeGreaterThanOrEqual(1);
  });

  it('TRADE_ROUTE_DECAY_RATE is less than TRADE_ROUTE_MAX_VOLUME (routes survive multiple ticks)', () => {
    expect(TRADE_ROUTE_DECAY_RATE).toBeLessThan(TRADE_ROUTE_MAX_VOLUME);
  });
});
