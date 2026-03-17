import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseSettlementPromotion } from '../phaseSettlementPromotion';
import {
  SETTLEMENT_PROMOTION_PROSPERITY,
  SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
  SETTLEMENT_DEMOTION_PROSPERITY,
} from '../phaseProsperity';
import type { GameState } from '../../types/gameState';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';

// ─── Minimal GameState factory ─────────────────────────────────────────────

function makeState(graph: WorldGraph, tick = 1, overrides: Partial<GameState> = {}): GameState {
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
    ...overrides,
  };
}

function addSettlement(
  graph: WorldGraph,
  id: string,
  subtype: string,
  prosperity: number,
  extraProps: Record<string, unknown> = {},
): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Settlement ${id}`,
    properties: { locationSubtype: subtype, prosperity, ...extraProps },
  });
}

describe('phaseSettlementPromotion', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    clearTraces();
  });

  // ─── Non-settlement skip ────────────────────────────────────────────────

  it('skips locations without locationSubtype', () => {
    graph.addNode({ id: 'loc.wild', type: 'location', name: 'Wilderness', properties: {} });
    const state = makeState(graph);
    phaseSettlementPromotion(state);
    const loc = graph.getNode('loc.wild')!;
    expect(loc.properties.prosperitySustainAboveTicks).toBeUndefined();
  });

  it('skips capital locations (never changes tier)', () => {
    addSettlement(graph, 'loc.cap', 'capital', 100);
    const state = makeState(graph);
    for (let i = 0; i < SETTLEMENT_PROMOTION_SUSTAIN_TICKS + 5; i++) {
      phaseSettlementPromotion({ ...state, tick: i });
    }
    expect(graph.getNode('loc.cap')!.properties.locationSubtype).toBe('capital');
  });

  // ─── Sustain counter increments ─────────────────────────────────────────

  it('increments prosperitySustainAboveTicks when prosperity >= threshold', () => {
    addSettlement(graph, 'loc.hamlet', 'hamlet', SETTLEMENT_PROMOTION_PROSPERITY);
    const state = makeState(graph, 1);
    phaseSettlementPromotion(state);
    expect(graph.getNode('loc.hamlet')!.properties.prosperitySustainAboveTicks).toBe(1);
  });

  it('increments prosperitySustainBelowTicks when prosperity <= demotion threshold', () => {
    addSettlement(graph, 'loc.city', 'city', SETTLEMENT_DEMOTION_PROSPERITY);
    const state = makeState(graph, 1);
    phaseSettlementPromotion(state);
    expect(graph.getNode('loc.city')!.properties.prosperitySustainBelowTicks).toBe(1);
  });

  it('does not change counters on mid-range prosperity', () => {
    const midProsperity = (SETTLEMENT_DEMOTION_PROSPERITY + SETTLEMENT_PROMOTION_PROSPERITY) / 2;
    addSettlement(graph, 'loc.town', 'town', midProsperity, {
      prosperitySustainAboveTicks: 2,
      prosperitySustainBelowTicks: 1,
    });
    const state = makeState(graph, 1);
    phaseSettlementPromotion(state);
    const props = graph.getNode('loc.town')!.properties;
    // Neither should change
    expect(props.prosperitySustainAboveTicks).toBe(2);
    expect(props.prosperitySustainBelowTicks).toBe(1);
  });

  // ─── Promotion logic ────────────────────────────────────────────────────

  it('promotes hamlet to town after sustained high prosperity', () => {
    addSettlement(graph, 'loc.hamlet', 'hamlet', SETTLEMENT_PROMOTION_PROSPERITY, {
      prosperitySustainAboveTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 5);
    const result = phaseSettlementPromotion(state);
    expect(graph.getNode('loc.hamlet')!.properties.locationSubtype).toBe('town');
    // Should emit a chronicle event
    expect(result.tickEvents?.length).toBeGreaterThan(0);
  });

  it('promotes town to city after sustained high prosperity', () => {
    addSettlement(graph, 'loc.town', 'town', SETTLEMENT_PROMOTION_PROSPERITY, {
      prosperitySustainAboveTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 5);
    phaseSettlementPromotion(state);
    expect(graph.getNode('loc.town')!.properties.locationSubtype).toBe('city');
  });

  it('does not promote city beyond city (no city→something higher)', () => {
    addSettlement(graph, 'loc.city', 'city', SETTLEMENT_PROMOTION_PROSPERITY, {
      prosperitySustainAboveTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 5);
    phaseSettlementPromotion(state);
    // city is not in PROMOTION_ELIGIBLE so nothing changes
    expect(graph.getNode('loc.city')!.properties.locationSubtype).toBe('city');
  });

  it('does not promote before threshold is reached', () => {
    addSettlement(graph, 'loc.hamlet', 'hamlet', SETTLEMENT_PROMOTION_PROSPERITY, {
      prosperitySustainAboveTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 2,
    });
    const state = makeState(graph, 1);
    phaseSettlementPromotion(state);
    expect(graph.getNode('loc.hamlet')!.properties.locationSubtype).toBe('hamlet');
  });

  it('resets counters after promotion', () => {
    addSettlement(graph, 'loc.hamlet', 'hamlet', SETTLEMENT_PROMOTION_PROSPERITY, {
      prosperitySustainAboveTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 1);
    phaseSettlementPromotion(state);
    const props = graph.getNode('loc.hamlet')!.properties;
    expect(props.prosperitySustainAboveTicks).toBe(0);
    expect(props.prosperitySustainBelowTicks).toBe(0);
  });

  // ─── Demotion logic ─────────────────────────────────────────────────────

  it('demotes city to town after sustained low prosperity', () => {
    addSettlement(graph, 'loc.city', 'city', SETTLEMENT_DEMOTION_PROSPERITY, {
      prosperitySustainBelowTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 5);
    const result = phaseSettlementPromotion(state);
    expect(graph.getNode('loc.city')!.properties.locationSubtype).toBe('town');
    expect(result.tickEvents?.length).toBeGreaterThan(0);
  });

  it('demotes town to hamlet after sustained low prosperity', () => {
    addSettlement(graph, 'loc.town', 'town', SETTLEMENT_DEMOTION_PROSPERITY, {
      prosperitySustainBelowTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 5);
    phaseSettlementPromotion(state);
    expect(graph.getNode('loc.town')!.properties.locationSubtype).toBe('hamlet');
  });

  it('does not demote hamlet further (hamlet stays hamlet)', () => {
    addSettlement(graph, 'loc.hamlet', 'hamlet', 0, {
      prosperitySustainBelowTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS + 10,
    });
    const state = makeState(graph, 1);
    phaseSettlementPromotion(state);
    expect(graph.getNode('loc.hamlet')!.properties.locationSubtype).toBe('hamlet');
  });

  it('resets counters after demotion', () => {
    addSettlement(graph, 'loc.city', 'city', SETTLEMENT_DEMOTION_PROSPERITY, {
      prosperitySustainBelowTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 1);
    phaseSettlementPromotion(state);
    const props = graph.getNode('loc.city')!.properties;
    expect(props.prosperitySustainAboveTicks).toBe(0);
    expect(props.prosperitySustainBelowTicks).toBe(0);
  });

  // ─── Trace emission ─────────────────────────────────────────────────────

  it('emits settlement_tier_change trace on promotion', () => {
    addSettlement(graph, 'loc.hamlet', 'hamlet', SETTLEMENT_PROMOTION_PROSPERITY, {
      prosperitySustainAboveTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 1);
    phaseSettlementPromotion(state);
    const traces = getTraces().filter(t => t.category === 'settlement_tier_change');
    expect(traces.length).toBe(1);
    const trace = traces[0] as any;
    expect(trace.direction).toBe('promotion');
    expect(trace.previousSubtype).toBe('hamlet');
    expect(trace.newSubtype).toBe('town');
  });

  it('emits settlement_tier_change trace on demotion', () => {
    addSettlement(graph, 'loc.city', 'city', SETTLEMENT_DEMOTION_PROSPERITY, {
      prosperitySustainBelowTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 1);
    phaseSettlementPromotion(state);
    const traces = getTraces().filter(t => t.category === 'settlement_tier_change');
    expect(traces.length).toBe(1);
    const trace = traces[0] as any;
    expect(trace.direction).toBe('demotion');
    expect(trace.previousSubtype).toBe('city');
    expect(trace.newSubtype).toBe('town');
  });

  // ─── Chronicle event ────────────────────────────────────────────────────

  it('chronicle events have significance 0.9', () => {
    addSettlement(graph, 'loc.hamlet', 'hamlet', SETTLEMENT_PROMOTION_PROSPERITY, {
      prosperitySustainAboveTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 1);
    const result = phaseSettlementPromotion(state);
    expect(result.tickEvents?.every(e => e.significance === 0.9)).toBe(true);
  });

  it('promotion event message mentions old and new subtype', () => {
    addSettlement(graph, 'loc.hamlet', 'hamlet', SETTLEMENT_PROMOTION_PROSPERITY, {
      prosperitySustainAboveTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS - 1,
    });
    const state = makeState(graph, 1);
    const result = phaseSettlementPromotion(state);
    const msg = result.tickEvents?.[0]?.message ?? '';
    expect(msg).toContain('hamlet');
    expect(msg).toContain('town');
  });

  // ─── Fail-soft ──────────────────────────────────────────────────────────

  it('does not crash when prosperity property is missing', () => {
    graph.addNode({
      id: 'loc.missing',
      type: 'location',
      name: 'Missing Prosperity',
      properties: { locationSubtype: 'hamlet' },
    });
    const state = makeState(graph, 1);
    expect(() => phaseSettlementPromotion(state)).not.toThrow();
  });

  it('SETTLEMENT_PROMOTION_SUSTAIN_TICKS is a positive integer >= 2', () => {
    expect(SETTLEMENT_PROMOTION_SUSTAIN_TICKS).toBeGreaterThanOrEqual(2);
    expect(Number.isInteger(SETTLEMENT_PROMOTION_SUSTAIN_TICKS)).toBe(true);
  });

  it('SETTLEMENT_PROMOTION_PROSPERITY > SETTLEMENT_DEMOTION_PROSPERITY', () => {
    expect(SETTLEMENT_PROMOTION_PROSPERITY).toBeGreaterThan(SETTLEMENT_DEMOTION_PROSPERITY);
  });
});
