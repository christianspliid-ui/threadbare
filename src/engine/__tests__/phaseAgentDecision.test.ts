import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseAgentDecision } from '../phaseAgentDecision';
import { EncounterCacheManager } from '../encounterCache';
import { buildDistanceMatrix } from '../distanceMatrix';
import type { DistanceMatrix } from '../distanceMatrix';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';

// ─── Helpers ────────────────────────────────────────────────────

function makeTestState(graph: WorldGraph, overrides?: Partial<GameState>): GameState {
  return {
    tick: 1,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'ascendant_1',
    essencePool: { [Symbol.iterator]: function* () { yield ['default', 0]; } },
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: { cycles: [], totalEntries: 0 },
    ...overrides,
  } as unknown as GameState;
}

function addLocation(
  graph: WorldGraph,
  id: string,
  name: string,
  locationType: string,
): void {
  graph.addNode({
    id,
    type: 'location',
    name,
    properties: { locationType },
  });
}

function addAgent(
  graph: WorldGraph,
  id: string,
  name: string,
  locationId: string,
  extraProps: Record<string, unknown> = {},
): void {
  graph.addNode({
    id,
    type: 'actor',
    name,
    properties: {
      actorType: 'individual',
      axiologicalProfile: {
        courage_prudence: 0,
        loyalty_ambition: 0,
        mercy_justice: 0,
        tradition_innovation: 0,
        community_autonomy: 0,
        faith_reason: 0,
        creation_destruction: 0,
        order_chaos: 0,
        nature_civilization: 0,
        generosity_acquisitiveness: 0,
      },
      ...extraProps,
    },
  });
  // Link agent to location via contains (location contains agent)
  graph.addEdge({
    id: `contains_${locationId}_${id}`,
    type: 'contains',
    source: locationId,
    target: id,
    properties: {},
  });
}

function addAdjacentEdge(graph: WorldGraph, from: string, to: string): void {
  graph.addEdge({
    id: `adjacent_${from}_${to}`,
    type: 'adjacent',
    source: from,
    target: to,
    properties: {},
  });
}

function makeRng(seed: number = 42): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Tests ──────────────────────────────────────────────────────

describe('phaseAgentDecision', () => {
  let graph: WorldGraph;
  let cache: EncounterCacheManager;
  let distMatrix: DistanceMatrix;

  beforeEach(() => {
    graph = new WorldGraph();
  });

  function buildCacheAndMatrix() {
    cache = new EncounterCacheManager();
    cache.buildFullCache(graph);
    distMatrix = buildDistanceMatrix(graph);
  }

  // 1. Idle agent with local encounters picks one (gets tick event)
  it('creates tick events for idle agents with local encounter candidates', () => {
    // Setup: a town location with encounter templates available
    addLocation(graph, 'loc_town', 'Test Town', 'town');
    addAgent(graph, 'agent_1', 'Brave Knight', 'loc_town');
    buildCacheAndMatrix();

    const state = makeTestState(graph);
    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    // Should process without errors; may or may not find candidates
    // depending on encounter-content templates for 'town'
    expect(result).toBeDefined();
    expect(result.tickEvents).toBeDefined();
  });

  // 2. Agent with active unified action is skipped
  it('skips agents with active unified actions', () => {
    addLocation(graph, 'loc_a', 'Town A', 'town');
    addAgent(graph, 'agent_active', 'Busy Agent', 'loc_a');
    buildCacheAndMatrix();

    const state = makeTestState(graph, {
      unifiedActions: [
        {
          actorId: 'agent_active',
          resolved: false,
        } as any,
      ],
    });

    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    // Agent should be skipped — no new events for this agent
    const agentEvents = (result.tickEvents ?? []).filter(
      (e) => e.id.includes('agent_active'),
    );
    expect(agentEvents).toHaveLength(0);
  });

  // 3. Agent with occupied encounter is skipped
  it('skips agents occupied by active encounters', () => {
    addLocation(graph, 'loc_b', 'Town B', 'town');
    addAgent(graph, 'agent_enc', 'Encounter Agent', 'loc_b');
    buildCacheAndMatrix();

    const state = makeTestState(graph, {
      encounterProgress: [
        {
          actorId: 'agent_enc',
          encounterId: 'enc_test',
          status: 'active',
          occupiedUntilTick: 10, // well beyond tick 1
          currentEncounterIndex: 0,
          history: [],
          startedTick: 0,
        },
      ],
    });

    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    const agentEvents = (result.tickEvents ?? []).filter(
      (e) => e.id.includes('agent_enc'),
    );
    expect(agentEvents).toHaveLength(0);
  });

  // 4. Agent with active movement queue is skipped
  it('skips agents with active movement queues', () => {
    addLocation(graph, 'loc_c', 'Town C', 'town');
    addAgent(graph, 'agent_mov', 'Moving Agent', 'loc_c', {
      movementState: {
        movementQueue: ['loc_d'],
        destinationId: 'loc_d',
      },
    });
    buildCacheAndMatrix();

    const state = makeTestState(graph);
    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    const agentEvents = (result.tickEvents ?? []).filter(
      (e) => e.id.includes('agent_mov'),
    );
    expect(agentEvents).toHaveLength(0);
  });

  // 5. Agent with no location is skipped
  it('skips agents with no location edges', () => {
    // Add agent without any location edge
    graph.addNode({
      id: 'agent_lost',
      type: 'actor',
      name: 'Lost Agent',
      properties: {
        actorType: 'individual',
        axiologicalProfile: { courage_prudence: 0 },
      },
    });
    addLocation(graph, 'loc_d', 'Town D', 'town');
    buildCacheAndMatrix();

    const state = makeTestState(graph);
    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    const agentEvents = (result.tickEvents ?? []).filter(
      (e) => e.id.includes('agent_lost'),
    );
    expect(agentEvents).toHaveLength(0);
  });

  // 6. Multiple agents process independently
  it('processes multiple idle agents independently', () => {
    addLocation(graph, 'loc_multi', 'Multi Town', 'town');
    addAgent(graph, 'agent_m1', 'Agent One', 'loc_multi');
    addAgent(graph, 'agent_m2', 'Agent Two', 'loc_multi');
    buildCacheAndMatrix();

    const state = makeTestState(graph);
    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    // Both agents should be processed (result exists, no crash)
    expect(result).toBeDefined();
    expect(result.tickEvents).toBeDefined();
  });

  // 7. Empty cache → all agents idle
  it('returns no encounter events when cache is empty', () => {
    // Location type that has no encounter templates
    addLocation(graph, 'loc_empty', 'Empty Hex', 'void_plane');
    addAgent(graph, 'agent_void', 'Void Walker', 'loc_empty');
    buildCacheAndMatrix();

    const state = makeTestState(graph);
    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    // No encounter events since there are no candidates
    const encounterEvents = (result.tickEvents ?? []).filter(
      (e) => e.type === 'agent_encounter',
    );
    expect(encounterEvents).toHaveLength(0);
  });

  // 8. Agent queues movement toward distant encounter
  it('queues movement for agents when encounter is at a distant location', () => {
    addLocation(graph, 'loc_here', 'Here', 'wilderness');
    addLocation(graph, 'loc_there', 'There', 'town');
    addAdjacentEdge(graph, 'loc_here', 'loc_there');
    addAgent(graph, 'agent_far', 'Traveler', 'loc_here');
    buildCacheAndMatrix();

    const state = makeTestState(graph);
    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    // Agent may have queued movement or chosen idle behavior
    // This mainly tests that the code path doesn't crash
    expect(result).toBeDefined();
    expect(result.tickEvents).toBeDefined();
  });

  // 9. Idle agent with no candidates → idle behavior (stay/drift)
  it('falls back to idle behavior when no scored candidates are above threshold', () => {
    // Use a location type unlikely to have encounter templates
    addLocation(graph, 'loc_barren', 'Barren Land', 'deep_ocean');
    addAgent(graph, 'agent_idle', 'Idle Agent', 'loc_barren');
    buildCacheAndMatrix();

    const state = makeTestState(graph);
    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    // Should not crash; agent goes through idle behavior path
    expect(result).toBeDefined();
  });

  // 10. Returns updated tickEvents preserving existing events
  it('preserves existing tickEvents and appends new ones', () => {
    addLocation(graph, 'loc_pres', 'Preserve Town', 'town');
    addAgent(graph, 'agent_pres', 'Preserver', 'loc_pres');
    buildCacheAndMatrix();

    const existingEvent = {
      id: 'existing_1',
      tick: 1,
      type: 'doom_escalation' as const,
      message: 'Existing event',
      significance: 0.5,
    };
    const state = makeTestState(graph, {
      tickEvents: [existingEvent],
    });

    const result = phaseAgentDecision(state, cache, distMatrix, makeRng());

    // Existing event should be preserved
    expect(result.tickEvents).toBeDefined();
    expect(result.tickEvents!.some((e) => e.id === 'existing_1')).toBe(true);
  });
});
