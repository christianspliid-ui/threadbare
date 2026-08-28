import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseTradeRouteDecay } from '../phaseTradeRouteDecay';
import {
  TRADE_ROUTE_DECAY_RATE,
  TRADE_ROUTE_FRESHNESS_WINDOW,
  TRADE_ROUTE_FOUNDING_GRACE_WINDOW,
  TRADE_ROUTE_MAX_VOLUME,
} from '../tradeRoute';
import { UNDERTAKING_CHECKPOINT_INTERVAL_TICKS } from '../../data/strategic-action-constants';
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
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    phaseTradeRouteDecay(makeState(graph));
    expect(graph.getAllEdges()).toHaveLength(0);
  });

  // ── Fresh route: no decay ───────────────────────────────────────────────

  it('does NOT decay a fresh route (lastTraded within freshness window)', () => {
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.1',
      source: 'loc.a',
      target: 'loc.b',
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
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    const initialVolume = 5;
    graph.addEdge({
      id: 'route.1',
      source: 'loc.a',
      target: 'loc.b',
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
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.1',
      source: 'loc.a',
      target: 'loc.b',
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
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    // Legacy edge with no volume field — readTradeRouteProps defaults to 1
    graph.addEdge({
      id: 'route.1',
      source: 'loc.a',
      target: 'loc.b',
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
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.1',
      source: 'loc.a',
      target: 'loc.b',
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
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.1',
      source: 'loc.a',
      target: 'loc.b',
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
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    graph.addNode({ id: 'loc.c', type: 'location', name: 'C', properties: {} });

    const freshTick = 10;
    const currentTick = freshTick + TRADE_ROUTE_FRESHNESS_WINDOW + 1;

    // Fresh route — should not decay
    graph.addEdge({
      id: 'route.fresh',
      source: 'loc.a',
      target: 'loc.b',
      type: 'trades_with',
      properties: { volume: 5, lastTraded: currentTick, established: 1 },
    });
    // Stale route — should decay
    graph.addEdge({
      id: 'route.stale',
      source: 'loc.b',
      target: 'loc.c',
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
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.gone', type: 'location', name: 'Gone', properties: {} });
    graph.addEdge({
      id: 'route.orphan',
      source: 'loc.a',
      target: 'loc.gone',
      type: 'trades_with',
      properties: { volume: 3, lastTraded: 0, established: 0 },
    });
    // Simulate endpoint removal after route was established
    graph.removeNode('loc.gone');

    expect(() => {
      phaseTradeRouteDecay(makeState(graph, TRADE_ROUTE_FRESHNESS_WINDOW + 2));
    }).not.toThrow();
  });
});

// ─── Founder's grace window (THR-1320) ─────────────────────────────────────
//
// The defect these cover: a route minted by `createTradeRoute` at `volume: 1` with
// nothing in the strategic path ever refreshing `lastTraded` went stale at +6, lost
// its only point of volume on that tick and was removed — so `blockadeRoute` found
// `no_route` every time and the `trade_route` kind's counter-play could never land.

describe('phaseTradeRouteDecay — founder\'s grace (THR-1320)', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    clearTraces();
  });

  /** A route minted the way `createTradeRoute` mints one: volume 1, founder stamped. */
  function addFoundedRoute(establishedTick = 0): void {
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.founded',
      source: 'loc.a',
      target: 'loc.b',
      type: 'trades_with',
      properties: {
        volume: 1,
        establishedTick,
        establishedBy: 'agent.merchant',
        lastTraded: establishedTick,
      },
    });
  }

  const routeStanding = (): boolean => graph.getAllEdges().some(e => e.id === 'route.founded');

  it('the exact tick the defect fired: a founded route still stands where it used to be deleted', () => {
    addFoundedRoute(0);
    // One past the freshness window is where `isRouteStale` first fires, and a
    // volume-1 route dies on that same tick. This is the measured failure.
    phaseTradeRouteDecay(makeState(graph, TRADE_ROUTE_FRESHNESS_WINDOW + 1));
    expect(routeStanding()).toBe(true);
    expect((graph.getAllEdges().find(e => e.id === 'route.founded')!
      .properties as Record<string, unknown>).volume).toBe(1);
  });

  it('stands for the whole grace window, and long enough to be blockaded', () => {
    addFoundedRoute(0);
    for (let tick = 1; tick < TRADE_ROUTE_FOUNDING_GRACE_WINDOW; tick++) {
      phaseTradeRouteDecay(makeState(graph, tick));
    }
    expect(routeStanding()).toBe(true);
  });

  it('decays once the grace window lapses — the window is a delay, not an exemption', () => {
    addFoundedRoute(0);
    phaseTradeRouteDecay(makeState(graph, TRADE_ROUTE_FOUNDING_GRACE_WINDOW));
    expect(routeStanding()).toBe(false);
  });

  it('measures the window from the founding tick, not from tick 0', () => {
    const founded = 40;
    addFoundedRoute(founded);
    phaseTradeRouteDecay(makeState(graph, founded + TRADE_ROUTE_FOUNDING_GRACE_WINDOW - 1));
    expect(routeStanding()).toBe(true);
    phaseTradeRouteDecay(makeState(graph, founded + TRADE_ROUTE_FOUNDING_GRACE_WINDOW));
    expect(routeStanding()).toBe(false);
  });

  // The scope line from the ticket: an unowned route decaying on inactivity is
  // arguably correct and must not be swept up. Falsifies the guard above — if the
  // grace were applied to every route rather than to founded ones, this fails.
  it('grants NO grace to a route with no founder', () => {
    graph.addNode({ id: 'loc.a', type: 'location', name: 'A', properties: {} });
    graph.addNode({ id: 'loc.b', type: 'location', name: 'B', properties: {} });
    graph.addEdge({
      id: 'route.founded', // same id so `routeStanding` reads it
      source: 'loc.a',
      target: 'loc.b',
      type: 'trades_with',
      properties: { volume: 1, establishedTick: 0, lastTraded: 0 },
    });

    phaseTradeRouteDecay(makeState(graph, TRADE_ROUTE_FRESHNESS_WINDOW + 1));
    expect(routeStanding()).toBe(false);
  });

  it('a founded route past its grace still dies on the ordinary freshness rule, not sooner', () => {
    addFoundedRoute(0);
    // Trade on it right as the window lapses: `lastTraded` moves, so the ordinary
    // rule now governs and the route survives its own grace expiry.
    const edge = graph.getAllEdges().find(e => e.id === 'route.founded')!;
    (edge.properties as Record<string, unknown>).lastTraded = TRADE_ROUTE_FOUNDING_GRACE_WINDOW;
    (edge.properties as Record<string, unknown>).volume = 3;

    phaseTradeRouteDecay(makeState(graph, TRADE_ROUTE_FOUNDING_GRACE_WINDOW));
    expect(routeStanding()).toBe(true);
  });
});

// ─── Constants contract ────────────────────────────────────────────────────

describe('tradeRoute decay constants', () => {
  it('TRADE_ROUTE_FRESHNESS_WINDOW is >= 1', () => {
    expect(TRADE_ROUTE_FRESHNESS_WINDOW).toBeGreaterThanOrEqual(1);
  });

  // The reachability contract this ticket exists to hold: the grace has to outlast a
  // warlord noticing the route (one checkpoint interval) plus the blockade project
  // itself, or the counter-play stays unreachable however the constant is spelled.
  it('TRADE_ROUTE_FOUNDING_GRACE_WINDOW outlasts the blockade detect-and-complete cycle', () => {
    const BLOCKADE_PROJECT_DURATION = 4; // strategic_blockade_route.projectDuration
    expect(TRADE_ROUTE_FOUNDING_GRACE_WINDOW).toBeGreaterThan(
      UNDERTAKING_CHECKPOINT_INTERVAL_TICKS + BLOCKADE_PROJECT_DURATION,
    );
  });

  it('TRADE_ROUTE_FOUNDING_GRACE_WINDOW outlasts the freshness window it defers', () => {
    expect(TRADE_ROUTE_FOUNDING_GRACE_WINDOW).toBeGreaterThan(TRADE_ROUTE_FRESHNESS_WINDOW);
  });

  it('TRADE_ROUTE_DECAY_RATE is less than TRADE_ROUTE_MAX_VOLUME (routes survive multiple ticks)', () => {
    expect(TRADE_ROUTE_DECAY_RATE).toBeLessThan(TRADE_ROUTE_MAX_VOLUME);
  });
});
