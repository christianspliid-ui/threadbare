/**
 * Tests: Notable Agendas (THR-630 seam A) — roster, prominence, Claim family,
 * launch, phase execution, counter-play, thread-takeover.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  listNotables,
  scoreNotableProminence,
  selectClaimTarget,
  buildNotableAgenda,
  phaseNotableAgendas,
  agendaFlags,
  isThreadedByPlayer,
} from '../notableAgendas';
import { CLAIM_FAMILY } from '../../data/notable-agendas/claim';
import {
  MAX_ACTIVE_NOTABLE_AGENDAS,
  NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS,
  NOTABLE_AGENDA_PHASE_INVEST_TICKS,
  NOTABLE_AGENDA_COUNTERS_TO_FAIL,
  NOTABLE_SCOPE_CONTROLS_NORM,
} from '../../data/notable-agenda-config';
import { getTraces, clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import type { GameState, ActiveComposition } from '../../types/gameState';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeState(tick: number, graph: WorldGraph, extra: Partial<GameState> = {}): GameState {
  return {
    tick,
    seed: 42,
    graph,
    tickEvents: [],
    worldFlags: {},
    activeCompositions: [],
    ...extra,
  } as unknown as GameState;
}

function addHex(graph: WorldGraph, id: string, col: number, row: number): void {
  graph.addNode({
    id,
    type: 'location',
    name: `Hex ${id}`,
    properties: { terrain: 'plains', hexCol: col, hexRow: row },
  });
}

function addFaction(graph: WorldGraph, id: string, name = `Faction ${id}`): void {
  graph.addNode({ id, type: 'actor', name, properties: { actorType: 'faction' } });
}

function addLeader(
  graph: WorldGraph,
  id: string,
  factionId: string,
  hexId: string,
  extraProps: Record<string, unknown> = {},
): void {
  graph.addNode({
    id,
    type: 'actor',
    name: `Leader ${id}`,
    properties: { actorType: 'individual', ...extraProps },
  });
  // The canonical leader seam needs both the authoritative `leads` edge and
  // live membership (getAnointedLeaderId drops leads edges of non-members).
  graph.addEdge({ id: `e_leads_${id}`, source: id, target: factionId, type: 'leads', properties: { seatedTick: 0 } });
  graph.addEdge({ id: `e_member_${id}`, source: id, target: factionId, type: 'member_of', properties: { role: 'leader', rank: 'leader', joinedTick: 0 } });
  graph.addEdge({ id: `e_loc_${id}`, source: id, target: hexId, type: 'located_at', properties: {} });
}

function addHolding(graph: WorldGraph, id: string, factionId: string, col: number, row: number, name = `Holding ${id}`): void {
  graph.addNode({
    id,
    type: 'location',
    name,
    properties: { terrain: 'plains', locationSubtype: 'town', hexCol: col, hexRow: row },
  });
  graph.addEdge({ id: `e_ctrl_${id}`, source: factionId, target: id, type: 'controls', properties: {} });
}

/** Two factions, two leaders, one foreign holding — the minimal claim world. */
function claimWorld(): WorldGraph {
  const graph = new WorldGraph();
  addHex(graph, 'hex_a', 0, 0);
  addHex(graph, 'hex_b', 3, 0);
  addFaction(graph, 'f_mine', 'The Home Court');
  addFaction(graph, 'f_theirs', 'The Far Court');
  addLeader(graph, 'leader_mine', 'f_mine', 'hex_a', {
    domainCapabilities: { iron: 60, heart: 20 },
    axiologicalProfile: { candor_guile: 0.8, mercy_cruelty: -0.4 },
  });
  addHolding(graph, 'their_town', 'f_theirs', 3, 0, 'Farwatch');
  return graph;
}

describe('notableAgendas (THR-630 seam A)', () => {
  beforeEach(() => {
    clearTraces();
    enableTracing();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  // ─── Roster discovery ────────────────────────────────────────────────────

  it('listNotables returns only individuals with leads edges, sorted by id', () => {
    const graph = claimWorld();
    // A non-leader individual and a faction should both be excluded.
    graph.addNode({ id: 'commoner', type: 'actor', name: 'Commoner', properties: { actorType: 'individual' } });
    addLeader(graph, 'a_first_leader', 'f_theirs', 'hex_b');

    const notables = listNotables(graph);
    expect(notables.map((n) => n.notableId)).toEqual(['a_first_leader', 'leader_mine']);
    expect(notables[1].factionId).toBe('f_mine');
  });

  // ─── Prominence ──────────────────────────────────────────────────────────

  it('scoreNotableProminence blends scope, power, and drive on real-shaped properties', () => {
    const graph = claimWorld();
    // Saturate scope: NORM controls edges.
    for (let i = 0; i < NOTABLE_SCOPE_CONTROLS_NORM; i++) {
      addHolding(graph, `mine_${i}`, 'f_mine', 1, 1);
    }
    const state = makeState(1, graph);
    const score = scoreNotableProminence(state, 'leader_mine', 'f_mine');
    // scope=1 → 0.35; power=60/100 → 0.15; drive=mean(0.8,0.4)=0.6 → 0.12; proximity=0.
    expect(score).toBeCloseTo(0.35 + 0.6 * 0.25 + 0.6 * 0.2, 5);
  });

  it('prominence proximity component rises when a player thread is nearby', () => {
    const graph = claimWorld();
    graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
    graph.addNode({ id: 'friend', type: 'actor', name: 'Friend', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e_loc_friend', source: 'friend', target: 'hex_a', type: 'located_at', properties: {} });
    graph.addEdge({ id: 'e_thread', source: 'asc', target: 'friend', type: 'thread', properties: {} });

    const near = scoreNotableProminence(makeState(1, graph, { ascendantId: 'asc' }), 'leader_mine', 'f_mine');
    const far = scoreNotableProminence(makeState(1, graph), 'leader_mine', 'f_mine');
    expect(near).toBeGreaterThan(far);
  });

  // ─── Target selection ────────────────────────────────────────────────────

  it('selectClaimTarget picks the nearest foreign holding, never its own', () => {
    const graph = claimWorld();
    addHolding(graph, 'own_town', 'f_mine', 0, 0);
    addHolding(graph, 'far_foreign', 'f_theirs', 9, 9);

    const target = selectClaimTarget(makeState(1, graph), 'leader_mine', 'f_mine', new Set());
    expect(target?.targetId).toBe('their_town'); // dist 3 beats dist ~9; own excluded
  });

  it('selectClaimTarget skips already-targeted locations and ruins', () => {
    const graph = claimWorld();
    graph.getNode('their_town')!.properties.locationSubtype = 'ruins';
    addHolding(graph, 'their_other', 'f_theirs', 4, 0);

    const skipRuins = selectClaimTarget(makeState(1, graph), 'leader_mine', 'f_mine', new Set());
    expect(skipRuins?.targetId).toBe('their_other');

    const skipTargeted = selectClaimTarget(
      makeState(1, graph), 'leader_mine', 'f_mine', new Set(['their_other']),
    );
    expect(skipTargeted).toBeUndefined();
  });

  // ─── Launch builder ──────────────────────────────────────────────────────

  it('buildNotableAgenda builds four phases, arms phase 1, and substitutes prose', () => {
    const rng = () => 0; // always the first variant
    const plan = buildNotableAgenda(
      'leader_mine', 'Maren Hale', 'The Home Court', CLAIM_FAMILY, 10, 'their_town', 'Farwatch', rng,
    );
    expect(plan.composition.phases).toHaveLength(4);
    expect(plan.composition.sponsorNotableId).toBe('leader_mine');
    expect(plan.composition.agendaFamily).toBe('claim');
    expect(plan.composition.resolvedNodes.target).toBe('their_town');
    const compId = plan.composition.compositionId;
    expect(plan.worldFlagUpdates[agendaFlags.ready(compId, 'whisper')]).toBe(true);
    expect(plan.worldFlagUpdates[agendaFlags.lastLaunch('leader_mine')]).toBe(10);
    const rationale = plan.composition.phases![0].rationale!;
    expect(rationale).toContain('Maren Hale');
    expect(rationale).toContain('Farwatch');
    expect(rationale).not.toContain('{notable}');
    expect(rationale).not.toContain('{target}');
  });

  // ─── Phase: roster launches ──────────────────────────────────────────────

  it('launches an agenda on a roster tick and emits launched + aggregate scan traces', () => {
    const graph = claimWorld();
    const state = makeState(NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS, graph);
    const result = phaseNotableAgendas(state);

    const comps = (result.activeCompositions ?? []).filter((c) => c.sponsorNotableId);
    expect(comps).toHaveLength(1);
    expect(comps[0].agendaFamily).toBe('claim');
    expect(comps[0].resolvedNodes.target).toBe('their_town');

    const traces = getTraces() as unknown as Array<Record<string, unknown>>;
    expect(traces.filter((t) => t.category === 'notable.agenda_launched')).toHaveLength(1);
    expect(traces.filter((t) => t.category === 'notable.roster_scan')).toHaveLength(1);
  });

  it('does not launch off-cadence and never exceeds the agenda budget', () => {
    const graph = claimWorld();
    const offCadence = phaseNotableAgendas(makeState(NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS + 1, graph));
    expect((offCadence.activeCompositions ?? []).filter((c) => c.sponsorNotableId)).toHaveLength(0);

    // Budget: pre-fill MAX active agendas → no new launch even on cadence.
    const filler: ActiveComposition[] = Array.from({ length: MAX_ACTIVE_NOTABLE_AGENDAS }, (_, i) => ({
      compositionId: `filler-${i}`,
      firedAtTick: 0,
      activatedPhaseIds: [],
      phaseActivationTicks: {},
      resolvedNodes: {},
      status: 'active' as const,
      lastEvaluationTick: 0,
      sponsorNotableId: `other-${i}`,
      agendaFamily: 'claim',
    }));
    const atBudget = phaseNotableAgendas(
      makeState(NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS, graph, { activeCompositions: filler }),
    );
    const launched = (atBudget.activeCompositions ?? []).filter(
      (c) => c.sponsorNotableId === 'leader_mine',
    );
    expect(launched).toHaveLength(0);
  });

  it('thread-takeover: threaded notables are never selected for launches', () => {
    const graph = claimWorld();
    graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
    graph.addEdge({ id: 'e_thread_leader', source: 'asc', target: 'leader_mine', type: 'thread', properties: {} });
    const state = makeState(NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS, graph, { ascendantId: 'asc' });
    expect(isThreadedByPlayer(state, 'leader_mine')).toBe(true);

    const result = phaseNotableAgendas(state);
    expect((result.activeCompositions ?? []).filter((c) => c.sponsorNotableId)).toHaveLength(0);
    const scan = (getTraces() as unknown as Array<Record<string, unknown>>).find(
      (t) => t.category === 'notable.roster_scan',
    );
    expect(scan?.skippedThreaded).toBe(1);
  });

  // ─── Phase: execution + invest + counter-play ────────────────────────────

  function launchedWorld(): { graph: WorldGraph; comp: ActiveComposition; flags: Record<string, unknown> } {
    const graph = claimWorld();
    const plan = buildNotableAgenda(
      'leader_mine', 'Leader leader_mine', 'The Home Court', CLAIM_FAMILY, 0, 'their_town', 'Farwatch', () => 0,
    );
    return { graph, comp: plan.composition, flags: { ...plan.worldFlagUpdates } };
  }

  it('executes the materialize move: sponsors_scheme edge with sponsorKind notable', () => {
    const { graph, comp, flags } = launchedWorld();
    // Simulate the runner having activated whisper + declaration.
    comp.activatedPhaseIds = ['whisper', 'declaration'];
    const state = makeState(3, graph, { activeCompositions: [comp], worldFlags: flags });
    phaseNotableAgendas(state);

    const edges = graph.getOutgoingEdges('leader_mine', 'sponsors_scheme');
    expect(edges).toHaveLength(1);
    expect(edges[0].target).toBe('their_town');
    expect(edges[0].properties.sponsorKind).toBe('notable');
  });

  it('invests each tick and arms the next phase at the invest threshold', () => {
    const { graph, comp, flags } = launchedWorld();
    comp.activatedPhaseIds = ['whisper'];
    flags[agendaFlags.moveDone(comp.compositionId, 'whisper')] = true;
    flags[agendaFlags.invest(comp.compositionId)] = NOTABLE_AGENDA_PHASE_INVEST_TICKS - 1;
    const state = makeState(3, graph, { activeCompositions: [comp], worldFlags: flags });
    const result = phaseNotableAgendas(state);
    expect(result.worldFlags?.[agendaFlags.ready(comp.compositionId, 'declaration')]).toBe(true);
  });

  it('thread-takeover freezes an active agenda (no invest while sponsor threaded)', () => {
    const { graph, comp, flags } = launchedWorld();
    graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
    graph.addEdge({ id: 'e_t', source: 'asc', target: 'leader_mine', type: 'thread', properties: {} });
    comp.activatedPhaseIds = ['whisper'];
    flags[agendaFlags.moveDone(comp.compositionId, 'whisper')] = true;
    flags[agendaFlags.invest(comp.compositionId)] = 3;
    const state = makeState(3, graph, {
      activeCompositions: [comp], worldFlags: flags, ascendantId: 'asc',
    });
    const result = phaseNotableAgendas(state);
    // Invest counter unchanged — the agenda is frozen, not advancing.
    expect(result.worldFlags?.[agendaFlags.invest(comp.compositionId)]).toBe(3);
  });

  it('counter-play: first counter stalls, NOTABLE_AGENDA_COUNTERS_TO_FAIL fails the agenda', () => {
    const { graph, comp, flags } = launchedWorld();
    // Player controls the target → countered.
    graph.addNode({ id: 'asc', type: 'actor', name: 'Ascendant', properties: { actorType: 'ascendant' } });
    graph.addEdge({ id: 'e_ctrl_asc', source: 'asc', target: 'their_town', type: 'controls', properties: {} });

    let state = makeState(3, graph, {
      activeCompositions: [comp], worldFlags: flags, ascendantId: 'asc',
    });
    let result = phaseNotableAgendas(state);
    expect(result.worldFlags?.[agendaFlags.counters(comp.compositionId)]).toBe(1);
    expect(result.activeCompositions?.[0].status).toBe('active'); // stalled, not failed

    // Advance past the stall window and counter again → failed.
    const stallUntil = result.worldFlags?.[agendaFlags.stallUntil(comp.compositionId)] as number;
    for (let i = 1; i < NOTABLE_AGENDA_COUNTERS_TO_FAIL; i++) {
      state = makeState(stallUntil + i, graph, {
        activeCompositions: result.activeCompositions,
        worldFlags: result.worldFlags as Record<string, unknown>,
        ascendantId: 'asc',
      });
      result = phaseNotableAgendas(state);
    }
    expect(result.activeCompositions?.[0].status).toBe('failed');
    const countered = (getTraces() as unknown as Array<Record<string, unknown>>).filter(
      (t) => t.category === 'notable.agenda_countered',
    );
    expect(countered.length).toBeGreaterThanOrEqual(2);
    expect(countered[countered.length - 1].outcome).toBe('failed');
  });

  it('notes completion once when the runner marks the composition completed', () => {
    const { graph, comp, flags } = launchedWorld();
    comp.activatedPhaseIds = ['whisper', 'declaration', 'pressure', 'reckoning'];
    for (const p of comp.activatedPhaseIds) {
      flags[agendaFlags.moveDone(comp.compositionId, p)] = true;
    }
    comp.status = 'completed';
    const state = makeState(9, graph, { activeCompositions: [comp], worldFlags: flags });
    const result = phaseNotableAgendas(state);
    expect(result.worldFlags?.[agendaFlags.completedNoted(comp.compositionId)]).toBe(true);
    const completed = (getTraces() as unknown as Array<Record<string, unknown>>).filter(
      (t) => t.category === 'notable.agenda_completed',
    );
    expect(completed).toHaveLength(1);

    // Second pass: no duplicate trace.
    clearTraces();
    phaseNotableAgendas(makeState(10, graph, {
      activeCompositions: result.activeCompositions,
      worldFlags: result.worldFlags as Record<string, unknown>,
    }));
    expect(
      (getTraces() as unknown as Array<Record<string, unknown>>).filter(
        (t) => t.category === 'notable.agenda_completed',
      ),
    ).toHaveLength(0);
  });
});
