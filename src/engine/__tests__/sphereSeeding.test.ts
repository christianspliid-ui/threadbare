import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { runTick, resetEventCounter, resetDecisionCache } from '../orchestrator';
import { resetReputationTraitInit } from '../phaseReputationTraits';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { createSimulationRuntime } from '../simulationRuntime';
import { WorldGraph } from '../graph';
import {
  backfillSphereAffinity,
  computeFactionSphereAggregates,
  computeSphereSeedCensus,
  getFactionSphereScores,
  seedFromRankedSpheres,
} from '../sphereAffinity';
import { phaseSpherePressure, resolveSpherePressure } from '../phaseSpherePressure';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import {
  ARCHETYPE_SPHERE_BONUS_PRIMARY,
  ARCHETYPE_SPHERE_BONUS_SECONDARY,
  LOCATION_TYPE_BONUS,
  createDefaultSphereAffinity,
  type PressureSource,
  type SphereAffinity,
  type FactionSphereAggregate,
} from '../../types/sphereAffinity';
import type { GameState } from '../../types/gameState';
import type { CultureIdentity } from '../../types/culture';
import type { GraphNode } from '../../types/graph';

/**
 * THR-1768 — every node carries a sphere bag. Census assertions run on a GENERATED
 * medium world (seeds 42 and 99): the defect was a mint path nobody remembered, which a
 * fixture world cannot contain (THR-1759 measured 509/509 zero mortals and 117/235
 * unbagged places on seed 42 before this).
 */

const SEEDS = [42, 99];
/** Enough ticks to cross the sweep at the head of the pressure phase several times. */
const WARM_TICKS = 6;
const MULTI_TICK_TIMEOUT_MS = 60_000;

function boot(seed: number): GameState {
  resetEventCounter();
  resetDecisionCache();
  resetReputationTraitInit();
  const archetype = generateArchetypes(4, seed)[0];
  const { cols, rows } = MAP_SIZE_PRESETS.medium;
  return initializeGameState(archetype, 'SphereSeedProbe', createBalancedCosmology(), seed, cols, rows).state;
}

function veneratedOfStrongestCulture(state: GameState, node: GraphNode): string[] | null {
  let best: { v: string[]; strength: number } | null = null;
  for (const e of state.graph.getOutgoingEdges(node.id, 'belongs_to')) {
    const v = (state.graph.getNode(e.target)?.properties.cultureIdentity as CultureIdentity | undefined)?.veneratedSpheres;
    if (!v || v.length === 0) continue;
    const strength = (e.properties.culturalStrength as number) ?? 1.0;
    if (!best || strength > best.strength) best = { v, strength };
  }
  return best?.v ?? null;
}

describe('sphere bags on a generated medium world (THR-1768)', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: the god, every mortal with a culture and every place carry a bag at tick 0`, () => {
      const state = boot(seed);
      const asc = state.graph.getNode(state.ascendantId)!;
      const alignment = asc.properties.sphereAlignment as { primary: string; secondary: string };
      const ascScores = (asc.properties.sphereAffinity as SphereAffinity).scores as Record<string, number>;
      expect(ascScores[alignment.primary]).toBe(ARCHETYPE_SPHERE_BONUS_PRIMARY);
      expect(ascScores[alignment.secondary]).toBe(ARCHETYPE_SPHERE_BONUS_SECONDARY);

      const census = computeSphereSeedCensus(state.graph, state.tiles);
      expect(census.place.total).toBeGreaterThan(0);
      expect(census.sublocation.total).toBeGreaterThan(0);
      expect(census.place.unseeded).toBe(0);
      expect(census.sublocation.unseeded).toBe(0);
      expect(census.individual.unseeded).toBe(0);
      expect(census.ascendant.byRoute.alignment).toBe(1);

      const individuals = state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'individual');
      let withCulture = 0;
      for (const n of individuals) {
        const v = veneratedOfStrongestCulture(state, n);
        if (!v) continue;
        withCulture++;
        const scores = (n.properties.sphereAffinity as SphereAffinity).scores as Record<string, number>;
        expect(scores[v[0]]).toBe(ARCHETYPE_SPHERE_BONUS_PRIMARY);
      }
      expect(withCulture).toBeGreaterThan(0);
      expect(census.individual.byRoute.none ?? 0).toBe(individuals.length - withCulture);

      // Lairs and elder ruins carry their declared sphere on top of terrain.
      const declared = state.graph.getNodesByType('location').filter(n => n.properties.locationType === 'lair');
      expect(declared.length).toBeGreaterThan(0);
      for (const lair of declared) {
        const sphere = lair.properties.dominantSphere as string;
        const scores = (lair.properties.sphereAffinity as SphereAffinity).scores as Record<string, number>;
        expect(scores[sphere]).toBeGreaterThanOrEqual(LOCATION_TYPE_BONUS);
      }

      for (const kind of Object.keys(census) as (keyof typeof census)[]) {
        expect(census[kind].nonInteger).toBe(0);
      }
    });

    it(`seed ${seed}: after ${WARM_TICKS} ticks no location or individual is unbagged and every faction has an aggregate`, () => {
      let state = boot(seed);
      const runtime = createSimulationRuntime();
      for (let i = 0; i < WARM_TICKS; i++) state = runTick(state, [], runtime);
      const census = computeSphereSeedCensus(state.graph, state.tiles);
      expect(census.place.unseeded).toBe(0);
      expect(census.sublocation.unseeded).toBe(0);
      expect(census.individual.unseeded).toBe(0);
      for (const kind of Object.keys(census) as (keyof typeof census)[]) {
        expect(census[kind].nonInteger).toBe(0);
      }
      const factions = state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'faction');
      expect(factions.length).toBeGreaterThan(0);
      for (const f of factions) {
        expect(f.properties.sphereAggregate).toBeDefined();
      }
    }, MULTI_TICK_TIMEOUT_MS);
  }
});

// ─── Unit: the helpers ─────────────────────────────────────────────

function actor(graph: WorldGraph, id: string, props: Record<string, unknown>): void {
  graph.addNode({ id, type: 'actor', name: id, properties: props });
}

function edge(graph: WorldGraph, id: string, source: string, target: string, type: string): void {
  graph.addEdge({ id, source, target, type, properties: {} } as never);
}

describe('backfillSphereAffinity', () => {
  it('seeds a null bag and never overwrites a valid one', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'culture.a', type: 'actor', name: 'A', properties: { actorType: 'culture', cultureIdentity: { veneratedSpheres: ['life', 'mind'] } } });
    actor(graph, 'npc.new', { actorType: 'individual', sphereAffinity: null });
    edge(graph, 'e1', 'npc.new', 'culture.a', 'belongs_to');
    const grown = createDefaultSphereAffinity();
    grown.scores.force = 9;
    graph.addNode({ id: 'lair_x', type: 'location', name: 'Lair', properties: { locationType: 'lair', terrain: 'volcano', dominantSphere: 'force', sphereAffinity: grown } });
    graph.addNode({ id: 'wp_1', type: 'location', name: 'Waypoint', properties: { terrain: 'forest' } });

    const { seeded } = backfillSphereAffinity(graph, [], 5);

    expect(seeded).toBe(3); // npc, culture, waypoint
    expect((graph.getNode('npc.new')!.properties.sphereAffinity as SphereAffinity).scores.life).toBe(ARCHETYPE_SPHERE_BONUS_PRIMARY);
    expect((graph.getNode('npc.new')!.properties.sphereAffinity as SphereAffinity).scores.mind).toBe(ARCHETYPE_SPHERE_BONUS_SECONDARY);
    expect((graph.getNode('lair_x')!.properties.sphereAffinity as SphereAffinity).scores.force).toBe(9);
    expect((graph.getNode('wp_1')!.properties.sphereAffinity as SphereAffinity).scores.life).toBe(3);
  });

  it('seedFromRankedSpheres ignores non-spheres and collapses a repeated primary', () => {
    const a = seedFromRankedSpheres(['nonsense', 'time', 'time', 'order']);
    expect(a.scores.time).toBe(ARCHETYPE_SPHERE_BONUS_PRIMARY);
    expect(a.scores.order).toBe(ARCHETYPE_SPHERE_BONUS_SECONDARY);
  });
});

describe('faction sphere aggregate (D3)', () => {
  it('is the rounded mean of individual members and changes when one member changes', () => {
    const graph = new WorldGraph();
    actor(graph, 'fac', { actorType: 'faction', sphereAffinity: createDefaultSphereAffinity() });
    for (const [id, life] of [['m1', 4], ['m2', 2]] as const) {
      const bag = createDefaultSphereAffinity();
      bag.scores.life = life;
      actor(graph, id, { actorType: 'individual', sphereAffinity: bag });
      edge(graph, `mo_${id}`, id, 'fac', 'member_of');
    }

    expect(computeFactionSphereAggregates(graph, 1)).toBe(1);
    const first = graph.getNode('fac')!.properties.sphereAggregate as FactionSphereAggregate;
    expect(first.scores.life).toBe(3);
    expect(first.memberCount).toBe(2);

    // Unchanged → no write.
    expect(computeFactionSphereAggregates(graph, 2)).toBe(0);

    const m1 = graph.getNode('m1')!.properties.sphereAffinity as SphereAffinity;
    graph.updateNode('m1', { properties: { sphereAffinity: { ...m1, scores: { ...m1.scores, life: 8 } } } });
    expect(computeFactionSphereAggregates(graph, 3)).toBe(1);
    expect((graph.getNode('fac')!.properties.sphereAggregate as FactionSphereAggregate).scores.life).toBe(5);
  });

  it('getFactionSphereScores reads own + aggregate, and all zeros when the faction has no sphere', () => {
    const graph = new WorldGraph();
    const own = createDefaultSphereAffinity();
    own.scores.entropy = 2;
    actor(graph, 'fac', { actorType: 'faction', sphereAffinity: own, sphereAggregate: { scores: { ...createDefaultSphereAffinity().scores, entropy: 1, life: 3 }, memberCount: 3, computedTick: 0 } });
    actor(graph, 'empty', { actorType: 'faction' });
    const scores = getFactionSphereScores(graph.getNode('fac'));
    expect(scores.entropy).toBe(3);
    expect(scores.life).toBe(3);
    expect(Object.values(getFactionSphereScores(graph.getNode('empty'))).every(v => v === 0)).toBe(true);
  });
});

describe('phaseSpherePressure bookkeeping (THR-1768)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  const ALL_SOURCES: PressureSource[] = [
    'divine_action', 'control_effect', 'encounter', 'doom', 'rival',
    'notable', 'mandate', 'overchannel', 'environmental',
  ];

  it('emits a sphere_pressure trace naming every writer', () => {
    const graph = new WorldGraph();
    actor(graph, 'target', { actorType: 'individual', sphereAffinity: createDefaultSphereAffinity() });
    const state = {
      graph,
      tick: 7,
      tiles: [],
      pendingSpherePressures: ALL_SOURCES.map((source, i) => ({
        targetEntityId: 'target', sphere: 'life' as const, magnitude: 1, source, sourceId: `src_${i}`,
      })),
      pendingQuintessenceEvents: [],
    } as unknown as GameState;

    phaseSpherePressure(state);

    const traces = getTraces().filter(t => t.category === 'sphere_pressure') as unknown as Array<{ sources: PressureSource[]; sourceIds: string[]; entityId: string; tick: number }>;
    expect(traces.length).toBeGreaterThan(0);
    const seen = new Set(traces.flatMap(t => t.sources));
    for (const s of ALL_SOURCES) expect(seen.has(s)).toBe(true);
    expect(traces[0].entityId).toBe('target');
    expect(traces[0].tick).toBe(7);
  });

  it('erosion removes whole points only — a sub-point excess is absorbed (D5)', () => {
    const bag = createDefaultSphereAffinity();
    bag.scores.force = 3;
    // Mind opposes Force; threshold = 3. 3.6 exceeds it by 0.6 → nothing whole to remove.
    const { updated, traces } = resolveSpherePressure(bag, [
      { targetEntityId: 'x', sphere: 'mind', magnitude: 3.6, source: 'notable', sourceId: 'n1' },
    ]);
    expect(updated.scores.force).toBe(3);
    expect(traces[0].outcome).toBe('absorbed');

    const { updated: eroded } = resolveSpherePressure(bag, [
      { targetEntityId: 'x', sphere: 'mind', magnitude: 4.9, source: 'notable', sourceId: 'n1' },
    ]);
    expect(eroded.scores.force).toBe(2);
    expect(Number.isInteger(eroded.scores.force)).toBe(true);
  });
});
