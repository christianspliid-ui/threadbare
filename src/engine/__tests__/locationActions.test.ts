/**
 * Tests for the THR-401 location action expansion.
 *
 * Coverage:
 *  - Property-label derivation (populationHealth 5-tier, divinePresence 3-tier).
 *  - phaseProsperity reads new properties: dampener, presence bonus, cursed routes.
 *  - phaseProsperity clears expired countdown properties.
 *  - phaseUnrest bleeds unrest upward when population health is low.
 *  - phaseSettlementPromotion suppresses promotion while sickened.
 *  - Natural recovery + decay for populationHealth and divinePresence.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseProsperity, BASE_CARRYING_CAPACITY } from '../phaseProsperity';
import { phaseUnrest, UNREST_DECAY_RATE } from '../phaseUnrest';
import { phaseSettlementPromotion } from '../phaseSettlementPromotion';
import { derivePopulationHealthLabel, deriveDivinePresenceLabel } from '../retinue';
import {
  LOC_HEALTH_DEFAULT_BASELINE,
  LOC_HEALTH_RECOVERY_RATE,
  LOC_HEALTH_DAMPENER_THRESHOLD,
  LOC_HEALTH_UNREST_BLEED,
  LOC_PRESENCE_DECAY_RATE,
  LOC_PRESENCE_PROSPERITY_BONUS,
  LOC_PRESENCE_PROSPERITY_THRESHOLD,
  LOC_CURSE_ROADS_DURATION_TICKS,
  LOC_SICKEN_WELLS_DURATION_TICKS,
} from '../../data/location-action-constants';
import type { GameState } from '../../types/gameState';
import type { HexTile } from '../../types/index';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';

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

describe('THR-401 — population health label', () => {
  it('returns null when score is absent', () => {
    expect(derivePopulationHealthLabel(undefined)).toBe(null);
    expect(derivePopulationHealthLabel(null)).toBe(null);
    expect(derivePopulationHealthLabel('80')).toBe(null);
  });

  it('maps the five health bands', () => {
    expect(derivePopulationHealthLabel(95)).toBe('Thriving');
    expect(derivePopulationHealthLabel(80)).toBe('Well');
    expect(derivePopulationHealthLabel(60)).toBe('Steady');
    expect(derivePopulationHealthLabel(40)).toBe('Failing');
    expect(derivePopulationHealthLabel(10)).toBe('Wasting');
  });
});

describe('THR-401 — divine presence label', () => {
  it('returns null below 0.1', () => {
    expect(deriveDivinePresenceLabel(0)).toBe(null);
    expect(deriveDivinePresenceLabel(0.05)).toBe(null);
    expect(deriveDivinePresenceLabel(undefined)).toBe(null);
  });

  it('maps the three presence tiers', () => {
    expect(deriveDivinePresenceLabel(0.2)).toBe('Touched by the divine');
    expect(deriveDivinePresenceLabel(0.5)).toBe('A presence here');
    expect(deriveDivinePresenceLabel(0.9)).toBe('Sacred ground');
  });
});

describe('THR-401 — phaseProsperity property reads', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    clearTraces();
  });

  it('low populationHealth dampens prosperity target', () => {
    // Two identical hamlets, one with low health: low-health hamlet should
    // drift toward a lower target this tick.
    graph.addNode({
      id: 'loc.healthy', type: 'location', name: 'Healthy',
      properties: { locationSubtype: 'hamlet', prosperity: BASE_CARRYING_CAPACITY, populationHealth: 80 },
    });
    graph.addNode({
      id: 'loc.sick', type: 'location', name: 'Sick',
      properties: { locationSubtype: 'hamlet', prosperity: BASE_CARRYING_CAPACITY, populationHealth: 20 },
    });
    phaseProsperity(makeState(graph));
    const healthy = graph.getNode('loc.healthy')!.properties.prosperity as number;
    const sick = graph.getNode('loc.sick')!.properties.prosperity as number;
    expect(sick).toBeLessThan(healthy);
  });

  it('divinePresence above threshold adds a flat prosperity bonus', () => {
    graph.addNode({
      id: 'loc.bare', type: 'location', name: 'Bare',
      properties: { locationSubtype: 'hamlet', prosperity: 0 },
    });
    graph.addNode({
      id: 'loc.touched', type: 'location', name: 'Touched',
      properties: {
        locationSubtype: 'hamlet',
        prosperity: 0,
        divinePresence: LOC_PRESENCE_PROSPERITY_THRESHOLD,
      },
    });
    phaseProsperity(makeState(graph));
    const bare = graph.getNode('loc.bare')!.properties.prosperity as number;
    const touched = graph.getNode('loc.touched')!.properties.prosperity as number;
    // Both drift upward toward equilibrium; the touched one drifts further
    // because target is higher by LOC_PRESENCE_PROSPERITY_BONUS.
    expect(touched).toBeGreaterThanOrEqual(bare);
  });

  it('clears expired countdown properties and emits location_countdown_expired', () => {
    graph.addNode({
      id: 'loc.expired', type: 'location', name: 'Expired',
      properties: {
        locationSubtype: 'hamlet',
        prosperity: BASE_CARRYING_CAPACITY,
        wellsSickenedUntilTick: 1,
      },
    });
    phaseProsperity(makeState(graph, { tick: 5 }));
    expect(graph.getNode('loc.expired')!.properties.wellsSickenedUntilTick).toBeUndefined();
    const expired = getTraces().filter(t => t.category === 'location_countdown_expired');
    expect(expired.length).toBe(1);
  });

  it('preserves active countdown properties', () => {
    graph.addNode({
      id: 'loc.cursed', type: 'location', name: 'Cursed',
      properties: {
        locationSubtype: 'hamlet',
        prosperity: BASE_CARRYING_CAPACITY,
        routesCursedUntilTick: 100,
      },
    });
    phaseProsperity(makeState(graph, { tick: 5 }));
    expect(graph.getNode('loc.cursed')!.properties.routesCursedUntilTick).toBe(100);
  });
});

describe('THR-401 — phaseProsperity natural recovery and decay', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => clearTraces());

  it('populationHealth recovers by LOC_HEALTH_RECOVERY_RATE toward baseline', () => {
    graph.addNode({
      id: 'loc.recover', type: 'location', name: 'Recovering',
      properties: { locationSubtype: 'hamlet', prosperity: 30, populationHealth: 40 },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.recover')!.properties.populationHealth).toBe(40 + LOC_HEALTH_RECOVERY_RATE);
  });

  it('populationHealth above baseline decays toward baseline', () => {
    graph.addNode({
      id: 'loc.boosted', type: 'location', name: 'Boosted',
      properties: { locationSubtype: 'hamlet', prosperity: 30, populationHealth: 95 },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.boosted')!.properties.populationHealth).toBe(95 - LOC_HEALTH_RECOVERY_RATE);
  });

  it('divinePresence decays by LOC_PRESENCE_DECAY_RATE toward 0', () => {
    graph.addNode({
      id: 'loc.fading', type: 'location', name: 'Fading',
      properties: { locationSubtype: 'hamlet', prosperity: 30, divinePresence: 0.5 },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.fading')!.properties.divinePresence).toBeCloseTo(0.5 - LOC_PRESENCE_DECAY_RATE);
  });

  it('does not move populationHealth when already at baseline', () => {
    graph.addNode({
      id: 'loc.stable', type: 'location', name: 'Stable',
      properties: { locationSubtype: 'hamlet', prosperity: 30, populationHealth: LOC_HEALTH_DEFAULT_BASELINE },
    });
    phaseProsperity(makeState(graph));
    expect(graph.getNode('loc.stable')!.properties.populationHealth).toBe(LOC_HEALTH_DEFAULT_BASELINE);
  });
});

describe('THR-401 — phaseUnrest bleed from low population health', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => clearTraces());

  it('bleeds unrest upward when populationHealth is below threshold', () => {
    graph.addNode({
      id: 'loc.suffering', type: 'location', name: 'Suffering',
      properties: { locationSubtype: 'hamlet', unrest: 10, populationHealth: 20 },
    });
    phaseUnrest(makeState(graph));
    const newUnrest = graph.getNode('loc.suffering')!.properties.unrest as number;
    // Old behavior: decay -1. New: decay -1 + bleed +1 = net change 0.
    expect(newUnrest).toBe(10 - UNREST_DECAY_RATE + LOC_HEALTH_UNREST_BLEED);
  });

  it('does not bleed when populationHealth is above threshold', () => {
    graph.addNode({
      id: 'loc.well', type: 'location', name: 'Well',
      properties: { locationSubtype: 'hamlet', unrest: 10, populationHealth: 80 },
    });
    phaseUnrest(makeState(graph));
    const newUnrest = graph.getNode('loc.well')!.properties.unrest as number;
    expect(newUnrest).toBe(10 - UNREST_DECAY_RATE);
  });

  it('starts unrest from zero when health is below threshold', () => {
    graph.addNode({
      id: 'loc.broken', type: 'location', name: 'Broken',
      properties: { locationSubtype: 'hamlet', unrest: 0, populationHealth: 20 },
    });
    phaseUnrest(makeState(graph));
    // Pure decay would short-circuit at unrest = 0; bleed forces processing.
    const newUnrest = graph.getNode('loc.broken')!.properties.unrest as number;
    expect(newUnrest).toBe(0); // -1 decay + 1 bleed, then clamped at 0
  });
});

describe('THR-401 — phaseSettlementPromotion suppression', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => clearTraces());

  it('does not accumulate promotion sustain while wells are sickened', () => {
    graph.addNode({
      id: 'loc.sickly', type: 'location', name: 'Sickly',
      properties: {
        locationSubtype: 'hamlet',
        prosperity: 90, // well above promotion threshold
        wellsSickenedUntilTick: 100,
        prosperitySustainAboveTicks: 0,
      },
    });
    phaseSettlementPromotion(makeState(graph, { tick: 5 }));
    expect(graph.getNode('loc.sickly')!.properties.prosperitySustainAboveTicks).toBe(0);
  });

  it('accumulates promotion sustain when sickness has expired', () => {
    graph.addNode({
      id: 'loc.healed', type: 'location', name: 'Healed',
      properties: {
        locationSubtype: 'hamlet',
        prosperity: 90,
        prosperitySustainAboveTicks: 0,
      },
    });
    phaseSettlementPromotion(makeState(graph, { tick: 5 }));
    expect(graph.getNode('loc.healed')!.properties.prosperitySustainAboveTicks).toBe(1);
  });

  it('does not accumulate promotion sustain when populationHealth is low', () => {
    graph.addNode({
      id: 'loc.struggling', type: 'location', name: 'Struggling',
      properties: {
        locationSubtype: 'hamlet',
        prosperity: 90,
        populationHealth: 20,
        prosperitySustainAboveTicks: 0,
      },
    });
    phaseSettlementPromotion(makeState(graph, { tick: 5 }));
    expect(graph.getNode('loc.struggling')!.properties.prosperitySustainAboveTicks).toBe(0);
  });
});

describe('THR-401 — integration: Bless / Sicken cycle', () => {
  it('Sickening followed by recovery returns health toward baseline', () => {
    const graph = new WorldGraph();
    enableTracing();
    clearTraces();

    graph.addNode({
      id: 'loc.cycle', type: 'location', name: 'Cycle',
      properties: { locationSubtype: 'hamlet', prosperity: 30, populationHealth: LOC_HEALTH_DEFAULT_BASELINE },
    });

    // Step 1: simulate a Sicken-the-Wells outcome by applying its deltas directly.
    const node = graph.getNode('loc.cycle')!;
    node.properties.populationHealth = (node.properties.populationHealth as number) + -25;
    node.properties.wellsSickenedUntilTick = 1 + LOC_SICKEN_WELLS_DURATION_TICKS;

    // Step 2: tick forward — health should drift back upward each tick.
    for (let t = 2; t <= 5; t++) {
      phaseProsperity(makeState(graph, { tick: t }));
    }

    const healed = graph.getNode('loc.cycle')!.properties.populationHealth as number;
    // After 4 ticks of recovery from 55 (80 - 25), should be at 59.
    expect(healed).toBe(LOC_HEALTH_DEFAULT_BASELINE - 25 + 4 * LOC_HEALTH_RECOVERY_RATE);

    // Step 3: wellsSickenedUntilTick should still be set (didn't expire yet — 1 + 10 = 11)
    expect(graph.getNode('loc.cycle')!.properties.wellsSickenedUntilTick).toBe(11);

    clearTraces();
  });
});

describe('THR-401 — integration: Curse the Roads zeroes trade prosperity', () => {
  it('cursed settlement loses trade-route contribution to its target', () => {
    const graph = new WorldGraph();
    enableTracing();
    clearTraces();

    // Build a settlement and an actor located there with an outbound trade route.
    graph.addNode({
      id: 'loc.A', type: 'location', name: 'Northhaven',
      properties: { locationSubtype: 'hamlet', prosperity: 60 },
    });
    graph.addNode({
      id: 'loc.B', type: 'location', name: 'Eastend',
      properties: { locationSubtype: 'hamlet', prosperity: 60 },
    });
    graph.addNode({ id: 'actor.A', type: 'actor', name: 'A-merchant', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'actor.B', type: 'actor', name: 'B-merchant', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.loc.A', source: 'actor.A', target: 'loc.A', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e.loc.B', source: 'actor.B', target: 'loc.B', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e.trade', source: 'actor.A', target: 'actor.B', type: 'trades_with', properties: { volume: 10 } });

    // Step 1: no curse — A should drift toward a target that includes the trade bonus.
    phaseProsperity(makeState(graph, { tick: 1 }));
    const beforeCurse = graph.getNode('loc.A')!.properties.prosperity as number;

    // Step 2: apply Curse the Roads to A (set property directly).
    graph.getNode('loc.A')!.properties.routesCursedUntilTick = 10 + LOC_CURSE_ROADS_DURATION_TICKS;
    graph.getNode('loc.A')!.properties.prosperity = beforeCurse;
    clearTraces();

    // Step 3: tick again with cursed routes.
    phaseProsperity(makeState(graph, { tick: 2 }));
    const afterCurse = graph.getNode('loc.A')!.properties.prosperity as number;
    expect(afterCurse).toBeLessThanOrEqual(beforeCurse);

    // A location_flag_consumed trace should have fired.
    const flagTraces = getTraces().filter(t => t.category === 'location_flag_consumed');
    expect(flagTraces.length).toBeGreaterThanOrEqual(1);

    clearTraces();
  });
});

describe('THR-401 — getProsperityTier compatibility (regression)', () => {
  it('does not crash when location is missing populationHealth/divinePresence', () => {
    const graph = new WorldGraph();
    enableTracing();
    clearTraces();
    graph.addNode({
      id: 'loc.minimal', type: 'location', name: 'Minimal',
      properties: { locationSubtype: 'hamlet', prosperity: 30 },
    });
    expect(() => phaseProsperity(makeState(graph))).not.toThrow();
    clearTraces();
  });
});
