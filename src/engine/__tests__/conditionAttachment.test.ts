/**
 * THR-117: condition_attachment aftermath effect kind.
 * Tests: fail-soft cases, wound promotion signal, stack application, duration defaults.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyEncounterAftermathReaction,
  CONDITION_DEFAULT_INTENSITY,
} from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT } from '../../data/attachment-slot-constants';
import { CONDITION_WOUNDED_DURATION } from '../../data/condition-trait-content';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildState(opts?: { withWoundTrait?: boolean; withOtherTrait?: boolean }): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'actor-npc', type: 'actor', name: 'NPC', properties: { actorType: 'individual' } });
  if (opts?.withWoundTrait) {
    graph.addNode({
      id: 'trait.condition.wounded',
      type: 'trait',
      name: 'Wounded',
      properties: { subcategory: 'condition', tags: ['#condition', '#combat', '#negative'] },
    });
  }
  if (opts?.withOtherTrait) {
    graph.addNode({
      id: 'trait.condition.inspired',
      type: 'trait',
      name: 'Inspired',
      properties: { subcategory: 'condition', tags: ['#condition', '#positive'] },
    });
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

function makeAction(actorId = 'actor-hero'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId: 'enc.test', targetId: actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  };
}

function makeReaction(effectOverrides: Partial<{
  templateId: string;
  targetAgentId: string;
  durationOverride: number;
  stackCount: number;
}>): EncounterAftermathReaction {
  return {
    id: 'react-test',
    label: 'Test Reaction',
    effects: [{
      kind: 'condition_attachment',
      templateId: effectOverrides.templateId ?? 'trait.condition.wounded',
      ...(effectOverrides.targetAgentId ? { targetAgentId: effectOverrides.targetAgentId } : {}),
      ...(effectOverrides.durationOverride !== undefined ? { durationOverride: effectOverrides.durationOverride } : {}),
      ...(effectOverrides.stackCount !== undefined ? { stackCount: effectOverrides.stackCount } : {}),
    }],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('condition_attachment aftermath effect', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  describe('fail-soft: template missing', () => {
    it('skips the effect and emits failure trace when templateId is not in graph', () => {
      const state = buildState(); // wound trait NOT added
      const action = makeAction();
      const reaction = makeReaction({ templateId: 'trait.condition.wounded' });

      const { state: next, mutationSummary } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      expect(mutationSummary.woundApplied).toBe(false);
      expect(mutationSummary.touchedStructure).toBe(false);
      // No has_trait edge added
      expect(next.graph.getOutgoingEdges('actor-hero', 'has_trait')).toHaveLength(0);
      // Failure trace emitted
      const traces = getTraces();
      const failTrace = traces.find(t => t.category === 'encounter_aftermath_effect' && (t as { success?: boolean }).success === false);
      expect(failTrace).toBeDefined();
      expect((failTrace as { failReason?: string }).failReason).toBe('template_missing');
    });
  });

  describe('fail-soft: target missing', () => {
    it('skips the effect when targetAgentId does not exist in graph', () => {
      const state = buildState({ withWoundTrait: true });
      const action = makeAction();
      const reaction = makeReaction({ templateId: 'trait.condition.wounded', targetAgentId: 'actor-ghost' });

      const { state: next, mutationSummary } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      expect(mutationSummary.touchedStructure).toBe(false);
      expect(next.graph.getOutgoingEdges('actor-hero', 'has_trait')).toHaveLength(0);
    });
  });

  describe('fail-soft: no actor id', () => {
    it('skips when neither targetAgentId nor action.actorId is available', () => {
      const state = buildState({ withWoundTrait: true });
      const reaction = makeReaction({});

      const { mutationSummary } = applyEncounterAftermathReaction(state, undefined, reaction, 10, runtime);

      expect(mutationSummary.woundApplied).toBe(false);
      expect(mutationSummary.touchedStructure).toBe(false);
    });
  });

  describe('woundApplied signal', () => {
    it('sets woundApplied when wound template targets actor', () => {
      const state = buildState({ withWoundTrait: true });
      const action = makeAction('actor-hero');
      const reaction = makeReaction({ templateId: 'trait.condition.wounded' });

      const { mutationSummary } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      expect(mutationSummary.woundApplied).toBe(true);
    });

    it('does NOT set woundApplied when wound template targets non-actor', () => {
      const state = buildState({ withWoundTrait: true });
      const action = makeAction('actor-hero');
      const reaction = makeReaction({ templateId: 'trait.condition.wounded', targetAgentId: 'actor-npc' });

      const { mutationSummary } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      expect(mutationSummary.woundApplied).toBe(false);
      // But the condition IS applied to the npc
      expect(state.graph.getOutgoingEdges('actor-npc', 'has_trait')).toHaveLength(1);
    });

    it('does NOT set woundApplied for non-wound condition templates', () => {
      const state = buildState({ withOtherTrait: true });
      const action = makeAction('actor-hero');
      const reaction = makeReaction({ templateId: 'trait.condition.inspired' });

      const { mutationSummary } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      expect(mutationSummary.woundApplied).toBe(false);
      expect(mutationSummary.touchedStructure).toBe(true);
    });
  });

  describe('has_trait edge creation', () => {
    it('applies a single has_trait edge with wound template default duration', () => {
      const state = buildState({ withWoundTrait: true });
      const action = makeAction('actor-hero');
      const reaction = makeReaction({ templateId: 'trait.condition.wounded' });

      const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      const edges = next.graph.getOutgoingEdges('actor-hero', 'has_trait')
        .filter(e => e.target === 'trait.condition.wounded');
      expect(edges).toHaveLength(CONDITION_ATTACHMENT_DEFAULT_STACK_COUNT);
      expect(edges[0].properties.durationTicks).toBe(CONDITION_WOUNDED_DURATION);
      expect(edges[0].properties.intensity).toBe(CONDITION_DEFAULT_INTENSITY);
    });

    it('applies multiple stacks when stackCount > 1', () => {
      const state = buildState({ withWoundTrait: true });
      const action = makeAction('actor-hero');
      const reaction = makeReaction({ templateId: 'trait.condition.wounded', stackCount: 2 });

      const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      const edges = next.graph.getOutgoingEdges('actor-hero', 'has_trait')
        .filter(e => e.target === 'trait.condition.wounded');
      expect(edges).toHaveLength(2);
    });

    it('respects durationOverride when supplied', () => {
      const state = buildState({ withWoundTrait: true });
      const action = makeAction('actor-hero');
      const reaction = makeReaction({ templateId: 'trait.condition.wounded', durationOverride: 6 });

      const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      const edges = next.graph.getOutgoingEdges('actor-hero', 'has_trait')
        .filter(e => e.target === 'trait.condition.wounded');
      expect(edges[0].properties.durationTicks).toBe(6);
    });

    it('falls back to template default when durationOverride is invalid (<= 0)', () => {
      const state = buildState({ withWoundTrait: true });
      const action = makeAction('actor-hero');
      const reaction = makeReaction({ templateId: 'trait.condition.wounded', durationOverride: 0 });

      const { state: next } = applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      const edges = next.graph.getOutgoingEdges('actor-hero', 'has_trait')
        .filter(e => e.target === 'trait.condition.wounded');
      expect(edges[0].properties.durationTicks).toBe(CONDITION_WOUNDED_DURATION);
    });
  });

  describe('trace emission', () => {
    it('emits condition_applied and encounter_aftermath_effect traces on success', () => {
      const state = buildState({ withWoundTrait: true });
      const action = makeAction('actor-hero');
      const reaction = makeReaction({ templateId: 'trait.condition.wounded' });

      applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      const traces = getTraces();
      const condApplied = traces.find(t => t.category === 'condition_applied');
      const effectTrace = traces.find(t => t.category === 'encounter_aftermath_effect' && (t as { effectKind?: string }).effectKind === 'condition_attachment');
      expect(condApplied).toBeDefined();
      expect(effectTrace).toBeDefined();
      expect((effectTrace as { success?: boolean }).success).toBe(true);
    });

    it('includes woundApplied in the effectDetail of the encounter_aftermath_effect trace', () => {
      const state = buildState({ withWoundTrait: true });
      const action = makeAction('actor-hero');
      const reaction = makeReaction({ templateId: 'trait.condition.wounded' });

      applyEncounterAftermathReaction(state, action, reaction, 10, runtime);

      const traces = getTraces();
      const effectTrace = traces.find(t =>
        t.category === 'encounter_aftermath_effect' &&
        (t as { effectKind?: string }).effectKind === 'condition_attachment',
      );
      expect((effectTrace as { effectDetail?: { woundApplied?: boolean } }).effectDetail?.woundApplied).toBe(true);
    });
  });
});
