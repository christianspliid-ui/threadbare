/**
 * THR-761: aftermath-applied conditions must actually expire.
 *
 * `decayConditions` is the only tick-driven condition-expiry path and it counts
 * down `edge.properties.ticksRemaining`. The two aftermath paths that mint
 * condition edges (`apply_condition`, `condition_attachment`) historically wrote
 * only `durationTicks`, which no production reader consumes — so every condition
 * they applied was permanent regardless of its authored duration.
 *
 * These tests assert the *expiry*, not the write: each drives the real decay loop
 * tick by tick and requires the edge to be gone on the authored tick. A test that
 * only asserts `durationTicks` was written passes on the broken code (that is what
 * `conditionAttachment.test.ts` did before this ticket).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { decayConditions } from '../conditionDecay';
import { clearTraces, enableTracing, disableTracing } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { CONDITION_WOUNDED_DURATION } from '../../data/condition-trait-content';
import type { GameState } from '../../types/gameState';
import type { EncounterAftermathReaction, UnifiedAction } from '../../types/unifiedAction';

const START_TICK = 10;

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'trait.condition.wounded',
    type: 'trait',
    name: 'Wounded',
    properties: { subcategory: 'condition', tags: ['#condition', '#combat', '#negative'] },
  });
  graph.addNode({
    id: 'trait.condition.inspired',
    type: 'trait',
    name: 'Inspired',
    properties: { subcategory: 'condition', tags: ['#condition', '#positive'] },
  });
  return {
    tick: START_TICK, seed: 42, cycle: 1, phase: 'playing', graph,
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

function makeAction(actorId = 'actor-hero'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId: 'enc.test', targetId: actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  };
}

function applyConditionReaction(
  conditionTraitId: string,
  durationTicks?: number,
): EncounterAftermathReaction {
  return {
    id: 'react-apply-condition',
    label: 'Apply Condition',
    effects: [{
      kind: 'apply_condition',
      conditionTraitId,
      ...(durationTicks !== undefined ? { durationTicks } : {}),
    }],
  };
}

function conditionAttachmentReaction(
  templateId: string,
  durationOverride?: number,
): EncounterAftermathReaction {
  return {
    id: 'react-condition-attachment',
    label: 'Attach Condition',
    effects: [{
      kind: 'condition_attachment',
      templateId,
      ...(durationOverride !== undefined ? { durationOverride } : {}),
    }],
  };
}

/** Count live has_trait edges from the hero to a given condition trait. */
function conditionEdgeCount(state: GameState, traitId: string): number {
  return state.graph.getOutgoingEdges('actor-hero', 'has_trait')
    .filter(e => e.target === traitId).length;
}

/** Drive the real decay loop `n` times, as the orchestrator does once per tick. */
function advance(state: GameState, n: number): void {
  for (let i = 0; i < n; i++) {
    decayConditions(state.graph, START_TICK + i + 1);
  }
}

describe('THR-761 — aftermath conditions expire through decayConditions', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  describe('apply_condition', () => {
    it('removes the condition on the tick its authored duration runs out', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(), applyConditionReaction('trait.condition.inspired', 5), START_TICK, runtime,
      );
      expect(conditionEdgeCount(next, 'trait.condition.inspired')).toBe(1);

      advance(next, 4);
      expect(conditionEdgeCount(next, 'trait.condition.inspired')).toBe(1); // still inside its duration

      advance(next, 1);
      expect(conditionEdgeCount(next, 'trait.condition.inspired')).toBe(0); // expired on tick 5
    });

    it('counts ticksRemaining down while keeping durationTicks as provenance', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(), applyConditionReaction('trait.condition.inspired', 8), START_TICK, runtime,
      );

      const [edge] = next.graph.getOutgoingEdges('actor-hero', 'has_trait')
        .filter(e => e.target === 'trait.condition.inspired');
      expect(edge.properties.ticksRemaining).toBe(8);
      expect(edge.properties.durationTicks).toBe(8);

      advance(next, 3);

      const [decayed] = next.graph.getOutgoingEdges('actor-hero', 'has_trait')
        .filter(e => e.target === 'trait.condition.inspired');
      expect(decayed.properties.ticksRemaining).toBe(5);
      // durationTicks is the authored total, untouched by decay — it drives the
      // UI progress bar and stays as provenance of what was originally applied.
      expect(decayed.properties.durationTicks).toBe(8);
    });

    it('leaves an indefinite condition (duration omitted) permanent', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(), applyConditionReaction('trait.condition.inspired'), START_TICK, runtime,
      );

      const [edge] = next.graph.getOutgoingEdges('actor-hero', 'has_trait')
        .filter(e => e.target === 'trait.condition.inspired');
      expect(edge.properties.ticksRemaining).toBeUndefined();

      advance(next, 40);
      expect(conditionEdgeCount(next, 'trait.condition.inspired')).toBe(1);
    });
  });

  describe('condition_attachment', () => {
    it('removes the condition on the tick durationOverride runs out', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(), conditionAttachmentReaction('trait.condition.wounded', 6), START_TICK, runtime,
      );
      expect(conditionEdgeCount(next, 'trait.condition.wounded')).toBe(1);

      advance(next, 5);
      expect(conditionEdgeCount(next, 'trait.condition.wounded')).toBe(1);

      advance(next, 1);
      expect(conditionEdgeCount(next, 'trait.condition.wounded')).toBe(0);
    });

    it('removes a wound at its template default duration', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(), conditionAttachmentReaction('trait.condition.wounded'), START_TICK, runtime,
      );

      advance(next, CONDITION_WOUNDED_DURATION - 1);
      expect(conditionEdgeCount(next, 'trait.condition.wounded')).toBe(1);

      advance(next, 1);
      expect(conditionEdgeCount(next, 'trait.condition.wounded')).toBe(0);
    });
  });
});
