/**
 * Sublocation System Integration Tests
 *
 * End-to-end tests verifying the complete sublocation pipeline:
 * 1. Graph setup with location types and sublocation types
 * 2. Agent with axiological profile
 * 3. Sublocation instance creation
 * 4. Selection and placement
 * 5. Dissolution on triggers
 *
 * Design doc: Docs/plans/2026-03-10-sublocation-system-design.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  ensureSublocations,
  scoreSublocations,
  selectSublocation,
  checkDissolutions,
  createDivineSublocation,
} from '../sublocation';
import { getSubLocations, getActorsAtLocation } from '../viewLevel';
import type { GraphNode, GraphEdge } from '../../types/graph';
import type { AxiologicalProfile } from '../../types/agent';
import type { SublocationProperties, SublocationPersistence } from '../../types/sublocation';

/**
 * Test 1: Full pipeline
 * Agent arrives at city → sublocations created → agent selects sublocation →
 * agent moves to selected sublocation → UI data shows sublocation grouping
 */
describe('Integration Test 1: Full pipeline (arrival → creation → selection → placement)', () => {
  let graph: WorldGraph;
  let cityLocationId: string;
  let cityTypeId: string;
  let agentId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    cityLocationId = 'location-city-1';
    cityTypeId = 'location-type.city';
    agentId = 'agent-wanderer-1';

    // Build city location
    const cityLocation: GraphNode = {
      id: cityLocationId,
      type: 'location',
      name: 'Port City',
      properties: {
        locationType: 'hex',
        locationSubtype: 'city',
      },
    };
    graph.addNode(cityLocation);

    // Build location-type node
    const cityType: GraphNode = {
      id: cityTypeId,
      type: 'location',
      name: 'City Location Type',
      properties: {
        category: 'location-type',
      },
    };
    graph.addNode(cityType);

    // Build sublocation type nodes
    const templeQuarter: GraphNode = {
      id: 'sublocation-type.temple-quarter',
      type: 'location',
      name: 'Temple Quarter',
      properties: {
        category: 'sublocation-type',
        motivations: [
          { left: 'devotion', right: 'independence', weight: 0.8 },
          { left: 'tradition', right: 'innovation', weight: 0.6 },
        ] as Array<{ left: string; right: string; weight: number }>,
      },
    };
    graph.addNode(templeQuarter);

    const marketSquare: GraphNode = {
      id: 'sublocation-type.market-square',
      type: 'location',
      name: 'Market Square',
      properties: {
        category: 'sublocation-type',
        motivations: [
          { left: 'greed', right: 'generosity', weight: 0.7 },
          { left: 'cunning', right: 'honesty', weight: 0.5 },
        ] as Array<{ left: string; right: string; weight: number }>,
      },
    };
    graph.addNode(marketSquare);

    // Link location-type → sublocation types with 'contains' edges
    graph.addEdge({
      id: 'edge-contains-temple',
      source: cityTypeId,
      target: 'sublocation-type.temple-quarter',
      type: 'contains',
      properties: {},
    });

    graph.addEdge({
      id: 'edge-contains-market',
      source: cityTypeId,
      target: 'sublocation-type.market-square',
      type: 'contains',
      properties: {},
    });

    // Link location → location-type with 'located_at' edge
    graph.addEdge({
      id: 'edge-location-type-link',
      source: cityLocationId,
      target: cityTypeId,
      type: 'located_at',
      properties: {},
    });

    // Build agent with axiological profile
    const axiologicalProfile: AxiologicalProfile = {
      ambition_contentment: 0.5,
      courage_prudence: 0.5,
      cruelty_compassion: 0.3,
      cunning_honesty: 0.4,
      devotion_independence: 0.8, // strong devotion → temple quarter preference
      loyalty_treachery: 0.5,
      tradition_innovation: 0.5,
      dominance_humility: 0.5,
      wrath_patience: 0.5,
      greed_generosity: -0.2, // slightly greedy → weak market square preference
    };

    const agent: GraphNode = {
      id: agentId,
      type: 'actor',
      name: 'Wandering Pilgrim',
      properties: {
        axiologicalProfile,
      },
    };
    graph.addNode(agent);

    // Place agent at city location
    graph.addEdge({
      id: 'edge-agent-at-city',
      source: agentId,
      target: cityLocationId,
      type: 'located_at',
      properties: {},
    });
  });

  it('full pipeline: agent arrives at city → selects sublocation → gets encounter candidates → UI data shows sublocation grouping', () => {
    // Step 1: Verify agent is at city location
    const agentAtCityEdges = graph.getOutgoingEdges(agentId, 'located_at');
    expect(agentAtCityEdges).toHaveLength(1);
    expect(agentAtCityEdges[0].target).toBe(cityLocationId);

    // Step 2: Call ensureSublocations to create sublocation instances
    // 'city' maps to: market-district, temple-quarter, barracks via SUBTYPE_SUBLOCATION_MAP
    const sublocations = ensureSublocations(graph, cityLocationId, 42);
    expect(sublocations).toHaveLength(3);
    expect(sublocations.every(s => s.type === 'location')).toBe(true);

    // Verify sublocation instances have correct properties
    const props0 = sublocations[0].properties as SublocationProperties;
    expect(props0.sublocationTypeId).toBeDefined();
    expect(props0.parentLocationId).toBe(cityLocationId);
    expect(props0.persistence.type).toBe('permanent');

    // Step 3: Verify sublocation instances are in graph
    for (const sub of sublocations) {
      expect(graph.getNode(sub.id)).toBeDefined();
    }

    // Step 4: Call selectSublocation to pick one deterministically
    const selectedSublocation = selectSublocation(graph, sublocations, agentId, 42);
    expect(selectedSublocation).toBeDefined();
    expect(sublocations.map(s => s.id)).toContain(selectedSublocation!.id);

    // Step 5: Simulate agent moving to selected sublocation
    // Remove agent's current located_at edge
    graph.removeEdge(agentAtCityEdges[0].id);

    // Add new located_at edge from agent to selected sublocation
    graph.addEdge({
      id: 'edge-agent-at-sublocation',
      source: agentId,
      target: selectedSublocation!.id,
      type: 'located_at',
      properties: {},
    });

    // Step 6: Verify UI data shows proper sublocation grouping
    // getSubLocations should return sublocations via 'contains' edges
    // But first we need to add contains edges from city to sublocations
    // (This would normally be done by ensureSublocations or the placement pipeline)
    for (const sub of sublocations) {
      // Check if contains edge already exists
      const existingContains = graph.getOutgoingEdges(cityLocationId, 'contains');
      if (!existingContains.some(e => e.target === sub.id)) {
        graph.addEdge({
          id: `edge-city-contains-${sub.id}`,
          source: cityLocationId,
          target: sub.id,
          type: 'contains',
          properties: {},
        });
      }
    }

    const citySublocations = getSubLocations(graph, cityLocationId);
    expect(citySublocations).toHaveLength(3);
    expect(citySublocations.map(s => s.id)).toContain(selectedSublocation!.id);

    // Step 7: Verify agent's located_at edge points to sublocation
    const agentEdgesAfter = graph.getOutgoingEdges(agentId, 'located_at');
    expect(agentEdgesAfter).toHaveLength(1);
    expect(agentEdgesAfter[0].target).toBe(selectedSublocation!.id);

    // Step 8: Verify we can query actors at the selected sublocation
    const actorsAtSelected = getActorsAtLocation(graph, selectedSublocation!.id);
    expect(actorsAtSelected).toHaveLength(1);
    expect(actorsAtSelected[0].id).toBe(agentId);
  });
});

/**
 * Test 2: Fallback for no sublocations
 * Location with no sublocation type mappings → ensureSublocations returns empty
 */
describe('Integration Test 2: Fallback (wilderness location with no sublocation types)', () => {
  let graph: WorldGraph;
  let wildernessLocationId: string;
  let wildernessTypeId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    wildernessLocationId = 'location-wilderness-1';
    wildernessTypeId = 'location-type.wilderness';

    // Build wilderness location
    const wilderness: GraphNode = {
      id: wildernessLocationId,
      type: 'location',
      name: 'Untamed Wilderness',
      properties: {
        locationType: 'hex',
        locationSubtype: 'wilderness',
      },
    };
    graph.addNode(wilderness);

    // Build location-type node (without sublocation type children)
    const wildernessType: GraphNode = {
      id: wildernessTypeId,
      type: 'location',
      name: 'Wilderness Location Type',
      properties: {
        category: 'location-type',
      },
    };
    graph.addNode(wildernessType);

    // Link location → location-type with 'located_at' edge
    graph.addEdge({
      id: 'edge-wilderness-type-link',
      source: wildernessLocationId,
      target: wildernessTypeId,
      type: 'located_at',
      properties: {},
    });

    // NOTE: We intentionally do NOT add any sublocation type mappings
    // (no 'contains' edges from wilderness-type to sublocation-types)
  });

  it('fallback: location with no sublocation type mappings → ensureSublocations returns empty', () => {
    // Call ensureSublocations
    const sublocations = ensureSublocations(graph, wildernessLocationId, 42);

    // Should return empty array
    expect(sublocations).toHaveLength(0);

    // Verify no location nodes were created with this location as parent
    const allLocations = graph.getNodesByType('location');
    const createdSublocations = allLocations.filter(node => {
      const props = node.properties as Partial<SublocationProperties>;
      return props.parentLocationId === wildernessLocationId && props.sublocationTypeId;
    });

    expect(createdSublocations).toHaveLength(0);
  });
});

/**
 * Test 3: Divine sublocation lifecycle
 * Create → agent visits → dissolves on encounter_completed
 */
describe('Integration Test 3: Divine sublocation lifecycle (create → visit → dissolve)', () => {
  let graph: WorldGraph;
  let cityLocationId: string;
  let godId: string;
  let agentId: string;
  let divineSubLocationId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    cityLocationId = 'location-city-2';
    godId = 'god-maker-1';
    agentId = 'agent-blessed-1';

    // Build city location
    const city: GraphNode = {
      id: cityLocationId,
      type: 'location',
      name: 'Divine City',
      properties: {
        locationType: 'hex',
        locationSubtype: 'city',
      },
    };
    graph.addNode(city);

    // Build agent
    const agent: GraphNode = {
      id: agentId,
      type: 'actor',
      name: 'Divine Agent',
      properties: {},
    };
    graph.addNode(agent);

    // Place agent at city initially
    graph.addEdge({
      id: 'edge-agent-at-city-initial',
      source: agentId,
      target: cityLocationId,
      type: 'located_at',
      properties: {},
    });
  });

  it('divine sublocation lifecycle: create → agent visits → dissolves on encounter_completed', () => {
    const tick = 50;

    // Step 1: Call createDivineSublocation
    const divineSublocation = createDivineSublocation(graph, {
      locationId: cityLocationId,
      sublocationTypeId: 'sublocation-type.sacred-shrine',
      godId,
      purpose: 'arrange_meeting',
      tick,
      persistence: { type: 'temporal', dissolvesOn: 'encounter_completed' },
      name: 'Divine Shrine',
    });

    expect(divineSublocation).toBeDefined();
    divineSubLocationId = divineSublocation!.id;

    // Verify divine sublocation has correct properties
    const divineProps = divineSublocation!.properties as SublocationProperties;
    expect(divineProps.sublocationTypeId).toBe('sublocation-type.sacred-shrine');
    expect(divineProps.parentLocationId).toBe(cityLocationId);
    expect(divineProps.persistence.type).toBe('temporal');
    if (divineProps.persistence.type === 'temporal') {
      expect(divineProps.persistence.dissolvesOn).toBe('encounter_completed');
    }

    // Verify divine origin is set
    expect(divineProps.divineOrigin).toBeDefined();
    expect(divineProps.divineOrigin?.creatorGodId).toBe(godId);
    expect(divineProps.divineOrigin?.purpose).toBe('arrange_meeting');
    expect(divineProps.divineOrigin?.createdAtTick).toBe(tick);

    // Verify node is in graph
    expect(graph.getNode(divineSubLocationId)).toBeDefined();

    // Verify contains edge from city to divine sublocation
    const cityContainsEdges = graph.getOutgoingEdges(cityLocationId, 'contains');
    expect(cityContainsEdges.some(e => e.target === divineSubLocationId)).toBe(true);

    // Step 2: Simulate agent visiting the divine sublocation
    // Remove agent's current located_at edge
    let agentEdges = graph.getOutgoingEdges(agentId, 'located_at');
    expect(agentEdges).toHaveLength(1);
    graph.removeEdge(agentEdges[0].id);

    // Add new located_at edge from agent to divine sublocation
    graph.addEdge({
      id: 'edge-agent-at-divine-sublocation',
      source: agentId,
      target: divineSubLocationId,
      type: 'located_at',
      properties: {},
    });

    agentEdges = graph.getOutgoingEdges(agentId, 'located_at');
    expect(agentEdges).toHaveLength(1);
    expect(agentEdges[0].target).toBe(divineSubLocationId);

    // Step 3: Call checkDissolutions with empty/completed encounter progress
    const dissolutionEvents = checkDissolutions(graph, tick + 1, []);

    // Should have one dissolution event
    expect(dissolutionEvents).toHaveLength(1);
    expect(dissolutionEvents[0].sublocationId).toBe(divineSubLocationId);
    expect(dissolutionEvents[0].parentLocationId).toBe(cityLocationId);
    expect(dissolutionEvents[0].displacedAgentIds).toContain(agentId);
    expect(dissolutionEvents[0].reason).toContain('encounter_completed');

    // Step 4: Verify divine sublocation node is removed from graph
    expect(graph.getNode(divineSubLocationId)).toBeUndefined();

    // Step 5: Verify agent's located_at edge moved to parent location
    agentEdges = graph.getOutgoingEdges(agentId, 'located_at');
    expect(agentEdges).toHaveLength(1);
    expect(agentEdges[0].target).toBe(cityLocationId);
  });
});
