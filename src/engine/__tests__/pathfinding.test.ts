import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { findShortestPath } from '../pathfinding';

describe('findShortestPath (Dijkstra)', () => {
  describe('basic pathfinding', () => {
    it('returns path for direct neighbor (1 hop) on grassland', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const startId = 'hex_a';
      const endId = 'hex_b';

      // Agent
      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      // Start hex (grassland)
      graph.addNode({
        id: startId,
        type: 'location',
        name: 'Hex A',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      // End hex (grassland)
      graph.addNode({
        id: endId,
        type: 'location',
        name: 'Hex B',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      // Adjacent edge (bidirectional for undirected graph)
      graph.addEdge({
        id: 'edge_a_b',
        source: startId,
        target: endId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_b_a',
        source: endId,
        target: startId,
        type: 'adjacent',
        properties: {},
      });

      const result = findShortestPath(graph, agentId, startId, endId);

      expect(result).not.toBeNull();
      expect(result?.path).toEqual([endId]);
      // 2-edge model: grassland→grassland = 2 ticks
      expect(result?.totalCost).toBe(2);
    });

    it('returns path for two-hop route A→B→C', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const startId = 'hex_a';
      const midId = 'hex_b';
      const endId = 'hex_c';

      // Agent
      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      // Create three hexes in a line
      for (const [id, col, name] of [
        [startId, 0, 'Hex A'] as const,
        [midId, 1, 'Hex B'] as const,
        [endId, 2, 'Hex C'] as const,
      ]) {
        graph.addNode({
          id,
          type: 'location',
          name,
          properties: {
            terrain: 'grassland',
            locationType: 'hex_center',
            hexCol: col,
            hexRow: 0,
          },
        });
      }

      // A ↔ B ↔ C (bidirectional)
      graph.addEdge({
        id: 'edge_a_b',
        source: startId,
        target: midId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_b_a',
        source: midId,
        target: startId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_b_c',
        source: midId,
        target: endId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_c_b',
        source: endId,
        target: midId,
        type: 'adjacent',
        properties: {},
      });

      const result = findShortestPath(graph, agentId, startId, endId);

      expect(result).not.toBeNull();
      expect(result?.path).toEqual([midId, endId]);
      // 2-edge model: 2 hops × 2 ticks grassland = 4 ticks
      expect(result?.totalCost).toBe(4);
    });

    it('returns empty path with zero cost when start === end', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_test';
      const nodeId = 'hex_a';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Test',
        properties: { actorType: 'individual' },
      });

      graph.addNode({
        id: nodeId,
        type: 'location',
        name: 'Hex A',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const result = findShortestPath(graph, agentId, nodeId, nodeId);

      expect(result).not.toBeNull();
      expect(result?.path).toEqual([]);
      expect(result?.totalCost).toBe(0);
    });
  });

  describe('unreachable destinations', () => {
    it('returns null when end node is isolated (no edges)', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const startId = 'hex_a';
      const isolatedId = 'hex_isolated';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      graph.addNode({
        id: startId,
        type: 'location',
        name: 'Hex A',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      graph.addNode({
        id: isolatedId,
        type: 'location',
        name: 'Isolated Hex',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 5,
          hexRow: 5,
        },
      });

      const result = findShortestPath(graph, agentId, startId, isolatedId);

      expect(result).toBeNull();
    });

    it('returns null when only path to end is through impassable (Infinity cost) ocean', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const startId = 'hex_plains';
      const oceanId = 'hex_ocean';
      const endId = 'hex_island';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      // Start on plains
      graph.addNode({
        id: startId,
        type: 'location',
        name: 'Plains',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      // Ocean in the middle (impassable)
      graph.addNode({
        id: oceanId,
        type: 'location',
        name: 'Ocean',
        properties: {
          terrain: 'ocean',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      // Island at end
      graph.addNode({
        id: endId,
        type: 'location',
        name: 'Island',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 2,
          hexRow: 0,
        },
      });

      // Plains ↔ Ocean ↔ Island (but ocean is impassable)
      graph.addEdge({
        id: 'edge_plains_ocean',
        source: startId,
        target: oceanId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_ocean_plains',
        source: oceanId,
        target: startId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_ocean_island',
        source: oceanId,
        target: endId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_island_ocean',
        source: endId,
        target: oceanId,
        type: 'adjacent',
        properties: {},
      });

      const result = findShortestPath(graph, agentId, startId, endId);

      expect(result).toBeNull();
    });
  });

  describe('cost-based routing', () => {
    it('prefers lower-cost terrain: plains (cost 2) over mountains (cost 3.5)', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const startId = 'hex_start';
      const plainsId = 'hex_plains';
      const mountainId = 'hex_mountain';
      const endId = 'hex_end';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      // Create start, two middle options, and end
      graph.addNode({
        id: startId,
        type: 'location',
        name: 'Start',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      graph.addNode({
        id: plainsId,
        type: 'location',
        name: 'Plains',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      graph.addNode({
        id: mountainId,
        type: 'location',
        name: 'Mountain',
        properties: {
          terrain: 'mountains',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 1,
        },
      });

      graph.addNode({
        id: endId,
        type: 'location',
        name: 'End',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 2,
          hexRow: 0,
        },
      });

      // start → plains → end (cost: 2 + 2 = 4) — 2-edge model
      // start → mountain → end (cost: 2+1.5 + 2 = 5.5) — mountains have +1.5 arrival tax
      graph.addEdge({
        id: 'edge_start_plains',
        source: startId,
        target: plainsId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_plains_start',
        source: plainsId,
        target: startId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_plains_end',
        source: plainsId,
        target: endId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_end_plains',
        source: endId,
        target: plainsId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_start_mountain',
        source: startId,
        target: mountainId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_mountain_start',
        source: mountainId,
        target: startId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_mountain_end',
        source: mountainId,
        target: endId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_end_mountain',
        source: endId,
        target: mountainId,
        type: 'adjacent',
        properties: {},
      });

      const result = findShortestPath(graph, agentId, startId, endId);

      expect(result).not.toBeNull();
      // Should pick plains route (lower cost)
      expect(result?.path).toEqual([plainsId, endId]);
      // 2-edge model: 2 hops × 2 ticks grassland = 4 ticks
      expect(result?.totalCost).toBe(4);
    });
  });

  describe('within-hex navigation', () => {
    it('navigates within hex via contains edges: hex_center→loc_city, cost includes entry tax', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const hexCenterId = 'hex_a_center';
      const cityLocationId = 'loc_city_a';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      // Hex center
      graph.addNode({
        id: hexCenterId,
        type: 'location',
        name: 'Hex A Center',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      // City within hex
      graph.addNode({
        id: cityLocationId,
        type: 'location',
        name: 'City A',
        properties: {
          locationSubtype: 'city',
          locationType: 'location',
          terrain: 'grassland',
        },
      });

      // contains edge: hex_center → city (cost 2 base + 1 city entry = 3)
      graph.addEdge({
        id: 'edge_hex_city',
        source: hexCenterId,
        target: cityLocationId,
        type: 'contains',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_city_hex',
        source: cityLocationId,
        target: hexCenterId,
        type: 'contains',
        properties: {},
      });

      const result = findShortestPath(graph, agentId, hexCenterId, cityLocationId);

      expect(result).not.toBeNull();
      expect(result?.path).toEqual([cityLocationId]);
      // 2-edge model: 2 (base) + 1 (city entry tax) = 3
      expect(result?.totalCost).toBe(3);
    });
  });

  describe('node type filtering', () => {
    it('skips non-location nodes (only traverses location type)', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const startId = 'hex_a';
      const nonLocationId = 'actor_npc';
      const endId = 'hex_b';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      // Start hex
      graph.addNode({
        id: startId,
        type: 'location',
        name: 'Hex A',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      // Non-location node (actor)
      graph.addNode({
        id: nonLocationId,
        type: 'actor',
        name: 'NPC',
        properties: { actorType: 'individual' },
      });

      // End hex
      graph.addNode({
        id: endId,
        type: 'location',
        name: 'Hex B',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      // Direct path through non-location (should be skipped)
      graph.addEdge({
        id: 'edge_a_npc',
        source: startId,
        target: nonLocationId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_npc_b',
        source: nonLocationId,
        target: endId,
        type: 'adjacent',
        properties: {},
      });

      // Proper path: start → end (direct)
      graph.addEdge({
        id: 'edge_a_b',
        source: startId,
        target: endId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_b_a',
        source: endId,
        target: startId,
        type: 'adjacent',
        properties: {},
      });

      const result = findShortestPath(graph, agentId, startId, endId);

      expect(result).not.toBeNull();
      // Should use direct route, avoiding non-location NPC
      expect(result?.path).toEqual([endId]);
      // 2-edge model: grassland→grassland = 2 ticks
      expect(result?.totalCost).toBe(2);
    });
  });

  describe('return type validation', () => {
    it('returns PathResult with path array and totalCost number', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_test';
      const startId = 'hex_a';
      const endId = 'hex_b';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Test',
        properties: { actorType: 'individual' },
      });

      graph.addNode({
        id: startId,
        type: 'location',
        name: 'Hex A',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      graph.addNode({
        id: endId,
        type: 'location',
        name: 'Hex B',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      graph.addEdge({
        id: 'edge_a_b',
        source: startId,
        target: endId,
        type: 'adjacent',
        properties: {},
      });

      graph.addEdge({
        id: 'edge_b_a',
        source: endId,
        target: startId,
        type: 'adjacent',
        properties: {},
      });

      const result = findShortestPath(graph, agentId, startId, endId);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('totalCost');
      expect(Array.isArray(result?.path)).toBe(true);
      expect(typeof result?.totalCost).toBe('number');
    });
  });
});
