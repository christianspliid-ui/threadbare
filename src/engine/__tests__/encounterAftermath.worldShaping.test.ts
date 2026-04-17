/**
 * THR-115: World-shaping aftermath effects.
 * Tests: spawn_artifact, emit_omen, faction topology mutations,
 *        phaseEmittedOmenDecay, deriveEmittedOmenEncounterBias, fail-soft cases.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { phaseEmittedOmenDecay, deriveEmittedOmenEncounterBias } from '../phaseOmenAgenda';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, EncounterAftermathReactionEffect, UnifiedAction } from '../../types/unifiedAction';
import type { EmittedOmen } from '../../types/omen';

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'faction-alpha', type: 'actor', name: 'Alpha Guild', properties: { actorType: 'faction', actorStatus: 'active' } });
  graph.addNode({ id: 'faction-beta', type: 'actor', name: 'Beta Order', properties: { actorType: 'faction', actorStatus: 'active' } });
  graph.addNode({ id: 'faction-gamma', type: 'actor', name: 'Gamma Circle', properties: { actorType: 'faction', actorStatus: 'active' } });
  graph.addNode({ id: 'member-1', type: 'actor', name: 'Member One', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'member-2', type: 'actor', name: 'Member Two', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'mem1_alpha', source: 'member-1', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.7 } });
  graph.addEdge({ id: 'mem2_alpha', source: 'member-2', target: 'faction-alpha', type: 'member_of', properties: { reputation: 0.5 } });
  return {
    tick: 50, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as GameState;
}

function makeAction(actorId = 'actor-hero', templateId = 'enc.test'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId, targetId: actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  };
}

function makeReaction(effects: EncounterAftermathReactionEffect[]): EncounterAftermathReaction {
  return { id: 'rx-test', label: 'Test Reaction', effects } as EncounterAftermathReaction;
}

// Shorthand: call with correct arg order (state, action, reaction, tick, runtime)
function apply(
  state: GameState,
  reaction: EncounterAftermathReaction,
  runtime: SimulationRuntime,
  tick = 50,
) {
  return applyEncounterAftermathReaction(state, makeAction(), reaction, tick, runtime);
}

// ─── spawn_artifact ─────────────────────────────────────────────────────────

describe('spawn_artifact', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('adds artifact node to graph and connects it to actor with possesses edge', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'spawn_artifact', tier: 'common', category: 'talisman',
      nameOverride: 'Shard of Memory',
    }]);
    const result = apply(state, reaction, runtime);
    const possessesEdge = result.state.graph.getAllEdges().find(e => e.type === 'possesses' && e.source === 'actor-hero');
    expect(possessesEdge).toBeDefined();
    const artifactNode = result.state.graph.getNode(possessesEdge!.target);
    expect(artifactNode).toBeDefined();
    expect(artifactNode!.name).toBe('Shard of Memory');
    expect(artifactNode!.properties.tier).toBe('common');
    expect(artifactNode!.type).toBe('artifact');
  });

  it('uses bonded_to edge and artifact_legendary type for legendary tier', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'spawn_artifact', tier: 'legendary', category: 'weapon',
      nameOverride: 'Godsbane',
    }]);
    const result = apply(state, reaction, runtime);
    const bondEdge = result.state.graph.getAllEdges().find(e => e.type === 'bonded_to' && e.source === 'actor-hero');
    expect(bondEdge).toBeDefined();
    const node = result.state.graph.getNode(bondEdge!.target);
    expect(node?.type).toBe('artifact_legendary');
  });

  it('emits artifact_spawned trace with success=true', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'spawn_artifact', tier: 'shaping', category: 'relic' }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'artifact_spawned');
    expect(trace).toBeDefined();
    expect((trace as any).success).toBe(true);
    expect((trace as any).tier).toBe('shaping');
  });

  it('emits artifact_spawned with success=false when target actor not found', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'spawn_artifact', tier: 'common', category: 'mundane',
      targetAgentId: 'nonexistent-agent',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'artifact_spawned');
    expect((trace as any).success).toBe(false);
    expect((trace as any).failReason).toBe('target_actor_missing');
  });

  it('places artifact at location using contains edge when targetLocationId provided', () => {
    const state = buildState();
    state.graph.addNode({ id: 'loc-shrine', type: 'location', name: 'Shrine', properties: {} });
    const reaction = makeReaction([{
      kind: 'spawn_artifact', tier: 'common', category: 'key',
      targetLocationId: 'loc-shrine', nameOverride: 'Iron Key',
    }]);
    const result = apply(state, reaction, runtime);
    const containsEdge = result.state.graph.getAllEdges().find(e => e.type === 'contains' && e.source === 'loc-shrine');
    expect(containsEdge).toBeDefined();
    const node = result.state.graph.getNode(containsEdge!.target);
    expect(node?.name).toBe('Iron Key');
  });

  it('adds a narrative tick event for the spawned artifact', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'spawn_artifact', tier: 'common', category: 'tome', nameOverride: 'Arcane Codex' }]);
    const result = apply(state, reaction, runtime);
    const event = result.state.tickEvents.find(e => e.message.includes('Arcane Codex'));
    expect(event).toBeDefined();
  });
});

// ─── emit_omen ──────────────────────────────────────────────────────────────

describe('emit_omen', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('adds an EmittedOmen entry to state.emittedOmens', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'emit_omen', category: 'doom_echo', intensity: 0.7,
      scope: { kind: 'global' }, narrativeHook: 'A shadow falls.',
    }]);
    const result = apply(state, reaction, runtime);
    expect(result.state.emittedOmens).toHaveLength(1);
    expect(result.state.emittedOmens![0].category).toBe('doom_echo');
    expect(result.state.emittedOmens![0].intensity).toBe(0.7);
    expect(result.state.emittedOmens![0].scope.kind).toBe('global');
  });

  it('sets expiresTick = tick + durationTicks', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'emit_omen', category: 'sphere_surge', intensity: 0.5,
      scope: { kind: 'global' }, narrativeHook: 'Energy crackles.', durationTicks: 10,
    }]);
    const result = apply(state, reaction, runtime, 50);
    expect(result.state.emittedOmens![0].expiresTick).toBe(60); // tick=50 + 10
  });

  it('applies default local radius when local scope has no radius', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'emit_omen', category: 'cultural', intensity: 0.4,
      scope: { kind: 'local', hexCol: 3, hexRow: 3 }, narrativeHook: 'Voices carry.',
    }]);
    const result = apply(state, reaction, runtime);
    expect((result.state.emittedOmens![0].scope as any).radius).toBe(2);
  });

  it('degrades regional scope with missing regionId to global', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'emit_omen', category: 'doom_echo', intensity: 0.3,
      scope: { kind: 'regional', regionId: '' }, narrativeHook: 'Something stirs.',
    }]);
    const result = apply(state, reaction, runtime);
    expect(result.state.emittedOmens![0].scope.kind).toBe('global');
    const trace = getTraces().find(t => t.category === 'omen_emitted');
    expect((trace as any).degradedToGlobal).toBe(true);
  });

  it('emits omen_emitted trace', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'emit_omen', category: 'seasonal', intensity: 0.6,
      scope: { kind: 'global' }, narrativeHook: 'Harvest winds blow.',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'omen_emitted');
    expect(trace).toBeDefined();
    expect((trace as any).omenCategory).toBe('seasonal');
  });

  it('evicts oldest omen when EMITTED_OMEN_MAX_ACTIVE exceeded', () => {
    const state = buildState();
    state.emittedOmens = Array.from({ length: 20 }, (_, idx) => ({
      omenId: `omen-old-${idx}`,
      sourceEncounterId: 'enc-old',
      sourceReactionId: 'rx-old',
      category: 'doom_echo' as const,
      intensity: 0.1,
      scope: { kind: 'global' as const },
      narrativeHook: 'old',
      emittedTick: idx,
      expiresTick: 9999,
    }));
    const reaction = makeReaction([{
      kind: 'emit_omen', category: 'sphere_surge', intensity: 0.8,
      scope: { kind: 'global' }, narrativeHook: 'New power erupts.',
    }]);
    const result = apply(state, reaction, runtime);
    expect(result.state.emittedOmens!.length).toBe(20);
    expect(result.state.emittedOmens!.every(o => o.omenId !== 'omen-old-0')).toBe(true);
    expect(result.state.emittedOmens!.some(o => o.category === 'sphere_surge')).toBe(true);
    const decayTrace = getTraces().find(t => t.category === 'omen_decayed');
    expect((decayTrace as any).failReason).toBe('cap_evicted');
  });
});

// ─── phaseEmittedOmenDecay ───────────────────────────────────────────────────

describe('phaseEmittedOmenDecay', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('removes omens where tick > expiresTick and emits omen_decayed trace', () => {
    const state = buildState();
    state.emittedOmens = [
      { omenId: 'o-expired', sourceEncounterId: 'enc-1', sourceReactionId: 'rx-1',
        category: 'doom_echo', intensity: 0.5, scope: { kind: 'global' },
        narrativeHook: '', emittedTick: 10, expiresTick: 30 }, // tick=50 > 30
      { omenId: 'o-live', sourceEncounterId: 'enc-1', sourceReactionId: 'rx-1',
        category: 'seasonal', intensity: 0.5, scope: { kind: 'global' },
        narrativeHook: '', emittedTick: 45, expiresTick: 100 },
    ];
    const patch = phaseEmittedOmenDecay(state);
    expect(patch.emittedOmens).toHaveLength(1);
    expect(patch.emittedOmens![0].omenId).toBe('o-live');
    const trace = getTraces().find(t => t.category === 'omen_decayed');
    expect((trace as any).omenId).toBe('o-expired');
  });

  it('returns {} when no omens present', () => {
    const state = buildState();
    expect(phaseEmittedOmenDecay(state)).toEqual({});
  });

  it('returns {} when no omens have expired', () => {
    const state = buildState();
    state.emittedOmens = [{
      omenId: 'o-live', sourceEncounterId: 'enc-1', sourceReactionId: 'rx-1',
      category: 'doom_echo', intensity: 0.5, scope: { kind: 'global' },
      narrativeHook: '', emittedTick: 40, expiresTick: 100,
    }];
    expect(phaseEmittedOmenDecay(state)).toEqual({});
  });
});

// ─── deriveEmittedOmenEncounterBias ─────────────────────────────────────────

describe('deriveEmittedOmenEncounterBias', () => {
  const makeOmen = (overrides: Partial<EmittedOmen>): EmittedOmen => ({
    omenId: 'o-1', sourceEncounterId: 'enc-1', sourceReactionId: 'rx-1',
    category: 'doom_echo', intensity: 1.0, scope: { kind: 'global' },
    narrativeHook: '', emittedTick: 1, expiresTick: 999,
    ...overrides,
  });

  it('returns {} for empty input', () => {
    expect(deriveEmittedOmenEncounterBias([], 0, 0)).toEqual({});
    expect(deriveEmittedOmenEncounterBias(undefined, 0, 0)).toEqual({});
  });

  it('maps doom_echo to duel/steal encounter types', () => {
    const bias = deriveEmittedOmenEncounterBias([makeOmen({ category: 'doom_echo', intensity: 1.0 })], 0, 0);
    expect(bias['duel']).toBeGreaterThan(0);
    expect(bias['steal']).toBeGreaterThan(0);
  });

  it('maps sphere_surge to explore/create encounter types', () => {
    const bias = deriveEmittedOmenEncounterBias([makeOmen({ category: 'sphere_surge', intensity: 0.5 })], 0, 0);
    expect(bias['explore']).toBeGreaterThan(0);
    expect(bias['create']).toBeGreaterThan(0);
  });

  it('excludes omen with local scope when agent is outside radius', () => {
    const omen = makeOmen({
      scope: { kind: 'local', hexCol: 10, hexRow: 10, radius: 1 },
      category: 'doom_echo',
    });
    const bias = deriveEmittedOmenEncounterBias([omen], 0, 0);
    expect(Object.keys(bias)).toHaveLength(0);
  });

  it('includes omen with local scope when agent is within radius', () => {
    const omen = makeOmen({
      scope: { kind: 'local', hexCol: 2, hexRow: 2, radius: 3 },
      category: 'doom_echo',
    });
    const bias = deriveEmittedOmenEncounterBias([omen], 1, 1);
    expect(bias['duel']).toBeGreaterThan(0);
  });

  it('accumulates bias from multiple omens', () => {
    const omens = [
      makeOmen({ omenId: 'o-1', category: 'doom_echo', intensity: 0.5 }),
      makeOmen({ omenId: 'o-2', category: 'doom_echo', intensity: 0.5 }),
    ];
    const single = deriveEmittedOmenEncounterBias([omens[0]], 0, 0);
    const both = deriveEmittedOmenEncounterBias(omens, 0, 0);
    expect(both['duel']).toBeCloseTo((single['duel'] ?? 0) * 2, 5);
  });
});

// ─── faction_splinter ────────────────────────────────────────────────────────

describe('faction_splinter', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('creates new faction node and moves selected members', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_splinter',
      sourceFactionId: 'faction-alpha',
      newFactionName: 'Rebel Wing',
      memberSelection: { kind: 'explicit_ids', agentIds: ['member-1'] },
    }]);
    const result = apply(state, reaction, runtime);
    const newMemberEdge = result.state.graph.getOutgoingEdges('member-1', 'member_of')
      .find(e => e.target !== 'faction-alpha');
    expect(newMemberEdge).toBeDefined();
    const newNode = result.state.graph.getNode(newMemberEdge!.target);
    expect(newNode?.name).toBe('Rebel Wing');
    const stillInAlpha = result.state.graph.getOutgoingEdges('member-1', 'member_of')
      .find(e => e.target === 'faction-alpha');
    expect(stillInAlpha).toBeUndefined();
  });

  it('creates resentful relates_to edge from new faction to source', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_splinter',
      sourceFactionId: 'faction-alpha',
      newFactionName: 'Dissenters',
      memberSelection: { kind: 'explicit_ids', agentIds: ['member-2'] },
    }]);
    const result = apply(state, reaction, runtime);
    const splinterFactionId = result.state.graph.getOutgoingEdges('member-2', 'member_of')
      .find(e => e.target !== 'faction-alpha')?.target;
    const relEdge = result.state.graph.getOutgoingEdges(splinterFactionId ?? '', 'relates_to')
      .find(e => e.target === 'faction-alpha');
    expect(relEdge).toBeDefined();
    expect((relEdge!.properties.sentiment as number)).toBeLessThan(0);
  });

  it('emits faction_splintered trace with success=true', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_splinter',
      sourceFactionId: 'faction-alpha',
      newFactionName: 'Breakers',
      memberSelection: { kind: 'explicit_ids', agentIds: ['member-1'] },
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_splintered');
    expect((trace as any).success).toBe(true);
    expect((trace as any).memberCount).toBe(1);
  });

  it('emits faction_splintered with success=false when source faction missing', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_splinter',
      sourceFactionId: 'nonexistent-faction',
      newFactionName: 'Ghost Wing',
      memberSelection: { kind: 'explicit_ids', agentIds: [] },
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_splintered');
    expect((trace as any).success).toBe(false);
    expect((trace as any).failReason).toBe('source_faction_invalid');
  });
});

// ─── faction_absorb ──────────────────────────────────────────────────────────

describe('faction_absorb', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('migrates absorbed members to absorbing faction and marks absorbed as dissolved', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_absorb',
      absorbingFactionId: 'faction-beta',
      absorbedFactionId: 'faction-alpha',
      reputationMerge: 'max',
    }]);
    const result = apply(state, reaction, runtime);
    const m1Edge = result.state.graph.getOutgoingEdges('member-1', 'member_of')
      .find(e => e.target === 'faction-beta');
    expect(m1Edge).toBeDefined();
    expect(result.state.graph.getNode('faction-alpha')!.properties.actorStatus).toBe('dissolved');
  });

  it('emits faction_absorbed trace with success=true and correct migratedMemberCount', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_absorb',
      absorbingFactionId: 'faction-beta',
      absorbedFactionId: 'faction-alpha',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_absorbed');
    expect((trace as any).success).toBe(true);
    expect((trace as any).migratedMemberCount).toBe(2);
  });

  it('emits faction_absorbed with success=false when faction missing', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_absorb',
      absorbingFactionId: 'nonexistent',
      absorbedFactionId: 'faction-alpha',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_absorbed');
    expect((trace as any).success).toBe(false);
  });
});

// ─── faction_dissolve ────────────────────────────────────────────────────────

describe('faction_dissolve', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('marks faction as dissolved and removes member_of edges (independent fallback)', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_dissolve',
      factionId: 'faction-alpha',
      memberFallback: 'independent',
    }]);
    const result = apply(state, reaction, runtime);
    expect(result.state.graph.getNode('faction-alpha')!.properties.actorStatus).toBe('dissolved');
    const m1Edge = result.state.graph.getOutgoingEdges('member-1', 'member_of').find(e => e.target === 'faction-alpha');
    expect(m1Edge).toBeUndefined();
  });

  it('redirects members to rival when drift_to_rival fallback and rival exists', () => {
    const state = buildState();
    state.graph.addEdge({
      id: 'alpha_to_gamma_rel', source: 'faction-alpha', target: 'faction-gamma',
      type: 'relates_to', properties: { sentiment: -0.5, strength: 0.9 },
    });
    const reaction = makeReaction([{
      kind: 'faction_dissolve',
      factionId: 'faction-alpha',
      memberFallback: 'drift_to_rival',
    }]);
    const result = apply(state, reaction, runtime);
    const driftEdge = result.state.graph.getOutgoingEdges('member-1', 'member_of')
      .find(e => e.target === 'faction-gamma' && e.properties?.basis === 'drift');
    expect(driftEdge).toBeDefined();
  });

  it('emits faction_dissolved trace with success=true', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_dissolve',
      factionId: 'faction-alpha',
      memberFallback: 'independent',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_dissolved');
    expect((trace as any).success).toBe(true);
    expect((trace as any).releasedMemberCount).toBe(2);
  });

  it('emits faction_dissolved with success=false when faction missing', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_dissolve',
      factionId: 'nonexistent-faction',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_dissolved');
    expect((trace as any).success).toBe(false);
  });
});

// ─── faction_declare_war ─────────────────────────────────────────────────────

describe('faction_declare_war', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('creates bidirectional relates_to edges with war sentiment and war basis', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_declare_war',
      factionA: 'faction-alpha',
      factionB: 'faction-beta',
    }]);
    const result = apply(state, reaction, runtime);
    const aToB = result.state.graph.getOutgoingEdges('faction-alpha', 'relates_to').find(e => e.target === 'faction-beta');
    const bToA = result.state.graph.getOutgoingEdges('faction-beta', 'relates_to').find(e => e.target === 'faction-alpha');
    expect(aToB).toBeDefined();
    expect(bToA).toBeDefined();
    expect((aToB!.properties.sentiment as number)).toBeLessThanOrEqual(-0.8);
    expect(aToB!.properties.basis).toBe('war');
  });

  it('emits faction_war_declared trace with success=true', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_declare_war',
      factionA: 'faction-alpha',
      factionB: 'faction-beta',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_war_declared');
    expect((trace as any).success).toBe(true);
  });

  it('emits faction_war_declared with success=false when faction missing', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_declare_war',
      factionA: 'faction-alpha',
      factionB: 'nonexistent',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_war_declared');
    expect((trace as any).success).toBe(false);
  });
});

// ─── faction_force_peace ─────────────────────────────────────────────────────

describe('faction_force_peace', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('creates relates_to edges with sentiment clamped above peace floor', () => {
    const state = buildState();
    state.graph.addEdge({ id: 'a_to_b_war', source: 'faction-alpha', target: 'faction-beta',
      type: 'relates_to', properties: { sentiment: -0.9, strength: 1.0, basis: 'war' } });
    const reaction = makeReaction([{
      kind: 'faction_force_peace',
      factionA: 'faction-alpha',
      factionB: 'faction-beta',
      sentimentBoost: 0.3,
    }]);
    const result = apply(state, reaction, runtime);
    const aToB = result.state.graph.getOutgoingEdges('faction-alpha', 'relates_to').find(e => e.target === 'faction-beta');
    // max(floor=0.2, -0.9 + 0.3 = -0.6) → 0.2
    expect((aToB!.properties.sentiment as number)).toBeGreaterThanOrEqual(0.2);
  });

  it('emits faction_peace_forced trace with success=true', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_force_peace',
      factionA: 'faction-alpha',
      factionB: 'faction-beta',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_peace_forced');
    expect((trace as any).success).toBe(true);
  });

  it('emits faction_peace_forced with success=false when faction missing', () => {
    const state = buildState();
    const reaction = makeReaction([{
      kind: 'faction_force_peace',
      factionA: 'faction-alpha',
      factionB: 'ghost-faction',
    }]);
    apply(state, reaction, runtime);
    const trace = getTraces().find(t => t.category === 'faction_peace_forced');
    expect((trace as any).success).toBe(false);
  });
});

// ─── Fail-soft: tick loop never crashes ─────────────────────────────────────

describe('fail-soft: no handler throws', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { runtime = createSimulationRuntime(); });

  it('does not throw when all faction nodes are missing', () => {
    const state = buildState();
    const reactions: EncounterAftermathReaction[] = [
      makeReaction([{ kind: 'faction_splinter', sourceFactionId: 'x', newFactionName: 'Y', memberSelection: { kind: 'explicit_ids', agentIds: [] } }]),
      makeReaction([{ kind: 'faction_absorb', absorbingFactionId: 'x', absorbedFactionId: 'y' }]),
      makeReaction([{ kind: 'faction_dissolve', factionId: 'x' }]),
      makeReaction([{ kind: 'faction_declare_war', factionA: 'x', factionB: 'y' }]),
      makeReaction([{ kind: 'faction_force_peace', factionA: 'x', factionB: 'y' }]),
    ];
    for (const reaction of reactions) {
      expect(() => apply(state, reaction, runtime)).not.toThrow();
    }
  });

  it('does not throw for spawn_artifact with missing target actor', () => {
    const state = buildState();
    const reaction = makeReaction([{ kind: 'spawn_artifact', tier: 'common', category: 'mundane', targetAgentId: 'ghost' }]);
    expect(() => apply(state, reaction, runtime)).not.toThrow();
  });
});
