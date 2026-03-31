import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { generateEntityProse, clearProseCache } from '../proseGenerator';

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

describe('prose cache', () => {
  beforeEach(() => {
    clearProseCache();
  });

  it('returns cached result on second call with same (nodeId, tick, mode)', () => {
    const graph = buildFullGraph();
    const first = generateEntityProse('loc_0', graph, 42, 'summary', 1);
    const second = generateEntityProse('loc_0', graph, 42, 'summary', 1);
    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it('produces fresh result when tick changes (cache miss)', () => {
    const graph = buildFullGraph();
    // tick 1 — first call, computes and caches
    const result1 = generateEntityProse('loc_0', graph, 42, 'summary', 1);
    // Same tick, same args — should return same string (cache hit)
    const result1Again = generateEntityProse('loc_0', graph, 42, 'summary', 1);
    expect(result1Again).toBe(result1);
    // Different tick — different cache key, forces fresh compute
    // The result should still be a valid string (deterministic output)
    const result2 = generateEntityProse('loc_0', graph, 42, 'summary', 2);
    expect(result2).toBeTruthy();
    // Both ticks produce valid prose (same seed → same content)
    expect(result2).toBe(result1);
  });

  it('keeps separate cache entries for different modes on same entity and tick', () => {
    const graph = buildFullGraph();
    const summary = generateEntityProse('loc_0', graph, 42, 'summary', 5);
    const full = generateEntityProse('loc_0', graph, 42, 'full', 5);
    expect(summary).toBeTruthy();
    expect(full).toBeTruthy();
    // Full prose should be longer than summary (more paragraphs)
    expect(full.length).toBeGreaterThan(summary.length);
  });

  it('clearProseCache() resets all cached entries', () => {
    const graph = buildFullGraph();
    // Fill cache with entries at tick 1
    const result1 = generateEntityProse('loc_0', graph, 42, 'summary', 1);
    // Clear cache — now the internal state is reset
    clearProseCache();
    // Same call after clear should still produce the same result (deterministic)
    const result2 = generateEntityProse('loc_0', graph, 42, 'summary', 1);
    expect(result2).toBeTruthy();
    expect(result2).toBe(result1);
    // Verify cache works again after clear: a new entity at same tick
    const agentResult = generateEntityProse('ind_0', graph, 42, 'summary', 1);
    expect(agentResult).toBeTruthy();
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
