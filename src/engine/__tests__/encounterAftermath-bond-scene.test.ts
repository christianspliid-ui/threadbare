/**
 * THR-695 (Scene Integration, Slice B): aftermath scene-targeting sentinels
 * ($target / $cast: / role:) + the bond_change effect.
 *
 * Covers:
 *  - bindAftermathSceneTargets: $target kind-matching, $cast:/role: binding, fail-soft
 *  - role: effects on the example-file pattern provably land on the bound cast member
 *  - bond_change: create/update relates_to edge, clamp, reciprocal, non-agent no-op
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyEncounterAftermathReaction,
  bindAftermathSceneTargets,
} from '../encounterAftermath';
import { getAgentBonds } from '../graphQueries';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';
import type { EncounterSupportBinding } from '../../types/encounter';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual', reputationScore: 0.5 } });
  graph.addNode({ id: 'actor-victim', type: 'actor', name: 'Victim', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-captain', type: 'actor', name: 'Captain', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'faction-guild', type: 'actor', name: 'Guild', properties: { actorType: 'faction' } });
  graph.addNode({ id: 'loc-town', type: 'location', name: 'Town', properties: { hexCol: 1, hexRow: 1 } });
  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
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
  } as unknown as GameState;
}

function makeBinding(key: string, nodeId: string, kind: 'actor' | 'location' = 'actor'): EncounterSupportBinding {
  return { key, nodeId, kind, delivery: 'pre-seeded', persistence: 'ephemeral', reused: true } as unknown as EncounterSupportBinding;
}

function makeAction(opts?: {
  actorId?: string;
  targetId?: string;
  bindings?: readonly EncounterSupportBinding[];
}): UnifiedAction {
  const actorId = opts?.actorId ?? 'actor-hero';
  return {
    actionId: 'ua_test', actorId, templateId: 'enc.test',
    targetId: opts?.targetId ?? actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    supportBindings: opts?.bindings,
  } as unknown as UnifiedAction;
}

// ─── bindAftermathSceneTargets (pure) ──────────────────────────────────────────

describe('bindAftermathSceneTargets — $target kind matching', () => {
  it('$target on targetAgentId binds to an agent target', () => {
    const graph = buildState().graph;
    const effect = { kind: 'hidden_mark', targetAgentId: '$target', category: 'betrayal', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect;
    const bound = bindAftermathSceneTargets(effect, makeAction({ targetId: 'actor-victim' }), graph) as { targetAgentId: string };
    expect(bound.targetAgentId).toBe('actor-victim');
  });

  it('$target on targetFactionId does NOT bind when the target is an agent (kind mismatch → sentinel stays)', () => {
    const graph = buildState().graph;
    const effect = { kind: 'reputation_score', targetFactionId: '$target', delta: -0.1 } as unknown as EncounterAftermathReactionEffect;
    const bound = bindAftermathSceneTargets(effect, makeAction({ targetId: 'actor-victim' }), graph) as { targetFactionId: string };
    expect(bound.targetFactionId).toBe('$target');
  });

  it('$target on targetFactionId binds when the target is a faction', () => {
    const graph = buildState().graph;
    const effect = { kind: 'reputation_score', targetFactionId: '$target', delta: -0.1 } as unknown as EncounterAftermathReactionEffect;
    const bound = bindAftermathSceneTargets(effect, makeAction({ targetId: 'faction-guild' }), graph) as { targetFactionId: string };
    expect(bound.targetFactionId).toBe('faction-guild');
  });

  it('$target leaves the sentinel when the action has no resolvable target', () => {
    const graph = buildState().graph;
    const effect = { kind: 'hidden_mark', targetAgentId: '$target', category: 'x', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect;
    const bound = bindAftermathSceneTargets(effect, makeAction({ targetId: '' }), graph) as { targetAgentId: string };
    expect(bound.targetAgentId).toBe('$target');
  });
});

describe('bindAftermathSceneTargets — $cast: / role: binding', () => {
  it('$cast:<key> binds via support bindings', () => {
    const graph = buildState().graph;
    const effect = { kind: 'hidden_mark', targetAgentId: '$cast:victim', category: 'x', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect;
    const action = makeAction({ bindings: [makeBinding('victim', 'actor-victim')] });
    const bound = bindAftermathSceneTargets(effect, action, graph) as { targetAgentId: string };
    expect(bound.targetAgentId).toBe('actor-victim');
  });

  it('role:<key> legacy alias binds identically to $cast:', () => {
    const graph = buildState().graph;
    const effect = { kind: 'reputation_score', targetFactionId: 'role:guild', delta: -0.05 } as unknown as EncounterAftermathReactionEffect;
    const action = makeAction({ bindings: [makeBinding('guild', 'faction-guild')] });
    const bound = bindAftermathSceneTargets(effect, action, graph) as { targetFactionId: string };
    expect(bound.targetFactionId).toBe('faction-guild');
  });

  it('unresolvable $cast: leaves the sentinel in place', () => {
    const graph = buildState().graph;
    const effect = { kind: 'hidden_mark', targetAgentId: '$cast:nobody', category: 'x', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect;
    const action = makeAction({ bindings: [makeBinding('victim', 'actor-victim')] });
    const bound = bindAftermathSceneTargets(effect, action, graph) as { targetAgentId: string };
    expect(bound.targetAgentId).toBe('$cast:nobody');
  });

  it('literal ids and non-sentinel values pass through untouched', () => {
    const graph = buildState().graph;
    const effect = { kind: 'hidden_mark', targetAgentId: 'actor-victim', category: 'x', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect;
    const bound = bindAftermathSceneTargets(effect, makeAction(), graph);
    expect(bound).toBe(effect); // same reference — nothing rebound
  });

  it('emits aftermath_sentinel_bound traces (bound and unbound)', () => {
    clearTraces(); enableTracing();
    const graph = buildState().graph;
    const effect = { kind: 'hidden_mark', targetAgentId: '$cast:nobody', category: 'x', severity: 0.5, label: 'x' } as unknown as EncounterAftermathReactionEffect;
    bindAftermathSceneTargets(effect, makeAction(), graph, {
      tick: 10, actionId: 'ua_test', actorAgentId: 'actor-hero', encounterId: 'enc.test', reactionId: 'rx', effectIndex: 0,
    });
    const bound = getTraces().find(t => t.category === 'aftermath_sentinel_bound');
    expect(bound).toBeDefined();
    expect((bound as { resolvedNodeId?: string | null }).resolvedNodeId).toBeNull();
    disableTracing(); clearTraces();
  });
});

// ─── role: effects provably land (example-file pattern) ────────────────────────

describe('role: aftermath effects land on the bound cast member', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('hidden_mark with targetAgentId role:victim marks the bound victim, not the actor', () => {
    const state = buildState();
    const action = makeAction({ bindings: [makeBinding('victim', 'actor-victim')] });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.betrayal', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'hidden_mark', targetAgentId: 'role:victim', category: 'betrayal', severity: 0.7, label: 'betrayed' } as unknown as EncounterAftermathReactionEffect],
    };
    const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    expect(next.hiddenMarks?.some(m => m.targetAgentId === 'actor-victim')).toBe(true);
    expect(next.hiddenMarks?.some(m => m.targetAgentId === 'actor-hero')).toBe(false);
  });

  it('reputation_score with targetFactionId role:guild mutates the bound faction', () => {
    const state = buildState();
    const action = makeAction({ bindings: [makeBinding('guild', 'faction-guild')] });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.rep', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_score', targetFactionId: 'role:guild', delta: -0.05 } as unknown as EncounterAftermathReactionEffect],
    };
    const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    const rep = next.graph.getNode('faction-guild')?.properties?.reputationScore as number | undefined;
    expect(rep).toBeCloseTo(0.5 - 0.05); // DEFAULT_FACTION_REPUTATION − 0.05
  });
});

// ─── bond_change ────────────────────────────────────────────────────────────────

describe('bond_change effect', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  function bondReaction(effect: Partial<EncounterAftermathReactionEffect>): EncounterAftermathReaction {
    return { id: 'rx.bond', label: 'test', closeAfterSelection: true, effects: [effect as EncounterAftermathReactionEffect] };
  }

  it('creates a relates_to edge with clamped sentiment when none exists, and mirrors reciprocally', () => {
    const state = buildState();
    const action = makeAction();
    const { state: next } = applyEncounterAftermathReaction(
      state, action,
      bondReaction({ kind: 'bond_change', withAgentId: 'actor-victim', sentimentDelta: 0.4, trustDelta: 0.3 } as EncounterAftermathReactionEffect),
      10, runtime,
    );
    const forward = getAgentBonds(next.graph, 'actor-hero').find(b => b.agent.id === 'actor-victim');
    expect(forward?.sentiment).toBeCloseTo(0.4);
    expect(forward?.trust).toBeCloseTo(0.3);
    // reciprocal (default true) mirrors onto the reverse edge
    const reverse = getAgentBonds(next.graph, 'actor-victim').find(b => b.agent.id === 'actor-hero');
    expect(reverse?.sentiment).toBeCloseTo(0.4);
  });

  it('updates an existing edge and clamps sentiment to [-1, 1]', () => {
    const state = buildState();
    state.graph.addEdge({ id: 'edge_rel_pre', source: 'actor-hero', target: 'actor-victim', type: 'relates_to', properties: { sentiment: 0.8, trust: 0.5 } });
    const { state: next } = applyEncounterAftermathReaction(
      state, makeAction(),
      bondReaction({ kind: 'bond_change', withAgentId: 'actor-victim', sentimentDelta: 0.5, reciprocal: false } as EncounterAftermathReactionEffect),
      10, runtime,
    );
    const forward = getAgentBonds(next.graph, 'actor-hero').find(b => b.agent.id === 'actor-victim');
    expect(forward?.sentiment).toBe(1); // 0.8 + 0.5 clamped to 1
  });

  it('trustDelta clamps to [0, 1]', () => {
    const state = buildState();
    state.graph.addEdge({ id: 'edge_rel_pre2', source: 'actor-hero', target: 'actor-victim', type: 'relates_to', properties: { sentiment: 0, trust: 0.9 } });
    const { state: next } = applyEncounterAftermathReaction(
      state, makeAction(),
      bondReaction({ kind: 'bond_change', withAgentId: 'actor-victim', sentimentDelta: -0.2, trustDelta: 0.5, reciprocal: false } as EncounterAftermathReactionEffect),
      10, runtime,
    );
    const forward = getAgentBonds(next.graph, 'actor-hero').find(b => b.agent.id === 'actor-victim');
    expect(forward?.trust).toBe(1); // 0.9 + 0.5 clamped to 1
  });

  it('reciprocal:false leaves the reverse edge absent', () => {
    const state = buildState();
    const { state: next } = applyEncounterAftermathReaction(
      state, makeAction(),
      bondReaction({ kind: 'bond_change', withAgentId: 'actor-victim', sentimentDelta: 0.3, reciprocal: false } as EncounterAftermathReactionEffect),
      10, runtime,
    );
    expect(getAgentBonds(next.graph, 'actor-victim').find(b => b.agent.id === 'actor-hero')).toBeUndefined();
  });

  it('non-agent withAgentId no-ops (success=false), creates no edge', () => {
    const state = buildState();
    applyEncounterAftermathReaction(
      state, makeAction(),
      bondReaction({ kind: 'bond_change', withAgentId: 'loc-town', sentimentDelta: 0.3 } as EncounterAftermathReactionEffect),
      10, runtime,
    );
    expect(state.graph.getOutgoingEdges('actor-hero', 'relates_to')).toHaveLength(0);
    const fail = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect' &&
      (t as { effectKind?: string }).effectKind === 'bond_change',
    );
    expect((fail as { success?: boolean })?.success).toBe(false);
    expect((fail as { failReason?: string })?.failReason).toBe('non_agent_target');
  });

  it('$target withAgentId binds to the encounter target agent', () => {
    const state = buildState();
    const action = makeAction({ targetId: 'actor-captain' });
    const { state: next } = applyEncounterAftermathReaction(
      state, action,
      bondReaction({ kind: 'bond_change', withAgentId: '$target', sentimentDelta: 0.25, reciprocal: false } as EncounterAftermathReactionEffect),
      10, runtime,
    );
    const forward = getAgentBonds(next.graph, 'actor-hero').find(b => b.agent.id === 'actor-captain');
    expect(forward?.sentiment).toBeCloseTo(0.25);
  });

  it('emits bond_change_applied trace with before/after and created flag', () => {
    const state = buildState();
    applyEncounterAftermathReaction(
      state, makeAction(),
      bondReaction({ kind: 'bond_change', withAgentId: 'actor-victim', sentimentDelta: 0.4, reciprocal: false } as EncounterAftermathReactionEffect),
      10, runtime,
    );
    const trace = getTraces().find(t => t.category === 'bond_change_applied');
    expect(trace).toBeDefined();
    if (trace && trace.category === 'bond_change_applied') {
      expect(trace.created).toBe(true);
      expect(trace.sentimentBefore).toBeCloseTo(0);
      expect(trace.sentimentAfter).toBeCloseTo(0.4);
    }
  });

  it('touchedWorld=true after a bond_change mutation', () => {
    const state = buildState();
    const { mutationSummary } = applyEncounterAftermathReaction(
      state, makeAction(),
      bondReaction({ kind: 'bond_change', withAgentId: 'actor-victim', sentimentDelta: 0.1 } as EncounterAftermathReactionEffect),
      10, runtime,
    );
    expect(mutationSummary.touchedWorld).toBe(true);
  });
});

// ─── Slice F content integration (THR-699) ────────────────────────────────────
// The authored reactions in the swept content files reach applyBondEdge through
// the real pipeline: template reaction → $target bind pass → relates_to edge.

describe('Slice F content — authored bond_change reactions land on the graph', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { runtime = createSimulationRuntime(); });

  function findReaction(templateId: string, reactionId: string): EncounterAftermathReaction {
    const template = getUnifiedTemplateById(templateId);
    expect(template, templateId).toBeDefined();
    const reaction = template!.aftermathConfig?.fallback?.reactions
      ?.find((r: EncounterAftermathReaction) => r.id === reactionId);
    expect(reaction, `${templateId}/${reactionId}`).toBeDefined();
    return reaction!;
  }

  it('social.forge_alliance ally reaction creates the alliance relates_to edge it narrates', () => {
    const state = buildState();
    const action = makeAction({ targetId: 'actor-victim' });
    const reaction = findReaction('social.forge_alliance', 'forge_alliance_seed_ally');

    expect(getAgentBonds(state.graph, 'actor-hero')).toHaveLength(0);
    const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

    const bonds = getAgentBonds(next.graph, 'actor-hero');
    expect(bonds).toHaveLength(1);
    expect(bonds[0].agent.id).toBe('actor-victim');
    expect(bonds[0].sentiment).toBeGreaterThan(0);
    // The follow-up seed carries the scene (same ally returns).
    const seedEffect = reaction.effects.find(e => e.kind === 'encounter_seed') as { inheritContext?: boolean };
    expect(seedEffect?.inheritContext).toBe(true);
  });

  it('social.deceive exposed reaction drops sentiment through the betrayal delta', () => {
    const state = buildState();
    const action = makeAction({ targetId: 'actor-victim' });
    const reaction = findReaction('social.deceive', 'deceive_mark_exposed');

    const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

    const bonds = getAgentBonds(next.graph, 'actor-hero');
    expect(bonds).toHaveLength(1);
    expect(bonds[0].sentiment).toBeLessThan(0);
  });

  it('tavern.brawl rematch reaction bonds and inherits scene context', () => {
    const state = buildState();
    const action = makeAction({ targetId: 'actor-victim' });
    const reaction = findReaction('tavern.brawl', 'brawl_rematch_seed');

    const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

    expect(getAgentBonds(next.graph, 'actor-hero')).toHaveLength(1);
    const seedEffect = reaction.effects.find(e => e.kind === 'encounter_seed') as { inheritContext?: boolean };
    expect(seedEffect?.inheritContext).toBe(true);
  });

  it('a location-targeted action leaves authored bond_change a no-op (kind mismatch fail-soft)', () => {
    const state = buildState();
    const action = makeAction({ targetId: 'loc-town' });
    const reaction = findReaction('social.forge_alliance', 'forge_alliance_seed_ally');

    const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    expect(getAgentBonds(next.graph, 'actor-hero')).toHaveLength(0);
  });
});
