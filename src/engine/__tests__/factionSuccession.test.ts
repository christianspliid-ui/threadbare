/**
 * THR-432 — Faction Succession subsystem tests.
 *
 * Covers:
 *   - EDGE_SCHEMA entries for `will_succeed` and `leads`
 *   - applyAnointSuccessor — creates will_succeed edge, emits trace, multi-faction resolved
 *   - getAnointedLeaderId — returns leader when leads edge is set; null on stale/expelled
 *   - phaseFactionSuccession — all five outcomes
 *   - Integration: anoint → kill leader → successor holds leads + inheritance encounter seeded
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyAnointSuccessor } from '../anointSuccessor';
import { getAnointedLeaderId, getFactionLeaderId } from '../factionNetwork';
import { phaseFactionSuccession } from '../phaseFactionSuccession';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import { EDGE_SCHEMA } from '../../types/edgeSchema';
import {
  INHERITANCE_ENCOUNTER_DELAY,
  INHERITANCE_SEEDED_ENCOUNTER_ID,
} from '../../data/faction-action-constants';

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'ascendant' } });
  graph.addNode({
    id: 'faction-alpha',
    type: 'actor',
    name: 'Alpha Guild',
    properties: {
      actorType: 'faction',
      actorStatus: 'active',
      reputation: 0.6,
      factionType: 'guild',
    },
  });
  graph.addNode({ id: 'm1', type: 'actor', name: 'Marsa', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'm2', type: 'actor', name: 'Bren', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'm3', type: 'actor', name: 'Cael', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'me1', source: 'm1', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.9, role: 'leader', rank: 5, joinedTick: 0 } });
  graph.addEdge({ id: 'me2', source: 'm2', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.6, role: 'member', rank: 2, joinedTick: 0 } });
  graph.addEdge({ id: 'me3', source: 'm3', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.5, role: 'member', rank: 2, joinedTick: 0 } });
  return {
    tick: 10,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'actor-hero',
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
    visibilityMap: {} as never,
    familiarityMap: {} as never,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
    encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as GameState;
}

beforeEach(() => {
  enableTracing();
  clearTraces();
});

afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('EDGE_SCHEMA — THR-432 entries', () => {
  it('declares will_succeed with anointedTick required', () => {
    const schema = EDGE_SCHEMA.will_succeed;
    expect(schema).toBeDefined();
    expect(schema.type).toBe('will_succeed');
    expect(schema.direction).toBe('directed');
    expect(schema.requiredProperties).toContain('anointedTick');
  });

  it('declares leads with seatedTick required', () => {
    const schema = EDGE_SCHEMA.leads;
    expect(schema).toBeDefined();
    expect(schema.type).toBe('leads');
    expect(schema.direction).toBe('directed');
    expect(schema.cardinality).toBe('one-to-one');
    expect(schema.requiredProperties).toContain('seatedTick');
  });
});

describe('applyAnointSuccessor', () => {
  it('creates a will_succeed edge stamped with anointedTick', () => {
    const state = buildState();
    const ok = applyAnointSuccessor(state, 'm2', 'actor-hero');
    expect(ok).toBe(true);
    const edges = state.graph.getOutgoingEdges('m2', 'will_succeed');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe('faction-alpha');
    expect(edges[0].properties.anointedTick).toBe(state.tick);
    expect(edges[0].properties.anointedBy).toBe('actor-hero');
  });

  it('emits a faction_anoint_successor trace', () => {
    const state = buildState();
    applyAnointSuccessor(state, 'm2', 'actor-hero');
    const traces = getTraces();
    const trace = traces.find(t => t.category === 'faction_anoint_successor');
    expect(trace).toBeDefined();
    if (trace && 'successorId' in trace) {
      expect(trace.successorId).toBe('m2');
      expect(trace.reAnointment).toBe(false);
    }
  });

  it('marks reAnointment when target already had a will_succeed edge', () => {
    const state = buildState();
    applyAnointSuccessor(state, 'm2', 'actor-hero');
    state.tick = 11;
    applyAnointSuccessor(state, 'm2', 'actor-hero');
    const traces = getTraces();
    const last = traces.filter(t => t.category === 'faction_anoint_successor').pop();
    expect(last).toBeDefined();
    if (last && 'reAnointment' in last) {
      expect(last.reAnointment).toBe(true);
    }
    // Two edges now — succession resolver will pick the most recent.
    expect(state.graph.getOutgoingEdges('m2', 'will_succeed')).toHaveLength(2);
  });

  it('refuses when target has no faction membership', () => {
    const state = buildState();
    state.graph.addNode({ id: 'm4', type: 'actor', name: 'Free Agent', properties: { actorType: 'individual' } });
    const ok = applyAnointSuccessor(state, 'm4', 'actor-hero');
    expect(ok).toBe(false);
  });

  it('refuses on army-type target', () => {
    const state = buildState();
    state.graph.addNode({ id: 'army1', type: 'actor', name: 'Army', properties: { actorType: 'individual', armyState: 'mustered' } });
    state.graph.addEdge({ id: 'mae', source: 'army1', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.4, role: 'army', rank: 1, joinedTick: 0 } });
    const ok = applyAnointSuccessor(state, 'army1', 'actor-hero');
    expect(ok).toBe(false);
  });
});

describe('getAnointedLeaderId', () => {
  it('returns null when no leads edge exists', () => {
    const state = buildState();
    expect(getAnointedLeaderId(state.graph, 'faction-alpha')).toBeNull();
  });

  it('returns the seated leader when leads edge points at a member', () => {
    const state = buildState();
    state.graph.addEdge({ id: 'lead1', source: 'm2', target: 'faction-alpha', type: 'leads', properties: { seatedTick: state.tick, conferredVia: 'anointment' } });
    expect(getAnointedLeaderId(state.graph, 'faction-alpha')).toBe('m2');
  });

  it('returns null when leads edge points at a non-member (stale edge)', () => {
    const state = buildState();
    state.graph.addNode({ id: 'expelled', type: 'actor', name: 'Expelled', properties: { actorType: 'individual' } });
    state.graph.addEdge({ id: 'lead1', source: 'expelled', target: 'faction-alpha', type: 'leads', properties: { seatedTick: state.tick, conferredVia: 'anointment' } });
    expect(getAnointedLeaderId(state.graph, 'faction-alpha')).toBeNull();
  });
});

describe('phaseFactionSuccession — outcomes', () => {
  it('bootstraps the snapshot on first observation', () => {
    const state = buildState();
    phaseFactionSuccession(state);
    const faction = state.graph.getNode('faction-alpha')!;
    expect(faction.properties.leaderSnapshotId).toBeDefined();
    const traces = getTraces().filter(t => t.category === 'faction_succession');
    expect(traces.length).toBeGreaterThan(0);
    const t = traces[0];
    if ('outcome' in t) expect(t.outcome).toBe('snapshot_bootstrapped');
  });

  it('does nothing further when the leader is unchanged', () => {
    const state = buildState();
    phaseFactionSuccession(state); // bootstrap
    clearTraces();
    state.tick = 11;
    phaseFactionSuccession(state);
    const traces = getTraces().filter(t => t.category === 'faction_succession');
    expect(traces).toHaveLength(0);
  });

  it('inherits an anointed successor on leader exit', () => {
    const state = buildState();
    // Anoint m2 as successor.
    applyAnointSuccessor(state, 'm2', 'actor-hero');
    // Bootstrap snapshot.
    phaseFactionSuccession(state);
    expect(state.graph.getNode('faction-alpha')!.properties.leaderSnapshotId).toBe('m1');

    // Simulate the leader exiting — remove m1's member_of edge.
    const m1Edge = state.graph.getOutgoingEdges('m1', 'member_of')[0];
    state.graph.removeEdge(m1Edge.id);
    state.graph.removeNode('m1'); // mimic agentLifecycle death-removal cascade

    state.tick = 11;
    clearTraces();
    phaseFactionSuccession(state);

    // The leads edge should now point at m2.
    expect(getAnointedLeaderId(state.graph, 'faction-alpha')).toBe('m2');
    // The will_succeed edge should be consumed.
    expect(state.graph.getOutgoingEdges('m2', 'will_succeed')).toHaveLength(0);
    // The inheritance encounter should be seeded.
    expect(state.pendingEncounterSeeds?.length ?? 0).toBeGreaterThan(0);
    const seed = state.pendingEncounterSeeds?.find(s => s.templateId === INHERITANCE_SEEDED_ENCOUNTER_ID);
    expect(seed).toBeDefined();
    expect(seed?.targetAgentId).toBe('m2');
    expect(seed?.eligibleAfterTick).toBe(state.tick + INHERITANCE_ENCOUNTER_DELAY);
    // Trace should record the outcome.
    const trace = getTraces().find(t => t.category === 'faction_succession');
    expect(trace).toBeDefined();
    if (trace && 'outcome' in trace) expect(trace.outcome).toBe('anointed_inherited');
  });

  it('falls back to natural succession when no anointed successor exists', () => {
    const state = buildState();
    phaseFactionSuccession(state); // bootstrap snapshot to m1

    // Leader exits without an anointed successor.
    const m1Edge = state.graph.getOutgoingEdges('m1', 'member_of')[0];
    state.graph.removeEdge(m1Edge.id);
    state.graph.removeNode('m1');

    state.tick = 11;
    clearTraces();
    phaseFactionSuccession(state);

    // No leads edge created.
    expect(getAnointedLeaderId(state.graph, 'faction-alpha')).toBeNull();
    // Score derivation names the next-highest member (m2 has rep 0.6).
    expect(getFactionLeaderId(state.graph, 'faction-alpha')).toBe('m2');
    // Trace records natural_succession.
    const trace = getTraces().find(t => t.category === 'faction_succession');
    expect(trace).toBeDefined();
    if (trace && 'outcome' in trace) expect(trace.outcome).toBe('natural_succession');
  });

  it('clears a will_succeed edge when its holder self-seats by score climb', () => {
    const state = buildState();
    applyAnointSuccessor(state, 'm2', 'actor-hero');
    phaseFactionSuccession(state); // bootstrap snapshot to m1

    // m2 climbs to the seat by score (m1 is still alive and a member, but m2
    // outscores them). leadershipScore weighs rank and role-text hints — bump
    // m2 above m1's score (m1 has role:'leader' rank:5 → score ≈ 7.4).
    const m2Edge = state.graph.getOutgoingEdges('m2', 'member_of')[0];
    state.graph.updateEdge(m2Edge.id, {
      properties: { ...m2Edge.properties, reputation: 0.99, rank: 10, role: 'leader' },
    });
    // Also demote m1 so they no longer outrank.
    const m1Edge = state.graph.getOutgoingEdges('m1', 'member_of')[0];
    state.graph.updateEdge(m1Edge.id, {
      properties: { ...m1Edge.properties, reputation: 0.1, rank: 1, role: 'member' },
    });

    state.tick = 11;
    clearTraces();
    phaseFactionSuccession(state);

    // The will_succeed edge should be consumed (successor reached the seat unaided).
    expect(state.graph.getOutgoingEdges('m2', 'will_succeed')).toHaveLength(0);
    const trace = getTraces().find(t => t.category === 'faction_succession');
    if (trace && 'outcome' in trace) expect(trace.outcome).toBe('successor_self_seated');
  });

  it('handles peaceful overtake without firing succession', () => {
    const state = buildState();
    phaseFactionSuccession(state); // bootstrap

    // Boost m2 + demote m1 so m2 outscores m1 (without removing m1). Score
    // derivation weighs rank/role-text hints, not pure reputation.
    const m2Edge = state.graph.getOutgoingEdges('m2', 'member_of')[0];
    state.graph.updateEdge(m2Edge.id, {
      properties: { ...m2Edge.properties, reputation: 0.99, rank: 10, role: 'leader' },
    });
    const m1Edge = state.graph.getOutgoingEdges('m1', 'member_of')[0];
    state.graph.updateEdge(m1Edge.id, {
      properties: { ...m1Edge.properties, reputation: 0.1, rank: 1, role: 'member' },
    });

    state.tick = 11;
    clearTraces();
    phaseFactionSuccession(state);

    // No leads edge (anointed succession did not fire).
    expect(getAnointedLeaderId(state.graph, 'faction-alpha')).toBeNull();
    // Snapshot re-pointed.
    expect(state.graph.getNode('faction-alpha')!.properties.leaderSnapshotId).toBe('m2');
    const trace = getTraces().find(t => t.category === 'faction_succession');
    if (trace && 'outcome' in trace) expect(trace.outcome).toBe('peaceful_overtake');
  });

  it('picks the most recently anointed successor when multiple candidates exist', () => {
    const state = buildState();
    applyAnointSuccessor(state, 'm2', 'actor-hero'); // tick 10
    state.tick = 12;
    applyAnointSuccessor(state, 'm3', 'actor-hero'); // tick 12 — more recent
    state.tick = 10;
    phaseFactionSuccession(state); // bootstrap

    // Leader exits.
    const m1Edge = state.graph.getOutgoingEdges('m1', 'member_of')[0];
    state.graph.removeEdge(m1Edge.id);
    state.graph.removeNode('m1');

    state.tick = 13;
    clearTraces();
    phaseFactionSuccession(state);

    // m3 (more recent anointment) wins.
    expect(getAnointedLeaderId(state.graph, 'faction-alpha')).toBe('m3');
    // m2's edge is still there — queued for the next exit.
    expect(state.graph.getOutgoingEdges('m2', 'will_succeed')).toHaveLength(1);
  });

  it('fails-soft when a will_succeed holder has died (filter out)', () => {
    const state = buildState();
    applyAnointSuccessor(state, 'm2', 'actor-hero');
    phaseFactionSuccession(state); // bootstrap

    // Kill the anointed successor first, then kill the leader.
    state.graph.getOutgoingEdges('m2', 'member_of').forEach(e => state.graph.removeEdge(e.id));
    state.graph.removeNode('m2');
    const m1Edge = state.graph.getOutgoingEdges('m1', 'member_of')[0];
    state.graph.removeEdge(m1Edge.id);
    state.graph.removeNode('m1');

    state.tick = 11;
    clearTraces();
    phaseFactionSuccession(state);

    // Falls back to natural succession (m3 wins by score).
    expect(getAnointedLeaderId(state.graph, 'faction-alpha')).toBeNull();
    expect(getFactionLeaderId(state.graph, 'faction-alpha')).toBe('m3');
    const trace = getTraces().find(t => t.category === 'faction_succession');
    if (trace && 'outcome' in trace) expect(trace.outcome).toBe('natural_succession');
  });
});

describe('Integration — anoint → leader exit → encounter seeded', () => {
  it('end-to-end: cast Anoint Successor, leader dies, successor inherits and encounter is planted', () => {
    const state = buildState();

    // Cast Anoint Successor on m2.
    expect(applyAnointSuccessor(state, 'm2', 'actor-hero')).toBe(true);

    // Bootstrap snapshot.
    phaseFactionSuccession(state);

    // Leader dies (m1 removed; lifecycle would also drop their edges).
    state.graph.getOutgoingEdges('m1', 'member_of').forEach(e => state.graph.removeEdge(e.id));
    state.graph.removeNode('m1');

    // Next tick — succession resolves.
    state.tick = 11;
    phaseFactionSuccession(state);

    // m2 holds the `leads` edge.
    const leads = state.graph.getIncomingEdges('faction-alpha', 'leads');
    expect(leads).toHaveLength(1);
    expect(leads[0].source).toBe('m2');
    expect(leads[0].properties.conferredVia).toBe('anointment');

    // Inheritance encounter seeded.
    const seed = state.pendingEncounterSeeds?.find(s => s.templateId === INHERITANCE_SEEDED_ENCOUNTER_ID);
    expect(seed).toBeDefined();
    expect(seed?.targetAgentId).toBe('m2');

    // The seam test: getFactionLeaderId now reads the anointed seat
    // through the score-derivation fallback's prepend.
    expect(getFactionLeaderId(state.graph, 'faction-alpha')).toBe('m2');
  });
});
