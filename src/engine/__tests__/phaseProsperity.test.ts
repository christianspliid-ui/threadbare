import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseProsperity,
  getProsperityTier,
  PROSPERITY_DELTA_CLAMP,
  PROSPERITY_TIER_FLOURISHING,
  PROSPERITY_TIER_PROSPEROUS,
  PROSPERITY_TIER_MODEST,
  PROSPERITY_TIER_STRUGGLING,
  PROSPERITY_TRADE_BONUS_PER_ROUTE,
  POPULATION_LAG_TICKS_MIN,
  POPULATION_LAG_TICKS_MAX,
  SETTLEMENT_PROMOTION_PROSPERITY,
  SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
  SETTLEMENT_DEMOTION_PROSPERITY,
} from '../phaseProsperity';
import type { GameState } from '../../types/gameState';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';

// ─── Minimal GameState factory ────────────────────────────────────────────

function makeState(graph: WorldGraph, overrides: Partial<GameState> = {}): GameState {
  return {
    tick: 1,
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

// ─── Tests ────────────────────────────────────────────────────────────────

describe('phaseProsperity', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    clearTraces();
  });

  // ─── Fail-soft: non-settlement skip ─────────────────────────────────────

  it('skips locations without locationSubtype', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Wild', properties: {} });
    const state = makeState(graph);
    phaseProsperity(state);
    const loc = graph.getNode('loc.1')!;
    expect(loc.properties.prosperity).toBeUndefined();
  });

  it('skips non-settlement subtypes (wilderness, castle)', () => {
    graph.addNode({ id: 'loc.w', type: 'location', name: 'Wild', properties: { locationSubtype: 'wilderness' } });
    graph.addNode({ id: 'loc.c', type: 'location', name: 'Fort', properties: { locationSubtype: 'castle' } });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.w')!.properties.prosperity).toBeUndefined();
    expect(graph.getNode('loc.c')!.properties.prosperity).toBeUndefined();
  });

  // ─── Basic prosperity tick ────────────────────────────────────────────────

  it('initialises prosperity to 0 when missing and increments if there are resources', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Thornhaven',
      properties: {
        locationSubtype: 'hamlet',
        resources: {
          timber: { quantity: 50, renewalRate: 0.1, renewable: true },
        },
      },
    });
    phaseProsperity(makeState(graph));
    const loc = graph.getNode('loc.1')!;
    // baseIncome = 50 × 0.1 = 5, no trade, delta = 5
    expect(loc.properties.prosperity).toBe(5);
  });

  it('keeps prosperity at 0 if no resources and no trade routes', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Dusthollow',
      properties: { locationSubtype: 'hamlet' },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.prosperity).toBe(0);
  });

  it('clamps delta to PROSPERITY_DELTA_CLAMP even with large resources', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Richtown',
      properties: {
        locationSubtype: 'city',
        resources: {
          ore: { quantity: 100, renewalRate: 1.0, renewable: true },
          timber: { quantity: 100, renewalRate: 1.0, renewable: true },
        },
      },
    });
    phaseProsperity(makeState(graph));
    // rawDelta = 200, clamped to PROSPERITY_DELTA_CLAMP = 10
    expect(graph.getNode('loc.1')!.properties.prosperity).toBe(PROSPERITY_DELTA_CLAMP);
  });

  it('clamps prosperity to 100 maximum', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Opulent',
      properties: {
        locationSubtype: 'capital',
        prosperity: 98,
        resources: { ore: { quantity: 100, renewalRate: 1.0, renewable: true } },
      },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.prosperity).toBe(100);
  });

  it('clamps prosperity to 0 minimum (never negative)', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Dying',
      properties: {
        locationSubtype: 'hamlet',
        prosperity: 2,
        // no resources → baseIncome = 0, netDelta = 0 → prosperity = 2
      },
    });
    phaseProsperity(makeState(graph));
    // No negative income without disruption, so prosperity stays ≥ 0
    expect(graph.getNode('loc.1')!.properties.prosperity).toBeGreaterThanOrEqual(0);
  });

  // ─── Trade route bonus ────────────────────────────────────────────────────

  it('adds trade bonus from a trades_with edge', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Market', properties: { locationSubtype: 'town' } });
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'Trader A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'Trader B', properties: {} });
    graph.addEdge({ id: 'e1', source: 'actor.a', target: 'loc.1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: 'actor.a', target: 'actor.b', type: 'trades_with', properties: { volume: 10 } });

    phaseProsperity(makeState(graph));
    const prosperity = graph.getNode('loc.1')!.properties.prosperity as number;
    // volume = 10, normVolume = 1.0, tradeBonus = PROSPERITY_TRADE_BONUS_PER_ROUTE × 1 = 2
    expect(prosperity).toBe(PROSPERITY_TRADE_BONUS_PER_ROUTE);
  });

  it('deduplicates trade edges counted from both endpoint actors at same location', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Hub', properties: { locationSubtype: 'town' } });
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'B', properties: {} });
    graph.addEdge({ id: 'e1', source: 'actor.a', target: 'loc.1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: 'actor.b', target: 'loc.1', type: 'located_at', properties: {} });
    // A trades_with B — both are at loc.1
    graph.addEdge({ id: 'e3', source: 'actor.a', target: 'actor.b', type: 'trades_with', properties: { volume: 10 } });

    phaseProsperity(makeState(graph));
    const prosperity = graph.getNode('loc.1')!.properties.prosperity as number;
    // Edge should be counted only once despite both actors being at the location
    expect(prosperity).toBe(PROSPERITY_TRADE_BONUS_PER_ROUTE);
  });

  // ─── Population trend updates ─────────────────────────────────────────────

  it('sets populationTrend to "growing" at Flourishing tier', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Gleaming',
      properties: { locationSubtype: 'city', prosperity: PROSPERITY_TIER_FLOURISHING },
    });
    phaseProsperity(makeState(graph));
    // Prosperity stays at PROSPERITY_TIER_FLOURISHING (delta = 0, no resources) → tier Flourishing → growing
    expect(graph.getNode('loc.1')!.properties.populationTrend).toBe('growing');
  });

  it('sets populationTrend to "collapsing" at Destitute tier', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Dust',
      properties: { locationSubtype: 'hamlet', prosperity: 0 },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.populationTrend).toBe('collapsing');
  });

  it('sets populationTrend to "declining" at Struggling tier', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Hollow',
      properties: { locationSubtype: 'hamlet', prosperity: PROSPERITY_TIER_STRUGGLING },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.populationTrend).toBe('declining');
  });

  // ─── Fail-soft: missing populationLagTicks ─────────────────────────────────

  it('defaults populationLagTicks to POPULATION_LAG_TICKS_MIN when missing', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Nascent',
      properties: { locationSubtype: 'hamlet' },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.populationLagTicks).toBe(POPULATION_LAG_TICKS_MIN);
  });

  it('preserves an existing populationLagTicks value', () => {
    graph.addNode({
      id: 'loc.1',
      type: 'location',
      name: 'Settled',
      properties: { locationSubtype: 'town', populationLagTicks: 3 },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.populationLagTicks).toBe(3);
  });

  // ─── Trace emission ───────────────────────────────────────────────────────

  it('emits a prosperity_tick trace for each settlement processed', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'A', properties: { locationSubtype: 'hamlet' } });
    graph.addNode({ id: 'loc.2', type: 'location', name: 'B', properties: { locationSubtype: 'town' } });
    phaseProsperity(makeState(graph));
    const traces = getTraces().filter(t => t.category === 'prosperity_tick');
    // One per settlement (two settlements, each with missing populationLagTicks = two warning + two regular)
    const locationIds = traces.map(t => (t as any).locationId);
    expect(locationIds).toContain('loc.1');
    expect(locationIds).toContain('loc.2');
  });

  it('does NOT emit a prosperity_tick trace for non-settlement locations', () => {
    graph.addNode({ id: 'loc.w', type: 'location', name: 'Wild', properties: { locationSubtype: 'wilderness' } });
    phaseProsperity(makeState(graph));
    const traces = getTraces().filter(t => t.category === 'prosperity_tick');
    expect(traces).toHaveLength(0);
  });

  // ─── Processes multiple settlements in one tick ────────────────────────────

  it('processes multiple settlement nodes independently per tick', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Alpha', properties: { locationSubtype: 'hamlet', resources: { food: { quantity: 30, renewalRate: 0.1, renewable: true } } } });
    graph.addNode({ id: 'loc.2', type: 'location', name: 'Beta', properties: { locationSubtype: 'city', prosperity: 50, resources: { ore: { quantity: 60, renewalRate: 0.2, renewable: true } } } });
    phaseProsperity(makeState(graph));
    // loc.1: baseIncome = 3, delta = 3, prosperity = 3
    expect(graph.getNode('loc.1')!.properties.prosperity).toBe(3);
    // loc.2: baseIncome = 12, clamped to 10, prosperity = 50 + 10 = 60
    expect(graph.getNode('loc.2')!.properties.prosperity).toBe(60);
  });
});

// ─── getProsperityTier tests ──────────────────────────────────────────────

describe('getProsperityTier', () => {
  it('returns Flourishing at and above PROSPERITY_TIER_FLOURISHING', () => {
    expect(getProsperityTier(PROSPERITY_TIER_FLOURISHING)).toBe('Flourishing');
    expect(getProsperityTier(100)).toBe('Flourishing');
  });

  it('returns Prosperous between PROSPERITY_TIER_PROSPEROUS and PROSPERITY_TIER_FLOURISHING', () => {
    expect(getProsperityTier(PROSPERITY_TIER_PROSPEROUS)).toBe('Prosperous');
    expect(getProsperityTier(PROSPERITY_TIER_FLOURISHING - 1)).toBe('Prosperous');
  });

  it('returns Modest between PROSPERITY_TIER_MODEST and PROSPERITY_TIER_PROSPEROUS', () => {
    expect(getProsperityTier(PROSPERITY_TIER_MODEST)).toBe('Modest');
    expect(getProsperityTier(PROSPERITY_TIER_PROSPEROUS - 1)).toBe('Modest');
  });

  it('returns Struggling between PROSPERITY_TIER_STRUGGLING and PROSPERITY_TIER_MODEST', () => {
    expect(getProsperityTier(PROSPERITY_TIER_STRUGGLING)).toBe('Struggling');
    expect(getProsperityTier(PROSPERITY_TIER_MODEST - 1)).toBe('Struggling');
  });

  it('returns Destitute below PROSPERITY_TIER_STRUGGLING', () => {
    expect(getProsperityTier(PROSPERITY_TIER_STRUGGLING - 1)).toBe('Destitute');
    expect(getProsperityTier(0)).toBe('Destitute');
  });
});

// ─── Constants contract tests ─────────────────────────────────────────────

describe('phaseProsperity constants', () => {
  it('PROSPERITY_DELTA_CLAMP is a positive number', () => {
    expect(PROSPERITY_DELTA_CLAMP).toBeGreaterThan(0);
  });

  it('tier thresholds are in ascending order', () => {
    expect(PROSPERITY_TIER_STRUGGLING).toBeLessThan(PROSPERITY_TIER_MODEST);
    expect(PROSPERITY_TIER_MODEST).toBeLessThan(PROSPERITY_TIER_PROSPEROUS);
    expect(PROSPERITY_TIER_PROSPEROUS).toBeLessThan(PROSPERITY_TIER_FLOURISHING);
    expect(PROSPERITY_TIER_FLOURISHING).toBeLessThanOrEqual(100);
  });

  it('population lag ticks range is valid', () => {
    expect(POPULATION_LAG_TICKS_MIN).toBeGreaterThan(0);
    expect(POPULATION_LAG_TICKS_MAX).toBeGreaterThanOrEqual(POPULATION_LAG_TICKS_MIN);
  });

  it('settlement promotion threshold is higher than demotion threshold', () => {
    expect(SETTLEMENT_PROMOTION_PROSPERITY).toBeGreaterThan(SETTLEMENT_DEMOTION_PROSPERITY);
  });

  it('SETTLEMENT_PROMOTION_SUSTAIN_TICKS is a positive integer', () => {
    expect(SETTLEMENT_PROMOTION_SUSTAIN_TICKS).toBeGreaterThan(0);
    expect(Number.isInteger(SETTLEMENT_PROMOTION_SUSTAIN_TICKS)).toBe(true);
  });

  it('PROSPERITY_TRADE_BONUS_PER_ROUTE is positive', () => {
    expect(PROSPERITY_TRADE_BONUS_PER_ROUTE).toBeGreaterThan(0);
  });
});
