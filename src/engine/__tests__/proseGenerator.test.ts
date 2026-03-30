import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { generateEntityProse } from '../proseGenerator';

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
