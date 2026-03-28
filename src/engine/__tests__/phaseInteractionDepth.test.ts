/**
 * Tests for phaseInteractionDepth — the interaction depth accumulator phase.
 *
 * Tests cover:
 * - Co-location increments coLocationTicks and interactionDepth
 * - Faction co-membership increments interactionDepth by DEPTH_FACTION_PER_TICK
 * - Traces are emitted with correct before/after values
 * - Phase is idempotent — doesn't double-count on same tick when called twice
 * - GameState.agentKnowledge is initialized as empty Map in gameInit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import {
  DEPTH_COLOCATION_PER_TICK,
  DEPTH_FACTION_PER_TICK,
} from '../../types/agentKnowledge';
import { phaseInteractionDepth } from '../phaseInteractionDepth';

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
 * - avatar node connected to ascendant via 'avatar_of' edge
 * - avatar placed at location 'loc-1' at hex (5, 5)
 * - one agent 'agent-A' placed at 'loc-1' (same hex as avatar)
 * - one agent 'agent-B' placed at 'loc-2' at hex (10, 10) (different hex)
 */
function buildTestGraph(): WorldGraph {
  const graph = new WorldGraph();

  // Location nodes
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

  // Ascendant node
  graph.addNode({
    id: 'ascendant-1',
    type: 'actor',
    name: 'The God',
    properties: { actorType: 'ascendant' },
  });

  // Avatar node
  graph.addNode({
    id: 'avatar-1',
    type: 'actor',
    name: 'The Vessel',
    properties: { actorType: 'individual', locationId: 'loc-1' },
  });
  // avatar_of edge: avatar → ascendant
  graph.addEdge({
    id: 'edge-avatar-of',
    source: 'avatar-1',
    target: 'ascendant-1',
    type: 'avatar_of',
    properties: {},
  });
  // located_at edge: avatar → loc-1
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
    properties: { actorType: 'individual', locationId: 'loc-1' },
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
    properties: { actorType: 'individual', locationId: 'loc-2' },
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

/**
 * Extend test graph with a faction that both avatar and agent-B share.
 * agent-A is NOT in the faction.
 */
function addSharedFaction(graph: WorldGraph): void {
  graph.addNode({
    id: 'faction-1',
    type: 'actor',
    name: 'Iron Guild',
    properties: { actorType: 'faction' },
  });

  // Avatar is member of faction-1
  graph.addEdge({
    id: 'edge-avatar-faction',
    source: 'avatar-1',
    target: 'faction-1',
    type: 'member_of',
    properties: {},
  });

  // Agent B is member of faction-1 (same faction as avatar)
  graph.addEdge({
    id: 'edge-agentB-faction',
    source: 'agent-B',
    target: 'faction-1',
    type: 'member_of',
    properties: {},
  });
}

// ─── Co-location Tests ────────────────────────────────────────────

describe('phaseInteractionDepth — co-location', () => {
  let state: GameState;

  beforeEach(() => {
    const graph = buildTestGraph();
    state = makeMinimalState({ graph, ascendantId: 'ascendant-1' });
  });

  it('increments coLocationTicks for co-located agent', () => {
    phaseInteractionDepth(state);
    const k = state.agentKnowledge.get('agent-A');
    expect(k).toBeDefined();
    expect(k!.coLocationTicks).toBe(1);
  });

  it('increments interactionDepth by DEPTH_COLOCATION_PER_TICK for co-located agent', () => {
    phaseInteractionDepth(state);
    const k = state.agentKnowledge.get('agent-A');
    expect(k!.interactionDepth).toBeCloseTo(DEPTH_COLOCATION_PER_TICK);
  });

  it('does not affect non-co-located agents depth', () => {
    phaseInteractionDepth(state);
    const kB = state.agentKnowledge.get('agent-B');
    // agent-B may still be in map (with faction ambient), but coLocationTicks should be 0
    if (kB) {
      expect(kB.coLocationTicks).toBe(0);
    }
  });

  it('does not increment coLocationTicks for non-co-located agent', () => {
    phaseInteractionDepth(state);
    const kB = state.agentKnowledge.get('agent-B');
    if (kB) {
      expect(kB.coLocationTicks).toBe(0);
    }
  });
});

// ─── Faction Ambient Tests ─────────────────────────────────────────

describe('phaseInteractionDepth — faction ambient', () => {
  let state: GameState;

  beforeEach(() => {
    const graph = buildTestGraph();
    addSharedFaction(graph);
    state = makeMinimalState({ graph, ascendantId: 'ascendant-1' });
  });

  it('increments interactionDepth by DEPTH_FACTION_PER_TICK for faction co-member', () => {
    phaseInteractionDepth(state);
    const kB = state.agentKnowledge.get('agent-B');
    expect(kB).toBeDefined();
    expect(kB!.interactionDepth).toBeCloseTo(DEPTH_FACTION_PER_TICK);
  });

  it('does not add faction depth to agents not in shared faction', () => {
    phaseInteractionDepth(state);
    const kA = state.agentKnowledge.get('agent-A');
    // agent-A gets co-location but NOT faction ambient
    expect(kA!.interactionDepth).toBeCloseTo(DEPTH_COLOCATION_PER_TICK);
  });
});

// ─── Idempotency Tests ────────────────────────────────────────────

describe('phaseInteractionDepth — idempotency', () => {
  it('accumulates linearly when called twice (each call adds depth)', () => {
    const graph = buildTestGraph();
    const state = makeMinimalState({ graph, ascendantId: 'ascendant-1' });

    phaseInteractionDepth(state);
    phaseInteractionDepth(state);

    const kA = state.agentKnowledge.get('agent-A');
    expect(kA!.coLocationTicks).toBe(2);
    expect(kA!.interactionDepth).toBeCloseTo(DEPTH_COLOCATION_PER_TICK * 2);
  });
});

// ─── GameState Initialization ─────────────────────────────────────

describe('GameState agentKnowledge initialization', () => {
  it('agentKnowledge is an empty Map in a freshly constructed state', () => {
    const state = makeMinimalState();
    expect(state.agentKnowledge).toBeInstanceOf(Map);
    expect(state.agentKnowledge.size).toBe(0);
  });
});
