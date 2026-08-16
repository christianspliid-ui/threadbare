/**
 * THR-1143 — location conditions: timed, readable states on places.
 *
 * The primitive is a *widening*, not a new system: the same `has_trait` edge, the
 * same `ticksRemaining` counter, the same `decayConditions` expiry path. So these
 * tests are mostly about proving the widening reaches all the way through —
 * write, expiry, and both readers — rather than about new machinery.
 *
 * Two of them are written to fail if the feature is absent in a way a happy-path
 * test would not catch:
 *   • the gating pair asserts **both** polarities (eligible with the condition,
 *     ineligible without), because a gate that never rejects is not a gate;
 *   • the movement pair measures the same edge with and without the condition,
 *     because a single absolute number can be produced by an unrelated tax.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { decayConditions } from '../conditionDecay';
import { computeEdgeCost } from '../movementCost';
import { seedEncounterTraitDefinitions } from '../traitDefinitionSeeding';
import { buildLocationTargetContext } from '../targetContextBuilders';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import {
  CONDITION_PASS_CLOSED_DURATION,
  CONDITION_FESTIVAL_DURATION,
  LOCATION_CONDITION_MOVEMENT_TAX,
  LOCATION_CONDITION_IDS,
  LOCATION_IMPASSABLE_MULTIPLIER,
  CONDITION_TRAIT_DEFINITIONS,
} from '../../data/condition-trait-content';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

const PASS_CLOSED = 'trait.condition.location.pass_closed';
const FESTIVAL = 'trait.condition.location.festival';
const UNDER_WATCH = 'trait.condition.location.under_watch';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * A world holding one agent, one settlement, one hex and one sublocation.
 * Trait definitions arrive through the real seeding path (THR-809) rather than
 * hand-added nodes, so a definition that stopped shipping fails these tests.
 */
function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-hero', type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'loc-pass', type: 'location', name: 'The Kingsteeth Pass',
    properties: { locationSubtype: 'waypoint', hexCol: 3, hexRow: 4 },
  });
  graph.addNode({
    id: 'hex-3-4', type: 'location', name: 'Hex (3, 4)',
    properties: { terrain: 'mountains' },
  });
  graph.addNode({
    id: 'sub-tavern', type: 'location', name: 'The Broken Wheel',
    properties: { parentLocationId: 'loc-pass', sublocationCategory: 'tavern' },
  });
  seedEncounterTraitDefinitions(graph);
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

function makeAction(targetId = 'actor-hero'): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: 'actor-hero', templateId: 'enc.test', targetId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  };
}

function reactionOf(...effects: EncounterAftermathReactionEffect[]): EncounterAftermathReaction {
  return { id: 'react-test', label: 'Test Reaction', effects };
}

/** The `has_trait` edges a place is currently carrying. */
function conditionsOn(graph: WorldGraph, nodeId: string): string[] {
  return graph.getOutgoingEdges(nodeId, 'has_trait').map(e => e.target);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('THR-1143 — location conditions', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  describe('content', () => {
    it('ships the starter set, and every id in it is a seeded definition node', () => {
      const graph = new WorldGraph();
      seedEncounterTraitDefinitions(graph);
      expect(LOCATION_CONDITION_IDS.length).toBeGreaterThan(0);
      for (const id of LOCATION_CONDITION_IDS) {
        expect(graph.getNode(id), `${id} not seeded`).toBeDefined();
      }
    });

    it('every movement-tax key names a shipped condition — no tax on a phantom id', () => {
      const shipped = new Set(CONDITION_TRAIT_DEFINITIONS.map(n => n.id));
      for (const id of Object.keys(LOCATION_CONDITION_MOVEMENT_TAX)) {
        expect(shipped.has(id), `${id} taxed but not shipped`).toBe(true);
      }
    });
  });

  describe('write — a condition lands on a place', () => {
    it('apply_condition with targetLocationId writes the edge on the location, not the actor', () => {
      const state = buildState();
      const { state: next, mutationSummary } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({
          kind: 'apply_condition',
          conditionTraitId: PASS_CLOSED,
          targetLocationId: 'loc-pass',
          durationTicks: CONDITION_PASS_CLOSED_DURATION,
        }),
        10, runtime,
      );

      expect(mutationSummary.touchedStructure).toBe(true);
      expect(conditionsOn(next.graph, 'loc-pass')).toEqual([PASS_CLOSED]);
      expect(conditionsOn(next.graph, 'actor-hero')).toEqual([]);
    });

    it('writes the live decay counter, not only the authored total (the THR-761 trap)', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({
          kind: 'apply_condition',
          conditionTraitId: PASS_CLOSED,
          targetLocationId: 'loc-pass',
          durationTicks: CONDITION_PASS_CLOSED_DURATION,
        }),
        10, runtime,
      );
      const edge = next.graph.getOutgoingEdges('loc-pass', 'has_trait')[0];
      expect(edge.properties.ticksRemaining).toBe(CONDITION_PASS_CLOSED_DURATION);
    });

    it('condition_attachment reaches a place too, and takes the template default duration', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({ kind: 'condition_attachment', templateId: FESTIVAL, targetLocationId: 'loc-pass' }),
        10, runtime,
      );
      const edge = next.graph.getOutgoingEdges('loc-pass', 'has_trait')[0];
      expect(edge.target).toBe(FESTIVAL);
      expect(edge.properties.ticksRemaining).toBe(CONDITION_FESTIVAL_DURATION);
    });

    it('a wound on a place never sets woundApplied — that signal is about the actor', () => {
      const state = buildState();
      const { mutationSummary } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({
          kind: 'condition_attachment',
          templateId: 'trait.condition.wounded',
          targetLocationId: 'loc-pass',
        }),
        10, runtime,
      );
      expect(mutationSummary.woundApplied).toBeFalsy();
    });

    it('remove_condition lifts it again', () => {
      const state = buildState();
      const { state: applied } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({ kind: 'apply_condition', conditionTraitId: PASS_CLOSED, targetLocationId: 'loc-pass' }),
        10, runtime,
      );
      const { state: lifted } = applyEncounterAftermathReaction(
        applied, makeAction(),
        reactionOf({ kind: 'remove_condition', conditionTraitId: PASS_CLOSED, targetLocationId: 'loc-pass' }),
        11, runtime,
      );
      expect(conditionsOn(lifted.graph, 'loc-pass')).toEqual([]);
    });

    it('emits location_condition_applied naming the place and its tier', () => {
      const state = buildState();
      applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({
          kind: 'apply_condition',
          conditionTraitId: PASS_CLOSED,
          targetLocationId: 'loc-pass',
          durationTicks: CONDITION_PASS_CLOSED_DURATION,
        }),
        10, runtime,
      );
      const trace = getTraces().find(t => t.category === 'location_condition_applied') as
        | { locationId: string; locationName: string; carrierKind: string; conditionTemplateId: string; ticksRemaining: number }
        | undefined;
      expect(trace).toBeDefined();
      expect(trace?.locationId).toBe('loc-pass');
      expect(trace?.locationName).toBe('The Kingsteeth Pass');
      expect(trace?.carrierKind).toBe('waypoint');
      expect(trace?.conditionTemplateId).toBe(PASS_CLOSED);
      expect(trace?.ticksRemaining).toBe(CONDITION_PASS_CLOSED_DURATION);
    });

    it('does NOT emit the location trace when the carrier is an agent', () => {
      const state = buildState();
      applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({ kind: 'apply_condition', conditionTraitId: 'trait.condition.wounded' }),
        10, runtime,
      );
      expect(getTraces().some(t => t.category === 'location_condition_applied')).toBe(false);
    });

    it('fail-soft: an unresolvable place no-ops and traces rather than throwing', () => {
      const state = buildState();
      const { state: next, mutationSummary } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({ kind: 'apply_condition', conditionTraitId: PASS_CLOSED, targetLocationId: 'loc-nowhere' }),
        10, runtime,
      );
      expect(mutationSummary.touchedStructure).toBe(false);
      expect(next.graph.getNode('loc-nowhere')).toBeUndefined();
      expect(getTraces().some(t =>
        t.category === 'aftermath_target_invalid'
        && (t as { reason?: string }).reason === 'target_node_missing',
      )).toBe(true);
    });
  });

  describe('sentinels', () => {
    it('$target binds the action target when it is a place', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction('loc-pass'),
        reactionOf({ kind: 'apply_condition', conditionTraitId: PASS_CLOSED, targetLocationId: '$target' }),
        10, runtime,
      );
      expect(conditionsOn(next.graph, 'loc-pass')).toEqual([PASS_CLOSED]);
    });

    it('$target does NOT bind a sublocation to the location field — the tiers stay distinct', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction('sub-tavern'),
        reactionOf({ kind: 'apply_condition', conditionTraitId: PASS_CLOSED, targetLocationId: '$target' }),
        10, runtime,
      );
      expect(conditionsOn(next.graph, 'sub-tavern')).toEqual([]);
    });
  });

  describe('expiry — through the real decay loop, not a second path', () => {
    it('counts down and removes the edge when the term runs out', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({
          kind: 'apply_condition', conditionTraitId: FESTIVAL,
          targetLocationId: 'loc-pass', durationTicks: 3,
        }),
        10, runtime,
      );

      expect(decayConditions(next.graph, 11)).toHaveLength(0);
      expect(conditionsOn(next.graph, 'loc-pass')).toEqual([FESTIVAL]);
      expect(decayConditions(next.graph, 12)).toHaveLength(0);

      const removed = decayConditions(next.graph, 13);
      expect(removed).toHaveLength(1);
      expect(removed[0].carrierId).toBe('loc-pass');
      expect(removed[0].traitId).toBe(FESTIVAL);
      expect(conditionsOn(next.graph, 'loc-pass')).toEqual([]);
    });

    it('an indefinite condition (durationTicks 0) is never counted down', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({
          kind: 'apply_condition', conditionTraitId: UNDER_WATCH,
          targetLocationId: 'loc-pass', durationTicks: 0,
        }),
        10, runtime,
      );
      for (let t = 11; t < 40; t++) decayConditions(next.graph, t);
      expect(conditionsOn(next.graph, 'loc-pass')).toEqual([UNDER_WATCH]);
    });
  });

  describe('reader 1 — template gating reads location conditions', () => {
    it('the target context carries the place\'s conditions, and loses them on expiry', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({
          kind: 'apply_condition', conditionTraitId: FESTIVAL,
          targetLocationId: 'loc-pass', durationTicks: 1,
        }),
        10, runtime,
      );

      // Present → a template requiring it would pass the trait gate.
      const withCondition = buildLocationTargetContext('loc-pass', next.graph);
      expect(withCondition?.traitIds).toContain(FESTIVAL);

      // Absent after expiry → the same template is filtered out again. Falsifying
      // the other way matters: a gate that only ever passes is not a gate.
      decayConditions(next.graph, 11);
      const afterExpiry = buildLocationTargetContext('loc-pass', next.graph);
      expect(afterExpiry?.traitIds).not.toContain(FESTIVAL);
    });
  });

  describe('reader 2 — movement tax', () => {
    it('a closed pass multiplies the cost of entering it', () => {
      const state = buildState();
      const before = computeEdgeCost(state.graph, 'actor-hero', 'hex-3-4', 'loc-pass');

      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({
          kind: 'apply_condition', conditionTraitId: PASS_CLOSED,
          targetLocationId: 'loc-pass', durationTicks: CONDITION_PASS_CLOSED_DURATION,
        }),
        10, runtime,
      );
      const after = computeEdgeCost(next.graph, 'actor-hero', 'hex-3-4', 'loc-pass');

      expect(before.conditionMultiplier).toBe(1);
      expect(after.conditionMultiplier).toBe(LOCATION_IMPASSABLE_MULTIPLIER);
      expect(after.totalCost).toBeCloseTo(before.totalCost * LOCATION_IMPASSABLE_MULTIPLIER, 5);
    });

    it('is a price, not a wall — the cost stays finite and traversable (NFP #4)', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({ kind: 'apply_condition', conditionTraitId: PASS_CLOSED, targetLocationId: 'loc-pass' }),
        10, runtime,
      );
      const cost = computeEdgeCost(next.graph, 'actor-hero', 'hex-3-4', 'loc-pass');
      expect(Number.isFinite(cost.totalCost)).toBe(true);
    });

    it('the tax lifts by itself when the condition expires — no second lifecycle', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({
          kind: 'apply_condition', conditionTraitId: PASS_CLOSED,
          targetLocationId: 'loc-pass', durationTicks: 1,
        }),
        10, runtime,
      );
      expect(computeEdgeCost(next.graph, 'actor-hero', 'hex-3-4', 'loc-pass').conditionMultiplier)
        .toBe(LOCATION_IMPASSABLE_MULTIPLIER);

      decayConditions(next.graph, 11);
      expect(computeEdgeCost(next.graph, 'actor-hero', 'hex-3-4', 'loc-pass').conditionMultiplier).toBe(1);
    });

    it('a condition with no tax entry (under_watch) leaves movement untouched', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf({ kind: 'apply_condition', conditionTraitId: UNDER_WATCH, targetLocationId: 'loc-pass' }),
        10, runtime,
      );
      expect(computeEdgeCost(next.graph, 'actor-hero', 'hex-3-4', 'loc-pass').conditionMultiplier).toBe(1);
    });

    it('two taxing conditions compound', () => {
      const state = buildState();
      const { state: next } = applyEncounterAftermathReaction(
        state, makeAction(),
        reactionOf(
          { kind: 'apply_condition', conditionTraitId: PASS_CLOSED, targetLocationId: 'loc-pass' },
          { kind: 'apply_condition', conditionTraitId: FESTIVAL, targetLocationId: 'loc-pass' },
        ),
        10, runtime,
      );
      const expected = LOCATION_CONDITION_MOVEMENT_TAX[PASS_CLOSED] * LOCATION_CONDITION_MOVEMENT_TAX[FESTIVAL];
      expect(computeEdgeCost(next.graph, 'actor-hero', 'hex-3-4', 'loc-pass').conditionMultiplier)
        .toBeCloseTo(expected, 5);
    });
  });
});
