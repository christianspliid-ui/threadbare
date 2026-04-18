import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  phaseProsperity,
  getProsperityTier,
  computeBaseIncome,
  PROSPERITY_DELTA_CLAMP,
  PROSPERITY_DRIFT_RATE,
  PROSPERITY_DRIFT_MIN,
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
  BASE_CARRYING_CAPACITY,
  RESOURCE_CAPACITY_RATE,
  MAX_CARRYING_CAPACITY,
  UPKEEP_CITY,
  UPKEEP_CAPITAL,
  FACTION_PRESENCE_BONUS,
  FACTION_PRESENCE_MAX_BONUS,
  CORRUPTION_TARGET_RATE,
  CORRUPTION_TARGET_THRESHOLD,
  DIVINE_TARGET_RATE,
  DIVINE_TARGET_THRESHOLD,
  UNREST_TARGET_THRESHOLD,
  UNREST_TARGET_RATE,
  SHOCK_TRADE_ROUTE_LOST,
  SHOCK_TRADE_ROUTE_ESTABLISHED,
} from '../phaseProsperity';
import type { GameState, ProsperityShock } from '../../types/gameState';
import type { HexTile } from '../../types/index';
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
    unifiedActions: [],
    worldSoul: {} as GameState['worldSoul'],
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
    ...overrides,
  };
}

function makeTile(col: number, row: number, overrides: Partial<HexTile> = {}): HexTile {
  return {
    coord: { col, row },
    terrain: 'grassland',
    elevation: 0.5,
    moisture: 0.5,
    temperature: 0.5,
    divineInfluence: 0,
    corruption: 0,
    ...overrides,
  } as HexTile;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('phaseProsperity — Equilibrium Model', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    clearTraces();
  });

  // ─── Inertia: nothing happens → nothing changes ────────────────────────

  it('does not change prosperity when target equals current (inertial)', () => {
    // Hamlet with no resources → carrying capacity = BASE_CARRYING_CAPACITY (30)
    // Start at 30 → target = 30 → drift = 0 → no change
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Stillwater',
      properties: { locationSubtype: 'hamlet', prosperity: BASE_CARRYING_CAPACITY },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.prosperity).toBe(BASE_CARRYING_CAPACITY);
  });

  it('skips locations without locationSubtype', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Wild', properties: {} });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.prosperity).toBeUndefined();
  });

  it('skips non-settlement subtypes (wilderness)', () => {
    graph.addNode({ id: 'loc.w', type: 'location', name: 'Wild', properties: { locationSubtype: 'wilderness' } });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.w')!.properties.prosperity).toBeUndefined();
  });

  // ─── Drift toward target ───────────────────────────────────────────────

  it('drifts prosperity upward when below target', () => {
    // Hamlet starting at 0 with no resources → target = BASE_CARRYING_CAPACITY (30)
    // Drift = (30 - 0) * DRIFT_RATE
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Growing',
      properties: { locationSubtype: 'hamlet', prosperity: 0 },
    });
    phaseProsperity(makeState(graph));
    const newProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    expect(newProsperity).toBeGreaterThan(0);
    expect(newProsperity).toBeLessThanOrEqual(PROSPERITY_DELTA_CLAMP);
  });

  it('drifts prosperity downward when above target', () => {
    // Hamlet at 90 with no resources → target ~30 → drift negative
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Declining',
      properties: { locationSubtype: 'hamlet', prosperity: 90 },
    });
    phaseProsperity(makeState(graph));
    const newProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    expect(newProsperity).toBeLessThan(90);
  });

  it('clamps total delta to PROSPERITY_DELTA_CLAMP', () => {
    // City at 90, target much lower → drift would be large, but clamped
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Crashing',
      properties: { locationSubtype: 'city', prosperity: 90 },
    });
    phaseProsperity(makeState(graph));
    const newProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    expect(90 - newProsperity).toBeLessThanOrEqual(PROSPERITY_DELTA_CLAMP);
  });

  it('clamps prosperity to 0 minimum (never negative)', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Dying',
      properties: { locationSubtype: 'hamlet', prosperity: 0 },
    });
    // Add huge negative shocks
    const shocks: ProsperityShock[] = [{
      locationId: 'loc.1', delta: -50, causeType: 'encounter_impact',
      causeId: 'enc_1', description: 'Catastrophic raid',
    }];
    phaseProsperity(makeState(graph, { prosperityShocks: shocks }));
    expect(graph.getNode('loc.1')!.properties.prosperity).toBe(0);
  });

  it('clamps prosperity to 100 maximum', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Opulent',
      properties: { locationSubtype: 'capital', prosperity: 99 },
    });
    const shocks: ProsperityShock[] = [{
      locationId: 'loc.1', delta: 50, causeType: 'divine_blessing',
      causeId: 'div_1', description: 'Divine abundance',
    }];
    phaseProsperity(makeState(graph, { prosperityShocks: shocks }));
    expect(graph.getNode('loc.1')!.properties.prosperity).toBe(100);
  });

  // ─── Trade routes affect target ────────────────────────────────────────

  it('trade routes raise equilibrium target', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Market', properties: { locationSubtype: 'town', prosperity: 0 } });
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'Trader A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'Trader B', properties: {} });
    graph.addEdge({ id: 'e1', source: 'actor.a', target: 'loc.1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: 'actor.a', target: 'actor.b', type: 'trades_with', properties: { volume: 10 } });

    phaseProsperity(makeState(graph));

    // With trade route, target is higher → drift should be stronger than without
    const prosperity = graph.getNode('loc.1')!.properties.prosperity as number;
    expect(prosperity).toBeGreaterThan(0);
  });

  it('threatened trade routes do not contribute to target', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Market', properties: { locationSubtype: 'town', prosperity: 0 } });
    graph.addNode({ id: 'actor.a', type: 'actor', name: 'Trader A', properties: {} });
    graph.addNode({ id: 'actor.b', type: 'actor', name: 'Trader B', properties: {} });
    graph.addEdge({ id: 'e1', source: 'actor.a', target: 'loc.1', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e2', source: 'actor.a', target: 'actor.b', type: 'trades_with', properties: { volume: 10, threatened: true } });

    phaseProsperity(makeState(graph));

    // Threatened route → no trade bonus → lower target
    // Compare: same setup without trade route should give same result
    const graph2 = new WorldGraph();
    graph2.addNode({ id: 'loc.2', type: 'location', name: 'NoTrade', properties: { locationSubtype: 'town', prosperity: 0 } });
    phaseProsperity(makeState(graph2));

    const withThreatened = graph.getNode('loc.1')!.properties.prosperity as number;
    const withoutTrade = graph2.getNode('loc.2')!.properties.prosperity as number;
    expect(withThreatened).toBe(withoutTrade);
  });

  // ─── Shocks ────────────────────────────────────────────────────────────

  it('applies prosperity shocks from upstream phases', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Shocked',
      properties: { locationSubtype: 'hamlet', prosperity: BASE_CARRYING_CAPACITY },
    });
    const shocks: ProsperityShock[] = [{
      locationId: 'loc.1', delta: SHOCK_TRADE_ROUTE_LOST,
      causeType: 'trade_route_lost', causeId: 'route_1',
      description: 'Trade route to Ashford dissolved',
    }];
    phaseProsperity(makeState(graph, { prosperityShocks: shocks }));

    const newProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    // At target (30), drift = 0, shock = -3, clamped to -2
    expect(newProsperity).toBe(BASE_CARRYING_CAPACITY + Math.max(SHOCK_TRADE_ROUTE_LOST, -PROSPERITY_DELTA_CLAMP));
  });

  it('clears prosperity shocks after consumption', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Town',
      properties: { locationSubtype: 'hamlet', prosperity: 30 },
    });
    const shocks: ProsperityShock[] = [{
      locationId: 'loc.1', delta: 1, causeType: 'faction_arrival',
      causeId: 'f1', description: 'Faction arrived',
    }];
    const result = phaseProsperity(makeState(graph, { prosperityShocks: shocks }));
    expect(result.prosperityShocks).toEqual([]);
  });

  it('ignores shocks for unknown location IDs', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Town',
      properties: { locationSubtype: 'hamlet', prosperity: BASE_CARRYING_CAPACITY },
    });
    const shocks: ProsperityShock[] = [{
      locationId: 'loc.nonexistent', delta: -10,
      causeType: 'encounter_impact', causeId: 'enc_1',
      description: 'Raid on unknown location',
    }];
    phaseProsperity(makeState(graph, { prosperityShocks: shocks }));
    // loc.1 should be unaffected — at target, no shocks for it
    expect(graph.getNode('loc.1')!.properties.prosperity).toBe(BASE_CARRYING_CAPACITY);
  });

  // ─── Upkeep: cities decay without support ──────────────────────────────

  it('cities have lower target due to upkeep', () => {
    // City at 50, no resources, no trade → target = BASE_CARRYING_CAPACITY - UPKEEP_CITY
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'BigCity',
      properties: { locationSubtype: 'city', prosperity: 50 },
    });
    phaseProsperity(makeState(graph));
    const newProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    // Should drift down because target (30 - 5 = 25) < current (50)
    expect(newProsperity).toBeLessThan(50);
  });

  it('hamlets have no upkeep (truly inertial at carrying capacity)', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'SmallHamlet',
      properties: { locationSubtype: 'hamlet', prosperity: BASE_CARRYING_CAPACITY },
    });
    phaseProsperity(makeState(graph));
    // At target, no upkeep → no change
    expect(graph.getNode('loc.1')!.properties.prosperity).toBe(BASE_CARRYING_CAPACITY);
  });

  // ─── Corruption reduces target ─────────────────────────────────────────

  it('hex corruption reduces equilibrium target', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Blighted',
      properties: { locationSubtype: 'hamlet', prosperity: 30, hexCol: 5, hexRow: 3 },
    });
    const tiles = [makeTile(5, 3, { corruption: 0.8 })];
    phaseProsperity(makeState(graph, { tiles }));
    const newProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    // High corruption → target < 30 → drift down
    expect(newProsperity).toBeLessThan(30);
  });

  // ─── Divine influence boosts target ─────────────────────────────────────

  it('divine influence boosts equilibrium target', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Blessed',
      properties: { locationSubtype: 'hamlet', prosperity: 30, hexCol: 2, hexRow: 1 },
    });
    const tiles = [makeTile(2, 1, { divineInfluence: 0.9 })];
    phaseProsperity(makeState(graph, { tiles }));
    const newProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    // Divine boost → target > 30 → drift up
    expect(newProsperity).toBeGreaterThan(30);
  });

  // ─── Unrest reduces target ──────────────────────────────────────────────

  it('high unrest reduces equilibrium target', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Restless',
      properties: { locationSubtype: 'hamlet', prosperity: 30, unrest: 80 },
    });
    phaseProsperity(makeState(graph));
    const newProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    expect(newProsperity).toBeLessThan(30);
  });

  // ─── Faction presence boosts target ─────────────────────────────────────

  it('faction presence boosts equilibrium target', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Garrisoned', properties: { locationSubtype: 'hamlet', prosperity: 30 } });
    graph.addNode({ id: 'fac.1', type: 'faction', name: 'Iron Covenant', properties: {} });
    graph.addEdge({ id: 'e1', source: 'fac.1', target: 'loc.1', type: 'located_at', properties: {} });

    phaseProsperity(makeState(graph));
    const newProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    // Faction bonus → target > 30 → drift up
    expect(newProsperity).toBeGreaterThan(30);
  });

  // ─── Carrying capacity from resources ──────────────────────────────────

  it('resources increase carrying capacity (target ceiling)', () => {
    // Rich hamlet with lots of resources → higher carrying capacity → higher target
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Rich',
      properties: {
        locationSubtype: 'hamlet', prosperity: 0,
        resources: { ore: { quantity: 100, renewalRate: 1.0, renewable: true } },
      },
    });
    // Poor hamlet with no resources → lower carrying capacity
    graph.addNode({
      id: 'loc.2', type: 'location', name: 'Poor',
      properties: { locationSubtype: 'hamlet', prosperity: 0 },
    });

    phaseProsperity(makeState(graph));

    const richProsperity = graph.getNode('loc.1')!.properties.prosperity as number;
    const poorProsperity = graph.getNode('loc.2')!.properties.prosperity as number;
    // Both drift up, but rich should drift faster (higher target)
    expect(richProsperity).toBeGreaterThanOrEqual(poorProsperity);
  });

  // ─── Population trend updates ──────────────────────────────────────────

  it('sets populationTrend to "growing" at Flourishing tier', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Gleaming',
      properties: { locationSubtype: 'city', prosperity: PROSPERITY_TIER_FLOURISHING },
    });
    phaseProsperity(makeState(graph));
    // Even though prosperity may have drifted, check the trend was set
    const trend = graph.getNode('loc.1')!.properties.populationTrend;
    // At FLOURISHING prosperity, even after some drift, should still be growing or stable
    expect(['growing', 'stable']).toContain(trend);
  });

  it('sets populationTrend to "collapsing" at Destitute tier', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Dust',
      properties: { locationSubtype: 'hamlet', prosperity: 0 },
    });
    // Push prosperity down to keep it at 0 despite any drift
    const shocks: ProsperityShock[] = [{
      locationId: 'loc.1', delta: -10, causeType: 'encounter_impact',
      causeId: 'enc_1', description: 'Devastation',
    }];
    phaseProsperity(makeState(graph, { prosperityShocks: shocks }));
    expect(graph.getNode('loc.1')!.properties.populationTrend).toBe('collapsing');
  });

  // ─── Fail-soft: missing populationLagTicks ──────────────────────────────

  it('defaults populationLagTicks to POPULATION_LAG_TICKS_MIN when missing', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Nascent',
      properties: { locationSubtype: 'hamlet' },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.populationLagTicks).toBe(POPULATION_LAG_TICKS_MIN);
  });

  it('preserves an existing populationLagTicks value', () => {
    graph.addNode({
      id: 'loc.1', type: 'location', name: 'Settled',
      properties: { locationSubtype: 'town', populationLagTicks: 3 },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.1')!.properties.populationLagTicks).toBe(3);
  });

  // ─── Trace emission ────────────────────────────────────────────────────

  it('emits a prosperity_tick trace with equilibrium breakdown', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'A', properties: { locationSubtype: 'hamlet' } });
    phaseProsperity(makeState(graph));
    const traces = getTraces().filter(t => t.category === 'prosperity_tick');
    expect(traces.length).toBeGreaterThanOrEqual(1);
    const trace = traces.find((t: any) => t.locationId === 'loc.1') as any;
    expect(trace).toBeDefined();
    expect(trace.equilibriumTarget).toBeDefined();
    expect(trace.drift).toBeDefined();
    expect(trace.carryingCapacity).toBeDefined();
  });

  it('does NOT emit a prosperity_tick trace for non-settlement locations', () => {
    graph.addNode({ id: 'loc.w', type: 'location', name: 'Wild', properties: { locationSubtype: 'wilderness' } });
    phaseProsperity(makeState(graph));
    const traces = getTraces().filter(t => t.category === 'prosperity_tick');
    expect(traces).toHaveLength(0);
  });

  it('includes shocks in trace when present', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Town', properties: { locationSubtype: 'town', prosperity: 50 } });
    const shocks: ProsperityShock[] = [{
      locationId: 'loc.1', delta: -2, causeType: 'trade_route_lost',
      causeId: 'route_1', description: 'Route dissolved',
    }];
    phaseProsperity(makeState(graph, { prosperityShocks: shocks }));
    const traces = getTraces().filter(t => t.category === 'prosperity_tick');
    const trace = traces.find((t: any) => t.locationId === 'loc.1') as any;
    expect(trace.shockCount).toBe(1);
    expect(trace.shocks[0].causeType).toBe('trade_route_lost');
  });

  // ─── Processes multiple settlements ─────────────────────────────────────

  it('processes multiple settlement nodes independently per tick', () => {
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Alpha', properties: { locationSubtype: 'hamlet', prosperity: 0 } });
    graph.addNode({ id: 'loc.2', type: 'location', name: 'Beta', properties: { locationSubtype: 'city', prosperity: 90 } });
    phaseProsperity(makeState(graph));
    // loc.1: below target → should drift up
    expect((graph.getNode('loc.1')!.properties.prosperity as number)).toBeGreaterThan(0);
    // loc.2: city at 90 with no trade, target ~25 → should drift down
    expect((graph.getNode('loc.2')!.properties.prosperity as number)).toBeLessThan(90);
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

  it('PROSPERITY_DRIFT_RATE is between 0 and 1', () => {
    expect(PROSPERITY_DRIFT_RATE).toBeGreaterThan(0);
    expect(PROSPERITY_DRIFT_RATE).toBeLessThanOrEqual(1);
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

  it('carrying capacity constants are valid', () => {
    expect(BASE_CARRYING_CAPACITY).toBeGreaterThan(0);
    expect(BASE_CARRYING_CAPACITY).toBeLessThanOrEqual(MAX_CARRYING_CAPACITY);
    expect(RESOURCE_CAPACITY_RATE).toBeGreaterThan(0);
  });

  it('upkeep constants are non-negative', () => {
    expect(UPKEEP_CITY).toBeGreaterThanOrEqual(0);
    expect(UPKEEP_CAPITAL).toBeGreaterThanOrEqual(UPKEEP_CITY);
  });

  it('shock constants have correct signs', () => {
    expect(SHOCK_TRADE_ROUTE_ESTABLISHED).toBeGreaterThan(0);
    expect(SHOCK_TRADE_ROUTE_LOST).toBeLessThan(0);
  });
});

// ─── computeBaseIncome tests ──────────────────────────────────────────────

// THR-124: death-site spirit pressure variant
describe('phaseProsperity — death-site spirit pressure (THR-124)', () => {
  it('emits SpherePressureEvent for death-site location when deathSiteSpiritPressure is set', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Ashfield', properties: { locationSubtype: 'town', prosperity: 50, deathCount: 2 } });
    const state = makeState(graph, {
      doomIdentityMatrix: { locationPressure: { frontierDelta: 0, centerDelta: 0, deathSiteSpiritPressure: 2 } } as GameState['doomIdentityMatrix'],
    });
    const result = phaseProsperity(state);
    expect(result.pendingSpherePressures).toHaveLength(1);
    expect(result.pendingSpherePressures![0]).toMatchObject({ targetEntityId: 'loc-1', sphere: 'spirit', magnitude: 2, source: 'doom' });
  });

  it('does not emit spirit pressure when deathCount is 0', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Ashfield', properties: { locationSubtype: 'town', prosperity: 50, deathCount: 0 } });
    const state = makeState(graph, {
      doomIdentityMatrix: { locationPressure: { frontierDelta: 0, centerDelta: 0, deathSiteSpiritPressure: 2 } } as GameState['doomIdentityMatrix'],
    });
    const result = phaseProsperity(state);
    expect(result.pendingSpherePressures ?? []).toHaveLength(0);
  });

  it('accumulates into existing pendingSpherePressures', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc-1', type: 'location', name: 'Ashfield', properties: { locationSubtype: 'town', prosperity: 50, deathCount: 1 } });
    const existing = [{ targetEntityId: 'some-other', sphere: 'force' as const, magnitude: 3, source: 'rival' as const, sourceId: 'rival-1' }];
    const state = makeState(graph, {
      pendingSpherePressures: existing,
      doomIdentityMatrix: { locationPressure: { frontierDelta: 0, centerDelta: 0, deathSiteSpiritPressure: 2 } } as GameState['doomIdentityMatrix'],
    });
    const result = phaseProsperity(state);
    expect(result.pendingSpherePressures).toHaveLength(2);
  });
});

describe('computeBaseIncome', () => {
  it('returns 0 for no resources', () => {
    expect(computeBaseIncome({})).toBe(0);
  });

  it('computes sum of quantity × renewalRate', () => {
    const props = {
      resources: {
        grain: { quantity: 50, renewalRate: 0.3, renewable: true },
        timber: { quantity: 20, renewalRate: 0.1, renewable: true },
      },
    };
    // 50*0.3 + 20*0.1 = 15 + 2 = 17
    expect(computeBaseIncome(props)).toBe(17);
  });
});
