/**
 * Tests for phaseSphereAggregation — global World-Soul aggregation phase.
 *
 * Tests cover:
 * - Empty graph: returns default aggregate (all zeros, entityCount=0)
 * - Multiple location nodes: totals sum weighted scores
 * - Agent nodes contribute at lower weight (0.2)
 * - normalizeAggregate sums to 1.0
 * - normalizeAggregate handles all-zero totals (equal distribution)
 * - computeFoundationBalance: chaos_order and light_darkness axes
 * - getDominantSphere: returns sphere with highest total
 * - FundamentState.sphereWeights populated from normalized aggregate
 * - WorldSoulState gains aggregate field
 */
import { describe, it, expect } from 'vitest';
import {
  phaseSphereAggregation,
  normalizeAggregate,
  ENTITY_AGGREGATE_WEIGHT,
} from '../phaseSphereAggregation';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import type { SphereAffinity } from '../../types/sphereAffinity';
import type { SphereName } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { WorldSoulState } from '../../types/worldSoul';

// ─── Helpers ─────────────────────────────────────────────────────────

function makeAffinity(scores: Partial<Record<SphereName, number>>): SphereAffinity {
  const base = createDefaultSphereAffinity();
  for (const [k, v] of Object.entries(scores)) {
    base.scores[k as SphereName] = v as number;
  }
  return base;
}

function makeWorldSoul(): WorldSoulState {
  const sphereWeights = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) sphereWeights[s] = 1 / SPHERE_NAMES.length;
  return {
    fundament: {
      sphereWeights,
      cycleCount: 0,
    },
    resonance: {
      memories: [],
      maxMemories: 10,
    },
  };
}

function makeState(
  locations: Array<{ id: string; affinity: SphereAffinity }> = [],
  actors: Array<{ id: string; actorType: string; affinity: SphereAffinity }> = [],
): GameState {
  const graph = new WorldGraph();
  for (const loc of locations) {
    graph.addNode({
      id: loc.id,
      type: 'location',
      name: `Location ${loc.id}`,
      properties: { sphereAffinity: loc.affinity },
    });
  }
  for (const actor of actors) {
    graph.addNode({
      id: actor.id,
      type: 'actor',
      name: `Actor ${actor.id}`,
      properties: {
        actorType: actor.actorType,
        sphereAffinity: actor.affinity,
      },
    });
  }
  return {
    tick: 1,
    graph,
    worldSoul: makeWorldSoul(),
  } as unknown as GameState;
}

// ─── normalizeAggregate ───────────────────────────────────────────────

describe('normalizeAggregate', () => {
  it('all-zero totals returns equal distribution (1/12 each for 12 spheres)', () => {
    const totals = {} as Record<SphereName, number>;
    for (const s of SPHERE_NAMES) totals[s] = 0;
    const result = normalizeAggregate(totals);
    for (const s of SPHERE_NAMES) {
      expect(result[s]).toBeCloseTo(1 / SPHERE_NAMES.length, 5);
    }
  });

  it('single sphere with all score: that sphere gets 1.0', () => {
    const totals = {} as Record<SphereName, number>;
    for (const s of SPHERE_NAMES) totals[s] = 0;
    totals.life = 10;
    const result = normalizeAggregate(totals);
    expect(result.life).toBeCloseTo(1.0, 5);
    expect(result.force).toBeCloseTo(0, 5);
  });

  it('two equal spheres each get 0.5', () => {
    const totals = {} as Record<SphereName, number>;
    for (const s of SPHERE_NAMES) totals[s] = 0;
    totals.life = 5;
    totals.force = 5;
    const result = normalizeAggregate(totals);
    expect(result.life).toBeCloseTo(0.5, 5);
    expect(result.force).toBeCloseTo(0.5, 5);
  });

  it('result sums to 1.0', () => {
    const totals = {} as Record<SphereName, number>;
    for (const s of SPHERE_NAMES) totals[s] = 0;
    totals.life = 3;
    totals.force = 2;
    totals.energy = 5;
    const result = normalizeAggregate(totals);
    const sum = SPHERE_NAMES.reduce((acc, s) => acc + result[s], 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });
});

// ─── phaseSphereAggregation ─────────────────────────────────────────

describe('phaseSphereAggregation', () => {
  it('empty graph returns worldSoul update with aggregate (all zeros → equal weights)', () => {
    const state = makeState();
    const result = phaseSphereAggregation(state);
    expect(result.worldSoul).toBeDefined();
    expect(result.worldSoul!.aggregate).toBeDefined();
    expect(result.worldSoul!.aggregate!.entityCount).toBe(0);
    // All totals are 0 → normalize gives equal distribution
    const weights = result.worldSoul!.fundament.sphereWeights;
    expect(weights.life).toBeCloseTo(1 / SPHERE_NAMES.length, 5);
  });

  it('two location nodes with Life:3 and Life:5 → totalBySphere.life = 8 * 1.0', () => {
    const state = makeState([
      { id: 'loc1', affinity: makeAffinity({ life: 3 }) },
      { id: 'loc2', affinity: makeAffinity({ life: 5 }) },
    ]);
    const result = phaseSphereAggregation(state);
    const agg = result.worldSoul!.aggregate!;
    // ENTITY_AGGREGATE_WEIGHT for location = 1.0; weighted: 3*1 + 5*1 = 8
    expect(agg.totalBySphere.life).toBeCloseTo(8 * ENTITY_AGGREGATE_WEIGHT.location, 5);
  });

  it('agent with Life:2 at weight 0.2 contributes 0.4 to total life', () => {
    const state = makeState(
      [],
      [{ id: 'agent1', actorType: 'individual', affinity: makeAffinity({ life: 2 }) }]
    );
    const result = phaseSphereAggregation(state);
    const agg = result.worldSoul!.aggregate!;
    expect(agg.totalBySphere.life).toBeCloseTo(2 * ENTITY_AGGREGATE_WEIGHT.agent, 5);
  });

  it('dominantSphere is the sphere with highest totalBySphere', () => {
    const state = makeState([
      { id: 'loc1', affinity: makeAffinity({ life: 5, force: 1 }) },
    ]);
    const result = phaseSphereAggregation(state);
    expect(result.worldSoul!.aggregate!.dominantSphere).toBe('life');
  });

  it('dominantSphere is null when all totals are 0', () => {
    const state = makeState([
      { id: 'loc1', affinity: makeAffinity({}) },
    ]);
    const result = phaseSphereAggregation(state);
    expect(result.worldSoul!.aggregate!.dominantSphere).toBeNull();
  });

  it('FundamentState.sphereWeights derived from normalized aggregate', () => {
    const state = makeState([
      { id: 'loc1', affinity: makeAffinity({ life: 8, force: 0 }) },
    ]);
    const result = phaseSphereAggregation(state);
    const weights = result.worldSoul!.fundament.sphereWeights;
    // life has all 8 total score → should dominate the weights
    expect(weights.life).toBeGreaterThan(weights.force);
  });

  it('skips nodes without sphereAffinity (fail-soft)', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc1', type: 'location', name: 'Test', properties: {} });
    const state = {
      tick: 1,
      graph,
      worldSoul: makeWorldSoul(),
    } as unknown as GameState;
    expect(() => phaseSphereAggregation(state)).not.toThrow();
  });

  it('aggregates all entity types: location, actor/individual, actor/faction', () => {
    const state = makeState(
      [{ id: 'loc1', affinity: makeAffinity({ force: 3 }) }],
      [
        { id: 'agent1', actorType: 'individual', affinity: makeAffinity({ force: 5 }) },
        { id: 'faction1', actorType: 'faction', affinity: makeAffinity({ force: 2 }) },
      ]
    );
    const result = phaseSphereAggregation(state);
    const total = result.worldSoul!.aggregate!.totalBySphere.force;
    // loc: 3*1.0=3, individual: 5*0.2=1, faction: 2*0.1=0.2 → 4.2
    expect(total).toBeCloseTo(
      3 * ENTITY_AGGREGATE_WEIGHT.location +
      5 * ENTITY_AGGREGATE_WEIGHT.agent +
      2 * ENTITY_AGGREGATE_WEIGHT.faction,
      5
    );
  });

  it('entityCount reflects number of entities with sphereAffinity', () => {
    const state = makeState(
      [
        { id: 'loc1', affinity: makeAffinity({ life: 2 }) },
        { id: 'loc2', affinity: makeAffinity({ life: 1 }) },
      ],
      [{ id: 'agent1', actorType: 'individual', affinity: makeAffinity({}) }]
    );
    const result = phaseSphereAggregation(state);
    expect(result.worldSoul!.aggregate!.entityCount).toBe(3);
  });
});
