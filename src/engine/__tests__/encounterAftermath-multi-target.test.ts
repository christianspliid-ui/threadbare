/**
 * THR-114: Multi-target aftermath effects.
 * Tests: resolveAftermathTarget, non-actor targets, faction reputation,
 * apply_condition, remove_condition, witness fan-out, fail-soft cases.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyEncounterAftermathReaction,
  resolveAftermathTarget,
  DEFAULT_FACTION_REPUTATION,
  CONDITION_DEFAULT_INTENSITY,
} from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

function buildState(opts?: { withConditionTrait?: boolean; withSublocation?: boolean }): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual', reputationScore: 0.5 } });
  graph.addNode({ id: 'actor-victim', type: 'actor', name: 'Victim', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'faction-guild', type: 'actor', name: 'Guild', properties: { actorType: 'faction' } });
  if (opts?.withConditionTrait) {
    graph.addNode({ id: 'trait.condition.grieving', type: 'trait', name: 'Grieving', properties: {} });
    graph.addNode({ id: 'trait.condition.consecrated', type: 'trait', name: 'Consecrated', properties: {} });
  }
  if (opts?.withSublocation) {
    graph.addNode({ id: 'subloc-shrine', type: 'sublocation', name: 'Shrine', properties: {} });
  }
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

// ─── resolveAftermathTarget unit tests ────────────────────────────────────────

describe('resolveAftermathTarget', () => {
  it('returns agent target when targetAgentId set', () => {
    const result = resolveAftermathTarget({ kind: 'reputation_score', delta: 0.1, targetAgentId: 'actor-victim' } as never, makeAction());
    expect(result).toEqual({ kind: 'agent', id: 'actor-victim' });
  });

  it('returns faction target when targetFactionId set', () => {
    const result = resolveAftermathTarget({ kind: 'reputation_score', delta: 0.1, targetFactionId: 'faction-guild' } as never, makeAction());
    expect(result).toEqual({ kind: 'faction', id: 'faction-guild' });
  });

  it('returns sublocation target when targetSublocationId set', () => {
    const result = resolveAftermathTarget({ kind: 'apply_condition', conditionTraitId: 'x', targetSublocationId: 'subloc-shrine' } as never, makeAction());
    expect(result).toEqual({ kind: 'sublocation', id: 'subloc-shrine' });
  });

  it('agent > faction when both set (priority ordering)', () => {
    const result = resolveAftermathTarget({ kind: 'reputation_score', delta: 0, targetAgentId: 'actor-victim', targetFactionId: 'faction-guild' } as never, makeAction());
    expect(result).toEqual({ kind: 'agent', id: 'actor-victim' });
  });

  it('falls back to action.actorId when no explicit target', () => {
    const result = resolveAftermathTarget({ kind: 'reputation_score', delta: 0.1 } as never, makeAction('actor-hero'));
    expect(result).toEqual({ kind: 'agent', id: 'actor-hero' });
  });

  it('returns actor_fallback when no action and no explicit target', () => {
    const result = resolveAftermathTarget({ kind: 'recent_event', message: 'x', significance: 0.5 } as never, undefined);
    expect(result).toEqual({ kind: 'actor_fallback' });
  });
});

// ─── Faction reputation targeting ─────────────────────────────────────────────

describe('reputation_score on faction target', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('initializes faction reputationScore from DEFAULT_FACTION_REPUTATION when absent', () => {
    const state = buildState();
    const action = makeAction();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.test', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_score', targetFactionId: 'faction-guild', delta: 0.1 }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    const faction = next.graph.getNode('faction-guild');
    expect(faction?.properties?.reputationScore).toBeCloseTo(DEFAULT_FACTION_REPUTATION + 0.1);
  });

  it('emits faction_reputation_changed trace for faction target', () => {
    const state = buildState();
    const action = makeAction();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.faction', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_score', targetFactionId: 'faction-guild', delta: -0.05 }],
    };
    applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    const factionTraces = getTraces().filter(t => t.category === 'faction_reputation_changed');
    expect(factionTraces).toHaveLength(1);
    if (factionTraces[0].category === 'faction_reputation_changed') {
      expect(factionTraces[0].factionId).toBe('faction-guild');
      expect(factionTraces[0].delta).toBeCloseTo(-0.05);
    }
  });

  it('reputation_score on non-actor target emits target-resolution trace', () => {
    const state = buildState();
    const action = makeAction();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.victim', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_score', targetAgentId: 'actor-victim', delta: 0.05 }],
    };
    applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    const resolvedTraces = getTraces().filter(t => t.category === 'aftermath_target_resolved');
    expect(resolvedTraces.length).toBeGreaterThan(0);
    const repTrace = resolvedTraces.find(t =>
      t.category === 'aftermath_target_resolved' && t.effectKind === 'reputation_score'
    );
    expect(repTrace).toBeDefined();
    if (repTrace?.category === 'aftermath_target_resolved') {
      expect(repTrace.effectiveTargetId).toBe('actor-victim');
      expect(repTrace.effectiveTargetKind).toBe('agent');
    }
  });
});

// ─── reputation_set ────────────────────────────────────────────────────────────

describe('reputation_set', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('sets agent reputationScore absolutely, clamped to [0,1]', () => {
    const state = buildState();
    const action = makeAction();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.set', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_set', value: 0.1 }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    expect(next.graph.getNode('actor-hero')?.properties?.reputationScore).toBeCloseTo(0.1);
  });

  it('clamps value > 1 to 1.0', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.clamp', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_set', value: 1.5 }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    expect(next.graph.getNode('actor-hero')?.properties?.reputationScore).toBe(1);
  });

  it('emits reputation_set_applied trace', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.set2', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_set', targetFactionId: 'faction-guild', value: 0.2 }],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const setTraces = getTraces().filter(t => t.category === 'reputation_set_applied');
    expect(setTraces).toHaveLength(1);
    if (setTraces[0].category === 'reputation_set_applied') {
      expect(setTraces[0].targetId).toBe('faction-guild');
      expect(setTraces[0].value).toBeCloseTo(0.2);
    }
  });

  it('reputation_set on sublocation fails with target_kind_not_supported', () => {
    const state = buildState({ withSublocation: true });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.subloc', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_set', targetSublocationId: 'subloc-shrine', value: 0.5 } as never],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const failTrace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect' &&
      t.category === 'encounter_aftermath_effect' &&
      (t as { effectKind?: string }).effectKind === 'reputation_set' &&
      (t as { success?: boolean }).success === false
    );
    expect(failTrace).toBeDefined();
  });
});

// ─── apply_condition ───────────────────────────────────────────────────────────

describe('apply_condition', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('adds has_trait edge to target agent node', () => {
    const state = buildState({ withConditionTrait: true });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.cond', label: 'test', closeAfterSelection: true,
      effects: [{
        kind: 'apply_condition',
        targetAgentId: 'actor-victim',
        conditionTraitId: 'trait.condition.grieving',
        durationTicks: 200,
        intensity: 0.6,
      }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const edges = next.graph.getOutgoingEdges('actor-victim', 'has_trait');
    expect(edges.length).toBe(1);
    expect(edges[0].target).toBe('trait.condition.grieving');
    expect(edges[0].properties?.intensity).toBe(0.6);
    expect(edges[0].properties?.durationTicks).toBe(200);
    expect(edges[0].properties?.appliedAt).toBe(10);
  });

  it('uses default intensity when omitted', () => {
    const state = buildState({ withConditionTrait: true });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.cond2', label: 'test', closeAfterSelection: true,
      effects: [{
        kind: 'apply_condition',
        conditionTraitId: 'trait.condition.grieving',
      }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const edges = next.graph.getOutgoingEdges('actor-hero', 'has_trait');
    expect(edges[0]?.properties?.intensity).toBe(CONDITION_DEFAULT_INTENSITY);
  });

  it('emits condition_applied trace', () => {
    const state = buildState({ withConditionTrait: true });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.cond3', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'apply_condition', conditionTraitId: 'trait.condition.grieving', intensity: 0.8 }],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const condTraces = getTraces().filter(t => t.category === 'condition_applied');
    expect(condTraces).toHaveLength(1);
    if (condTraces[0].category === 'condition_applied') {
      expect(condTraces[0].conditionTraitId).toBe('trait.condition.grieving');
      expect(condTraces[0].intensity).toBe(0.8);
    }
  });

  it('apply_condition on sublocation node adds edge to sublocation', () => {
    const state = buildState({ withConditionTrait: true, withSublocation: true });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.subloc_cond', label: 'test', closeAfterSelection: true,
      effects: [{
        kind: 'apply_condition',
        targetSublocationId: 'subloc-shrine',
        conditionTraitId: 'trait.condition.consecrated',
        durationTicks: 1000,
        intensity: 0.8,
      }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const edges = next.graph.getOutgoingEdges('subloc-shrine', 'has_trait');
    expect(edges.length).toBe(1);
    expect(edges[0].target).toBe('trait.condition.consecrated');
  });

  it('fails gracefully when condition trait node missing', () => {
    const state = buildState(); // no traits added
    const reaction: EncounterAftermathReaction = {
      id: 'rx.missing', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'apply_condition', conditionTraitId: 'trait.condition.nonexistent' }],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const effectTrace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect' &&
      (t as { effectKind?: string }).effectKind === 'apply_condition'
    );
    expect(effectTrace).toBeDefined();
    expect((effectTrace as { success?: boolean })?.success).toBe(false);
  });

  it('mutationSummary.touchedStructure is true after apply_condition', () => {
    const state = buildState({ withConditionTrait: true });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.struct', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'apply_condition', conditionTraitId: 'trait.condition.grieving' }],
    };
    const { mutationSummary } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    expect(mutationSummary.touchedStructure).toBe(true);
    expect(mutationSummary.touchedWorld).toBe(false);
  });
});

// ─── remove_condition ─────────────────────────────────────────────────────────

describe('remove_condition', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('removes a has_trait edge matching the conditionTraitId', () => {
    const state = buildState({ withConditionTrait: true });
    // Pre-add the edge we want to remove
    state.graph.addEdge({
      id: 'edge-grief-1', source: 'actor-hero', target: 'trait.condition.grieving',
      type: 'has_trait', properties: { appliedAt: 5, durationTicks: 100, intensity: 0.5 },
    });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.remove', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.grieving' }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const remaining = next.graph.getOutgoingEdges('actor-hero', 'has_trait');
    expect(remaining.filter(e => e.target === 'trait.condition.grieving')).toHaveLength(0);
  });

  it('removeAll removes all matching edges', () => {
    const state = buildState({ withConditionTrait: true });
    state.graph.addEdge({ id: 'eg1', source: 'actor-hero', target: 'trait.condition.grieving', type: 'has_trait', properties: { appliedAt: 1, intensity: 0.5 } });
    state.graph.addEdge({ id: 'eg2', source: 'actor-hero', target: 'trait.condition.grieving', type: 'has_trait', properties: { appliedAt: 2, intensity: 0.7 } });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.removeall', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.grieving', removeAll: true }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    expect(next.graph.getOutgoingEdges('actor-hero', 'has_trait').filter(e => e.target === 'trait.condition.grieving')).toHaveLength(0);
  });

  it('succeeds gracefully when no matching edge exists (removedCount=0)', () => {
    const state = buildState({ withConditionTrait: true });
    const reaction: EncounterAftermathReaction = {
      id: 'rx.noop', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.grieving' }],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const remTrace = getTraces().find(t => t.category === 'condition_removed');
    expect(remTrace).toBeDefined();
    if (remTrace?.category === 'condition_removed') {
      expect(remTrace.removedCount).toBe(0);
    }
    // Should still emit success=true on the effect trace
    const effectTrace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect' &&
      (t as { effectKind?: string }).effectKind === 'remove_condition'
    );
    expect((effectTrace as { success?: boolean })?.success).toBe(true);
  });
});

// ─── Witness fan-out ───────────────────────────────────────────────────────────

describe('recent_event witness fan-out', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('stores witnessAgentIds on the TickEvent', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.witness', label: 'test', closeAfterSelection: true,
      effects: [{
        kind: 'recent_event',
        message: 'All witnessed this.',
        significance: 0.7,
        witnessAgentIds: ['actor-victim', 'actor-hero'],
      }],
    };
    const { state: next } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const event = next.recentEvents.at(-1);
    expect(event?.witnessAgentIds).toContain('actor-victim');
    expect(event?.witnessAgentIds).toContain('actor-hero');
  });

  it('emits encounter_aftermath_effect with witnessCount in effectDetail', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.wc', label: 'test', closeAfterSelection: true,
      effects: [{
        kind: 'recent_event',
        message: 'Seen by many.',
        significance: 0.5,
        witnessAgentIds: ['a', 'b', 'c'],
      }],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const effectTrace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect' &&
      (t as { effectKind?: string }).effectKind === 'recent_event'
    );
    expect(effectTrace).toBeDefined();
    expect((effectTrace as { effectDetail?: { witnessCount?: number } })?.effectDetail?.witnessCount).toBe(3);
  });
});

// ─── hidden_mark fail-soft ─────────────────────────────────────────────────────

describe('hidden_mark fail-soft on unsupported target kinds', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('emits success=false when hidden_mark targets a faction', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.hm_faction', label: 'test', closeAfterSelection: true,
      effects: [{
        kind: 'hidden_mark',
        targetFactionId: 'faction-guild',
        category: 'suspicion',
        severity: 0.5,
        label: 'Guild suspicious',
        revealFamilies: ['investigation'],
      } as never],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const effectTrace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect' &&
      (t as { effectKind?: string }).effectKind === 'hidden_mark'
    );
    expect((effectTrace as { success?: boolean })?.success).toBe(false);
    expect((effectTrace as { failReason?: string })?.failReason).toBe('target_kind_not_supported');
  });
});

// ─── multiple_targets_specified warning ───────────────────────────────────────

describe('multiple_targets_specified warning', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('emits aftermath_target_invalid warning and uses agent (priority) when both targetAgentId and targetFactionId set', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.ambiguous', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_score', targetAgentId: 'actor-victim', targetFactionId: 'faction-guild', delta: 0.1 } as never],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const warnTrace = getTraces().find(t =>
      t.category === 'aftermath_target_invalid' &&
      (t as { reason?: string }).reason === 'multiple_targets_specified'
    );
    expect(warnTrace).toBeDefined();
    // Priority: agent wins — victim should be mutated, not faction
    const victimRep = state.graph.getNode('actor-victim')?.properties?.reputationScore;
    expect(victimRep).toBeDefined();
  });
});

// ─── intelligence faction rejection ───────────────────────────────────────────

describe('intelligence faction rejection', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('emits success=false with target_kind_not_supported when intelligence targets a faction', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.intel_faction', label: 'test', closeAfterSelection: true,
      effects: [{
        kind: 'intelligence',
        targetFactionId: 'faction-guild',
        category: 'political_secret',
        label: 'Guild plans',
        detail: 'They plan to betray the council.',
      } as never],
    };
    applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    const effectTrace = getTraces().find(t =>
      t.category === 'encounter_aftermath_effect' &&
      (t as { effectKind?: string }).effectKind === 'intelligence'
    );
    expect((effectTrace as { success?: boolean })?.success).toBe(false);
    expect((effectTrace as { failReason?: string })?.failReason).toBe('target_kind_not_supported');
  });
});

// ─── reputation_tally faction path ────────────────────────────────────────────

describe('reputation_tally faction target', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('mutates faction node reputationTallies and emits faction_reputation_changed', () => {
    const state = buildState();
    const action = makeAction();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.tally_faction', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_tally', targetFactionId: 'faction-guild', key: 'goodwill', delta: 2 }],
    };
    applyEncounterAftermathReaction(state, action, reaction, 10, runtime);
    const faction = state.graph.getNode('faction-guild');
    const tallies = faction?.properties?.reputationTallies as Record<string, number> | undefined;
    expect(tallies?.goodwill).toBe(2);
    const factionTrace = getTraces().find(t => t.category === 'faction_reputation_changed');
    expect(factionTrace).toBeDefined();
    if (factionTrace?.category === 'faction_reputation_changed') {
      expect(factionTrace.factionId).toBe('faction-guild');
      expect(factionTrace.kind).toBe('reputation_tally');
    }
  });
});

// ─── mutationSummary contract ─────────────────────────────────────────────────

describe('mutationSummary contract', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('touchedWorld=true and touchedStructure=false for reputation_score only', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.world', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'reputation_score', delta: 0.1 }],
    };
    const { mutationSummary } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    expect(mutationSummary.touchedWorld).toBe(true);
    expect(mutationSummary.touchedStructure).toBe(false);
  });

  it('neither flag set for recent_event only', () => {
    const state = buildState();
    const reaction: EncounterAftermathReaction = {
      id: 'rx.noflags', label: 'test', closeAfterSelection: true,
      effects: [{ kind: 'recent_event', message: 'x', significance: 0.3 }],
    };
    const { mutationSummary } = applyEncounterAftermathReaction(state, makeAction(), reaction, 10, runtime);
    expect(mutationSummary.touchedWorld).toBe(false);
    expect(mutationSummary.touchedStructure).toBe(false);
  });
});
