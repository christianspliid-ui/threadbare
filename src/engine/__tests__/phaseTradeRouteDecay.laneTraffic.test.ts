/**
 * THR-1636 S1 — lanes that carry.
 *
 * A lane whose two ends are standing settlements with uncursed roads is `carrying`
 * and never decays; a blockaded lane is `suspended` and never dissolves; anything
 * else is `idle` and decays on the old terms. Volume steps one per settle tick
 * toward the lane's traffic level. The kill switch restores the old behaviour.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseTradeRouteDecay } from '../phaseTradeRouteDecay';
import {
  laneTraffic,
  laneTrafficLevel,
  setLaneTrafficEnabledOverride,
  LANE_TRAFFIC_BASE_VOLUME,
  LANE_TRAFFIC_MAX_VOLUME,
  LANE_TRAFFIC_SETTLE_INTERVAL_TICKS,
  TRADE_ROUTE_FRESHNESS_WINDOW,
} from '../tradeRoute';
import { buildRouteTooltipsByHex } from '../tradeRouteMarkers';
import type { GameState } from '../../types/gameState';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';

function makeState(graph: WorldGraph, tick: number): GameState {
  return {
    tick, cycle: 0, seed: 42, graph, phase: 'playing',
    tickEvents: [], recentEvents: [], chronicleEntries: [],
  } as unknown as GameState;
}

function town(graph: WorldGraph, id: string, subtype = 'town', extra: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'location', name: id, properties: { locationSubtype: subtype, hexCol: id.length, hexRow: 1, ...extra } });
}

function lane(graph: WorldGraph, props: Record<string, unknown> = {}): void {
  graph.addEdge({
    id: 'lane.1', source: 'loc.a', target: 'loc.b', type: 'trades_with',
    properties: { volume: 1, establishedTick: 0, lastTraded: 0, threatened: false, ...props },
  });
}

/** Run the phase for ticks 1..n, one call per tick. */
function runTo(graph: WorldGraph, n: number): void {
  for (let t = 1; t <= n; t++) phaseTradeRouteDecay(makeState(graph, t));
}

describe('laneTraffic (THR-1636)', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = new WorldGraph(); });

  it('carries between two standing settlements', () => {
    town(graph, 'loc.a', 'capital'); town(graph, 'loc.b', 'hamlet'); lane(graph);
    expect(laneTraffic(graph, graph.getEdge('lane.1')!, 10)).toBe('carrying');
  });

  it('a Place end resolves up to its settlement', () => {
    town(graph, 'loc.a'); town(graph, 'loc.b');
    graph.addNode({ id: 'place.b', type: 'location', name: 'Market', properties: { parentLocationId: 'loc.b' } });
    graph.addEdge({ id: 'lane.1', source: 'loc.a', target: 'place.b', type: 'trades_with', properties: { volume: 1 } });
    expect(laneTraffic(graph, graph.getEdge('lane.1')!, 10)).toBe('carrying');
  });

  it('is idle when an end is razed (reads ruins) or missing', () => {
    town(graph, 'loc.a'); town(graph, 'loc.b', 'ruins'); lane(graph);
    expect(laneTraffic(graph, graph.getEdge('lane.1')!, 10)).toBe('idle');
  });

  it('is idle while either end has cursed roads, and carries again once the curse lapses', () => {
    town(graph, 'loc.a'); town(graph, 'loc.b', 'town', { routesCursedUntilTick: 20 }); lane(graph);
    expect(laneTraffic(graph, graph.getEdge('lane.1')!, 10)).toBe('idle');
    expect(laneTraffic(graph, graph.getEdge('lane.1')!, 20)).toBe('carrying');
  });

  it('is suspended while blockaded and threatened; carries once the threat clears', () => {
    town(graph, 'loc.a'); town(graph, 'loc.b'); lane(graph, { threatened: true, blockadedBy: 'actor.x' });
    expect(laneTraffic(graph, graph.getEdge('lane.1')!, 10)).toBe('suspended');
    graph.getEdge('lane.1')!.properties.threatened = false;
    expect(laneTraffic(graph, graph.getEdge('lane.1')!, 10)).toBe('carrying');
  });

  it('traffic level: base with no balance, penalised when threatened, clamped to [1, MAX]', () => {
    expect(laneTrafficLevel({}, {}, false)).toBe(LANE_TRAFFIC_BASE_VOLUME);
    expect(laneTrafficLevel({}, {}, true)).toBe(LANE_TRAFFIC_BASE_VOLUME - 1);
    expect(laneTrafficLevel({}, {}, false)).toBeLessThanOrEqual(LANE_TRAFFIC_MAX_VOLUME);
    expect(laneTrafficLevel({}, {}, true)).toBeGreaterThanOrEqual(1);
  });
});

describe('phaseTradeRouteDecay — lane traffic (THR-1636)', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = new WorldGraph(); enableTracing(); clearTraces(); });
  afterEach(() => { setLaneTrafficEnabledOverride(null); clearTraces(); });

  it('a seeded lane between standing towns outlives tick 36 and settles at its traffic level', () => {
    town(graph, 'loc.a'); town(graph, 'loc.b'); lane(graph);
    runTo(graph, 300);
    const edge = graph.getEdge('lane.1');
    expect(edge).toBeDefined();
    expect(edge!.properties.volume).toBe(LANE_TRAFFIC_BASE_VOLUME);
    expect(edge!.properties.lastTraded).toBe(300);
    expect(getTraces().some(t => t.category === 'trade_route_volume_change' && (t as { cause?: string }).cause === 'traffic')).toBe(true);
  });

  it('with the kill switch off the same lane dies on the old timer', () => {
    setLaneTrafficEnabledOverride(false);
    town(graph, 'loc.a'); town(graph, 'loc.b'); lane(graph);
    runTo(graph, TRADE_ROUTE_FRESHNESS_WINDOW + 2);
    expect(graph.getEdge('lane.1')).toBeUndefined();
    expect(getTraces().some(t => t.category === 'trade_route_upkeep')).toBe(false);
  });

  it('a worked lane above its level sinks back one step per settle tick', () => {
    town(graph, 'loc.a'); town(graph, 'loc.b'); lane(graph, { volume: 6 });
    runTo(graph, LANE_TRAFFIC_SETTLE_INTERVAL_TICKS);
    expect(graph.getEdge('lane.1')!.properties.volume).toBe(5);
    runTo(graph, LANE_TRAFFIC_SETTLE_INTERVAL_TICKS * 2);
    // runTo restarts at tick 1, so settle ticks 12 and 24 fire again: two more steps.
    expect(graph.getEdge('lane.1')!.properties.volume).toBe(3);
  });

  it('a blockaded lane is suspended: never dissolved, and settles toward 1', () => {
    town(graph, 'loc.a'); town(graph, 'loc.b'); lane(graph, { volume: 3, threatened: true, blockadedBy: 'actor.x' });
    runTo(graph, 200);
    const edge = graph.getEdge('lane.1');
    expect(edge).toBeDefined();
    expect(edge!.properties.volume).toBe(1);
  });

  it('a lane whose town was razed is idle and decays away (the traced cause of death)', () => {
    town(graph, 'loc.a'); town(graph, 'loc.b', 'ruins'); lane(graph, { volume: 2 });
    runTo(graph, 20);
    expect(graph.getEdge('lane.1')).toBeUndefined();
    expect(getTraces().some(t => t.category === 'trade_route_dissolved')).toBe(true);
  });

  it('emits one trade_route_upkeep aggregate per settle tick, never per lane', () => {
    town(graph, 'loc.a'); town(graph, 'loc.b'); lane(graph);
    runTo(graph, LANE_TRAFFIC_SETTLE_INTERVAL_TICKS * 2);
    const upkeep = getTraces().filter(t => t.category === 'trade_route_upkeep');
    expect(upkeep).toHaveLength(2);
    expect(upkeep[0]).toMatchObject({ carrying: 1, suspended: 0, idle: 0, steppedUp: 1, steppedDown: 0 });
  });
});

describe('route tooltip traffic word (THR-1636)', () => {
  afterEach(() => setLaneTrafficEnabledOverride(null));

  it('names the class per lane; kill switch off reads carrying', () => {
    const graph = new WorldGraph();
    town(graph, 'loc.a'); town(graph, 'loc.b'); lane(graph, { threatened: true, blockadedBy: 'actor.x' });
    const entries = [...buildRouteTooltipsByHex(graph, 5).values()].flat();
    expect(entries.every(e => e.traffic === 'suspended')).toBe(true);
    setLaneTrafficEnabledOverride(false);
    const off = [...buildRouteTooltipsByHex(graph, 5).values()].flat();
    expect(off.every(e => e.traffic === 'carrying')).toBe(true);
  });
});
