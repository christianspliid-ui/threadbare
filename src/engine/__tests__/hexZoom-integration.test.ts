// src/engine/__tests__/hexZoom-integration.test.ts
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getLocationsInHex,
  getAgentsAtLocation,
  getHexSphereInfluence,
  getLineOfSight,
  getLocationConnections,
} from '../hexZoom';
import { getPolygonVertices } from '../../lib/polygonLayout';

describe('Hex Zoom integration', () => {
  it('full hex zoom flow: locations → agents → layout → connections → sight', () => {
    const graph = new WorldGraph();

    // Create 3 locations in hex (5, 3)
    const locIds = ['loc.a', 'loc.b', 'loc.c'];
    for (const id of locIds) {
      graph.addNode({
        id,
        type: 'location',
        name: `Location ${id}`,
        properties: { locationType: 'location', hexCol: 5, hexRow: 3, terrain: 'forest', sphereBiases: { mind: 0.1 } },
      });
    }

    // Connect a→b, b→c
    graph.addEdge({ id: 'adj.ab', source: 'loc.a', target: 'loc.b', type: 'adjacent', properties: {} });
    graph.addEdge({ id: 'adj.bc', source: 'loc.b', target: 'loc.c', type: 'adjacent', properties: {} });

    // Place agents
    graph.addNode({ id: 'actor.1', type: 'actor', name: 'Agent1', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.1', source: 'actor.1', target: 'loc.a', type: 'located_at', properties: {} });

    // Ascendant + avatar in same hex
    graph.addNode({ id: 'asc.1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'avt.1', type: 'actor', name: 'Avatar', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.avt', source: 'avt.1', target: 'asc.1', type: 'avatar_of', properties: {} });
    graph.addEdge({ id: 'e.avt.loc', source: 'avt.1', target: 'loc.a', type: 'located_at', properties: {} });

    // 1. Query locations
    const locs = getLocationsInHex(graph, 5, 3);
    expect(locs).toHaveLength(3);

    // 2. Query agents per location
    const agentsA = getAgentsAtLocation(graph, 'loc.a');
    expect(agentsA).toHaveLength(2); // Agent1 + Avatar

    // 3. Compute polygon layout
    const vertices = getPolygonVertices(locs.length, 300, 300, 170);
    expect(vertices).toHaveLength(3);
    // Triangle: all points equidistant from center
    for (const v of vertices) {
      const dist = Math.sqrt((v.x - 300) ** 2 + (v.y - 300) ** 2);
      expect(dist).toBeCloseTo(170);
    }

    // 4. Get connections
    const connections = getLocationConnections(graph, locIds);
    expect(connections).toHaveLength(2); // a→b and b→c

    // 5. Check line of sight
    expect(getLineOfSight(graph, 'asc.1', { col: 5, row: 3 })).toBe('full');

    // 6. Sphere influence
    const influence = getHexSphereInfluence(graph, 5, 3);
    expect(influence.mind).toBeCloseTo(0.3); // 3 locations × 0.1
  });
});
