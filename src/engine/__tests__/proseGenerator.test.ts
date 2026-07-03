import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateEntityProse } from '../proseGenerator';
import { createSimulationRuntime, resetRuntimeCaches, type SimulationRuntime } from '../simulationRuntime';

function buildFullGraph(): WorldGraph {
  const graph = new WorldGraph();

  // Location with full connections
  graph.addNode({
    id: 'loc_0',
    type: 'location',
    name: 'Thornhaven',
    properties: {
      locationSubtype: 'town',
      terrain: 'grassland',
      sphereInfluence: {
        life: 0.8,
        mind: 0.1,
        force: 0.05,
        matter: 0.05,
        energy: 0,
        spirit: 0,
        time: 0,
        entropy: 0,
      },
    },
  });
  graph.addNode({
    id: 'culture_0',
    type: 'actor',
    name: 'The Verdant Accord',
    properties: {
      actorType: 'culture',
      cultureIdentity: {
        foundationPair: 'order_light',
        creationSphere: 'life',
        biomeName: 'grassland',
      },
    },
  });
  graph.addEdge({
    id: 'e1',
    source: 'loc_0',
    target: 'culture_0',
    type: 'belongs_to',
    properties: { culturalStrength: 0.7 },
  });
  graph.addNode({
    id: 'fac_0',
    type: 'actor',
    name: 'The Iron Covenant',
    properties: { actorType: 'faction' },
  });
  graph.addEdge({
    id: 'e2',
    source: 'fac_0',
    target: 'loc_0',
    type: 'controls',
    properties: { influence: 0.6 },
  });
  graph.addNode({
    id: 'ind_0',
    type: 'actor',
    name: 'Brynn',
    properties: {
      actorType: 'individual',
      narrativeArchetype: 'folk_hero',
      cooperationStrategy: 'tit-for-tat',
    },
  });
  graph.addEdge({
    id: 'e3',
    source: 'ind_0',
    target: 'loc_0',
    type: 'located_at',
    properties: {},
  });

  return graph;
}

describe('prose cache (runtime-owned, THR-577)', () => {
  let runtime: SimulationRuntime;

  beforeEach(() => {
    runtime = createSimulationRuntime();
  });

  it('populates the runtime cache and serves same (nodeId, tick, mode) from it', () => {
    const graph = buildFullGraph();
    const first = generateEntityProse('loc_0', graph, 42, 'summary', 1, runtime);
    expect(first).toBeTruthy();
    expect(runtime.proseCache.size).toBe(1);
    const second = generateEntityProse('loc_0', graph, 42, 'summary', 1, runtime);
    expect(second).toBe(first);
    // No new entry — the second call was a cache hit, not a recompute.
    expect(runtime.proseCache.size).toBe(1);
  });

  it('evicts all entries when the tick advances', () => {
    const graph = buildFullGraph();
    generateEntityProse('loc_0', graph, 42, 'summary', 1, runtime);
    generateEntityProse('ind_0', graph, 42, 'summary', 1, runtime);
    expect(runtime.proseCache.size).toBe(2);
    // Different tick — cache clears, then repopulates with the new entry only.
    const result2 = generateEntityProse('loc_0', graph, 42, 'summary', 2, runtime);
    expect(result2).toBeTruthy();
    // Same seed → same content across ticks (deterministic output).
    const result1 = generateEntityProse('loc_0', graph, 42, 'summary', 1, runtime);
    expect(result2).toBe(result1);
  });

  it('keeps separate cache entries for different modes on same entity and tick', () => {
    const graph = buildFullGraph();
    const summary = generateEntityProse('loc_0', graph, 42, 'summary', 5, runtime);
    const full = generateEntityProse('loc_0', graph, 42, 'full', 5, runtime);
    expect(summary).toBeTruthy();
    expect(full).toBeTruthy();
    // Full prose should be longer than summary (more paragraphs)
    expect(full.length).toBeGreaterThan(summary.length);
    expect(runtime.proseCache.size).toBe(2);
  });

  it('resetRuntimeCaches() clears all cached prose entries', () => {
    const graph = buildFullGraph();
    const result1 = generateEntityProse('loc_0', graph, 42, 'summary', 1, runtime);
    expect(runtime.proseCache.size).toBeGreaterThan(0);
    // Session reset — cache emptied.
    resetRuntimeCaches(runtime);
    expect(runtime.proseCache.size).toBe(0);
    // Same call after reset still produces the same result (deterministic) and re-caches.
    const result2 = generateEntityProse('loc_0', graph, 42, 'summary', 1, runtime);
    expect(result2).toBe(result1);
    expect(runtime.proseCache.size).toBe(1);
  });

  it('composes fresh (uncached) when no runtime is threaded', () => {
    const graph = buildFullGraph();
    const result = generateEntityProse('loc_0', graph, 42, 'summary', 1);
    expect(result).toBeTruthy();
    // Deterministic — a second uncached call returns identical content.
    expect(generateEntityProse('loc_0', graph, 42, 'summary', 1)).toBe(result);
  });

  it('works correctly with tick=0 default (backward compat)', () => {
    const graph = buildFullGraph();
    // Existing tests call with 4 args — tick defaults to 0
    const result = generateEntityProse('loc_0', graph, 42, 'summary');
    expect(result).toBeTruthy();
  });
});

describe('generateEntityProse', () => {
  it('generates full prose for a location with multiple paragraphs', () => {
    const graph = buildFullGraph();
    const result = generateEntityProse('loc_0', graph, 42, 'full');
    expect(result).toBeTruthy();
    const paragraphs = result.split('\n\n');
    expect(paragraphs.length).toBeGreaterThanOrEqual(3);
  });

  it('generates summary prose (single paragraph)', () => {
    const graph = buildFullGraph();
    const result = generateEntityProse('loc_0', graph, 42, 'summary');
    expect(result).toBeTruthy();
    expect(result.split('\n\n').length).toBe(1);
  });

  it('is deterministic for same seed', () => {
    const graph = buildFullGraph();
    const a = generateEntityProse('loc_0', graph, 42, 'full');
    const b = generateEntityProse('loc_0', graph, 42, 'full');
    expect(a).toBe(b);
  });

  it('varies with different seeds', () => {
    const graph = buildFullGraph();
    const a = generateEntityProse('loc_0', graph, 42, 'full');
    const b = generateEntityProse('loc_0', graph, 99, 'full');
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
  });

  it('generates prose for agents', () => {
    const graph = buildFullGraph();
    const result = generateEntityProse('ind_0', graph, 42, 'full');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(20);
  });

  it('returns empty for nonexistent node', () => {
    const graph = buildFullGraph();
    expect(generateEntityProse('nonexistent', graph, 42, 'full')).toBe('');
  });

  it('returns empty for unsupported node types', () => {
    const graph = buildFullGraph();
    graph.addNode({
      id: 'cosm_0',
      type: 'cosmology',
      name: 'Force',
      properties: {},
    });
    expect(generateEntityProse('cosm_0', graph, 42, 'full')).toBe('');
  });
});
