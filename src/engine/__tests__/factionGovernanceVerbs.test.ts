/**
 * Tests for THR-400 — faction governance verbs.
 *
 * Covers:
 *   - getDoubterCandidate / refreshFactionDerivedFlags
 *   - applyStirDissent / applyWhisperLeader / applyRecoverDoctrine / applySurfaceDoubter
 *   - Per-tick dissent decay + threshold seeding (via phaseFactionActions)
 *   - Verb dispatch through op: 'faction_verb' (intercepted by unifiedActionResolution)
 *
 * Each test seeds a minimal world graph (one faction + members + alignment)
 * and exercises a single verb in isolation. The tick-loop tests run the full
 * `phaseFactionActions` to verify the dissent phase runs on every tick (not
 * just FACTION_ACTION_INTERVAL boundaries).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../graph';
import { phaseFactionActions } from '../phaseFactionActions';
import {
  applyStirDissent,
  applyWhisperLeader,
  applyRecoverDoctrine,
  applySurfaceDoubter,
  applyKindleACalling,
} from '../factionGovernanceVerbs';
import {
  getDoubterCandidate,
  refreshFactionDerivedFlags,
} from '../factionNetwork';
import {
  STIR_DISSENT_INCREMENT,
  DISSENT_DECAY_PER_TICK,
  DISSENT_ENCOUNTER_THRESHOLD,
  SURFACE_DOUBTER_MIN_DISTANCE,
  SURFACE_DOUBTER_DISSENT_CONTRIBUTION,
  DIVINE_WHISPER_PENDING_CONDITION,
  SURFACED_BY_DIVINE_ATTENTION_CONDITION,
} from '../../data/faction-action-constants';
import type { GameState } from '../../types/gameState';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function makeState(graph: WorldGraph, tick = 1): GameState {
  return {
    tick,
    graph,
    tickEvents: [],
    seed: 42,
    encounterProgress: [],
    unifiedActions: [],
    pendingEncounterSeeds: [],
    ascendantId: 'ascendant_1',
    recentEvents: [],
  } as unknown as GameState;
}

function addAscendant(graph: WorldGraph, id = 'ascendant_1'): void {
  graph.addNode({
    id,
    type: 'actor',
    name: 'Ascendant',
    properties: { actorType: 'ascendant' },
  });
}

function addFaction(
  graph: WorldGraph,
  id: string,
  alignment?: Record<string, 'positive' | 'negative'>,
): void {
  graph.addNode({
    id,
    type: 'actor',
    name: id,
    properties: {
      actorType: 'faction',
      factionDefId: id,
      reputationAlignment: alignment ?? {},
    },
  });
}

function addMember(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
  opts: {
    reputation?: number;
    alignment?: Record<string, number>;
    role?: string;
    armyState?: object;
  } = {},
): void {
  graph.addNode({
    id: agentId,
    type: 'actor',
    name: agentId,
    properties: {
      actorType: opts.armyState ? 'individual' : 'individual',
      reputationAlignment: opts.alignment ?? {},
      ...(opts.armyState ? { armyState: opts.armyState } : {}),
    },
  });
  graph.addEdge({
    id: `e_member_${agentId}_${factionId}`,
    source: agentId,
    target: factionId,
    type: 'member_of',
    properties: { reputation: opts.reputation ?? 0.5, role: opts.role ?? 'member', rank: 1 },
  });
}

function addClueNode(graph: WorldGraph, id: string, factionDefId: string, doctrineId = 'doctrine_old_truth'): void {
  graph.addNode({
    id,
    type: 'event',
    name: 'Recovered doctrine clue',
    properties: {
      clueType: 'recovered_doctrine',
      factionDefId,
      doctrineId,
      realignment: { star: 'positive' },
    },
  });
}

// ─── getDoubterCandidate ────────────────────────────────────────────────────

describe('getDoubterCandidate', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = makeGraph(); });

  it('returns null when the faction has no reputationAlignment', () => {
    addFaction(graph, 'faction-a');
    addMember(graph, 'agent-1', 'faction-a', { alignment: { heart: -0.8 } });
    expect(getDoubterCandidate(graph, 'faction-a')).toBeNull();
  });

  it('returns null when no member exceeds SURFACE_DOUBTER_MIN_DISTANCE', () => {
    addFaction(graph, 'faction-a', { heart: 'positive' });
    addMember(graph, 'agent-1', 'faction-a', { alignment: { heart: 0.5 } });
    addMember(graph, 'agent-2', 'faction-a', { alignment: { heart: -0.2 } });
    expect(getDoubterCandidate(graph, 'faction-a')).toBeNull();
  });

  it('returns the most-misaligned non-leader member', () => {
    addFaction(graph, 'faction-a', { heart: 'positive' });
    // Leader is the highest-rep non-army member.
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9, alignment: { heart: -0.6 } });
    addMember(graph, 'doubter', 'faction-a', { reputation: 0.3, alignment: { heart: -0.8 } });
    addMember(graph, 'loyalist', 'faction-a', { reputation: 0.4, alignment: { heart: 0.6 } });
    const result = getDoubterCandidate(graph, 'faction-a');
    expect(result).not.toBeNull();
    expect(result!.agentId).toBe('doubter');
    expect(result!.axisDistance).toBeGreaterThanOrEqual(SURFACE_DOUBTER_MIN_DISTANCE);
  });

  it('excludes the resolved leader from doubter candidates', () => {
    addFaction(graph, 'faction-a', { heart: 'positive' });
    // Single member is automatically the leader → no candidate.
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9, alignment: { heart: -0.8 } });
    expect(getDoubterCandidate(graph, 'faction-a')).toBeNull();
  });
});

// ─── refreshFactionDerivedFlags ─────────────────────────────────────────────

describe('refreshFactionDerivedFlags', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = makeGraph(); });

  it('sets hasLeader true when a non-army member exists', () => {
    addFaction(graph, 'faction-a', { heart: 'positive' });
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    refreshFactionDerivedFlags(graph, 'faction-a');
    expect(graph.getNode('faction-a')?.properties.hasLeader).toBe(true);
  });

  it('sets hasDoubter + doubterId when a misaligned member exists', () => {
    addFaction(graph, 'faction-a', { heart: 'positive' });
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9, alignment: { heart: 0.5 } });
    addMember(graph, 'doubter', 'faction-a', { reputation: 0.3, alignment: { heart: -0.9 } });
    refreshFactionDerivedFlags(graph, 'faction-a');
    expect(graph.getNode('faction-a')?.properties.hasDoubter).toBe(true);
    expect(graph.getNode('faction-a')?.properties.doubterId).toBe('doubter');
  });

  it('sets hasRecoverableDoctrine true when a tagged clue exists', () => {
    addFaction(graph, 'faction-a');
    addClueNode(graph, 'clue-1', 'faction-a');
    refreshFactionDerivedFlags(graph, 'faction-a');
    expect(graph.getNode('faction-a')?.properties.hasRecoverableDoctrine).toBe(true);
  });
});

// ─── applyStirDissent ───────────────────────────────────────────────────────

describe('applyStirDissent', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = makeGraph(); });

  it('raises dissentLevel by STIR_DISSENT_INCREMENT', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    const state = makeState(graph);
    const trace = applyStirDissent(state, 'faction-a');
    expect(trace).not.toBeNull();
    expect(trace!.previousDissentLevel).toBe(0);
    expect(trace!.newDissentLevel).toBeCloseTo(STIR_DISSENT_INCREMENT, 5);
    expect(graph.getNode('faction-a')?.properties.dissentLevel).toBeCloseTo(STIR_DISSENT_INCREMENT, 5);
  });

  it('clamps dissentLevel to 1.0 across repeated casts', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    const state = makeState(graph);
    for (let i = 0; i < 10; i++) applyStirDissent(state, 'faction-a');
    expect(graph.getNode('faction-a')?.properties.dissentLevel).toBe(1);
  });

  it('returns null when the faction node is missing or non-faction', () => {
    addAscendant(graph);
    const state = makeState(graph);
    expect(applyStirDissent(state, 'no-such-faction')).toBeNull();
  });
});

// ─── applyWhisperLeader ─────────────────────────────────────────────────────

describe('applyWhisperLeader', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = makeGraph(); });

  it('applies divine_whisper_pending condition + plants follow-up seed', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    const state = makeState(graph);
    const trace = applyWhisperLeader(state, 'faction-a', 'protector');
    expect(trace).not.toBeNull();
    expect(trace!.leaderId).toBe('leader');
    expect(trace!.preferredPole).toBe('protector');
    expect(trace!.conflictedWithOtherWhisper).toBe(false);

    const leader = graph.getNode('leader');
    const conditions = leader?.properties.conditions as string[] | undefined;
    expect(conditions).toContain(DIVINE_WHISPER_PENDING_CONDITION);
    expect(leader?.properties.divineWhisperPreferredPole).toBe('protector');
    expect(state.pendingEncounterSeeds!.length).toBe(1);
    expect(state.pendingEncounterSeeds![0].templateId).toBe('faction.encounter.leader_at_a_crossroads');
  });

  it('returns null when no leader exists', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    const state = makeState(graph);
    expect(applyWhisperLeader(state, 'faction-a', 'sworn')).toBeNull();
  });

  it('flags conflictedWithOtherWhisper when leader already carries the condition', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    graph.updateNode('leader', {
      properties: { conditions: [DIVINE_WHISPER_PENDING_CONDITION] },
    });
    const state = makeState(graph);
    const trace = applyWhisperLeader(state, 'faction-a', 'sworn');
    expect(trace!.conflictedWithOtherWhisper).toBe(true);
  });
});

// ─── applyRecoverDoctrine ───────────────────────────────────────────────────

describe('applyRecoverDoctrine', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = makeGraph(); });

  it('consumes the clue, sets recoveredDoctrineId, plants encounter seed', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    addClueNode(graph, 'clue-1', 'faction-a', 'doctrine_old_truth');
    const state = makeState(graph);
    const trace = applyRecoverDoctrine(state, 'faction-a');
    expect(trace).not.toBeNull();
    expect(trace!.doctrineId).toBe('doctrine_old_truth');
    expect(graph.getNode('clue-1')).toBeUndefined();
    expect(graph.getNode('faction-a')?.properties.recoveredDoctrineId).toBe('doctrine_old_truth');
    expect(state.pendingEncounterSeeds!.length).toBe(1);
    expect(state.pendingEncounterSeeds![0].templateId).toBe('faction.encounter.doctrine_surfaces');
  });

  it('returns null when no clue exists', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    const state = makeState(graph);
    expect(applyRecoverDoctrine(state, 'faction-a')).toBeNull();
  });
});

// ─── applySurfaceDoubter ────────────────────────────────────────────────────

describe('applySurfaceDoubter', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = makeGraph(); });

  it('applies surfaced_by_divine_attention + plants encounter seed + bumps dissent', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a', { heart: 'positive' });
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9, alignment: { heart: 0.5 } });
    addMember(graph, 'doubter', 'faction-a', { reputation: 0.3, alignment: { heart: -0.9 } });
    const state = makeState(graph);
    const trace = applySurfaceDoubter(state, 'faction-a');
    expect(trace).not.toBeNull();
    expect(trace!.doubterId).toBe('doubter');

    const doubter = graph.getNode('doubter');
    const conditions = doubter?.properties.conditions as string[] | undefined;
    expect(conditions).toContain(SURFACED_BY_DIVINE_ATTENTION_CONDITION);
    expect(graph.getNode('faction-a')?.properties.dissentLevel).toBeCloseTo(SURFACE_DOUBTER_DISSENT_CONTRIBUTION, 5);
    expect(state.pendingEncounterSeeds!.length).toBe(1);
    expect(state.pendingEncounterSeeds![0].templateId).toBe('faction.encounter.doubter_chooses');
  });

  it('returns null when no doubter candidate exists', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a', { heart: 'positive' });
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9, alignment: { heart: 0.5 } });
    const state = makeState(graph);
    expect(applySurfaceDoubter(state, 'faction-a')).toBeNull();
  });
});

// ─── Tick decay + threshold (phaseFactionActions) ──────────────────────────

describe('phaseFactionActions — dissent decay + threshold (THR-400)', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = makeGraph(); });

  it('decays dissent on every tick, not just FACTION_ACTION_INTERVAL boundaries', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    graph.updateNode('faction-a', { properties: { dissentLevel: 0.5 } });

    // Tick 1 — off-interval — should still decay.
    const state = makeState(graph, 1);
    phaseFactionActions(state);
    const next = graph.getNode('faction-a')?.properties.dissentLevel as number;
    expect(next).toBeLessThan(0.5);
    expect(next).toBeGreaterThan(0.5 - DISSENT_DECAY_PER_TICK - 1e-9);
  });

  it('seeds a dissent_surfaces encounter when dissent crosses the threshold and resets', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    graph.updateNode('faction-a', { properties: { dissentLevel: DISSENT_ENCOUNTER_THRESHOLD + 0.01 } });

    const state = makeState(graph, 1);
    phaseFactionActions(state);

    expect(graph.getNode('faction-a')?.properties.dissentLevel).toBe(0);
    const seeds = state.pendingEncounterSeeds ?? [];
    expect(seeds.length).toBe(1);
    expect(seeds[0].templateId).toBe('faction.encounter.dissent_surfaces');
  });

  it('refreshes derived flags every tick so the action drawer can gate verbs', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a', { heart: 'positive' });
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9, alignment: { heart: 0.5 } });
    addMember(graph, 'doubter', 'faction-a', { reputation: 0.3, alignment: { heart: -0.9 } });
    addClueNode(graph, 'clue-1', 'faction-a');
    const state = makeState(graph, 1);
    phaseFactionActions(state);

    const props = graph.getNode('faction-a')?.properties ?? {};
    expect(props.hasLeader).toBe(true);
    expect(props.hasDoubter).toBe(true);
    expect(props.doubterId).toBe('doubter');
    expect(props.hasRecoverableDoctrine).toBe(true);
  });

  it('ticks down the divine_whisper_pending condition when expiry passes', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    graph.updateNode('leader', {
      properties: {
        conditions: [DIVINE_WHISPER_PENDING_CONDITION],
        divineWhisperPreferredPole: 'protector',
        divineWhisperExpiresTick: 5,
      },
    });
    const state = makeState(graph, 6); // past expiry
    phaseFactionActions(state);
    const leader = graph.getNode('leader');
    expect((leader?.properties.conditions as string[] | undefined) ?? [])
      .not.toContain(DIVINE_WHISPER_PENDING_CONDITION);
    expect(leader?.properties.divineWhisperPreferredPole).toBeNull();
  });
});

// ─── applyKindleACalling (THR-433) ──────────────────────────────────────────

describe('applyKindleACalling', () => {
  let graph: WorldGraph;
  beforeEach(() => { graph = makeGraph(); });

  /** Build a faction node using a real FACTION_DEFINITIONS key so
   *  scoreEligibleAmbitions returns non-empty candidates. */
  function addKindleFaction(id: string, defId = 'arcane_circle'): void {
    graph.addNode({
      id,
      type: 'actor',
      name: id,
      properties: {
        actorType: 'faction',
        factionDefId: defId,
        reputationAlignment: {},
        prosperity: 0.8,
      },
    });
  }

  it('returns null when the faction node is missing or non-faction', () => {
    addAscendant(graph);
    const state = makeState(graph);
    expect(applyKindleACalling(state, 'no-such-faction')).toBeNull();
  });

  it('returns null when the faction has no factionDefId', () => {
    addAscendant(graph);
    addFaction(graph, 'faction-a'); // helper sets factionDefId=id; clear it
    graph.updateNode('faction-a', { properties: { factionDefId: undefined } });
    const state = makeState(graph);
    expect(applyKindleACalling(state, 'faction-a')).toBeNull();
  });

  it('flags noEligibleCandidates when scoreEligibleAmbitions returns []', () => {
    addAscendant(graph);
    // factionDefId is an unknown key → FACTION_DEFINITIONS.get returns undefined
    addFaction(graph, 'faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    const state = makeState(graph);
    const trace = applyKindleACalling(state, 'faction-a');
    expect(trace).not.toBeNull();
    expect(trace!.noEligibleCandidates).toBe(true);
    expect(trace!.newAmbitionType).toBeNull();
    expect(trace!.lockedByArmy).toBe(false);
  });

  it('replaces the active ambition with a kindled one, plants the encounter', () => {
    addAscendant(graph);
    addKindleFaction('faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    const state = makeState(graph);
    const trace = applyKindleACalling(state, 'faction-a');
    expect(trace).not.toBeNull();
    expect(trace!.newAmbitionType).not.toBeNull();
    expect(trace!.lockedByArmy).toBe(false);
    expect(trace!.noEligibleCandidates).toBe(false);
    expect(trace!.candidates.length).toBeGreaterThan(0);

    // pursues edge now points at a kindled ambition node
    const pursues = graph.getOutgoingEdges('faction-a', 'pursues');
    expect(pursues.length).toBe(1);
    const ambitionNode = graph.getNode(pursues[0].target);
    expect(ambitionNode).not.toBeNull();
    expect(ambitionNode!.properties.kindled).toBe(true);
    expect(ambitionNode!.properties.ambitionType).toBe(trace!.newAmbitionType);

    // Encounter seed planted on the leader
    expect(state.pendingEncounterSeeds!.length).toBe(1);
    expect(state.pendingEncounterSeeds![0].targetAgentId).toBe('leader');
    expect(state.pendingEncounterSeeds![0].templateId).toBe('faction.encounter.calling_named');

    // Leader marked with the kindled_calling_pending condition
    const leader = graph.getNode('leader');
    expect(leader!.properties.conditions).toContain('kindled_calling_pending');
    expect(leader!.properties.kindledCallingAmbitionType).toBe(trace!.newAmbitionType);
  });

  it('removes the previous ambition node when replacing', () => {
    addAscendant(graph);
    addKindleFaction('faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });

    // Pre-existing ambition
    graph.addNode({
      id: 'amb_old',
      type: 'ambition',
      name: 'old ambition',
      properties: { ambitionType: 'revenge', priority: 0.5, createdTick: 0 },
    });
    graph.addEdge({
      id: 'e_pursues_old',
      source: 'faction-a',
      target: 'amb_old',
      type: 'pursues',
      properties: { priority: 0.5, status: 'active', milestones: [] },
    });

    const state = makeState(graph);
    const trace = applyKindleACalling(state, 'faction-a');
    expect(trace).not.toBeNull();
    expect(trace!.previousAmbitionType).toBe('revenge');
    expect(graph.getNode('amb_old')).toBeUndefined();
  });

  it('refuses to replace an army-locked ambition (lockedByArmy=true)', () => {
    addAscendant(graph);
    addKindleFaction('faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });

    // Active ambition the army is committed to
    graph.addNode({
      id: 'amb_locked',
      type: 'ambition',
      name: 'territorial_expansion',
      properties: { ambitionType: 'territorial_expansion', priority: 0.7 },
    });
    graph.addEdge({
      id: 'e_pursues_faction_locked',
      source: 'faction-a',
      target: 'amb_locked',
      type: 'pursues',
      properties: { priority: 0.7, status: 'active', milestones: [] },
    });

    // Army (group actor) member of the faction, pursuing the same ambition
    graph.addNode({
      id: 'army-a',
      type: 'actor',
      name: 'Army',
      properties: { actorType: 'group', armyState: { size: 'regiment' } },
    });
    graph.addEdge({
      id: 'e_member_army',
      source: 'army-a',
      target: 'faction-a',
      type: 'member_of',
      properties: { role: 'army', rank: 'army', reputation: 0 },
    });
    graph.addEdge({
      id: 'e_army_pursues',
      source: 'army-a',
      target: 'amb_locked',
      type: 'pursues',
      properties: { priority: 1.0, status: 'active', milestones: [] },
    });

    const state = makeState(graph);
    const trace = applyKindleACalling(state, 'faction-a');
    expect(trace).not.toBeNull();
    expect(trace!.lockedByArmy).toBe(true);
    expect(trace!.newAmbitionType).toBeNull();

    // The previous ambition node remains untouched
    expect(graph.getNode('amb_locked')).not.toBeNull();
    expect(state.pendingEncounterSeeds!.length).toBe(0);
  });

  it('produces deterministic output for the same seed + faction + tick', () => {
    addAscendant(graph);
    addKindleFaction('faction-a');
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    const state1 = makeState(graph);
    const trace1 = applyKindleACalling(state1, 'faction-a');

    // Fresh graph, identical setup
    const graph2 = makeGraph();
    addAscendant(graph2);
    graph2.addNode({
      id: 'faction-a',
      type: 'actor',
      name: 'faction-a',
      properties: { actorType: 'faction', factionDefId: 'arcane_circle', reputationAlignment: {}, prosperity: 0.8 },
    });
    graph2.addNode({
      id: 'leader',
      type: 'actor',
      name: 'leader',
      properties: { actorType: 'individual', reputationAlignment: {} },
    });
    graph2.addEdge({
      id: 'e_member_leader',
      source: 'leader',
      target: 'faction-a',
      type: 'member_of',
      properties: { reputation: 0.9, role: 'member', rank: 1 },
    });
    const state2 = makeState(graph2);
    const trace2 = applyKindleACalling(state2, 'faction-a');

    expect(trace1!.newAmbitionType).toBe(trace2!.newAmbitionType);
  });

  it('biases away from territorial_expansion when dissent is high', () => {
    addAscendant(graph);
    addKindleFaction('faction-a', 'arcane_circle');
    graph.updateNode('faction-a', { properties: { dissentLevel: 0.95 } });
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    const state = makeState(graph);
    const trace = applyKindleACalling(state, 'faction-a');
    expect(trace).not.toBeNull();
    const expansionWeight = trace!.candidates.find(c => c.type === 'territorial_expansion')?.finalWeight ?? 0;
    const defensiveWeight = trace!.candidates.find(c => c.type === 'defensive_consolidation')?.finalWeight ?? 0;
    // Defensive must outweigh expansion under high dissent
    expect(defensiveWeight).toBeGreaterThan(expansionWeight);
  });

  it('biases toward cultural_dominance when recoveredDoctrineId is set', () => {
    addAscendant(graph);
    addKindleFaction('faction-a', 'arcane_circle');
    graph.updateNode('faction-a', { properties: { recoveredDoctrineId: 'doctrine_x' } });
    addMember(graph, 'leader', 'faction-a', { reputation: 0.9 });
    const state = makeState(graph);
    const trace = applyKindleACalling(state, 'faction-a');
    expect(trace).not.toBeNull();
    const culturalWeight = trace!.candidates.find(c => c.type === 'cultural_dominance')?.finalWeight ?? 0;
    // arcane_circle's base cultural_dominance is 0.4; doctrine bias adds substantially
    expect(culturalWeight).toBeGreaterThan(0.4);
  });
});
