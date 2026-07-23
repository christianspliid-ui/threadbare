/**
 * Economic shock seeding in phaseProsperity (THR-725).
 *
 * The contract: a prosperity swing no ordinary drift could produce plants themed scene
 * seeds on the mortals standing there — cause-agnostic, so the four divine economic verbs
 * (which write `prosperity` directly, bypassing the shock queue) and queued
 * `ProsperityShock`s both trip it through the same test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseProsperity } from '../phaseProsperity';
import type { GameState, ProsperityShock } from '../../types/gameState';
import { clearTraces, getTraces, enableTracing } from '../traceBuffer';
import {
  ECON_SHOCK_DELTA,
  ECON_SHOCK_SEED_COUNT,
  ECON_BOOM_SEED_TEMPLATES,
  ECON_BUST_SEED_TEMPLATES,
} from '../../data/economic-scene-affinity';
import { PROSPERITY_DELTA_CLAMP } from '../phaseProsperity';

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
  } as GameState;
}

/** A town at `prosperity`, with `mortals` individuals standing in it. */
function makeTown(graph: WorldGraph, prosperity: number, mortals = 3): void {
  graph.addNode({
    id: 'loc.town', type: 'location', name: 'Ashford',
    properties: { locationSubtype: 'town', prosperity },
  });
  for (let i = 0; i < mortals; i++) {
    graph.addNode({
      id: `agent.${i}`, type: 'actor', name: `Mortal ${i}`,
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: `edge.at.${i}`, source: `agent.${i}`, target: 'loc.town',
      type: 'located_at', properties: {},
    });
  }
}

/** Run one settling pass so the settlement has an `econLastProsperity` baseline. */
function settle(graph: WorldGraph, tick = 1): GameState {
  const state = makeState(graph, { tick });
  phaseProsperity(state);
  return state;
}

describe('phaseProsperity — economic shock seeding', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => clearTraces());

  // World generation must not read as a shock: with no prior baseline there is no delta.
  it('plants nothing on a settlement seen for the first time', () => {
    makeTown(graph, 10);
    const result = phaseProsperity(makeState(graph));
    expect(result.pendingEncounterSeeds).toBeUndefined();
  });

  it('records the value it wrote as next tick\'s baseline', () => {
    makeTown(graph, 40);
    phaseProsperity(makeState(graph));
    const props = graph.getNode('loc.town')!.properties;
    expect(props.econLastProsperity).toBe(props.prosperity);
  });

  // The load-bearing case: `loc.blight` writes the property directly, never through the
  // shock queue, so detection has to notice writes it did not make itself.
  it('detects a direct property write (the divine-verb path) as a bust shock', () => {
    makeTown(graph, 40);
    settle(graph);

    // Simulate loc.blight: -10 straight onto the property.
    graph.getNode('loc.town')!.properties.prosperity =
      (graph.getNode('loc.town')!.properties.prosperity as number) - 10;

    const result = phaseProsperity(makeState(graph, { tick: 2 }));
    expect(result.pendingEncounterSeeds).toHaveLength(ECON_SHOCK_SEED_COUNT);

    const trace = getTraces().find(t => t.category === 'econ_shock_seeded') as
      | (Record<string, unknown> & { polarity: string; cause: string })
      | undefined;
    expect(trace?.polarity).toBe('bust');
    expect(trace?.cause).toBe('direct_write');
  });

  it('detects a direct property write upward as a boom shock', () => {
    makeTown(graph, 40);
    settle(graph);
    graph.getNode('loc.town')!.properties.prosperity =
      (graph.getNode('loc.town')!.properties.prosperity as number) + 12;

    const result = phaseProsperity(makeState(graph, { tick: 2 }));
    const seeds = result.pendingEncounterSeeds ?? [];
    expect(seeds).toHaveLength(ECON_SHOCK_SEED_COUNT);
    for (const seed of seeds) {
      expect(ECON_BOOM_SEED_TEMPLATES).toContain(seed.templateId);
    }
  });

  it('detects a queued ProsperityShock through the same test', () => {
    makeTown(graph, 40);
    settle(graph);

    const shocks: ProsperityShock[] = [
      { locationId: 'loc.town', delta: -(ECON_SHOCK_DELTA + 3), causeType: 'encounter_impact', causeId: 'x', description: 'raid' },
    ];
    const result = phaseProsperity(makeState(graph, { tick: 2, prosperityShocks: shocks }));
    expect(result.pendingEncounterSeeds ?? []).toHaveLength(ECON_SHOCK_SEED_COUNT);
    const trace = getTraces().find(t => t.category === 'econ_shock_seeded') as
      | (Record<string, unknown> & { cause: string })
      | undefined;
    expect(trace?.cause).toBe('prosperity_shock');
  });

  // Ordinary equilibrium drift is clamped to PROSPERITY_DELTA_CLAMP, well under the
  // threshold — the world does not throw a festival because the market had a good week.
  it('does not fire on ordinary drift', () => {
    expect(ECON_SHOCK_DELTA).toBeGreaterThan(PROSPERITY_DELTA_CLAMP);
    makeTown(graph, 0);
    settle(graph);
    for (let tick = 2; tick <= 12; tick++) {
      const result = phaseProsperity(makeState(graph, { tick }));
      expect(result.pendingEncounterSeeds).toBeUndefined();
    }
  });

  it('does not fire on a swing just under the threshold', () => {
    makeTown(graph, 50);
    settle(graph);
    graph.getNode('loc.town')!.properties.prosperity =
      (graph.getNode('loc.town')!.properties.prosperity as number) - (ECON_SHOCK_DELTA - 1);
    expect(phaseProsperity(makeState(graph, { tick: 2 })).pendingEncounterSeeds).toBeUndefined();
  });

  // Fail-soft: a shock with nobody present plants nothing rather than queueing orphan seeds.
  it('plants nothing when no mortals are present', () => {
    makeTown(graph, 40, 0);
    settle(graph);
    graph.getNode('loc.town')!.properties.prosperity = 10;
    expect(phaseProsperity(makeState(graph, { tick: 2 })).pendingEncounterSeeds).toBeUndefined();
  });

  it('never plants more seeds than there are mortals present', () => {
    makeTown(graph, 40, 1);
    settle(graph);
    graph.getNode('loc.town')!.properties.prosperity = 10;
    expect(phaseProsperity(makeState(graph, { tick: 2 })).pendingEncounterSeeds).toHaveLength(1);
  });

  it('targets distinct mortals and draws bust templates for a bust shock', () => {
    makeTown(graph, 40, 4);
    settle(graph);
    graph.getNode('loc.town')!.properties.prosperity = 8;

    const seeds = phaseProsperity(makeState(graph, { tick: 2 })).pendingEncounterSeeds ?? [];
    expect(new Set(seeds.map(s => s.targetAgentId)).size).toBe(seeds.length);
    for (const seed of seeds) {
      expect(ECON_BUST_SEED_TEMPLATES).toContain(seed.templateId);
      
      expect(seed.eligibleAfterTick).toBe(3);
    }
  });

  it('appends to existing pending seeds rather than replacing them', () => {
    makeTown(graph, 40);
    settle(graph);
    graph.getNode('loc.town')!.properties.prosperity = 10;

    const existing = [{ seedId: 'prior' }] as unknown as GameState['pendingEncounterSeeds'];
    const result = phaseProsperity(
      makeState(graph, { tick: 2, pendingEncounterSeeds: existing }),
    );
    expect(result.pendingEncounterSeeds?.[0]?.seedId).toBe('prior');
    expect(result.pendingEncounterSeeds).toHaveLength(1 + ECON_SHOCK_SEED_COUNT);
  });

  // One aggregate trace per shock, never one per seed — the trace-volume rule.
  it('emits exactly one trace per shock event', () => {
    makeTown(graph, 40);
    settle(graph);
    graph.getNode('loc.town')!.properties.prosperity = 10;
    phaseProsperity(makeState(graph, { tick: 2 }));
    expect(getTraces().filter(t => t.category === 'econ_shock_seeded')).toHaveLength(1);
  });

  // NFP #3 — same seed, same tick, same world → same draws.
  it('is deterministic across identical runs', () => {
    function run(): string[] {
      const g = new WorldGraph();
      makeTown(g, 40, 4);
      settle(g);
      g.getNode('loc.town')!.properties.prosperity = 8;
      const seeds = phaseProsperity(makeState(g, { tick: 2 })).pendingEncounterSeeds ?? [];
      return seeds.map(s => `${s.targetAgentId}:${s.templateId}`);
    }
    expect(run()).toEqual(run());
  });
});
