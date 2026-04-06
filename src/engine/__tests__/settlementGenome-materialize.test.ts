// src/engine/__tests__/settlementGenome-materialize.test.ts
import { describe, it, expect } from 'vitest';
import { materializeGenome } from '../settlementGenome/materialize';
import { WorldGraph } from '../graph';
import type { GenomeResult } from '../settlementGenome/types';

describe('materializeGenome', () => {
  it('creates sublocation nodes and contains edges from genome result', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_1', type: 'location', name: 'Test Town',
      properties: { locationSubtype: 'town' },
    });

    const result: GenomeResult = {
      sublocations: [
        { id: 'sublocation-type.inn', sourcePass: 'infrastructure', tags: ['commerce'] },
        { id: 'sublocation-type.barracks', sourcePass: 'sphere', tags: ['military'] },
      ],
      npcs: [],
      archetypeId: null,
      archetypeName: null,
      archetypeProseFlavor: null,
      settlementReachProfile: {} as any,
    };

    materializeGenome(graph, 'loc_1', result, 42);

    const containsEdges = graph.getOutgoingEdges('loc_1', 'contains');
    expect(containsEdges.length).toBe(2);

    // Verify sublocation nodes exist
    for (const edge of containsEdges) {
      const node = graph.getNode(edge.target);
      expect(node).toBeTruthy();
      expect(node!.type).toBe('location');
      expect(node!.properties.sublocationTypeId).toBeTruthy();
    }
  });

  it('stores genome result on location properties', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_1', type: 'location', name: 'Test Town',
      properties: { locationSubtype: 'town' },
    });

    const result: GenomeResult = {
      sublocations: [],
      npcs: [],
      archetypeId: 'garrison-town',
      archetypeName: 'Garrison Town',
      archetypeProseFlavor: 'a town that exists to hold the line',
      settlementReachProfile: {} as any,
    };

    materializeGenome(graph, 'loc_1', result, 42);

    const loc = graph.getNode('loc_1');
    expect(loc!.properties.archetypeId).toBe('garrison-town');
    expect(loc!.properties.archetypeName).toBe('Garrison Town');
  });

  it('skips duplicate sublocation types (idempotent)', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'loc_1', type: 'location', name: 'Test Town',
      properties: { locationSubtype: 'town' },
    });

    const result: GenomeResult = {
      sublocations: [
        { id: 'sublocation-type.inn', sourcePass: 'infrastructure', tags: ['commerce'] },
      ],
      npcs: [],
      archetypeId: null,
      archetypeName: null,
      archetypeProseFlavor: null,
      settlementReachProfile: {} as any,
    };

    // First call
    materializeGenome(graph, 'loc_1', result, 42);
    // Second call (idempotent)
    materializeGenome(graph, 'loc_1', result, 42);

    const containsEdges = graph.getOutgoingEdges('loc_1', 'contains');
    expect(containsEdges.length).toBe(1);
  });

  it('handles missing location gracefully', () => {
    const graph = new WorldGraph();
    const result: GenomeResult = {
      sublocations: [],
      npcs: [],
      archetypeId: null,
      archetypeName: null,
      archetypeProseFlavor: null,
      settlementReachProfile: {} as any,
    };

    // Should not throw
    expect(() => materializeGenome(graph, 'nonexistent', result, 42)).not.toThrow();
  });
});
