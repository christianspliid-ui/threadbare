import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { computeEdgeCost } from '../movementCost';
import {
  BASE_EDGE_TRAVERSAL_COST,
  type MovementEdgeCost,
} from '../../types/movement';
import { MIN_EDGE_COST } from '../../data/movement-content';

describe('computeEdgeCost', () => {
  describe('basic terrain and location tax calculations', () => {
    it('plains hex with no modifiers yields baseCost=1, terrainTax=0, totalCost=1', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const sourceId = 'hex_a_center';
      const destId = 'hex_b_center';

      // Create actor node
      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      // Create destination hex with grassland terrain (tax 0)
      graph.addNode({
        id: destId,
        type: 'location',
        name: 'Hex B Center',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      // Create source hex for completeness (not directly used in calculation)
      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Hex A Center',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost.baseCost).toBe(BASE_EDGE_TRAVERSAL_COST);
      expect(cost.terrainTax).toBe(0);
      expect(cost.locationTax).toBe(0);
      expect(cost.speedModifier).toBe(0);
      expect(cost.totalCost).toBe(1);
    });

    it('mountain destination yields terrainTax=1.5, totalCost=2.5', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const sourceId = 'hex_a';
      const destId = 'hex_mountain';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      // Mountains terrain has tax of 1.5
      graph.addNode({
        id: destId,
        type: 'location',
        name: 'Mountain Hex',
        properties: {
          terrain: 'mountains',
          locationType: 'hex_center',
          hexCol: 5,
          hexRow: 3,
        },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source Hex',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 4,
          hexRow: 3,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost.baseCost).toBe(1);
      expect(cost.terrainTax).toBe(1.5);
      expect(cost.locationTax).toBe(0);
      expect(cost.speedModifier).toBe(0);
      expect(cost.totalCost).toBe(2.5);
    });

    it('city destination yields locationTax=1, totalCost=2', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_wanderer';
      const sourceId = 'hex_a';
      const destId = 'loc_city';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Wanderer',
        properties: { actorType: 'individual' },
      });

      // City location has entry tax of 1
      graph.addNode({
        id: destId,
        type: 'location',
        name: 'The Grand City',
        properties: {
          locationSubtype: 'city',
          locationType: 'location',
          terrain: 'grassland', // base terrain is still grassland
        },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source Hex',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost.baseCost).toBe(1);
      expect(cost.terrainTax).toBe(0);
      expect(cost.locationTax).toBe(1);
      expect(cost.speedModifier).toBe(0);
      expect(cost.totalCost).toBe(2);
    });
  });

  describe('speed modifiers from agent traits', () => {
    it('agent with movement_speed=-5 trait floors at MIN_EDGE_COST=0.5', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_swift';
      const sourceId = 'hex_a';
      const destId = 'hex_b';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Swift Runner',
        properties: { actorType: 'individual' },
      });

      // Add trait edge with movement_speed modifier
      graph.addEdge({
        id: 'trait_fleet_footed',
        source: agentId,
        target: agentId,
        type: 'has_trait',
        properties: {
          traitId: 'fleet_footed',
          movement_speed: -5,
        },
      });

      graph.addNode({
        id: destId,
        type: 'location',
        name: 'Destination',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost.baseCost).toBe(1);
      expect(cost.speedModifier).toBe(-5);
      // 1 + 0 + 0 + (-5) = -4, floored at 0.5
      expect(cost.totalCost).toBe(MIN_EDGE_COST);
    });

    it('combines multiple movement_speed modifiers from multiple traits', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_enhanced';
      const sourceId = 'hex_a';
      const destId = 'hex_b';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Enhanced Runner',
        properties: { actorType: 'individual' },
      });

      // Add first trait with movement_speed
      graph.addEdge({
        id: 'trait_swift_1',
        source: agentId,
        target: agentId,
        type: 'has_trait',
        properties: {
          traitId: 'fleet_footed',
          movement_speed: -0.5,
        },
      });

      // Add second trait with movement_speed
      graph.addEdge({
        id: 'trait_swift_2',
        source: agentId,
        target: agentId,
        type: 'has_trait',
        properties: {
          traitId: 'elf_agility',
          movement_speed: -0.3,
        },
      });

      graph.addNode({
        id: destId,
        type: 'location',
        name: 'Destination',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost.baseCost).toBe(1);
      expect(cost.speedModifier).toBe(-0.8); // -0.5 + -0.3
      expect(cost.totalCost).toBe(MIN_EDGE_COST); // 1 + 0 + 0 + (-0.8) = 0.2, floored at 0.5
    });
  });

  describe('explicit entryTax override', () => {
    it('uses explicit entryTax property when present on destination node', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_test';
      const sourceId = 'hex_a';
      const destId = 'loc_special';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Test Actor',
        properties: { actorType: 'individual' },
      });

      // Location with explicit entryTax override
      graph.addNode({
        id: destId,
        type: 'location',
        name: 'Special Location',
        properties: {
          locationSubtype: 'city',
          locationType: 'location',
          terrain: 'grassland',
          entryTax: 2.5, // explicit override (city normally is 1)
        },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost.locationTax).toBe(2.5);
      expect(cost.totalCost).toBe(3.5); // 1 + 0 + 2.5
    });
  });

  describe('edge cases', () => {
    it('handles missing destination node gracefully (returns 0 tax)', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_test';
      const sourceId = 'hex_a';
      const destId = 'nonexistent_hex';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Test Actor',
        properties: { actorType: 'individual' },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      // Missing dest means no terrain/location tax
      expect(cost.baseCost).toBe(1);
      expect(cost.terrainTax).toBe(0);
      expect(cost.locationTax).toBe(0);
      expect(cost.totalCost).toBe(1);
    });

    it('handles agent with no trait edges', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_plain';
      const sourceId = 'hex_a';
      const destId = 'hex_b';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Plain Actor',
        properties: { actorType: 'individual' },
      });

      graph.addNode({
        id: destId,
        type: 'location',
        name: 'Destination',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost.speedModifier).toBe(0);
      expect(cost.totalCost).toBe(1);
    });

    it('handles trait edges with no movement_speed property', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_test';
      const sourceId = 'hex_a';
      const destId = 'hex_b';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Test Actor',
        properties: { actorType: 'individual' },
      });

      // Add trait edge without movement_speed
      graph.addEdge({
        id: 'trait_other',
        source: agentId,
        target: agentId,
        type: 'has_trait',
        properties: {
          traitId: 'some_other_trait',
          level: 3,
        },
      });

      graph.addNode({
        id: destId,
        type: 'location',
        name: 'Destination',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost.speedModifier).toBe(0);
      expect(cost.totalCost).toBe(1);
    });

    it('handles terrain and location taxes together', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_test';
      const sourceId = 'hex_a';
      const destId = 'loc_mountain_city';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Test Actor',
        properties: { actorType: 'individual' },
      });

      // Mountain location with city overlay
      graph.addNode({
        id: destId,
        type: 'location',
        name: 'Mountain City',
        properties: {
          terrain: 'mountains', // tax 1.5
          locationSubtype: 'city', // tax 1
          locationType: 'location',
        },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost.baseCost).toBe(1);
      expect(cost.terrainTax).toBe(1.5);
      expect(cost.locationTax).toBe(1);
      expect(cost.totalCost).toBe(3.5);
    });
  });

  describe('return type structure', () => {
    it('returns object with all required MovementEdgeCost fields', () => {
      const graph = new WorldGraph();
      const agentId = 'actor_test';
      const sourceId = 'hex_a';
      const destId = 'hex_b';

      graph.addNode({
        id: agentId,
        type: 'actor',
        name: 'Test Actor',
        properties: { actorType: 'individual' },
      });

      graph.addNode({
        id: destId,
        type: 'location',
        name: 'Destination',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 1,
          hexRow: 0,
        },
      });

      graph.addNode({
        id: sourceId,
        type: 'location',
        name: 'Source',
        properties: {
          terrain: 'grassland',
          locationType: 'hex_center',
          hexCol: 0,
          hexRow: 0,
        },
      });

      const cost = computeEdgeCost(graph, agentId, sourceId, destId);

      expect(cost).toHaveProperty('baseCost');
      expect(cost).toHaveProperty('terrainTax');
      expect(cost).toHaveProperty('locationTax');
      expect(cost).toHaveProperty('speedModifier');
      expect(cost).toHaveProperty('totalCost');
      expect(typeof cost.baseCost).toBe('number');
      expect(typeof cost.terrainTax).toBe('number');
      expect(typeof cost.locationTax).toBe('number');
      expect(typeof cost.speedModifier).toBe('number');
      expect(typeof cost.totalCost).toBe('number');
    });
  });
});
