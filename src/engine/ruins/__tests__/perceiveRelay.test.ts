/**
 * Tests for Perceive & Relay divine action resolution (THR-151).
 *
 * Covers:
 *   - PERCEIVE_RELAY_TEMPLATE_IDS: contains all 7 expected IDs
 *   - cast_attention: creates vague clue; fails without ruin; fails without bonded agent
 *   - refine_the_hush: upgrades vague→narrowed; falls back to new narrowed clue
 *   - listen_for_a_name: creates narrowed clue with originCultureId detail
 *   - read_the_threads: creates vague PoP clue; no-op when no PoP present
 *   - taste_the_wake: surfaces divine_mark secrets; no-op when no marks
 *   - compose_a_clue: creates knows_clue_of + divine_mark on bonded agent
 *   - compose_a_clue: no-op when agent is not bonded
 *   - whisper_the_direction: overrides agent movementState.destinationId
 */

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { mulberry32 } from '../../../lib/prng';
import type { GameState } from '../../../types/gameState';
import type { KnowsClueOfEdgeProperties } from '../../../types/knowledge';
import type { KnowsSecretOfEdgeProperties } from '../../../types/secretsFavors';
import type { MovementState } from '../../../types/movement';
import {
  enableTracing,
  disableTracing,
  clearTraces,
  getTraces,
} from '../../traceBuffer';
import {
  resolvePerceiveRelayAction,
  PERCEIVE_RELAY_TEMPLATE_IDS,
} from '../perceiveRelay';

// ─── Graph + state builders ──────────────────────────────────────────────────

function buildBaseGraph(opts: {
  bondedAgentHex?: { col: number; row: number };
  ruinHex?: { col: number; row: number };
  addPoP?: boolean;
} = {}): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'god-1',
    type: 'actor',
    name: 'The God',
    properties: { actorType: 'ascendant' },
  });

  if (opts.bondedAgentHex) {
    graph.addNode({
      id: 'loc-bonded',
      type: 'location',
      name: 'Bonded Agent Location',
      properties: {
        hexCol: opts.bondedAgentHex.col,
        hexRow: opts.bondedAgentHex.row,
      },
    });
    graph.addNode({
      id: 'agent-bonded',
      type: 'actor',
      name: 'Bonded Agent',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'god-thread-bonded',
      source: 'god-1',
      target: 'agent-bonded',
      type: 'thread',
      properties: {},
    });
    graph.addEdge({
      id: 'bonded-located',
      source: 'agent-bonded',
      target: 'loc-bonded',
      type: 'located_at',
      properties: {},
    });
  }

  if (opts.ruinHex) {
    graph.addNode({
      id: 'ruin-1',
      type: 'location',
      name: 'The Ancient Ruin',
      properties: {
        hexCol: opts.ruinHex.col,
        hexRow: opts.ruinHex.row,
        ruinMagnitude: 0.5,
        sphereAlignment: 'spirit',
        originCultureId: 'culture-old',
      },
    });
  }

  if (opts.addPoP) {
    graph.addNode({
      id: 'pop-1',
      type: 'location',
      name: 'Place of Power',
      properties: {
        hexCol: opts.ruinHex?.col ?? 3,
        hexRow: opts.ruinHex?.row ?? 3,
        isPlaceOfPower: true,
        ruinMagnitude: 0.6,
        sphereAlignment: 'spirit',
        originCultureId: '',
      },
    });
  }

  return graph;
}

function buildState(graph: WorldGraph, tick = 10): GameState {
  return {
    graph,
    ascendantId: 'god-1',
    tick,
    encounterProgress: [],
  } as unknown as GameState;
}

const rng = mulberry32(0xdeadbeef);

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  enableTracing();
  clearTraces();
});

afterEach(() => {
  disableTracing();
  clearTraces();
});

// ─── Template ID registry ────────────────────────────────────────────────────

describe('PERCEIVE_RELAY_TEMPLATE_IDS', () => {
  it('contains all 7 expected template IDs', () => {
    const expected = [
      'divine.perceive.cast_attention',
      'divine.perceive.refine_the_hush',
      'divine.perceive.listen_for_a_name',
      'divine.perceive.read_the_threads',
      'divine.perceive.taste_the_wake',
      'divine.relay.compose_a_clue',
      'divine.relay.whisper_the_direction',
    ];
    for (const id of expected) {
      expect(PERCEIVE_RELAY_TEMPLATE_IDS.has(id)).toBe(true);
    }
    expect(PERCEIVE_RELAY_TEMPLATE_IDS.size).toBe(7);
  });
});

// ─── divine.perceive.cast_attention ─────────────────────────────────────────

describe('divine.perceive.cast_attention', () => {
  it('creates a vague clue when ruin and bonded agent are both at target hex', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 3, row: 3 },
      bondedAgentHex: { col: 3, row: 3 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.cast_attention',
      state,
      'hex_3_3',
      mulberry32(1),
    );

    const clueEdges = graph.getOutgoingEdges('agent-bonded', 'knows_clue_of');
    expect(clueEdges).toHaveLength(1);
    const props = clueEdges[0].properties as unknown as KnowsClueOfEdgeProperties;
    expect(props.precision).toBe('vague');
    expect(props.source).toBe('divine_whisper');
    expect(props.composedByGodId).toBe('god-1');
  });

  it('emits suppression trace and creates no edge when no ruin exists at hex', () => {
    const graph = buildBaseGraph({
      bondedAgentHex: { col: 3, row: 3 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.cast_attention',
      state,
      'hex_3_3',
      mulberry32(1),
    );

    const clueEdges = graph.getAllEdges().filter(e => e.type === 'knows_clue_of');
    expect(clueEdges).toHaveLength(0);

    const traces = getTraces().filter(t => t.category === 'ruins.clue_suppressed_no_eligible_recipient');
    expect(traces).toHaveLength(1);
  });

  it('emits suppression trace and creates no edge when no bonded agent is adjacent', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 3, row: 3 },
      bondedAgentHex: { col: 10, row: 10 }, // far away
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.cast_attention',
      state,
      'hex_3_3',
      mulberry32(1),
    );

    const clueEdges = graph.getAllEdges().filter(e => e.type === 'knows_clue_of');
    expect(clueEdges).toHaveLength(0);

    const traces = getTraces().filter(t => t.category === 'ruins.clue_suppressed_no_eligible_recipient');
    expect(traces).toHaveLength(1);
  });

  it('accepts bonded agent on adjacent hex (distance 1)', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 3, row: 3 },
      bondedAgentHex: { col: 4, row: 3 }, // adjacent to (3,3)
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.cast_attention',
      state,
      'hex_3_3',
      mulberry32(1),
    );

    const clueEdges = graph.getOutgoingEdges('agent-bonded', 'knows_clue_of');
    expect(clueEdges).toHaveLength(1);
  });
});

// ─── divine.perceive.refine_the_hush ────────────────────────────────────────

describe('divine.perceive.refine_the_hush', () => {
  it('upgrades an existing vague clue to narrowed', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 2, row: 2 },
      bondedAgentHex: { col: 2, row: 2 },
    });

    // Pre-plant a vague clue on the bonded agent
    graph.addEdge({
      id: 'pre-clue',
      source: 'agent-bonded',
      target: 'ruin-1',
      type: 'knows_clue_of',
      properties: {
        magnitude: 0.5,
        precision: 'vague',
        source: 'tavern_rumor',
        discoveredTick: 5,
        consumed: false,
      } as unknown as Record<string, unknown>,
    });

    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.refine_the_hush',
      state,
      'hex_2_2',
      mulberry32(1),
    );

    const edge = graph.getOutgoingEdges('agent-bonded', 'knows_clue_of').find(e => e.id === 'pre-clue');
    expect(edge).toBeDefined();
    const props = edge!.properties as unknown as KnowsClueOfEdgeProperties;
    expect(props.precision).toBe('narrowed');

    const traces = getTraces().filter(t => t.category === 'ruins.clue_discovered');
    expect(traces.length).toBeGreaterThan(0);
  });

  it('spawns a new narrowed clue when no vague clue exists to upgrade', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 2, row: 2 },
      bondedAgentHex: { col: 2, row: 2 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.refine_the_hush',
      state,
      'hex_2_2',
      mulberry32(1),
    );

    const clueEdges = graph.getOutgoingEdges('agent-bonded', 'knows_clue_of');
    expect(clueEdges).toHaveLength(1);
    const props = clueEdges[0].properties as unknown as KnowsClueOfEdgeProperties;
    expect(props.precision).toBe('narrowed');
  });
});

// ─── divine.perceive.listen_for_a_name ──────────────────────────────────────

describe('divine.perceive.listen_for_a_name', () => {
  it('creates a narrowed clue with originCultureId in the detail', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 1, row: 1 },
      bondedAgentHex: { col: 1, row: 1 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.listen_for_a_name',
      state,
      'hex_1_1',
      mulberry32(1),
    );

    const clueEdges = graph.getOutgoingEdges('agent-bonded', 'knows_clue_of');
    expect(clueEdges).toHaveLength(1);
    const props = clueEdges[0].properties as unknown as KnowsClueOfEdgeProperties;
    expect(props.precision).toBe('narrowed');
    expect(props.detail).toContain('culture-old');
  });
});

// ─── divine.perceive.read_the_threads ───────────────────────────────────────

describe('divine.perceive.read_the_threads', () => {
  it('creates a vague clue for a Place of Power at the target hex', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 3, row: 3 },
      bondedAgentHex: { col: 3, row: 3 },
      addPoP: true,
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.read_the_threads',
      state,
      'hex_3_3',
      mulberry32(1),
    );

    const clueEdges = graph.getAllEdges().filter(e => e.type === 'knows_clue_of' && e.target === 'pop-1');
    expect(clueEdges).toHaveLength(1);
    const props = clueEdges[0].properties as unknown as KnowsClueOfEdgeProperties;
    expect(props.precision).toBe('vague');
  });

  it('emits suppression trace when no Place of Power exists at hex', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 3, row: 3 },
      bondedAgentHex: { col: 3, row: 3 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.read_the_threads',
      state,
      'hex_3_3',
      mulberry32(1),
    );

    const clueEdges = graph.getAllEdges().filter(e => e.type === 'knows_clue_of');
    expect(clueEdges).toHaveLength(0);

    const traces = getTraces().filter(t => t.category === 'ruins.clue_suppressed_no_eligible_recipient');
    expect(traces.length).toBeGreaterThan(0);
  });
});

// ─── divine.perceive.taste_the_wake ─────────────────────────────────────────

describe('divine.perceive.taste_the_wake', () => {
  it('emits divine_mark_discovered trace when agent at hex has a divine mark', () => {
    const graph = buildBaseGraph({
      bondedAgentHex: { col: 5, row: 5 },
    });

    // Place a rival god node (needed as edge target for knows_secret_of)
    graph.addNode({
      id: 'rival-god',
      type: 'actor',
      name: 'Rival God',
      properties: { actorType: 'ascendant' },
    });

    // Place another agent (not bonded) at the target hex with a divine_mark secret
    graph.addNode({
      id: 'loc-5-5',
      type: 'location',
      name: 'Location 5,5',
      properties: { hexCol: 5, hexRow: 5 },
    });
    graph.addNode({
      id: 'agent-marked',
      type: 'actor',
      name: 'Marked Agent',
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: 'marked-located',
      source: 'agent-marked',
      target: 'loc-5-5',
      type: 'located_at',
      properties: {},
    });
    graph.addEdge({
      id: 'divine-mark-edge',
      source: 'agent-marked',
      target: 'rival-god',
      type: 'knows_secret_of',
      properties: {
        secretType: 'divine_mark',
        magnitude: 0.5,
        discoveredTick: 3,
        source: 'divine_revelation',
        revealed: false,
      } as unknown as Record<string, unknown>,
    });

    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.taste_the_wake',
      state,
      'hex_5_5',
      rng,
    );

    const traces = getTraces().filter(t => t.category === 'ruins.divine_mark_discovered');
    expect(traces).toHaveLength(1);
    expect((traces[0] as Record<string, unknown>).agentId).toBe('agent-marked');
  });

  it('emits suppression trace when no divine marks are found', () => {
    const graph = buildBaseGraph({
      bondedAgentHex: { col: 5, row: 5 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.perceive.taste_the_wake',
      state,
      'hex_5_5',
      rng,
    );

    const markTraces = getTraces().filter(t => t.category === 'ruins.divine_mark_discovered');
    expect(markTraces).toHaveLength(0);
    const suppressTraces = getTraces().filter(t => t.category === 'ruins.clue_suppressed_no_eligible_recipient');
    expect(suppressTraces.length).toBeGreaterThan(0);
  });
});

// ─── divine.relay.compose_a_clue ────────────────────────────────────────────

describe('divine.relay.compose_a_clue', () => {
  it('creates knows_clue_of edge and divine_mark on bonded agent', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 0, row: 0 },
      bondedAgentHex: { col: 1, row: 1 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.relay.compose_a_clue',
      state,
      'agent-bonded',
      mulberry32(1),
    );

    const clueEdges = graph.getOutgoingEdges('agent-bonded', 'knows_clue_of');
    expect(clueEdges).toHaveLength(1);
    const clueProps = clueEdges[0].properties as unknown as KnowsClueOfEdgeProperties;
    expect(clueProps.source).toBe('divine_whisper');
    expect(clueProps.composedByGodId).toBe('god-1');
    expect(clueProps.precision).toBe('narrowed');

    const markEdges = graph.getOutgoingEdges('agent-bonded', 'knows_secret_of');
    expect(markEdges).toHaveLength(1);
    const markProps = markEdges[0].properties as unknown as KnowsSecretOfEdgeProperties;
    expect(markProps.secretType).toBe('divine_mark');
    expect(markProps.revealed).toBe(false);

    const clueTraces = getTraces().filter(t => t.category === 'ruins.clue_discovered');
    expect(clueTraces.length).toBeGreaterThan(0);
    const markTraces = getTraces().filter(t => t.category === 'ruins.divine_mark_composed');
    expect(markTraces).toHaveLength(1);
  });

  it('does nothing when the agent is not bonded', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 0, row: 0 },
    });
    graph.addNode({
      id: 'unbonded-agent',
      type: 'actor',
      name: 'Unbonded',
      properties: { actorType: 'individual' },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.relay.compose_a_clue',
      state,
      'unbonded-agent',
      mulberry32(1),
    );

    const clueEdges = graph.getAllEdges().filter(e => e.type === 'knows_clue_of');
    expect(clueEdges).toHaveLength(0);
  });

  it('does nothing when no ruin exists in the graph', () => {
    const graph = buildBaseGraph({
      bondedAgentHex: { col: 1, row: 1 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.relay.compose_a_clue',
      state,
      'agent-bonded',
      mulberry32(1),
    );

    const clueEdges = graph.getOutgoingEdges('agent-bonded', 'knows_clue_of');
    expect(clueEdges).toHaveLength(0);
  });
});

// ─── divine.relay.whisper_the_direction ─────────────────────────────────────

describe('divine.relay.whisper_the_direction', () => {
  it('overrides agent movementState.destinationId to nearest ruin', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 5, row: 5 },
      bondedAgentHex: { col: 2, row: 2 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.relay.whisper_the_direction',
      state,
      'agent-bonded',
      mulberry32(1),
    );

    const agentNode = graph.getNode('agent-bonded');
    const movState = (agentNode?.properties as Record<string, unknown>)?.movementState as MovementState | undefined;
    expect(movState).toBeDefined();
    expect(movState?.destinationId).toBe('ruin-1');
    expect(movState?.movementQueue).toEqual([]);
  });

  it('does nothing when agent is not bonded', () => {
    const graph = buildBaseGraph({
      ruinHex: { col: 5, row: 5 },
    });
    graph.addNode({
      id: 'unbonded',
      type: 'actor',
      name: 'Unbonded',
      properties: { actorType: 'individual' },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.relay.whisper_the_direction',
      state,
      'unbonded',
      mulberry32(1),
    );

    const agentNode = graph.getNode('unbonded');
    const movState = (agentNode?.properties as Record<string, unknown>)?.movementState;
    expect(movState).toBeUndefined();
  });

  it('does nothing when no ruin exists in the graph', () => {
    const graph = buildBaseGraph({
      bondedAgentHex: { col: 2, row: 2 },
    });
    const state = buildState(graph);

    resolvePerceiveRelayAction(
      'divine.relay.whisper_the_direction',
      state,
      'agent-bonded',
      mulberry32(1),
    );

    const agentNode = graph.getNode('agent-bonded');
    const movState = (agentNode?.properties as Record<string, unknown>)?.movementState;
    expect(movState).toBeUndefined();
  });
});

// ─── Fail-soft: missing targetId ─────────────────────────────────────────────

describe('resolvePerceiveRelayAction fail-soft', () => {
  it('returns without error when targetId is undefined', () => {
    const graph = buildBaseGraph();
    const state = buildState(graph);
    expect(() =>
      resolvePerceiveRelayAction('divine.perceive.cast_attention', state, undefined, rng)
    ).not.toThrow();
  });

  it('returns without error for unknown templateId', () => {
    const graph = buildBaseGraph();
    const state = buildState(graph);
    expect(() =>
      resolvePerceiveRelayAction('divine.perceive.unknown_action', state, 'hex_0_0', rng)
    ).not.toThrow();
  });
});
