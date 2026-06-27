import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  createEmptyEssencePool,
  computeEssenceGeneration,
  generateEssence,
  spendEssence,
  computeMaxEssence,
  canAfford,
  getInfluenceTier,
  processInfluenceMaintenance,
  checkTierPromotion,
  dropAgent,
  setHomeSeat,
} from '../influence';
import type { SphereAlignment } from '../../types/influence';
import { TIER_PROMOTION_THRESHOLDS, ESSENCE_PER_SEAT, ESSENCE_PER_PLACE_OF_POWER } from '../../types/influence';
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

  it('threaded agents increase generation', () => {
    const baseGen = computeEssenceGeneration(graph, ascendantId);
    const baseTotal = SPHERE_NAMES.reduce((sum, s) => sum + baseGen[s], 0);

    // Add a threaded agent
    graph.addNode({
      id: 'actor.threaded1',
      type: 'actor',
      name: 'Faithful One',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'edge.thread1',
      source: ascendantId,
      target: 'actor.threaded1',
      type: 'thread',
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

  // ── Home seat (throne) — THR-502 ──
  const sumGen = (g = computeEssenceGeneration(graph, ascendantId)) =>
    SPHERE_NAMES.reduce((sum, s) => sum + g[s], 0);

  const addSeatLocation = (id: string, props: Record<string, unknown> = {}) => {
    graph.addNode({ id, type: 'location', name: id, properties: { locationType: 'location', ...props } });
  };

  it('home seat raises generation by exactly ESSENCE_PER_SEAT', () => {
    addSeatLocation('loc.throne');
    const baseTotal = sumGen();
    graph.updateNode(ascendantId, {
      properties: { ...graph.getNode(ascendantId)!.properties, homeSeatLocationId: 'loc.throne' },
    });
    expect(sumGen()).toBeCloseTo(baseTotal + ESSENCE_PER_SEAT, 5);
  });

  it('home seat does not stack with place-of-power (named higher-yield case)', () => {
    addSeatLocation('loc.throne', { isPlaceOfPower: true });
    graph.addEdge({ id: 'edge.controls_throne', source: ascendantId, target: 'loc.throne', type: 'controls', properties: {} });
    const baseTotal = sumGen();
    graph.updateNode(ascendantId, {
      properties: { ...graph.getNode(ascendantId)!.properties, homeSeatLocationId: 'loc.throne' },
    });
    // Only the seat term applies — the place-of-power bonus is replaced, not added.
    expect(sumGen()).toBeCloseTo(baseTotal + ESSENCE_PER_SEAT - ESSENCE_PER_PLACE_OF_POWER, 5);
  });

  it('home seat pointing at a missing location contributes nothing (fail-soft)', () => {
    const baseTotal = sumGen();
    graph.updateNode(ascendantId, {
      properties: { ...graph.getNode(ascendantId)!.properties, homeSeatLocationId: 'loc.ghost' },
    });
    expect(sumGen()).toBeCloseTo(baseTotal, 5);
  });

  it('setHomeSeat sets the property + a controls edge and raises generation', () => {
    addSeatLocation('loc.throne');
    const baseTotal = sumGen();
    const result = setHomeSeat(graph, ascendantId, 'loc.throne');
    expect(result.success).toBe(true);
    expect(result.locationId).toBe('loc.throne');
    expect(graph.getNode(ascendantId)!.properties.homeSeatLocationId).toBe('loc.throne');
    expect(graph.getOutgoingEdges(ascendantId, 'controls').some(e => e.target === 'loc.throne')).toBe(true);
    expect(sumGen()).toBeCloseTo(baseTotal + ESSENCE_PER_SEAT, 5);
  });

  it('setHomeSeat with no ref prefers a capital, then falls back', () => {
    addSeatLocation('loc.hamlet', { locationType: 'hamlet' });
    addSeatLocation('loc.capital', { locationType: 'capital' });
    const result = setHomeSeat(graph, ascendantId);
    expect(result.success).toBe(true);
    expect(result.locationId).toBe('loc.capital');
  });

  it('setHomeSeat fails soft when no locations exist', () => {
    const result = setHomeSeat(graph, ascendantId, 'loc.nope');
    expect(result.success).toBe(false);
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

  it('computeMaxEssence scales with threaded agents', () => {
    const base = computeMaxEssence(graph, ascendantId);
    expect(base).toBe(50); // BASE_MAX_ESSENCE with no threaded agents

    graph.addNode({
      id: 'actor.w1',
      type: 'actor',
      name: 'W1',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'edge.t1',
      source: ascendantId,
      target: 'actor.w1',
      type: 'thread',
      properties: { tier: 1, ticksAtCurrentTier: 0, establishedTick: 0, totalEssenceSpent: 0, maintenanceCurrent: true },
    });

    const boosted = computeMaxEssence(graph, ascendantId);
    expect(boosted).toBe(55); // 50 + 5 per threaded agent
  });
});

describe('Influence Tier Management', () => {
  let graph: WorldGraph;
  const ascendantId = 'asc.player';
  const agentId = 'actor.agent1';

  beforeEach(() => {
    graph = new WorldGraph();

    graph.addNode({
      id: ascendantId,
      type: 'actor',
      name: 'The Verdant One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'life', secondary: 'spirit' } as SphereAlignment,
        essencePool: createEmptyEssencePool(),
      },
    });

    graph.addNode({
      id: agentId,
      type: 'actor',
      name: 'Faithful Agent',
      properties: { actorType: 'individual' },
    });
  });

  it('getInfluenceTier returns 0 for unrelated actor', () => {
    expect(getInfluenceTier(graph, ascendantId, agentId)).toBe(0);
  });

  it('getInfluenceTier returns current tier from thread edge', () => {
    graph.addEdge({
      id: 'edge.thread1',
      source: ascendantId,
      target: agentId,
      type: 'thread',
      properties: {
        tier: 2,
        ticksAtCurrentTier: 15,
        establishedTick: 0,
        totalEssenceSpent: 20,
        maintenanceCurrent: true,
      },
    });
    expect(getInfluenceTier(graph, ascendantId, agentId)).toBe(2);
  });

  it('processInfluenceMaintenance deducts essence and increments ticks', () => {
    const pool = createEmptyEssencePool();
    pool.life = 10;
    graph.updateNode(ascendantId, { properties: { ...graph.getNode(ascendantId)!.properties, essencePool: pool } });

    graph.addEdge({
      id: 'edge.thread1',
      source: ascendantId,
      target: agentId,
      type: 'thread',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 0,
        establishedTick: 0,
        totalEssenceSpent: 5,
        maintenanceCurrent: true,
      },
    });

    const result = processInfluenceMaintenance(graph, ascendantId, 1);

    expect(result.maintenancePaid).toContain(agentId);
    expect(result.maintenanceFailed).toHaveLength(0);

    const edge = graph.getOutgoingEdges(ascendantId, 'thread')[0];
    expect(edge.properties.ticksAtCurrentTier).toBe(1);
    expect(edge.properties.maintenanceCurrent).toBe(true);
  });

  it('processInfluenceMaintenance marks failed when insufficient essence', () => {
    const pool = createEmptyEssencePool();
    graph.updateNode(ascendantId, { properties: { ...graph.getNode(ascendantId)!.properties, essencePool: pool } });

    graph.addEdge({
      id: 'edge.thread1',
      source: ascendantId,
      target: agentId,
      type: 'thread',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 10,
        establishedTick: 0,
        totalEssenceSpent: 5,
        maintenanceCurrent: true,
      },
    });

    const result = processInfluenceMaintenance(graph, ascendantId, 11);
    expect(result.maintenanceFailed).toContain(agentId);

    const edge = graph.getOutgoingEdges(ascendantId, 'thread')[0];
    expect(edge.properties.maintenanceCurrent).toBe(false);
  });

  it('checkTierPromotion promotes when threshold met', () => {
    graph.addEdge({
      id: 'edge.thread1',
      source: ascendantId,
      target: agentId,
      type: 'thread',
      properties: {
        tier: 1,
        ticksAtCurrentTier: TIER_PROMOTION_THRESHOLDS[2],
        establishedTick: 0,
        totalEssenceSpent: 20,
        maintenanceCurrent: true,
      },
    });

    const promoted = checkTierPromotion(graph, ascendantId);
    expect(promoted).toContain(agentId);

    const edge = graph.getOutgoingEdges(ascendantId, 'thread')[0];
    expect(edge.properties.tier).toBe(2);
    expect(edge.properties.ticksAtCurrentTier).toBe(0);
  });

  it('checkTierPromotion does not promote when maintenance failed', () => {
    graph.addEdge({
      id: 'edge.thread1',
      source: ascendantId,
      target: agentId,
      type: 'thread',
      properties: {
        tier: 1,
        ticksAtCurrentTier: 999,
        establishedTick: 0,
        totalEssenceSpent: 20,
        maintenanceCurrent: false,
      },
    });

    const promoted = checkTierPromotion(graph, ascendantId);
    expect(promoted).toHaveLength(0);
  });

  it('checkTierPromotion does not promote past tier 4', () => {
    graph.addEdge({
      id: 'edge.thread1',
      source: ascendantId,
      target: agentId,
      type: 'thread',
      properties: {
        tier: 4,
        ticksAtCurrentTier: 999,
        establishedTick: 0,
        totalEssenceSpent: 100,
        maintenanceCurrent: true,
      },
    });

    const promoted = checkTierPromotion(graph, ascendantId);
    expect(promoted).toHaveLength(0);
  });

  it('dropAgent removes thread edge and returns drop result', () => {
    graph.addEdge({
      id: 'edge.thread1',
      source: ascendantId,
      target: agentId,
      type: 'thread',
      properties: {
        tier: 2,
        ticksAtCurrentTier: 50,
        establishedTick: 0,
        totalEssenceSpent: 60,
        maintenanceCurrent: true,
      },
    });

    const result = dropAgent(graph, ascendantId, agentId, 100);

    expect(result.agentId).toBe(agentId);
    expect(result.tierWhenDropped).toBe(2);
    expect(result.narrativeConsequence).toBe('crisis_of_faith');

    const edges = graph.getOutgoingEdges(ascendantId, 'thread');
    expect(edges).toHaveLength(0);
  });

  it('dropAgent assigns scar trait for tier 2+', () => {
    graph.addNode({
      id: 'trait.abandoned_by_divine',
      type: 'trait',
      name: 'Abandoned by the Divine',
      properties: {
        subcategory: 'scar',
        description: 'Once touched by divine purpose, now cast adrift.',
        importance: 0.7,
        maxLevel: 1,
        visibility: 'public',
        domainContributions: { heart: -0.5, star: -0.3 },
        tags: ['divine', 'abandonment'],
        flavorText: 'The silence where a god once whispered.',
      },
    });

    graph.addEdge({
      id: 'edge.thread1',
      source: ascendantId,
      target: agentId,
      type: 'thread',
      properties: {
        tier: 3,
        ticksAtCurrentTier: 90,
        establishedTick: 0,
        totalEssenceSpent: 200,
        maintenanceCurrent: true,
      },
    });

    const result = dropAgent(graph, ascendantId, agentId, 100);

    expect(result.tierWhenDropped).toBe(3);
    expect(result.narrativeConsequence).toBe('wild_card');
    expect(result.scarTraitAssigned).toBe(true);

    const traitEdges = graph.getOutgoingEdges(agentId, 'has_trait');
    const scarEdge = traitEdges.find((e) => e.target === 'trait.abandoned_by_divine');
    expect(scarEdge).toBeDefined();
  });
});
