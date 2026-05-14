/**
 * THR-430 — Schism subsystem tests.
 *
 * Covers:
 *   - applyPlantSchism      — sets pending props, snapshots cohesion, emits trace
 *   - decideSchismOutcome   — pure decision logic given (state, baseline, sample)
 *   - performFactionReform  — reputation penalty + most-misaligned expulsion
 *   - performFactionSplit   — splinter minted, members partitioned, edges copied
 *   - phaseSchismResolution — fires at the matching tick, clears props, fail-soft
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyPlantSchism } from '../schismPlant';
import {
  computeFactionCohesion,
  decideSchismOutcome,
  performFactionReform,
  performFactionSplit,
} from '../factionTopology';
import { phaseSchismResolution } from '../phaseSchismResolution';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import type { GameState } from '../../types/gameState';
import {
  SCHISM_PENDING_DURATION_TICKS,
  SCHISM_REFORM_EXPULSION_COUNT,
  SCHISM_REFORM_REPUTATION_PENALTY,
} from '../../data/game-config';

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'faction-alpha',
    type: 'actor',
    name: 'Alpha Guild',
    properties: {
      actorType: 'faction',
      actorStatus: 'active',
      reputation: 0.6,
      factionType: 'guild',
      dominantReach: 'iron',
    },
  });
  // 6 members with a spread of reputations — enough to split (n>=2) and to expel
  // 3 (SCHISM_REFORM_EXPULSION_COUNT=3) leaving at least 1 standing.
  graph.addNode({ id: 'm1', type: 'actor', name: 'M1', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'm2', type: 'actor', name: 'M2', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'm3', type: 'actor', name: 'M3', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'm4', type: 'actor', name: 'M4', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'm5', type: 'actor', name: 'M5', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'm6', type: 'actor', name: 'M6', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'me1', source: 'm1', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.9 } });
  graph.addEdge({ id: 'me2', source: 'm2', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.8 } });
  graph.addEdge({ id: 'me3', source: 'm3', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.7 } });
  graph.addEdge({ id: 'me4', source: 'm4', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.3 } });
  graph.addEdge({ id: 'me5', source: 'm5', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.2 } });
  graph.addEdge({ id: 'me6', source: 'm6', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.1 } });
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

let runtime: SimulationRuntime;

beforeEach(() => {
  enableTracing();
  clearTraces();
  runtime = createSimulationRuntime();
});

afterEach(() => {
  disableTracing();
  clearTraces();
});

describe('applyPlantSchism (THR-430)', () => {
  it('sets pending-resolution properties on the faction node', () => {
    const state = buildState();
    const ok = applyPlantSchism(state, runtime, 'faction-alpha', 'actor-hero', SCHISM_PENDING_DURATION_TICKS, state.tick);
    expect(ok).toBe(true);
    const faction = state.graph.getNode('faction-alpha')!;
    expect(faction.properties.schismPendingResolutionTick).toBe(state.tick + SCHISM_PENDING_DURATION_TICKS);
    expect(faction.properties.schismPlantedTick).toBe(state.tick);
    expect(faction.properties.schismActorAgentId).toBe('actor-hero');
    expect(typeof faction.properties.schismBaselineCohesion).toBe('number');
  });

  it('emits a schism_planted trace and a chronicle event', () => {
    const state = buildState();
    applyPlantSchism(state, runtime, 'faction-alpha', 'actor-hero', SCHISM_PENDING_DURATION_TICKS, state.tick);
    const traces = getTraces();
    const planted = traces.find(t => t.category === 'schism_planted');
    expect(planted).toBeDefined();
    expect(state.recentEvents?.length).toBeGreaterThan(0);
    const last = state.recentEvents![state.recentEvents!.length - 1];
    expect(last.message).toContain('Alpha Guild');
  });

  it('refuses to plant on a dissolved faction', () => {
    const state = buildState();
    state.graph.getNode('faction-alpha')!.properties.actorStatus = 'dissolved';
    const ok = applyPlantSchism(state, runtime, 'faction-alpha', 'actor-hero', SCHISM_PENDING_DURATION_TICKS, state.tick);
    expect(ok).toBe(false);
  });
});

describe('decideSchismOutcome (THR-430)', () => {
  it('is deterministic given identical inputs', () => {
    const state = buildState();
    const a = decideSchismOutcome(state, 'faction-alpha', 0.8, 0.3, { cohesion: 0.4, spread: 0.4, dissent: 0.2 });
    const b = decideSchismOutcome(state, 'faction-alpha', 0.8, 0.3, { cohesion: 0.4, spread: 0.4, dissent: 0.2 });
    expect(a).toEqual(b);
  });

  it('reform branch wins when sample > splitPressure', () => {
    const state = buildState();
    // Baseline = current cohesion → cohesionDrop = 0 → splitPressure = 0
    const baseline = computeFactionCohesion(state, 'faction-alpha');
    const decision = decideSchismOutcome(state, 'faction-alpha', baseline, 0.99, { cohesion: 0.4, spread: 0.4, dissent: 0.2 });
    expect(decision.outcome).toBe('reform');
    expect(decision.splitPressure).toBeLessThan(0.5);
  });

  it('split branch wins when cohesion has dropped and sample is low', () => {
    const state = buildState();
    // High baseline + very low current (drop all members reputation to 0)
    state.graph.getAllEdges()
      .filter(e => e.type === 'member_of' && e.target === 'faction-alpha')
      .forEach(e => { e.properties.reputation = 0; });
    const decision = decideSchismOutcome(state, 'faction-alpha', 1.0, 0.0, { cohesion: 1.0, spread: 0.0, dissent: 0.0 });
    expect(decision.outcome).toBe('split');
    expect(decision.inputs.cohesionDrop).toBeGreaterThan(0);
  });
});

describe('performFactionReform (THR-430)', () => {
  it('applies the reputation penalty and expels SCHISM_REFORM_EXPULSION_COUNT members', () => {
    const state = buildState();
    const before = (state.graph.getNode('faction-alpha')!.properties.reputation as number);
    const result = performFactionReform(
      state,
      runtime,
      'faction-alpha',
      { outcome: 'reform', splitPressure: 0.2, inputs: { cohesionDrop: 0, spread: 0, dissent: 0.2 } },
      state.tick,
    );
    expect(result.success).toBe(true);
    expect(result.expelledIds.length).toBe(SCHISM_REFORM_EXPULSION_COUNT);
    const after = state.graph.getNode('faction-alpha')!.properties.reputation as number;
    expect(after).toBeCloseTo(before - SCHISM_REFORM_REPUTATION_PENALTY, 6);
    // Expelled members should be the lowest-reputation ones (m6, m5, m4)
    expect(result.expelledIds.sort()).toEqual(['m4', 'm5', 'm6']);
  });

  it('emits faction_reformed and schism_resolved traces', () => {
    const state = buildState();
    performFactionReform(
      state,
      runtime,
      'faction-alpha',
      { outcome: 'reform', splitPressure: 0.2, inputs: { cohesionDrop: 0, spread: 0, dissent: 0.2 } },
      state.tick,
    );
    const traces = getTraces();
    expect(traces.find(t => t.category === 'faction_reformed')).toBeDefined();
    const resolved = traces.find(t => t.category === 'schism_resolved');
    expect(resolved).toBeDefined();
    expect((resolved as any).outcome).toBe('reform');
  });

  it('clamps expulsion so the faction is never emptied', () => {
    const state = buildState();
    // Reduce membership to 2; SCHISM_REFORM_EXPULSION_COUNT=3 should clamp to 1
    state.graph.removeEdge('me3');
    state.graph.removeEdge('me4');
    state.graph.removeEdge('me5');
    state.graph.removeEdge('me6');
    const result = performFactionReform(
      state,
      runtime,
      'faction-alpha',
      { outcome: 'reform', splitPressure: 0.2, inputs: { cohesionDrop: 0, spread: 0, dissent: 0.2 } },
      state.tick,
    );
    expect(result.success).toBe(true);
    expect(result.expelledIds.length).toBe(1);
  });
});

describe('performFactionSplit (THR-430)', () => {
  it('mints a splinter faction, partitions members, and creates a hostile back-edge', () => {
    const state = buildState();
    const result = performFactionSplit(
      state,
      runtime,
      'faction-alpha',
      { outcome: 'split', splitPressure: 0.8, inputs: { cohesionDrop: 0.5, spread: 0, dissent: 0.3 } },
      state.tick,
    );
    expect(result.success).toBe(true);
    expect(result.splinterFactionId).toBeDefined();
    const splinter = state.graph.getNode(result.splinterFactionId!);
    expect(splinter).toBeDefined();
    expect((splinter!.properties.actorType as string)).toBe('faction');

    // Lowest-rep half went to splinter (m6, m5, m4)
    const splinterMembers = state.graph.getIncomingEdges(result.splinterFactionId!, 'member_of');
    expect(splinterMembers.length).toBe(3);
    const memberIds = splinterMembers.map(e => e.source).sort();
    expect(memberIds).toEqual(['m4', 'm5', 'm6']);

    // Hostile relates_to edge: splinter → parent
    const backEdges = state.graph.getOutgoingEdges(result.splinterFactionId!, 'relates_to')
      .filter(e => e.target === 'faction-alpha');
    expect(backEdges.length).toBe(1);
    expect((backEdges[0].properties?.sentiment as number)).toBeLessThan(0);
  });

  it('refuses to split a single-member faction (fail-soft to caller)', () => {
    const state = buildState();
    // Remove all but m1
    ['me2', 'me3', 'me4', 'me5', 'me6'].forEach(id => state.graph.removeEdge(id));
    const result = performFactionSplit(
      state,
      runtime,
      'faction-alpha',
      { outcome: 'split', splitPressure: 0.9, inputs: { cohesionDrop: 0.7, spread: 0, dissent: 0.2 } },
      state.tick,
    );
    expect(result.success).toBe(false);
    expect(result.failReason).toBe('too_few_members');
  });
});

describe('phaseSchismResolution (THR-430)', () => {
  it('runs only on the matching resolution tick', () => {
    const state = buildState();
    applyPlantSchism(state, runtime, 'faction-alpha', 'actor-hero', 5, state.tick);
    // Should NOT fire on intermediate ticks
    state.tick = state.tick + 3;
    phaseSchismResolution(state, runtime);
    const faction = state.graph.getNode('faction-alpha')!;
    expect(faction.properties.schismPendingResolutionTick).toBeDefined();
    // Advance to resolution tick
    state.tick = (faction.properties.schismPendingResolutionTick as number);
    phaseSchismResolution(state, runtime);
    expect(state.graph.getNode('faction-alpha')!.properties.schismPendingResolutionTick).toBeUndefined();
  });

  it('emits a schism_resolved trace on the resolution tick', () => {
    const state = buildState();
    applyPlantSchism(state, runtime, 'faction-alpha', 'actor-hero', 1, state.tick);
    state.tick = state.tick + 1;
    clearTraces();
    phaseSchismResolution(state, runtime);
    const traces = getTraces();
    expect(traces.find(t => t.category === 'schism_resolved')).toBeDefined();
  });

  it('is fail-soft when faction was dissolved between plant and resolution', () => {
    const state = buildState();
    applyPlantSchism(state, runtime, 'faction-alpha', 'actor-hero', 1, state.tick);
    state.graph.getNode('faction-alpha')!.properties.actorStatus = 'dissolved';
    state.tick = state.tick + 1;
    clearTraces();
    expect(() => phaseSchismResolution(state, runtime)).not.toThrow();
    // Pending properties should still get cleared even on noop path
    expect(state.graph.getNode('faction-alpha')!.properties.schismPendingResolutionTick).toBeUndefined();
  });
});

describe('action.faction.schism template contract (THR-430)', () => {
  it('is registered in UNIFIED_ACTION_TEMPLATES with targetSubtypes including faction', async () => {
    const { UNIFIED_ACTION_TEMPLATES } = await import('../../data/unified-action-templates');
    const template = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'action.faction.schism');
    expect(template).toBeDefined();
    // targetCategories cast to TargetCategory in the file; raw value is ['faction']
    expect(template!.targetCategories).toContain('faction');
    expect(template!.actorAffinities).toContain('ascendant');
    expect(template!.sphereAffinity).toBe('chaos');
    expect(template!.rarityTier).toBe(3);
    expect(template!.steps.length).toBe(1);
    const onSuccess = template!.steps[0].onSuccess;
    expect(onSuccess.length).toBe(1);
    expect((onSuccess[0] as any).op).toBe('plant_schism');
  });
});
