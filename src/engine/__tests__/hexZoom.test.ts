import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getLocationsInHex,
  getAgentsAtLocation,
  getHexSphereInfluence,
  getLineOfSight,
  getLocationConnections,
} from '../hexZoom';

describe('hexZoom engine queries', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();

    // Create 3 locations: 2 in hex (3,4), 1 in hex (5,5)
    graph.addNode({
      id: 'loc.tavern',
      type: 'location',
      name: 'The Rusty Tankard',
      properties: { locationType: 'location', hexCol: 3, hexRow: 4, terrain: 'grassland', sphereBiases: { mind: 0.3 } },
    });
    graph.addNode({
      id: 'loc.temple',
      type: 'location',
      name: 'Sunken Temple',
      properties: { locationType: 'location', hexCol: 3, hexRow: 4, terrain: 'grassland', sphereBiases: { spirit: 0.5 } },
    });
    graph.addNode({
      id: 'loc.forge',
      type: 'location',
      name: 'The Forge',
      properties: { locationType: 'location', hexCol: 5, hexRow: 5, terrain: 'mountains', sphereBiases: { force: 0.4 } },
    });

    // Adjacency between tavern and temple (same hex)
    graph.addEdge({
      id: 'adj.tavern-temple',
      source: 'loc.tavern',
      target: 'loc.temple',
      type: 'adjacent',
      properties: {},
    });

    // Agents at tavern
    graph.addNode({
      id: 'actor.kael',
      type: 'actor',
      name: 'Kael',
      properties: { actorType: 'individual', locationId: 'loc.tavern' },
    });
    graph.addEdge({
      id: 'edge.kael-tavern',
      source: 'actor.kael',
      target: 'loc.tavern',
      type: 'located_at',
      properties: {},
    });

    graph.addNode({
      id: 'actor.mirael',
      type: 'actor',
      name: 'Mirael',
      properties: { actorType: 'individual', locationId: 'loc.temple' },
    });
    graph.addEdge({
      id: 'edge.mirael-temple',
      source: 'actor.mirael',
      target: 'loc.temple',
      type: 'located_at',
      properties: {},
    });

    // Ascendant + avatar in hex (3,4)
    graph.addNode({
      id: 'ascendant.test',
      type: 'actor',
      name: 'Test God',
      properties: { actorType: 'ascendant' },
    });
    graph.addNode({
      id: 'avatar.test',
      type: 'actor',
      name: 'Avatar',
      properties: { actorType: 'individual', locationId: 'loc.tavern' },
    });
    graph.addEdge({
      id: 'edge.avatar-link',
      source: 'avatar.test',
      target: 'ascendant.test',
      type: 'avatar_of',
      properties: {},
    });
    graph.addEdge({
      id: 'edge.avatar-loc',
      source: 'avatar.test',
      target: 'loc.tavern',
      type: 'located_at',
      properties: {},
    });
  });

  // ── getLocationsInHex ──

  describe('getLocationsInHex', () => {
    it('returns locations matching hex coordinates', () => {
      const locs = getLocationsInHex(graph, 3, 4);
      expect(locs).toHaveLength(2);
      expect(locs.map(l => l.id).sort()).toEqual(['loc.tavern', 'loc.temple']);
    });

    it('returns empty array for hex with no locations', () => {
      expect(getLocationsInHex(graph, 0, 0)).toEqual([]);
    });

    it('only returns location-type nodes', () => {
      graph.addNode({
        id: 'actor.wanderer',
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual', hexCol: 3, hexRow: 4 },
      });
      const locs = getLocationsInHex(graph, 3, 4);
      expect(locs).toHaveLength(2);
    });
  });

  // ── getAgentsAtLocation ──

  describe('getAgentsAtLocation', () => {
    it('returns agents with located_at edge to location', () => {
      const agents = getAgentsAtLocation(graph, 'loc.tavern');
      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.name).sort()).toEqual(['Avatar', 'Kael']);
    });

    it('returns empty array for location with no agents', () => {
      graph.addNode({
        id: 'loc.empty',
        type: 'location',
        name: 'Empty Place',
        properties: { locationType: 'location', hexCol: 9, hexRow: 9, terrain: 'desert' },
      });
      expect(getAgentsAtLocation(graph, 'loc.empty')).toEqual([]);
    });
  });

  // ── getHexSphereInfluence ──

  describe('getHexSphereInfluence', () => {
    it('aggregates sphere biases from locations in the hex', () => {
      const influence = getHexSphereInfluence(graph, 3, 4);
      expect(influence.mind).toBeCloseTo(0.3);
      expect(influence.spirit).toBeCloseTo(0.5);
    });

    it('returns zero influence for hex with no locations', () => {
      const influence = getHexSphereInfluence(graph, 0, 0);
      expect(influence.mind).toBe(0);
      expect(influence.spirit).toBe(0);
    });
  });

  // ── getLineOfSight ──

  describe('getLineOfSight', () => {
    it('returns full when avatar is in the same hex', () => {
      expect(getLineOfSight(graph, 'ascendant.test', { col: 3, row: 4 })).toBe('full');
    });

    it('returns partial when avatar is in adjacent hex', () => {
      graph.removeEdge('edge.avatar-loc');
      graph.addNode({
        id: 'loc.nearby',
        type: 'location',
        name: 'Nearby',
        properties: { locationType: 'location', hexCol: 4, hexRow: 4, terrain: 'grassland' },
      });
      graph.addEdge({
        id: 'edge.avatar-nearby',
        source: 'avatar.test',
        target: 'loc.nearby',
        type: 'located_at',
        properties: {},
      });
      expect(getLineOfSight(graph, 'ascendant.test', { col: 3, row: 4 })).toBe('partial');
    });

    it('returns none when avatar is distant', () => {
      graph.removeEdge('edge.avatar-loc');
      graph.addNode({
        id: 'loc.faraway',
        type: 'location',
        name: 'Far Away',
        properties: { locationType: 'location', hexCol: 10, hexRow: 10, terrain: 'grassland' },
      });
      graph.addEdge({
        id: 'edge.avatar-far',
        source: 'avatar.test',
        target: 'loc.faraway',
        type: 'located_at',
        properties: {},
      });
      expect(getLineOfSight(graph, 'ascendant.test', { col: 3, row: 4 })).toBe('none');
    });

    it('returns none when no avatar found', () => {
      graph.removeEdge('edge.avatar-link');
      expect(getLineOfSight(graph, 'ascendant.test', { col: 3, row: 4 })).toBe('none');
    });
  });

  // ── getLocationConnections ──

  describe('getLocationConnections', () => {
    it('returns adjacency edges between specified locations', () => {
      const edges = getLocationConnections(graph, ['loc.tavern', 'loc.temple']);
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe('loc.tavern');
      expect(edges[0].target).toBe('loc.temple');
    });

    it('excludes edges to locations outside the set', () => {
      graph.addEdge({
        id: 'adj.tavern-forge',
        source: 'loc.tavern',
        target: 'loc.forge',
        type: 'adjacent',
        properties: {},
      });
      const edges = getLocationConnections(graph, ['loc.tavern', 'loc.temple']);
      expect(edges).toHaveLength(1);
    });

    it('returns empty for locations with no connections', () => {
      expect(getLocationConnections(graph, ['loc.forge'])).toEqual([]);
    });
  });
});
