/**
 * Tests for revelationEmitter — hooks that fire revelation events from game phases.
 *
 * Tests cover:
 * - emitEncounterRevelations: reveals domain and value for co-located agents, emits TickEvent
 * - emitDilemmaRevelations: increments interactionDepth by DEPTH_DILEMMA, reveals disposition after threshold
 * - emitColocationRevelations: reveals visible possession subcategories on first sighting, emits RevelationTrace
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, TickEvent } from '../../types/gameState';
import { WorldGraph } from '../graph';
import {
  DEPTH_DILEMMA,
  DISPOSITION_DILEMMA_THRESHOLD,
  createEmptyAgentKnowledge,
} from '../../types/agentKnowledge';
import {
  emitEncounterRevelations,
  emitDilemmaRevelations,
  emitColocationRevelations,
} from '../revelationEmitter';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import type { RevelationTrace } from '../../types/trace';

// ─── Minimal GameState Factory ────────────────────────────────────

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  const graph = new WorldGraph();
  return {
    cycle: 0,
    tick: 1,
    phase: 'playing',
    seed: 42,
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'ascendant-1',
    essencePool: {} as never,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    ...overrides,
  };
}

// ─── Graph Setup Helpers ──────────────────────────────────────────

/**
 * Build a test graph with:
 * - ascendant node
 * - avatar node at loc-1 (hex 5,5)
 * - agent-A at loc-1 (same hex as avatar) — will be "co-located"
 * - agent-B at loc-2 (different hex)
 */
function buildTestGraph(): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'loc-1',
    type: 'location',
    name: 'Market Square',
    properties: { hexCol: 5, hexRow: 5, locationType: 'location' },
  });
  graph.addNode({
    id: 'loc-2',
    type: 'location',
    name: 'Old Tower',
    properties: { hexCol: 10, hexRow: 10, locationType: 'location' },
  });

  graph.addNode({
    id: 'ascendant-1',
    type: 'actor',
    name: 'The God',
    properties: { actorType: 'ascendant' },
  });

  // Avatar node connected to ascendant via avatar_of
  graph.addNode({
    id: 'avatar-1',
    type: 'actor',
    name: 'The Vessel',
    properties: { actorType: 'individual', locationId: 'loc-1' },
  });
  graph.addEdge({
    id: 'edge-avatar-of',
    source: 'avatar-1',
    target: 'ascendant-1',
    type: 'avatar_of',
    properties: {},
  });
  graph.addEdge({
    id: 'edge-avatar-loc',
    source: 'avatar-1',
    target: 'loc-1',
    type: 'located_at',
    properties: {},
  });

  // Agent A — co-located with avatar at loc-1
  graph.addNode({
    id: 'agent-A',
    type: 'actor',
    name: 'Agent Alpha',
    properties: {
      actorType: 'individual',
      locationId: 'loc-1',
      domainCapabilities: { iron: 3, gold: 1 },
    },
  });
  graph.addEdge({
    id: 'edge-agentA-loc',
    source: 'agent-A',
    target: 'loc-1',
    type: 'located_at',
    properties: {},
  });

  // Agent B — at different hex
  graph.addNode({
    id: 'agent-B',
    type: 'actor',
    name: 'Agent Beta',
    properties: {
      actorType: 'individual',
      locationId: 'loc-2',
      domainCapabilities: { heart: 2 },
    },
  });
  graph.addEdge({
    id: 'edge-agentB-loc',
    source: 'agent-B',
    target: 'loc-2',
    type: 'located_at',
    properties: {},
  });

  return graph;
}

// ─── emitEncounterRevelations Tests ──────────────────────────────

describe('emitEncounterRevelations', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('reveals the domain for co-located agent when encounter uses that reach', () => {
    const graph = buildTestGraph();
    // Add an active encounterProgress for agent-A with reach 'iron'
    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      encounterProgress: [
        {
          encounterId: 'enc-iron',
          actorId: 'agent-A',
          status: 'active',
          currentEncounterIndex: 0,
          history: [],
          startedTick: 1,
        },
      ],
    });

    emitEncounterRevelations(state);

    const k = state.agentKnowledge.get('agent-A');
    expect(k).toBeDefined();
    expect(k!.revealedDomains.has('iron')).toBe(true);
  });

  it('reveals the axiological value mapped from the encounter reach', () => {
    const graph = buildTestGraph();
    // iron reach maps to 'courage_prudence'
    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      encounterProgress: [
        {
          encounterId: 'enc-iron',
          actorId: 'agent-A',
          status: 'active',
          currentEncounterIndex: 0,
          history: [],
          startedTick: 1,
        },
      ],
    });

    emitEncounterRevelations(state);

    const k = state.agentKnowledge.get('agent-A');
    expect(k).toBeDefined();
    expect(k!.revealedValues.has('courage_prudence')).toBe(true);
  });

  it('emits TickEvent with type domain_revealed when domain is newly revealed', () => {
    const graph = buildTestGraph();
    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      encounterProgress: [
        {
          encounterId: 'enc-iron',
          actorId: 'agent-A',
          status: 'active',
          currentEncounterIndex: 0,
          history: [],
          startedTick: 1,
        },
      ],
    });

    emitEncounterRevelations(state);

    const domainRevealedEvents = state.tickEvents.filter(
      (e: TickEvent) => e.type === 'domain_revealed',
    );
    expect(domainRevealedEvents.length).toBeGreaterThan(0);
    const ev = domainRevealedEvents[0];
    expect(ev).toMatchObject({
      type: 'domain_revealed',
      significance: expect.any(Number),
    });
  });

  it('pushes RevelationTrace to traceBuffer for newly revealed domain', () => {
    const graph = buildTestGraph();
    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      encounterProgress: [
        {
          encounterId: 'enc-iron',
          actorId: 'agent-A',
          status: 'active',
          currentEncounterIndex: 0,
          history: [],
          startedTick: 1,
        },
      ],
    });

    emitEncounterRevelations(state);

    const traces = getTraces();
    const revelationTraces = traces.filter(
      t => t.category === 'agent_revelation',
    ) as RevelationTrace[];
    expect(revelationTraces.length).toBeGreaterThan(0);
    expect(revelationTraces[0].facetType).toBe('domain');
    expect(revelationTraces[0].agentId).toBe('agent-A');
  });

  it('increments interactionDepth by DEPTH_ENCOUNTER_OBSERVED for observed agent', () => {
    const graph = buildTestGraph();
    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      encounterProgress: [
        {
          encounterId: 'enc-iron',
          actorId: 'agent-A',
          status: 'active',
          currentEncounterIndex: 0,
          history: [],
          startedTick: 1,
        },
      ],
    });

    emitEncounterRevelations(state);

    const k = state.agentKnowledge.get('agent-A');
    expect(k).toBeDefined();
    expect(k!.interactionDepth).toBeGreaterThan(0);
  });

  it('does not reveal domain for agent not co-located with avatar', () => {
    const graph = buildTestGraph();
    // agent-B is at loc-2, avatar is at loc-1
    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      encounterProgress: [
        {
          encounterId: 'enc-heart',
          actorId: 'agent-B',
          status: 'active',
          currentEncounterIndex: 0,
          history: [],
          startedTick: 1,
        },
      ],
    });

    emitEncounterRevelations(state);

    const k = state.agentKnowledge.get('agent-B');
    // No revelation for non-co-located agent
    if (k) {
      expect(k.revealedDomains.size).toBe(0);
    }
  });

  it('does not throw on empty encounterProgress', () => {
    const state = makeMinimalState({ ascendantId: 'ascendant-1' });
    expect(() => emitEncounterRevelations(state)).not.toThrow();
  });
});

// ─── emitDilemmaRevelations Tests ─────────────────────────────────

describe('emitDilemmaRevelations', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('increments interactionDepth by DEPTH_DILEMMA for dilemma target co-located with avatar', () => {
    const graph = buildTestGraph();
    // agent-A is co-located with avatar
    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      tickEvents: [
        {
          id: 'ev-1',
          tick: 1,
          type: 'dilemma_resolved',
          message: 'Agent Alpha and Agent Beta: cooperate_cooperate',
          significance: 0.5,
        },
      ],
    });

    emitDilemmaRevelations(state);

    const k = state.agentKnowledge.get('agent-A');
    expect(k).toBeDefined();
    expect(k!.interactionDepth).toBeCloseTo(DEPTH_DILEMMA);
  });

  it('reveals disposition after DISPOSITION_DILEMMA_THRESHOLD witnessed dilemmas', () => {
    const graph = buildTestGraph();
    // Pre-seed agent-A with DISPOSITION_DILEMMA_THRESHOLD - 1 dilemma events already recorded
    const agentKnowledge = new Map();
    const knowledge = createEmptyAgentKnowledge();
    // Add dilemma events to knownEvents to simulate past dilemmas
    for (let i = 0; i < DISPOSITION_DILEMMA_THRESHOLD - 1; i++) {
      knowledge.knownEvents.add(`dilemma_ev_${i}`);
    }
    agentKnowledge.set('agent-A', knowledge);

    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      agentKnowledge,
      tickEvents: [
        {
          id: 'ev-dilemma',
          tick: 1,
          type: 'dilemma_resolved',
          message: 'Agent Alpha and Agent Beta: cooperate_cooperate',
          significance: 0.5,
        },
      ],
    });

    emitDilemmaRevelations(state);

    const k = state.agentKnowledge.get('agent-A');
    expect(k).toBeDefined();
    expect(k!.dispositionRevealed).toBe(true);
  });

  it('does not affect non-co-located agents', () => {
    const graph = buildTestGraph();
    // agent-B is not co-located with avatar
    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      tickEvents: [
        {
          id: 'ev-1',
          tick: 1,
          type: 'dilemma_resolved',
          message: 'Agent Beta and someone: defect_cooperate',
          significance: 0.5,
        },
      ],
    });

    emitDilemmaRevelations(state);

    // agent-B is not co-located with avatar; if it gets knowledge, depth should not be from dilemma
    const k = state.agentKnowledge.get('agent-B');
    if (k) {
      // agent-B might get some knowledge but not dilemma depth
      expect(k.interactionDepth).toBeLessThan(DEPTH_DILEMMA);
    }
  });

  it('does not throw on no dilemma events in tickEvents', () => {
    const state = makeMinimalState({ ascendantId: 'ascendant-1' });
    expect(() => emitDilemmaRevelations(state)).not.toThrow();
  });
});

// ─── emitColocationRevelations Tests ──────────────────────────────

describe('emitColocationRevelations', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });

  it('reveals visible possession subcategories on first sighting of co-located agent', () => {
    const graph = buildTestGraph();
    // Add a possession item for agent-A with subcategory 'arms'
    graph.addNode({
      id: 'sword-1',
      type: 'item',
      name: 'Iron Sword',
      properties: { subcategory: 'arms' },
    });
    graph.addEdge({
      id: 'edge-agentA-sword',
      source: 'agent-A',
      target: 'sword-1',
      type: 'possesses',
      properties: {},
    });

    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
    });

    emitColocationRevelations(state);

    const k = state.agentKnowledge.get('agent-A');
    expect(k).toBeDefined();
    expect(k!.revealedPossessions.has('sword-1')).toBe(true);
  });

  it('pushes RevelationTrace to traceBuffer for newly revealed possession', () => {
    const graph = buildTestGraph();
    graph.addNode({
      id: 'sword-1',
      type: 'item',
      name: 'Iron Sword',
      properties: { subcategory: 'arms' },
    });
    graph.addEdge({
      id: 'edge-agentA-sword',
      source: 'agent-A',
      target: 'sword-1',
      type: 'possesses',
      properties: {},
    });

    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
    });

    emitColocationRevelations(state);

    const traces = getTraces();
    const revelationTraces = traces.filter(
      t => t.category === 'agent_revelation',
    ) as RevelationTrace[];
    expect(revelationTraces.length).toBeGreaterThan(0);
    expect(revelationTraces.some(t => t.facetType === 'possession')).toBe(true);
  });

  it('does not reveal vestments subcategory items that are not on first sighting', () => {
    const graph = buildTestGraph();
    graph.addNode({
      id: 'robe-1',
      type: 'item',
      name: 'Traveler Robe',
      properties: { subcategory: 'vestments' },
    });
    graph.addEdge({
      id: 'edge-agentA-robe',
      source: 'agent-A',
      target: 'robe-1',
      type: 'possesses',
      properties: {},
    });

    // Pre-seed knowledge so possession is already revealed
    const agentKnowledge = new Map();
    const knowledge = createEmptyAgentKnowledge();
    knowledge.revealedPossessions.add('robe-1');
    agentKnowledge.set('agent-A', knowledge);

    const state = makeMinimalState({
      graph,
      ascendantId: 'ascendant-1',
      agentKnowledge,
    });

    emitColocationRevelations(state);

    const traces = getTraces();
    const revelationTraces = traces.filter(
      t => t.category === 'agent_revelation',
    ) as RevelationTrace[];
    // robe-1 was already known, so no new possession trace
    expect(revelationTraces.filter(t => (t as RevelationTrace).facetId === 'robe-1').length).toBe(0);
  });

  it('does not throw on empty graph (no co-located agents)', () => {
    const state = makeMinimalState({ ascendantId: 'ascendant-1' });
    expect(() => emitColocationRevelations(state)).not.toThrow();
  });
});

// ─── Fail-soft Tests ──────────────────────────────────────────────

describe('revelationEmitter fail-soft', () => {
  it('emitEncounterRevelations does not throw when agentKnowledge is undefined', () => {
    const state = makeMinimalState({
      ascendantId: 'ascendant-1',
      agentKnowledge: undefined as unknown as Map<string, never>,
    });
    expect(() => emitEncounterRevelations(state)).not.toThrow();
  });

  it('emitDilemmaRevelations does not throw when graph has no actors', () => {
    const state = makeMinimalState({ ascendantId: 'ascendant-1' });
    state.tickEvents.push({
      id: 'ev-dilemma',
      tick: 1,
      type: 'dilemma_resolved',
      message: 'Nobody and someone',
      significance: 0.5,
    });
    expect(() => emitDilemmaRevelations(state)).not.toThrow();
  });

  it('emitColocationRevelations does not throw when agentKnowledge is missing', () => {
    const state = makeMinimalState({
      ascendantId: 'ascendant-1',
      agentKnowledge: undefined as unknown as Map<string, never>,
    });
    expect(() => emitColocationRevelations(state)).not.toThrow();
  });
});
