import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { resourcesResolver } from '../proseResolvers';
import type { ResourceInstance } from '../../types/resource';

function makeLocationWithResources(
  resources: Record<string, ResourceInstance>,
): { graph: WorldGraph; nodeId: string } {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'loc_test',
    type: 'location',
    name: 'Test Location',
    properties: {
      terrain: 'temperate_forest',
      locationSubtype: 'hamlet',
      resources,
    },
  });
  return { graph, nodeId: 'loc_test' };
}

describe('resourcesResolver', () => {
  it('returns prose for location with abundant timber', () => {
    const { graph, nodeId } = makeLocationWithResources({
      timber: { quantity: 75, renewable: true, renewalRate: 0.3 },
    });
    const layers = resourcesResolver(nodeId, graph, 42);
    expect(layers).toHaveLength(1);
    expect(layers[0].category).toBe('resources');
    expect(layers[0].priority).toBe(65);
    expect(layers[0].source).toBe('resourcesResolver');
    expect(layers[0].text.length).toBeGreaterThan(10);
  });

  it('returns scarce variant prose for low-quantity resources', () => {
    const { graph, nodeId } = makeLocationWithResources({
      stone: { quantity: 15, renewable: false, renewalRate: 0 },
    });
    const layers = resourcesResolver(nodeId, graph, 42);
    expect(layers).toHaveLength(1);
    // Scarce prose should mention scarcity themes
    expect(layers[0].text.length).toBeGreaterThan(10);
  });

  it('returns empty array for location with no resources', () => {
    const { graph, nodeId } = makeLocationWithResources({});
    const layers = resourcesResolver(nodeId, graph, 42);
    expect(layers).toHaveLength(0);
  });

  it('returns empty array for location with exhausted resources', () => {
    const { graph, nodeId } = makeLocationWithResources({
      timber: { quantity: 0, renewable: true, renewalRate: 0.3 },
    });
    const layers = resourcesResolver(nodeId, graph, 42);
    expect(layers).toHaveLength(0);
  });

  it('picks the most abundant resource for prose', () => {
    const { graph, nodeId } = makeLocationWithResources({
      timber: { quantity: 30, renewable: true, renewalRate: 0.3 },
      stone: { quantity: 80, renewable: false, renewalRate: 0 },
    });
    const layers = resourcesResolver(nodeId, graph, 42);
    expect(layers).toHaveLength(1);
    // The prose should be about stone since it's the most abundant
    expect(layers[0].source).toBe('resourcesResolver');
  });

  it('returns empty for non-location nodes', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'actor_1',
      type: 'actor',
      name: 'Test Actor',
      properties: { actorType: 'individual' },
    });
    const layers = resourcesResolver('actor_1', graph, 42);
    expect(layers).toHaveLength(0);
  });

  it('returns empty for missing node', () => {
    const graph = new WorldGraph();
    const layers = resourcesResolver('nonexistent', graph, 42);
    expect(layers).toHaveLength(0);
  });

  it('is deterministic — same seed produces same prose', () => {
    const make = () => makeLocationWithResources({
      timber: { quantity: 75, renewable: true, renewalRate: 0.3 },
      stone: { quantity: 60, renewable: false, renewalRate: 0 },
    });
    const a = resourcesResolver(make().nodeId, make().graph, 42);
    const b = resourcesResolver(make().nodeId, make().graph, 42);
    expect(a).toEqual(b);
  });
});
