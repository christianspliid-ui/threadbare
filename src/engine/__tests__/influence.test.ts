import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createEmptyEssencePool,
  computeEssenceGeneration,
  generateEssence,
  spendEssence,
  computeMaxEssence,
  canAfford,
} from '../influence';
import type { SphereAlignment, EssencePool } from '../../types/influence';
import { SPHERE_NAMES } from '../../types/index';

describe('Essence Pool', () => {
  it('createEmptyEssencePool returns all zeros', () => {
    const pool = createEmptyEssencePool();
    for (const sphere of SPHERE_NAMES) {
      expect(pool[sphere]).toBe(0);
    }
  });

  it('canAfford returns true when pool has enough', () => {
    const pool = createEmptyEssencePool();
    pool.life = 5;
    expect(canAfford(pool, 'life', 3)).toBe(true);
    expect(canAfford(pool, 'life', 5)).toBe(true);
    expect(canAfford(pool, 'life', 5.1)).toBe(false);
    expect(canAfford(pool, 'force', 1)).toBe(false);
  });

  it('spendEssence deducts from pool and returns true', () => {
    const pool = createEmptyEssencePool();
    pool.force = 10;
    const result = spendEssence(pool, 'force', 3);
    expect(result).toBe(true);
    expect(pool.force).toBe(7);
  });

  it('spendEssence returns false and does not deduct when insufficient', () => {
    const pool = createEmptyEssencePool();
    pool.force = 2;
    const result = spendEssence(pool, 'force', 5);
    expect(result).toBe(false);
    expect(pool.force).toBe(2);
  });

  it('canAfford rejects negative costs', () => {
    const pool = createEmptyEssencePool();
    pool.force = 5;
    expect(() => canAfford(pool, 'force', -3)).toThrow('non-negative');
  });

  it('spendEssence rejects negative costs', () => {
    const pool = createEmptyEssencePool();
    pool.force = 5;
    expect(() => spendEssence(pool, 'force', -3)).toThrow('non-negative');
    expect(pool.force).toBe(5);
  });
});

describe('Essence Generation', () => {
  let graph: WorldGraph;
  const ascendantId = 'asc.player';

  beforeEach(() => {
    graph = new WorldGraph();

    // Create ascendant node
    graph.addNode({
      id: ascendantId,
      type: 'actor',
      name: 'The Verdant One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
      },
    });
  });

  it('base generation distributes by sphere alignment', () => {
    const gen = computeEssenceGeneration(graph, ascendantId);
    // Primary sphere (life) gets the largest share
    expect(gen.life).toBeGreaterThan(gen.force);
    // Secondary sphere (spirit) gets second largest
    expect(gen.spirit).toBeGreaterThan(gen.force);
    // All spheres sum to BASE_ESSENCE_PER_TICK (1.0)
    const total = SPHERE_NAMES.reduce((sum, s) => sum + gen[s], 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it('worshippers increase generation', () => {
    const baseGen = computeEssenceGeneration(graph, ascendantId);
    const baseTotal = SPHERE_NAMES.reduce((sum, s) => sum + baseGen[s], 0);

    // Add a worshipper
    graph.addNode({
      id: 'actor.worshipper1',
      type: 'actor',
      name: 'Faithful One',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'edge.worship1',
      source: 'actor.worshipper1',
      target: ascendantId,
      type: 'worships',
      properties: { tier: 1, ticksAtCurrentTier: 0, establishedTick: 0, totalEssenceSpent: 0, maintenanceCurrent: true },
    });

    const boostedGen = computeEssenceGeneration(graph, ascendantId);
    const boostedTotal = SPHERE_NAMES.reduce((sum, s) => sum + boostedGen[s], 0);
    expect(boostedTotal).toBeGreaterThan(baseTotal);
  });

  it('places of power increase generation', () => {
    const baseGen = computeEssenceGeneration(graph, ascendantId);
    const baseTotal = SPHERE_NAMES.reduce((sum, s) => sum + baseGen[s], 0);

    // Add a place of power controlled by the ascendant
    graph.addNode({
      id: 'loc.shrine',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location', isPlaceOfPower: true },
    });
    graph.addEdge({
      id: 'edge.controls_shrine',
      source: ascendantId,
      target: 'loc.shrine',
      type: 'controls',
      properties: {},
    });

    const boostedGen = computeEssenceGeneration(graph, ascendantId);
    const boostedTotal = SPHERE_NAMES.reduce((sum, s) => sum + boostedGen[s], 0);
    expect(boostedTotal).toBeGreaterThan(baseTotal);
  });

  it('generateEssence adds to pool respecting max', () => {
    const pool = createEmptyEssencePool();
    const gen = computeEssenceGeneration(graph, ascendantId);
    const maxEssence = 50;

    generateEssence(pool, gen, maxEssence);

    // Pool should have some essence now
    const total = SPHERE_NAMES.reduce((sum, s) => sum + pool[s], 0);
    expect(total).toBeGreaterThan(0);
    expect(total).toBeLessThanOrEqual(maxEssence);
  });

  it('generateEssence caps individual spheres at maxEssence', () => {
    const pool = createEmptyEssencePool();
    pool.life = 49;
    const gen = createEmptyEssencePool();
    gen.life = 5; // would push to 54

    generateEssence(pool, gen, 50);

    expect(pool.life).toBe(50);
  });

  it('computeMaxEssence scales with worshippers', () => {
    const base = computeMaxEssence(graph, ascendantId);
    expect(base).toBe(50); // BASE_MAX_ESSENCE with no worshippers

    graph.addNode({
      id: 'actor.w1',
      type: 'actor',
      name: 'W1',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'edge.w1',
      source: 'actor.w1',
      target: ascendantId,
      type: 'worships',
      properties: { tier: 1, ticksAtCurrentTier: 0, establishedTick: 0, totalEssenceSpent: 0, maintenanceCurrent: true },
    });

    const boosted = computeMaxEssence(graph, ascendantId);
    expect(boosted).toBe(55); // 50 + 5 per worshipper
  });
});
