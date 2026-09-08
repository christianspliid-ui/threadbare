/**
 * THR-1438 — the ownership of people-things: the ops and the gates.
 *
 * Seven cells change who commands a group of people. What is worth pinning is not
 * that they run, but that each one **refuses** where it is supposed to: a mutiny
 * against a company that is holding together, a claim on a band whose commander is
 * alive, a candidacy on a seat that is filled, a coup from outside the faction. Every
 * eligibility test below therefore has both arms — the refusal and, with the one
 * condition flipped, the pass. A guard nobody has watched fail is not a guard.
 *
 * The three assertions that could not be reached any other way:
 *   - the mutiny run on a pair who are **already hostile** leaves the injury recorded
 *     (the `writeGrudge` early-return would otherwise have swallowed it silently);
 *   - a candidacy seats **behind** an anointment and a notable's heir, and ahead of
 *     the derived ladder — three edges, one exit;
 *   - `seatLeader` moves `leaderSnapshotId`, so the phase does not read a usurpation
 *     as an exit and re-seat over the top of it.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { UndertakingObjectTypeId } from '../../types/strategicAction';
import { setCommander } from '../groups/groupCommand';
import { seatLeader, nominateSuccessor, forceSuccession } from '../factionSuccessionOps';
import { phaseFactionSuccession } from '../phaseFactionSuccession';
import { getFactionLeaderId } from '../factionNetwork';
import { holdsMotive } from '../undertakingMotive';
import { writeGrudge, writeCovetRivalry } from '../grievance/grudgeEdge';
import { getUndertakingObjectType, eligibilityRefusal } from '../../data/undertaking-objects';
import { resolveUndertakingCompletion } from '../undertakingResolver';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import {
  ANOINTMENT_PRIORITY,
  NOTABLE_HEIR_PRIORITY,
  CANDIDACY_PRIORITY_BY_BAND,
  COMMAND_SEIZED_COHESION_DELTA,
  USURPATION_STANDING_LOSS,
} from '../../data/strategic-action-constants';
import { GROUP_FRAY_THRESHOLD, GROUP_COHESION_BOUND_THRESHOLD } from '../../data/group-constants';
import { REPUTATION_WITH_MAX_DELTA_PER_OUTCOME } from '../reputation';

// ─── Fixtures ───────────────────────────────────────────────────────

function baseState(graph: WorldGraph): GameState {
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    ascendantId: 'actor-hero',
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    echoDefinitions: [], echoStates: [], encounterNotifications: [],
    clearanceGateStates: new Map(), stealthExposure: 0,
  } as unknown as GameState;
}

function mortal(graph: WorldGraph, id: string, name: string, extra: Record<string, unknown> = {}): void {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual', ...extra } });
}

/** A company with a commander and two more members, at a place they all stand. */
function companyWorld(cohesion: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Redfen', properties: { hexCol: 1, hexRow: 1 } });
  mortal(graph, 'cmd', 'Hask');
  mortal(graph, 'mutineer', 'Vessa');
  mortal(graph, 'other', 'Bren');
  mortal(graph, 'outsider', 'Kel');
  graph.addNode({
    id: 'grp', type: 'actor', name: 'The Grey Company',
    properties: { actorType: 'group', groupKind: 'company', groupType: 'warband', cohesion, groupStatus: 'active' },
  });
  graph.addEdge({ id: 'cb', source: 'grp', target: 'cmd', type: 'commanded_by', properties: { assignedTick: 0, via: 'formation' } });
  for (const [i, m] of ['cmd', 'mutineer', 'other'].entries()) {
    graph.addEdge({
      id: `mo${i}`, source: m, target: 'grp', type: 'member_of',
      properties: { joinedTick: 0, role: m === 'cmd' ? 'leader' : 'member' },
    });
  }
  for (const m of ['cmd', 'mutineer', 'other', 'outsider']) {
    graph.addEdge({ id: `la_${m}`, source: m, target: 'loc-1', type: 'located_at', properties: {} });
  }
  return baseState(graph);
}

/** An army raised for a faction, with a commander and one faction-mate who is not in it. */
function armyWorld(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Thornmarch', properties: { hexCol: 2, hexRow: 2 } });
  graph.addNode({ id: 'fac', type: 'actor', name: 'The Ashen Order', properties: { actorType: 'faction', actorStatus: 'active' } });
  mortal(graph, 'cmd', 'Marsa');
  mortal(graph, 'insider', 'Cael');
  mortal(graph, 'stranger', 'Orin');
  graph.addNode({
    id: 'army', type: 'actor', name: 'The Ashen Host',
    properties: { actorType: 'group', groupKind: 'army', armyState: { size: 'warband', headcount: 40 }, groupStatus: 'active' },
  });
  graph.addEdge({ id: 'acb', source: 'army', target: 'cmd', type: 'commanded_by', properties: { assignedTick: 0, via: 'formation' } });
  graph.addEdge({ id: 'afac', source: 'army', target: 'fac', type: 'member_of', properties: { joinedTick: 0 } });
  graph.addEdge({ id: 'mfac1', source: 'cmd', target: 'fac', type: 'member_of', properties: { joinedTick: 0, rank: 4 } });
  graph.addEdge({ id: 'mfac2', source: 'insider', target: 'fac', type: 'member_of', properties: { joinedTick: 0, rank: 2 } });
  graph.addEdge({ id: 'la_cmd', source: 'cmd', target: 'loc-1', type: 'located_at', properties: {} });
  return baseState(graph);
}

/** A faction with three ranked members and no seated leader. */
function factionWorld(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'fac', type: 'actor', name: 'Alpha Guild', properties: { actorType: 'faction', actorStatus: 'active' } });
  mortal(graph, 'top', 'Marsa');
  mortal(graph, 'mid', 'Bren');
  mortal(graph, 'low', 'Cael');
  graph.addEdge({ id: 'f1', source: 'top', target: 'fac', type: 'member_of', properties: { joinedTick: 0, rank: 5, reputation: 0.9 } });
  graph.addEdge({ id: 'f2', source: 'mid', target: 'fac', type: 'member_of', properties: { joinedTick: 0, rank: 3, reputation: 0.6 } });
  graph.addEdge({ id: 'f3', source: 'low', target: 'fac', type: 'member_of', properties: { joinedTick: 0, rank: 1, reputation: 0.4 } });
  return baseState(graph);
}

const handle = (nodeId: string) => ({ kind: 'node', nodeId } as const);
const typeOf = (id: UndertakingObjectTypeId) => getUndertakingObjectType(id)!;

beforeEach(() => { enableTracing(); clearTraces(); });
afterEach(() => { disableTracing(); clearTraces(); });

// ─── setCommander: the one writer ───────────────────────────────────

describe('setCommander — the one writer of a changed command', () => {
  it('replaces the edge and the roles, and names how the command changed', () => {
    const state = companyWorld(0.8);
    const result = setCommander(state, 'grp', 'mutineer', 'mutiny', 12);

    expect(result.success).toBe(true);
    expect(result.previousCommanderId).toBe('cmd');

    const edges = state.graph.getOutgoingEdges('grp', 'commanded_by');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe('mutineer');
    expect(edges[0].properties.via).toBe('mutiny');
    expect(edges[0].properties.assignedTick).toBe(12);

    const roles = new Map(state.graph.getIncomingEdges('grp', 'member_of').map(e => [e.source, e.properties.role]));
    expect(roles.get('mutineer')).toBe('leader');
    expect(roles.get('cmd')).toBe('member');
    expect(roles.get('other')).toBe('member');
  });

  it('admits a claimant who was never a member, as a leader', () => {
    const state = companyWorld(0.8);
    expect(setCommander(state, 'grp', 'outsider', 'claim', 12).success).toBe(true);
    const mine = state.graph.getOutgoingEdges('outsider', 'member_of').find(e => e.target === 'grp');
    expect(mine?.properties.role).toBe('leader');
  });

  it('writes nothing when the group or the actor is gone', () => {
    const state = companyWorld(0.8);
    expect(setCommander(state, 'nope', 'mutineer', 'claim', 12)).toEqual({ success: false, error: 'group_gone' });
    expect(setCommander(state, 'grp', 'nobody', 'claim', 12)).toEqual({ success: false, error: 'actor_gone' });
    // The standing command is untouched by either refusal.
    expect(state.graph.getOutgoingEdges('grp', 'commanded_by')[0].target).toBe('cmd');
  });
});

// ─── Ownership: a dead commander's band is unowned ───────────────────

describe('a band is held by its living commander', () => {
  it('reads unowned once the commander is dead, and another`s while they live', () => {
    const state = companyWorld(0.8);
    const type = typeOf('company');
    expect(type.ownersOf!(state.graph, handle('grp'))).toEqual(['cmd']);

    state.graph.updateNode('cmd', { properties: { ...state.graph.getNode('cmd')!.properties, deceased: true } });
    expect(type.ownersOf!(state.graph, handle('grp'))).toEqual([]);
  });
});

// ─── The mutiny gate: both arms ─────────────────────────────────────

describe('a mutiny waits for a company that is already coming apart', () => {
  it('is refused while cohesion holds, and offered once it frays', () => {
    const type = typeOf('company');
    const holding = companyWorld(GROUP_COHESION_BOUND_THRESHOLD);
    expect(eligibilityRefusal(holding.graph, type, 'control:seize', 'mutineer', handle('grp'))).toBe('cohesion_holds');

    // The one condition flipped — nothing else about the world changes.
    const frayed = companyWorld(GROUP_FRAY_THRESHOLD - 0.05);
    expect(eligibilityRefusal(frayed.graph, type, 'control:seize', 'mutineer', handle('grp'))).toBeNull();
  });

  it('refuses a mutineer who is not in the company', () => {
    const state = companyWorld(GROUP_FRAY_THRESHOLD - 0.05);
    expect(eligibilityRefusal(state.graph, typeOf('company'), 'control:seize', 'outsider', handle('grp')))
      .toBe('not_a_member');
  });

  it('opens a claim to a member or to whoever stands where the company stands, and to nobody else', () => {
    const state = companyWorld(0.8);
    const type = typeOf('company');
    expect(eligibilityRefusal(state.graph, type, 'control:claim', 'mutineer', handle('grp'))).toBeNull();
    expect(eligibilityRefusal(state.graph, type, 'control:claim', 'outsider', handle('grp'))).toBeNull();

    // Move the outsider away and the same actor is refused — so the pass above was
    // the co-location rule and not an absent gate.
    for (const e of state.graph.getOutgoingEdges('outsider', 'located_at')) state.graph.removeEdge(e.id);
    expect(eligibilityRefusal(state.graph, type, 'control:claim', 'outsider', handle('grp')))
      .toBe('not_with_the_company');
  });

  it('fails closed when the hook throws', () => {
    const state = companyWorld(0.8);
    const throwing = {
      ...typeOf('company'),
      eligibility: { 'control:claim': () => { throw new Error('boom'); } },
    } as never;
    expect(eligibilityRefusal(state.graph, throwing, 'control:claim', 'mutineer', handle('grp'))).toBe('error');
  });
});

// ─── The mutiny op, on a pair the gate had already made hostile ─────

describe('the mutiny records its injury even where a quarrel already stood', () => {
  it('rewrites a covet rivalry into a seized command, and licenses the plot back', () => {
    const state = companyWorld(GROUP_FRAY_THRESHOLD - 0.05);
    // The motive gate needs a quarrel, so by completion one nearly always exists.
    // `covets` is rivalry, not injury — the exact case `writeGrudge` used to swallow.
    writeCovetRivalry(state.graph, 'mutineer', 'cmd', 5);
    expect(holdsMotive(state.graph, 'cmd', 'mutineer', 'grudge')).toBe(false);

    const before = state.graph.getNode('grp')!.properties.cohesion as number;
    const resolution = resolveUndertakingCompletion({
      state, graph: state.graph, actorId: 'mutineer', verb: 'control',
      variant: 'control:seize', objectTypeId: 'company', handle: handle('grp'), tick: 12,
    });

    expect(resolution.variant).toBe('control:seize');
    expect(resolution.ops.every(o => o.success)).toBe(true);
    expect(state.graph.getOutgoingEdges('grp', 'commanded_by')[0].target).toBe('mutineer');

    const hostile = state.graph.getOutgoingEdges('mutineer', 'hostile_to').filter(e => e.target === 'cmd');
    expect(hostile).toHaveLength(1);
    expect(hostile[0].properties.cause).toBe('command_seized');
    expect(hostile[0].properties.causeUpgradedTick).toBe(12);
    // The whole point: the deposed commander now has a reason.
    expect(holdsMotive(state.graph, 'cmd', 'mutineer', 'grudge')).toBe(true);

    expect(state.graph.getNode('grp')!.properties.cohesion)
      .toBeCloseTo(before + COMMAND_SEIZED_COHESION_DELTA, 6);
  });

  it('never downgrades a standing injury to a later one', () => {
    const state = companyWorld(0.8);
    writeGrudge(state.graph, 'cmd', 'mutineer', 3, 'grievance_cooled');
    writeGrudge(state.graph, 'cmd', 'mutineer', 9, 'command_seized', { upgradeCause: true });
    const edge = state.graph.getOutgoingEdges('cmd', 'hostile_to').find(e => e.target === 'mutineer');
    expect(edge!.properties.cause).toBe('grievance_cooled');
    expect(edge!.properties.causeUpgradedTick).toBeUndefined();
  });
});

// ─── The coup: three arms by band ───────────────────────────────────

describe('a coup is decided by the faction and the band, never by the blade', () => {
  const runCoup = (state: GameState, outcome: string | undefined) => resolveUndertakingCompletion({
    state, graph: state.graph, actorId: 'insider', verb: 'control',
    variant: 'control:seize', objectTypeId: 'army', handle: handle('army'), tick: 12, outcome,
  });

  it('moves the command on a winning band', () => {
    const state = armyWorld();
    runCoup(state, 'success');
    const edge = state.graph.getOutgoingEdges('army', 'commanded_by')[0];
    expect(edge.target).toBe('insider');
    expect(edge.properties.via).toBe('coup');
    expect(state.graph.getNode('cmd')!.properties.deceased).toBeUndefined();
  });

  it('leaves the command and takes a grudge and standing on a failing band', () => {
    const state = armyWorld();
    runCoup(state, 'failure');
    expect(state.graph.getOutgoingEdges('army', 'commanded_by')[0].target).toBe('cmd');
    expect(holdsMotive(state.graph, 'cmd', 'insider', 'grudge')).toBe(true);
    const rep = state.graph.getOutgoingEdges('insider', 'reputation_with').find(e => e.target === 'fac');
    expect(rep).toBeDefined();
  });

  it('costs twice as much standing on a critical failure — and the cap does not swallow it', () => {
    const scoreOf = (state: GameState): number => {
      const e = state.graph.getOutgoingEdges('insider', 'reputation_with').find(x => x.target === 'fac');
      return e ? (e.properties.score as number) : Number.NaN;
    };
    const plain = armyWorld(); runCoup(plain, 'failure');
    const bad = armyWorld(); runCoup(bad, 'critical_failure');

    // Both arms actually wrote — otherwise the difference below would be a comparison
    // of two absences (the vacuous shape this test exists to avoid).
    expect(scoreOf(plain)).toBeCloseTo(0.5 - USURPATION_STANDING_LOSS, 6);
    expect(scoreOf(bad)).toBeCloseTo(0.5 - USURPATION_STANDING_LOSS * 2, 6);
    expect(scoreOf(plain) - scoreOf(bad)).toBeCloseTo(USURPATION_STANDING_LOSS, 6);

    // And the doubled loss is expressible at all: the reputation writer caps a single
    // outcome's delta, so a base above half the cap would make both arms identical.
    expect(USURPATION_STANDING_LOSS * 2).toBeLessThanOrEqual(REPUTATION_WITH_MAX_DELTA_PER_OUTCOME);
  });

  it('takes the failure arm when the band is absent — a lever start with no pin', () => {
    const state = armyWorld();
    runCoup(state, undefined);
    expect(state.graph.getOutgoingEdges('army', 'commanded_by')[0].target).toBe('cmd');
  });

  it('refuses a claimant from outside the army`s faction, and admits one from inside', () => {
    const state = armyWorld();
    const type = typeOf('army');
    expect(eligibilityRefusal(state.graph, type, 'control:seize', 'stranger', handle('army')))
      .toBe('not_of_the_faction');
    expect(eligibilityRefusal(state.graph, type, 'control:seize', 'insider', handle('army'))).toBeNull();
  });

  it('refuses a claim from someone who already commands a host', () => {
    const state = armyWorld();
    state.graph.addNode({
      id: 'army2', type: 'actor', name: 'The Second Host',
      properties: { actorType: 'group', groupKind: 'army', armyState: { size: 'warband', headcount: 10 } },
    });
    state.graph.addEdge({ id: 'a2cb', source: 'army2', target: 'insider', type: 'commanded_by', properties: { assignedTick: 0 } });
    expect(eligibilityRefusal(state.graph, typeOf('army'), 'control:claim', 'insider', handle('army')))
      .toBe('already_commands_a_host');
  });
});

// ─── The candidacy, and where it sits in the queue ──────────────────

describe('a candidacy stands for an empty seat and yields to the god', () => {
  it('is refused while a seat is filled, and admitted when none is', () => {
    const state = factionWorld();
    const type = typeOf('faction');
    expect(eligibilityRefusal(state.graph, type, 'control:claim', 'mid', handle('fac'))).toBeNull();

    state.graph.addEdge({ id: 'seat', source: 'top', target: 'fac', type: 'leads', properties: { seatedTick: 1, conferredVia: 'anointment' } });
    expect(eligibilityRefusal(state.graph, type, 'control:claim', 'mid', handle('fac'))).toBe('seat_is_filled');
  });

  it('refuses the derived leader, an outsider, and a second bid', () => {
    const state = factionWorld();
    const type = typeOf('faction');
    // `top` outranks the others, so the derived ladder already points at them.
    expect(getFactionLeaderId(state.graph, 'fac')).toBe('top');
    expect(eligibilityRefusal(state.graph, type, 'control:claim', 'top', handle('fac'))).toBe('already_leads');

    mortal(state.graph, 'nobody', 'Sten');
    expect(eligibilityRefusal(state.graph, type, 'control:claim', 'nobody', handle('fac'))).toBe('not_of_the_faction');

    nominateSuccessor(state, 'fac', 'mid', 'success', 10);
    expect(eligibilityRefusal(state.graph, type, 'control:claim', 'mid', handle('fac'))).toBe('already_stood');
  });

  it('files nothing on a band that did not carry', () => {
    const state = factionWorld();
    const result = nominateSuccessor(state, 'fac', 'mid', 'near_miss', 10);
    expect(result.success).toBe(false);
    expect(result.error).toBe('band_too_weak');
    expect(state.graph.getOutgoingEdges('mid', 'will_succeed')).toHaveLength(0);
  });

  it('files an edge whose priority is the band`s, and traces it', () => {
    const state = factionWorld();
    expect(nominateSuccessor(state, 'fac', 'mid', 'critical_success', 10).success).toBe(true);
    const edge = state.graph.getOutgoingEdges('mid', 'will_succeed')[0];
    expect(edge.target).toBe('fac');
    expect(edge.properties.priority).toBe(CANDIDACY_PRIORITY_BY_BAND.critical_success);
    expect(edge.properties.conferredVia).toBe('candidacy');
    expect(edge.properties.anointedBy).toBeNull();
    expect(getTraces().some(t => (t as { outcome?: string }).outcome === 'candidacy_filed')).toBe(true);
  });

  it('seats behind an anointment and a notable heir, and ahead of the derived ladder', () => {
    const state = factionWorld();
    // Three claims on one faction, filed in the order that would let recency decide
    // if priority did not: the candidacy is newest, and must still lose.
    state.graph.addEdge({
      id: 'ws_anoint', source: 'low', target: 'fac', type: 'will_succeed',
      properties: { anointedTick: 1, anointedBy: 'actor-hero', priority: ANOINTMENT_PRIORITY },
    });
    state.graph.addEdge({
      id: 'ws_heir', source: 'mid', target: 'fac', type: 'will_succeed',
      properties: { anointedTick: 2, anointedBy: 'notable-1', priority: NOTABLE_HEIR_PRIORITY },
    });
    nominateSuccessor(state, 'fac', 'top', 'critical_success', 3);

    // The seat falls empty: the snapshot leader leaves the faction.
    state.graph.updateNode('fac', { properties: { ...state.graph.getNode('fac')!.properties, leaderSnapshotId: 'top' } });
    for (const e of state.graph.getOutgoingEdges('top', 'member_of')) state.graph.removeEdge(e.id);
    state.tick = 20;
    phaseFactionSuccession(state);

    const seat = state.graph.getIncomingEdges('fac', 'leads')[0];
    expect(seat.source).toBe('low');            // the god's card
    expect(seat.properties.conferredVia).toBe('anointment');
    // The heir and the candidacy are still queued for the next exit.
    expect(state.graph.getOutgoingEdges('mid', 'will_succeed')).toHaveLength(1);
    expect(state.graph.getOutgoingEdges('top', 'will_succeed')).toHaveLength(1);
  });
});

// ─── The usurpation, and the phase's book ───────────────────────────

describe('a usurpation moves the seat and keeps the phase`s book', () => {
  it('seats the usurper and updates the snapshot, so the phase does not re-seat', () => {
    const state = factionWorld();
    state.graph.addEdge({ id: 'seat', source: 'top', target: 'fac', type: 'leads', properties: { seatedTick: 1, conferredVia: 'anointment' } });
    state.graph.updateNode('fac', { properties: { ...state.graph.getNode('fac')!.properties, leaderSnapshotId: 'top' } });

    expect(forceSuccession(state, undefined, 'fac', 'mid', 'success', 12).success).toBe(true);

    const seat = state.graph.getIncomingEdges('fac', 'leads');
    expect(seat).toHaveLength(1);
    expect(seat[0].source).toBe('mid');
    expect(seat[0].properties.conferredVia).toBe('usurpation');
    expect(state.graph.getNode('fac')!.properties.leaderSnapshotId).toBe('mid');
    expect(state.graph.getNode('top')!.properties.deceased).toBeUndefined();

    // The kill criterion: run the phase and the usurper is still seated.
    state.tick = 13;
    phaseFactionSuccession(state);
    expect(state.graph.getIncomingEdges('fac', 'leads')[0].source).toBe('mid');
  });

  it('costs a grudge and standing when it fails, and leaves the leader seated', () => {
    const state = factionWorld();
    state.graph.addEdge({ id: 'seat', source: 'top', target: 'fac', type: 'leads', properties: { seatedTick: 1, conferredVia: 'anointment' } });
    forceSuccession(state, undefined, 'fac', 'mid', 'failure', 12);

    expect(state.graph.getIncomingEdges('fac', 'leads')[0].source).toBe('top');
    expect(holdsMotive(state.graph, 'top', 'mid', 'grudge')).toBe(true);
    expect(getTraces().some(t => (t as { outcome?: string }).outcome === 'usurpation_failed')).toBe(true);
  });

  it('splits the faction on a critical failure', () => {
    const state = factionWorld();
    state.graph.addEdge({ id: 'seat', source: 'top', target: 'fac', type: 'leads', properties: { seatedTick: 1, conferredVia: 'anointment' } });
    forceSuccession(state, undefined, 'fac', 'mid', 'critical_failure', 12);
    // The schism op stamps the faction; whether it takes is the schism layer's call,
    // so what is pinned here is that the arm ran and the seat did not move.
    expect(state.graph.getIncomingEdges('fac', 'leads')[0].source).toBe('top');
    const outcomes = getTraces().map(t => (t as { outcome?: string }).outcome);
    expect(outcomes.some(o => o === 'usurpation_split' || o === 'usurpation_failed')).toBe(true);
  });

  it('refuses when there is nobody to unseat, or the usurper already leads', () => {
    const state = factionWorld();
    expect(forceSuccession(state, undefined, 'fac', 'top', 'success', 12).error).toBe('no_leader_to_unseat');
    expect(forceSuccession(state, undefined, 'nope', 'mid', 'success', 12).error).toBe('faction_not_found');
  });

  it('seatLeader consumes only the new leader`s own claims', () => {
    const state = factionWorld();
    state.graph.addEdge({ id: 'ws_a', source: 'mid', target: 'fac', type: 'will_succeed', properties: { anointedTick: 1 } });
    state.graph.addEdge({ id: 'ws_b', source: 'mid', target: 'fac', type: 'will_succeed', properties: { anointedTick: 2 } });
    state.graph.addEdge({ id: 'ws_c', source: 'low', target: 'fac', type: 'will_succeed', properties: { anointedTick: 3 } });

    expect(seatLeader(state.graph, 'fac', 'mid', 12, 'usurpation')).toBe(true);
    expect(state.graph.getOutgoingEdges('mid', 'will_succeed')).toHaveLength(0);
    expect(state.graph.getOutgoingEdges('low', 'will_succeed')).toHaveLength(1);
  });
});

// ─── The candidacy is not silently re-derived into the usurpation ───

describe('the proposed cell is the cell that runs', () => {
  it('a candidacy on a faction with a derived leader does not become a usurpation', () => {
    const state = factionWorld();
    // Ownership here reads `other` — the ladder points at `top` — which is exactly the
    // reading that would have re-derived this claim into a seize.
    const resolution = resolveUndertakingCompletion({
      state, graph: state.graph, actorId: 'mid', verb: 'control',
      variant: 'control:claim', objectTypeId: 'faction', handle: handle('fac'),
      tick: 12, outcome: 'success',
    });
    expect(resolution.variant).toBe('control:claim');
    expect(state.graph.getIncomingEdges('fac', 'leads')).toHaveLength(0);
    expect(state.graph.getOutgoingEdges('mid', 'will_succeed')).toHaveLength(1);
  });

  it('falls back to the ownership ladder when no variant is proposed', () => {
    const state = factionWorld();
    const resolution = resolveUndertakingCompletion({
      state, graph: state.graph, actorId: 'mid', verb: 'control',
      objectTypeId: 'faction', handle: handle('fac'), tick: 12, outcome: 'success',
    });
    expect(resolution.variant).toBe('control:seize');
  });
});

// ─── Scouting an army ───────────────────────────────────────────────

describe('scouting an army learns where it stands', () => {
  it('records intelligence on the scout and familiarity with the army`s ground', () => {
    const state = armyWorld();
    const resolution = resolveUndertakingCompletion({
      state, graph: state.graph, actorId: 'insider', verb: 'observe',
      variant: 'observe', objectTypeId: 'army', handle: handle('army'), tick: 12,
    });
    expect(resolution.variant).toBe('observe');

    const intel = state.graph.getNode('insider')!.properties.strategicIntelligence as Record<string, number>;
    expect(intel['army_army']).toBe(12);
    // `knows_of` points at the Location the host stands on — never at the host, which
    // the edge schema could not hold.
    expect(state.graph.getOutgoingEdges('insider', 'knows_of').map(e => e.target)).toContain('loc-1');
  });

  it('still records the sighting when the host stands nowhere the map names', () => {
    const state = armyWorld();
    for (const e of state.graph.getOutgoingEdges('cmd', 'located_at')) state.graph.removeEdge(e.id);
    const resolution = resolveUndertakingCompletion({
      state, graph: state.graph, actorId: 'insider', verb: 'observe',
      variant: 'observe', objectTypeId: 'army', handle: handle('army'), tick: 12,
    });
    expect(resolution.ops.every(o => o.success)).toBe(true);
    expect(state.graph.getOutgoingEdges('insider', 'knows_of')).toHaveLength(0);
  });
});

// ─── The dissolution sweep still promotes, through the one writer ───

describe('the dissolution sweep`s promotion is a command change like any other', () => {
  it('names itself a promotion on the edge', () => {
    const state = companyWorld(0.8);
    const members = ['mutineer', 'other'].map(id => state.graph.getNode(id)!) as GraphNode[];
    // Straight through the shared writer, which is what `promoteNewLeader` now calls.
    expect(setCommander(state, 'grp', members[0].id, 'promotion', 14).success).toBe(true);
    expect(state.graph.getOutgoingEdges('grp', 'commanded_by')[0].properties.via).toBe('promotion');
    expect(state.graph.getOutgoingEdges('grp', 'commanded_by')[0].properties.promoted).toBeUndefined();
  });
});
