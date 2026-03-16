import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  ensureSublocations,
  scoreSublocations,
  selectSublocation,
  checkDissolutions,
  createDivineSublocation,
} from '../sublocation';
import type { GraphNode, GraphEdge } from '../../types/graph';
import type { AxiologicalProfile, ValuePair } from '../../types/agent';
import type { SublocationProperties, SublocationPersistence } from '../../types/sublocation';

describe('ensureSublocations', () => {
  let graph: WorldGraph;
  let locationId: string;
  let locationTypeId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    locationId = 'location-1';
    locationTypeId = 'location-type.city';

    // Create a location node
    const location: GraphNode = {
      id: locationId,
      type: 'location',
      name: 'Test City',
      properties: {
        locationType: 'hex',
        locationSubtype: 'city',
      },
    };
    graph.addNode(location);

    // Create the location type node
    const locationType: GraphNode = {
      id: locationTypeId,
      type: 'location',
      name: 'City Location Type',
      properties: {
        category: 'location-type',
      },
    };
    graph.addNode(locationType);

    // Create sublocation type nodes
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

    // Create contains edges from location type to sublocation types
    const edge1: GraphEdge = {
      id: 'edge-contains-1',
      source: locationTypeId,
      target: 'sublocation-type.temple-quarter',
      type: 'contains',
      properties: {},
    };
    graph.addEdge(edge1);

    const edge2: GraphEdge = {
      id: 'edge-contains-2',
      source: locationTypeId,
      target: 'sublocation-type.market-square',
      type: 'contains',
      properties: {},
    };
    graph.addEdge(edge2);
  });

  it('creates sublocation instances via locationSubtype map (Path A)', () => {
    // No located_at edge needed — Path A uses locationSubtype: 'city' directly
    const result = ensureSublocations(graph, locationId, 42);

    // 'city' maps to: market-district, temple-quarter, barracks
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('location');
    expect(result[1].type).toBe('location');
    expect(result[2].type).toBe('location');

    // Check that nodes have been added to graph with correct properties
    const props0 = result[0].properties as SublocationProperties;
    expect(props0).toHaveProperty('sublocationTypeId');
    expect(props0).toHaveProperty('parentLocationId', locationId);
    expect(props0.parentLocationId).toBe(locationId);

    // Verify nodes exist in graph
    const node0 = graph.getNode(result[0].id);
    expect(node0).toBeDefined();

    // Verify contains edges were created (for getSubLocations)
    const containsEdges = graph.getOutgoingEdges(locationId, 'contains');
    expect(containsEdges.length).toBe(3);
  });

  it('creates sublocation instances via legacy edge path (Path B)', () => {
    // Use a subtype NOT in the map, forcing Path B (legacy edge-based lookup)
    graph.removeNode(locationId);
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Exotic Location',
      properties: { locationType: 'hex', locationSubtype: 'wilderness' },
    });

    // Add located_at edge linking location to location-type
    graph.addEdge({
      id: 'location-type-link',
      source: locationId,
      target: locationTypeId,
      type: 'located_at',
      properties: {},
    });

    const result = ensureSublocations(graph, locationId, 42);

    // Should create 2 sublocations via Path B (from contains edges in beforeEach)
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('location');
    expect(result[1].type).toBe('location');

    const props0 = result[0].properties as SublocationProperties;
    expect(props0).toHaveProperty('sublocationTypeId');
    expect(props0.parentLocationId).toBe(locationId);
  });

  it('is idempotent (second call returns same nodes)', () => {
    const first = ensureSublocations(graph, locationId, 42);
    const second = ensureSublocations(graph, locationId, 42);

    expect(first.length).toBe(second.length);
    expect(first.length).toBeGreaterThan(0);
    for (let i = 0; i < first.length; i++) {
      expect(first[i].id).toBe(second[i].id);
    }
  });

  it('returns empty for locationSubtype not in map and no legacy edges', () => {
    // Use a subtype NOT in the map AND no located_at edges → no sublocations
    graph.removeNode(locationId);
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Wild Place',
      properties: { locationType: 'hex', locationSubtype: 'wilderness' },
    });

    const result = ensureSublocations(graph, locationId, 42);
    expect(result).toHaveLength(0);
  });

  it('returns empty for unknown location (fail-soft)', () => {
    const result = ensureSublocations(graph, 'nonexistent-location', 42);
    expect(result).toHaveLength(0);
  });

  it('returns empty for location with no locationSubtype and no edges', () => {
    // No locationSubtype property and no located_at edges
    graph.removeNode(locationId);
    graph.addNode({
      id: locationId,
      type: 'location',
      name: 'Bare Location',
      properties: { locationType: 'hex' },
    });

    const result = ensureSublocations(graph, locationId, 42);
    expect(result).toHaveLength(0);
  });
});

describe('scoreSublocations', () => {
  let graph: WorldGraph;
  let sublocations: GraphNode[];
  let agent: GraphNode;

  beforeEach(() => {
    graph = new WorldGraph();

    // Create sublocation type nodes with motivations
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

    // Create sublocation instances
    const sub1: GraphNode = {
      id: 'sublocation-1',
      type: 'location',
      name: 'Temple Quarter Instance',
      properties: {
        sublocationTypeId: 'sublocation-type.temple-quarter',
        parentLocationId: 'location-1',
        persistence: { type: 'permanent' },
      } as SublocationProperties,
    };
    graph.addNode(sub1);

    const sub2: GraphNode = {
      id: 'sublocation-2',
      type: 'location',
      name: 'Market Square Instance',
      properties: {
        sublocationTypeId: 'sublocation-type.market-square',
        parentLocationId: 'location-1',
        persistence: { type: 'permanent' },
      } as SublocationProperties,
    };
    graph.addNode(sub2);

    sublocations = [sub1, sub2];

    // Create an agent with axiological profile
    const axiologicalProfile: AxiologicalProfile = {
      ambition_contentment: 0.7, // leans toward ambition
      courage_prudence: 0.3,
      cruelty_compassion: -0.5, // leans toward cruelty
      cunning_honesty: 0.6,
      devotion_independence: 0.8, // strong devotion
      loyalty_treachery: 0.2,
      tradition_innovation: 0.4,
      dominance_humility: -0.3,
      wrath_patience: -0.6, // wrathful
      greed_generosity: -0.4, // greedy
    };

    agent = {
      id: 'agent-1',
      type: 'actor',
      name: 'Test Agent',
      properties: {
        axiologicalProfile,
      },
    };
    graph.addNode(agent);
  });

  it('scores sublocations by motivation alignment with agent profile', () => {
    const scores = scoreSublocations(graph, sublocations, agent.id);

    expect(scores).toHaveLength(2);
    expect(scores[0]).toBeDefined();
    expect(scores[0].sublocationId).toBe('sublocation-1');
    expect(scores[0].score).toBeGreaterThanOrEqual(0);
  });

  it('returns all sublocations (never filters out)', () => {
    const scores = scoreSublocations(graph, sublocations, agent.id);
    expect(scores.length).toBe(sublocations.length);
  });

  it('higher motivation alignment results in higher score', () => {
    const scores = scoreSublocations(graph, sublocations, agent.id);

    // Temple Quarter has devotion_independence=0.8, and agent has +0.8 devotion
    // Should score high
    // Market Square has greed_generosity, and agent has -0.4 (leaning greedy)
    // Should score lower

    const templeScore = scores.find(s => s.sublocationId === 'sublocation-1')?.score ?? 0;
    const marketScore = scores.find(s => s.sublocationId === 'sublocation-2')?.score ?? 0;

    // Temple should score higher since devotion aligns better with agent
    expect(templeScore).toBeGreaterThan(marketScore);
  });

  it('gracefully handles sublocation with missing type node', () => {
    // Create a sublocation pointing to non-existent type
    const orphaned: GraphNode = {
      id: 'sublocation-orphan',
      type: 'location',
      name: 'Orphaned Sublocation',
      properties: {
        sublocationTypeId: 'nonexistent-type',
        parentLocationId: 'location-1',
        persistence: { type: 'permanent' },
      } as SublocationProperties,
    };
    graph.addNode(orphaned);

    const scores = scoreSublocations(graph, [orphaned], agent.id);
    expect(scores).toHaveLength(1);
    expect(scores[0].score).toBeDefined();
  });

  it('gracefully handles agent with missing axiological profile', () => {
    const agentNoProfile: GraphNode = {
      id: 'agent-no-profile',
      type: 'actor',
      name: 'No Profile Agent',
      properties: {},
    };
    graph.addNode(agentNoProfile);

    const scores = scoreSublocations(graph, sublocations, 'agent-no-profile');
    expect(scores).toHaveLength(2);
    // Should not throw, should have reasonable scores
  });
});

describe('selectSublocation', () => {
  let graph: WorldGraph;
  let sublocations: GraphNode[];
  let agent: GraphNode;

  beforeEach(() => {
    graph = new WorldGraph();

    // Create sublocation type nodes with motivations
    const templeQuarter: GraphNode = {
      id: 'sublocation-type.temple-quarter',
      type: 'location',
      name: 'Temple Quarter',
      properties: {
        category: 'sublocation-type',
        motivations: [
          { left: 'devotion', right: 'independence', weight: 0.9 },
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
          { left: 'greed', right: 'generosity', weight: 0.9 },
        ] as Array<{ left: string; right: string; weight: number }>,
      },
    };
    graph.addNode(marketSquare);

    // Create sublocation instances
    const sub1: GraphNode = {
      id: 'sublocation-1',
      type: 'location',
      name: 'Temple Quarter Instance',
      properties: {
        sublocationTypeId: 'sublocation-type.temple-quarter',
        parentLocationId: 'location-1',
        persistence: { type: 'permanent' },
      } as SublocationProperties,
    };
    graph.addNode(sub1);

    const sub2: GraphNode = {
      id: 'sublocation-2',
      type: 'location',
      name: 'Market Square Instance',
      properties: {
        sublocationTypeId: 'sublocation-type.market-square',
        parentLocationId: 'location-1',
        persistence: { type: 'permanent' },
      } as SublocationProperties,
    };
    graph.addNode(sub2);

    sublocations = [sub1, sub2];

    const axiologicalProfile: AxiologicalProfile = {
      ambition_contentment: 0.5,
      courage_prudence: 0.5,
      cruelty_compassion: 0.5,
      cunning_honesty: 0.5,
      devotion_independence: 0.9, // strong devotion
      loyalty_treachery: 0.5,
      tradition_innovation: 0.5,
      dominance_humility: 0.5,
      wrath_patience: 0.5,
      greed_generosity: -0.5, // greedy
    };

    agent = {
      id: 'agent-1',
      type: 'actor',
      name: 'Test Agent',
      properties: {
        axiologicalProfile,
      },
    };
    graph.addNode(agent);
  });

  it('selects via weighted random with seeded PRNG', () => {
    const selected = selectSublocation(graph, sublocations, agent.id, 42);
    expect(selected).toBeDefined();
    expect(selected.id).toMatch(/^sublocation-/);
  });

  it('is deterministic (same seed = same result)', () => {
    const sel1 = selectSublocation(graph, sublocations, agent.id, 42);
    const sel2 = selectSublocation(graph, sublocations, agent.id, 42);
    expect(sel1.id).toBe(sel2.id);
  });

  it('different seed produces different result (high probability for larger seed space)', () => {
    const selections = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const sel = selectSublocation(graph, sublocations, agent.id, i);
      selections.add(sel.id);
    }
    // With different seeds, we should see multiple selections
    // (low probability all 100 seeds pick the same location)
    expect(selections.size).toBeGreaterThan(1);
  });

  it('returns a node from the provided sublocations list', () => {
    const selected = selectSublocation(graph, sublocations, agent.id, 42);
    const selectedIds = sublocations.map(s => s.id);
    expect(selectedIds).toContain(selected.id);
  });

  it('gracefully handles empty sublocations list', () => {
    const selected = selectSublocation(graph, [], agent.id, 42);
    expect(selected).toBeUndefined();
  });

  it('prefers higher-scoring sublocations with weighted random', () => {
    // Run many times with different seeds to see which location is picked more often
    const counts: Record<string, number> = {
      'sublocation-1': 0,
      'sublocation-2': 0,
    };

    for (let i = 0; i < 1000; i++) {
      const selected = selectSublocation(graph, sublocations, agent.id, i);
      if (selected) {
        counts[selected.id] = (counts[selected.id] || 0) + 1;
      }
    }

    // Temple Quarter (sublocation-1) should be picked more often since
    // agent's axiological profile (devotion=0.9) aligns with its motivation (devotion=0.9)
    expect(counts['sublocation-1']).toBeGreaterThan(counts['sublocation-2']);
  });
});

// ── Task 5: checkDissolutions ───────────────────────────────────────────

describe('checkDissolutions', () => {
  let graph: WorldGraph;
  let parentLocationId: string;
  let sublocationId: string;
  let agentId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    parentLocationId = 'location-parent';
    sublocationId = 'sublocation-temporal';
    agentId = 'agent-1';

    // Create parent location
    const parentLocation: GraphNode = {
      id: parentLocationId,
      type: 'location',
      name: 'Parent Location',
      properties: {},
    };
    graph.addNode(parentLocation);

    // Create agent
    const agent: GraphNode = {
      id: agentId,
      type: 'actor',
      name: 'Test Agent',
      properties: {},
    };
    graph.addNode(agent);
  });

  it('dissolves temporal sublocation when encounter_completed and no active encounters', () => {
    // Create a temporal sublocation with encounter_completed trigger
    const sublocation: GraphNode = {
      id: sublocationId,
      type: 'location',
      name: 'Test Sublocation',
      properties: {
        sublocationTypeId: 'sublocation-type.temple',
        parentLocationId,
        persistence: { type: 'temporal', dissolvesOn: 'encounter_completed' } as SublocationPersistence,
      } as SublocationProperties,
    };
    graph.addNode(sublocation);

    // Agent is at this sublocation
    const locatedAtEdge: GraphEdge = {
      id: 'located-at-1',
      source: agentId,
      target: sublocationId,
      type: 'located_at',
      properties: {},
    };
    graph.addEdge(locatedAtEdge);

    // Call checkDissolutions with no active encounters
    const events = checkDissolutions(graph, 100, []);

    // Should have one dissolution event
    expect(events).toHaveLength(1);
    expect(events[0].sublocationId).toBe(sublocationId);
    expect(events[0].displacedAgentIds).toContain(agentId);
    expect(events[0].reason).toContain('encounter_completed');

    // Sublocation should be removed from graph
    expect(graph.getNode(sublocationId)).toBeUndefined();

    // Agent should now be located at parent location
    const agentNode = graph.getNode(agentId);
    const agentEdges = graph.getOutgoingEdges(agentId, 'located_at');
    expect(agentEdges).toHaveLength(1);
    expect(agentEdges[0].target).toBe(parentLocationId);
  });

  it('does NOT dissolve sublocation if encounter_completed trigger but agents present', () => {
    // Create a temporal sublocation with encounter_completed trigger
    const sublocation: GraphNode = {
      id: sublocationId,
      type: 'location',
      name: 'Test Sublocation',
      properties: {
        sublocationTypeId: 'sublocation-type.temple',
        parentLocationId,
        persistence: { type: 'temporal', dissolvesOn: 'encounter_completed' } as SublocationPersistence,
      } as SublocationProperties,
    };
    graph.addNode(sublocation);

    // Agent is at this sublocation
    const locatedAtEdge: GraphEdge = {
      id: 'located-at-1',
      source: agentId,
      target: sublocationId,
      type: 'located_at',
      properties: {},
    };
    graph.addEdge(locatedAtEdge);

    // Call checkDissolutions with active encounters
    const events = checkDissolutions(graph, 100, [
      { encounterId: 'encounter-1', actorId: agentId, status: 'active' },
    ]);

    // Should NOT dissolve
    expect(events).toHaveLength(0);

    // Sublocation should still exist
    expect(graph.getNode(sublocationId)).toBeDefined();
  });

  it('dissolves temporal sublocation with visited trigger when agent has visited', () => {
    // Create a temporal sublocation with visited trigger
    const sublocation: GraphNode = {
      id: sublocationId,
      type: 'location',
      name: 'Test Sublocation',
      properties: {
        sublocationTypeId: 'sublocation-type.temple',
        parentLocationId,
        persistence: { type: 'temporal', dissolvesOn: 'visited' } as SublocationPersistence,
      } as SublocationProperties,
    };
    graph.addNode(sublocation);

    // Agent is at this sublocation
    const locatedAtEdge: GraphEdge = {
      id: 'located-at-1',
      source: agentId,
      target: sublocationId,
      type: 'located_at',
      properties: {},
    };
    graph.addEdge(locatedAtEdge);

    // Call checkDissolutions
    const events = checkDissolutions(graph, 100, []);

    // Should dissolve
    expect(events).toHaveLength(1);
    expect(events[0].displacedAgentIds).toContain(agentId);
    expect(events[0].reason).toContain('visited');

    // Sublocation should be removed
    expect(graph.getNode(sublocationId)).toBeUndefined();
  });

  it('dissolves tick_expiry sublocation when tick >= expiresAtTick', () => {
    const expiresAtTick = 100;

    // Create a temporal sublocation with tick_expiry trigger
    const sublocation: GraphNode = {
      id: sublocationId,
      type: 'location',
      name: 'Test Sublocation',
      properties: {
        sublocationTypeId: 'sublocation-type.temple',
        parentLocationId,
        persistence: {
          type: 'temporal',
          dissolvesOn: { type: 'tick_expiry', expiresAtTick },
        } as SublocationPersistence,
      } as SublocationProperties,
    };
    graph.addNode(sublocation);

    // Agent is at this sublocation
    const locatedAtEdge: GraphEdge = {
      id: 'located-at-1',
      source: agentId,
      target: sublocationId,
      type: 'located_at',
      properties: {},
    };
    graph.addEdge(locatedAtEdge);

    // Call checkDissolutions at tick >= expiresAtTick
    const events = checkDissolutions(graph, expiresAtTick, []);

    // Should dissolve
    expect(events).toHaveLength(1);
    expect(events[0].reason).toContain('tick_expiry');

    // Sublocation should be removed
    expect(graph.getNode(sublocationId)).toBeUndefined();
  });

  it('does NOT dissolve tick_expiry sublocation when tick < expiresAtTick', () => {
    const expiresAtTick = 100;

    // Create a temporal sublocation with tick_expiry trigger
    const sublocation: GraphNode = {
      id: sublocationId,
      type: 'location',
      name: 'Test Sublocation',
      properties: {
        sublocationTypeId: 'sublocation-type.temple',
        parentLocationId,
        persistence: {
          type: 'temporal',
          dissolvesOn: { type: 'tick_expiry', expiresAtTick },
        } as SublocationPersistence,
      } as SublocationProperties,
    };
    graph.addNode(sublocation);

    // Agent is at this sublocation
    const locatedAtEdge: GraphEdge = {
      id: 'located-at-1',
      source: agentId,
      target: sublocationId,
      type: 'located_at',
      properties: {},
    };
    graph.addEdge(locatedAtEdge);

    // Call checkDissolutions at tick < expiresAtTick
    const events = checkDissolutions(graph, 99, []);

    // Should NOT dissolve
    expect(events).toHaveLength(0);

    // Sublocation should still exist
    expect(graph.getNode(sublocationId)).toBeDefined();
  });

  it('leaves permanent sublocations untouched', () => {
    // Create a permanent sublocation
    const sublocation: GraphNode = {
      id: sublocationId,
      type: 'location',
      name: 'Permanent Sublocation',
      properties: {
        sublocationTypeId: 'sublocation-type.temple',
        parentLocationId,
        persistence: { type: 'permanent' } as SublocationPersistence,
      } as SublocationProperties,
    };
    graph.addNode(sublocation);

    // Agent is at this sublocation
    const locatedAtEdge: GraphEdge = {
      id: 'located-at-1',
      source: agentId,
      target: sublocationId,
      type: 'located_at',
      properties: {},
    };
    graph.addEdge(locatedAtEdge);

    // Call checkDissolutions
    const events = checkDissolutions(graph, 100, []);

    // Should not dissolve
    expect(events).toHaveLength(0);

    // Sublocation should still exist
    expect(graph.getNode(sublocationId)).toBeDefined();

    // Agent should still be at sublocation
    const agentEdges = graph.getOutgoingEdges(agentId, 'located_at');
    expect(agentEdges[0].target).toBe(sublocationId);
  });

  it('relocates multiple displaced agents to parent location', () => {
    // Create multiple agents
    const agent2Id = 'agent-2';
    const agent2: GraphNode = {
      id: agent2Id,
      type: 'actor',
      name: 'Test Agent 2',
      properties: {},
    };
    graph.addNode(agent2);

    // Create a temporal sublocation
    const sublocation: GraphNode = {
      id: sublocationId,
      type: 'location',
      name: 'Test Sublocation',
      properties: {
        sublocationTypeId: 'sublocation-type.temple',
        parentLocationId,
        persistence: { type: 'temporal', dissolvesOn: 'encounter_completed' } as SublocationPersistence,
      } as SublocationProperties,
    };
    graph.addNode(sublocation);

    // Both agents are at this sublocation
    const edge1: GraphEdge = {
      id: 'located-at-1',
      source: agentId,
      target: sublocationId,
      type: 'located_at',
      properties: {},
    };
    graph.addEdge(edge1);

    const edge2: GraphEdge = {
      id: 'located-at-2',
      source: agent2Id,
      target: sublocationId,
      type: 'located_at',
      properties: {},
    };
    graph.addEdge(edge2);

    // Call checkDissolutions
    const events = checkDissolutions(graph, 100, []);

    // Should have one dissolution event with both agents displaced
    expect(events).toHaveLength(1);
    expect(events[0].displacedAgentIds).toHaveLength(2);
    expect(events[0].displacedAgentIds).toContain(agentId);
    expect(events[0].displacedAgentIds).toContain(agent2Id);

    // Both agents should be at parent location
    const agent1Edges = graph.getOutgoingEdges(agentId, 'located_at');
    const agent2Edges = graph.getOutgoingEdges(agent2Id, 'located_at');
    expect(agent1Edges[0].target).toBe(parentLocationId);
    expect(agent2Edges[0].target).toBe(parentLocationId);
  });
});

// ── Task 6: createDivineSublocation ───────────────────────────────────

describe('createDivineSublocation', () => {
  let graph: WorldGraph;
  let locationId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    locationId = 'location-1';

    // Create a parent location
    const location: GraphNode = {
      id: locationId,
      type: 'location',
      name: 'Test Location',
      properties: {},
    };
    graph.addNode(location);
  });

  it('creates divine sublocation with origin metadata', () => {
    const sublocationTypeId = 'sublocation-type.temple';
    const godId = 'god-1';
    const purpose = 'test_resolve';
    const tick = 50;

    const result = createDivineSublocation(graph, {
      locationId,
      sublocationTypeId,
      godId,
      purpose,
      tick,
      persistence: { type: 'temporal', dissolvesOn: 'visited' },
      name: 'Divine Temple',
    });

    // Should return a node
    expect(result).toBeDefined();
    expect(result?.type).toBe('location');

    // Should have divine origin
    const props = result?.properties as SublocationProperties;
    expect(props.divineOrigin).toBeDefined();
    expect(props.divineOrigin?.creatorGodId).toBe(godId);
    expect(props.divineOrigin?.purpose).toBe(purpose);
    expect(props.divineOrigin?.createdAtTick).toBe(tick);

    // Should be in graph
    expect(graph.getNode(result!.id)).toBeDefined();
  });

  it('sets persistence correctly', () => {
    const persistence = { type: 'temporal' as const, dissolvesOn: 'visited' as const };

    const result = createDivineSublocation(graph, {
      locationId,
      sublocationTypeId: 'sublocation-type.temple',
      godId: 'god-1',
      purpose: 'grant_sanctuary',
      tick: 50,
      persistence,
      name: 'Sanctuary',
    });

    const props = result?.properties as SublocationProperties;
    expect(props.persistence).toEqual(persistence);
  });

  it('adds contains edge from location to divine sublocation', () => {
    const result = createDivineSublocation(graph, {
      locationId,
      sublocationTypeId: 'sublocation-type.temple',
      godId: 'god-1',
      purpose: 'test_resolve',
      tick: 50,
      persistence: { type: 'permanent' },
    });

    const containsEdges = graph.getOutgoingEdges(locationId, 'contains');
    expect(containsEdges.length).toBeGreaterThan(0);

    const targetIds = containsEdges.map(e => e.target);
    expect(targetIds).toContain(result?.id);
  });

  it('returns undefined for nonexistent location', () => {
    const result = createDivineSublocation(graph, {
      locationId: 'nonexistent-location',
      sublocationTypeId: 'sublocation-type.temple',
      godId: 'god-1',
      purpose: 'test_resolve',
      tick: 50,
      persistence: { type: 'permanent' },
    });

    expect(result).toBeUndefined();
  });

  it('generates deterministic ID based on locationId, sublocationTypeId, and tick', () => {
    const result1 = createDivineSublocation(graph, {
      locationId,
      sublocationTypeId: 'sublocation-type.temple',
      godId: 'god-1',
      purpose: 'test_resolve',
      tick: 50,
      persistence: { type: 'permanent' },
    });

    // Remove the created node so we can create again
    if (result1) {
      graph.removeNode(result1.id);
    }

    // Create again with same params
    const result2 = createDivineSublocation(graph, {
      locationId,
      sublocationTypeId: 'sublocation-type.temple',
      godId: 'god-1',
      purpose: 'test_resolve',
      tick: 50,
      persistence: { type: 'permanent' },
    });

    // IDs should be the same
    expect(result1?.id).toBe(result2?.id);
  });

  it('returns undefined if sublocation already exists', () => {
    const params = {
      locationId,
      sublocationTypeId: 'sublocation-type.temple',
      godId: 'god-1',
      purpose: 'test_resolve',
      tick: 50,
      persistence: { type: 'permanent' } as SublocationPersistence,
    };

    // Create first time
    const result1 = createDivineSublocation(graph, params);
    expect(result1).toBeDefined();

    // Try to create again with same params
    const result2 = createDivineSublocation(graph, params);
    expect(result2).toBeUndefined();
  });

  it('uses provided name or defaults to "Divine [type]"', () => {
    // With custom name
    const result1 = createDivineSublocation(graph, {
      locationId: 'location-1',
      sublocationTypeId: 'sublocation-type.temple',
      godId: 'god-1',
      purpose: 'test_resolve',
      tick: 50,
      persistence: { type: 'permanent' },
      name: 'Custom Name',
    });
    expect(result1?.name).toBe('Custom Name');

    // Create new location for default name test
    graph.removeNode('location-1');
    const location2: GraphNode = {
      id: 'location-2',
      type: 'location',
      name: 'Test Location 2',
      properties: {},
    };
    graph.addNode(location2);

    // Without custom name
    const result2 = createDivineSublocation(graph, {
      locationId: 'location-2',
      sublocationTypeId: 'sublocation-type.temple',
      godId: 'god-1',
      purpose: 'test_resolve',
      tick: 51,
      persistence: { type: 'permanent' },
    });
    expect(result2?.name).toBe('Divine sublocation-type.temple');
  });
});
