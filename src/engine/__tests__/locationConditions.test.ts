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
  LOCATION_CONDITION_STEP_MODIFIER,
  LOCATION_CONDITION_STEP_MODIFIER_CAP,
  LOCATION_WATCHED_SHADOW_PENALTY,
  LOCATION_TENDED_SHRINE_VEIL_BONUS,
} from '../../data/condition-trait-content';
import { collectLocationConditionContributions } from '../resolutionModifiers';
import { deriveContributionLines } from '../encounters/stepFactorLines';
import { REACH_DOMAINS } from '../../types/traits';
import type { GameState } from '../../types/gameState';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
} from '../../types/unifiedAction';

const PASS_CLOSED = 'trait.condition.location.pass_closed';
const FESTIVAL = 'trait.condition.location.festival';
const UNDER_WATCH = 'trait.condition.location.under_watch';
const TENDED_SHRINE = 'trait.condition.location.tended_shrine';

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

  // ─── Reader #3: what a place costs to work in (THR-1483) ───────────────────
  //
  // The movement tax above prices *reaching* a place; this prices *working in*
  // one. It exists because `under_watch` and `tended_shrine` shipped with a chip
  // that named them and no engine reader at all — a state the player could see
  // and nothing could act on.
  //
  // Written to the same discipline as the movement pair: every assertion measures
  // the same step with and against a control, because a lone absolute number can
  // be produced by something other than the feature under test.
  describe('read — a condition changes the work done at a place', () => {
    function placeCarrying(...conditionIds: string[]): WorldGraph {
      const graph = new WorldGraph();
      seedEncounterTraitDefinitions(graph);
      graph.addNode({
        id: 'loc-watched', type: 'location', name: 'The Low Market',
        properties: { locationSubtype: 'hamlet' },
      } as never);
      for (const id of conditionIds) {
        graph.addEdge({
          id: `has_trait_loc-watched_${id}`,
          source: 'loc-watched', target: id, type: 'has_trait',
          properties: { appliedAt: 0, ticksRemaining: 50 },
        } as never);
      }
      return graph;
    }

    it('a watched place tells against the quiet reach, and only that reach', () => {
      const watched = placeCarrying(UNDER_WATCH);

      const shadow = collectLocationConditionContributions(watched, 'loc-watched', 'shadow');
      expect(shadow).toHaveLength(1);
      expect(shadow[0]!.value).toBe(LOCATION_WATCHED_SHADOW_PENALTY);
      expect(shadow[0]!.value).toBeLessThan(0);

      // The falsification arm, and the one that separates a mechanism from a mood.
      // A watcher does not make you worse at lifting a beam — if this returned a
      // contribution, the condition would be a blanket penalty wearing a reach's
      // name, and the factor panel would say so on steps it has no business
      // touching.
      expect(collectLocationConditionContributions(watched, 'loc-watched', 'iron')).toEqual([]);
      expect(collectLocationConditionContributions(watched, 'loc-watched', 'heart')).toEqual([]);
    });

    it('the same place without the condition tilts nothing', () => {
      // The control half of the pair. Without it the assertion above could be
      // reporting some unrelated location term that happens to be non-zero.
      const plain = placeCarrying();
      expect(collectLocationConditionContributions(plain, 'loc-watched', 'shadow')).toEqual([]);
    });

    it('a kept shrine reads the other way — direction, not merely presence', () => {
      const shrine = placeCarrying(TENDED_SHRINE);
      const veil = collectLocationConditionContributions(shrine, 'loc-watched', 'veil');

      expect(veil).toHaveLength(1);
      expect(veil[0]!.value).toBe(LOCATION_TENDED_SHRINE_VEIL_BONUS);
      expect(veil[0]!.value).toBeGreaterThan(0);
    });

    it('names the condition in words, never the raw id (UI Law 14)', () => {
      // The contribution's `sourceName` is substituted straight into a player-facing
      // factor sentence, so an id leaking here leaks onto the test panel.
      const [contribution] = collectLocationConditionContributions(
        placeCarrying(UNDER_WATCH), 'loc-watched', 'shadow',
      );
      expect(contribution!.sourceName).toBe('Under Watch');
      expect(contribution!.sourceName).not.toContain('trait.condition');
      expect(contribution!.kind).toBe('condition');
    });

    it('renders a factor line rather than moving the odds unexplained', () => {
      // `deriveContributionLines` silently DROPS any contribution whose kind has no
      // sentence pair in `DERIVED_FACTOR_SENTENCES`. So a new `ModifierSourceKind`
      // without its pair produces exactly the defect the factor panel exists to
      // prevent: a number that changes the roll while no line says why. This arm is
      // the reason the pair was authored in the same change.
      const contributions = collectLocationConditionContributions(
        placeCarrying(UNDER_WATCH), 'loc-watched', 'shadow',
      );
      const lines = deriveContributionLines(contributions, 'Kael Thornweaver');

      expect(lines).toHaveLength(1);
      expect(lines[0]!.kind).toBe('condition');
      expect(lines[0]!.polarity).toBe('against');
      expect(lines[0]!.text).toContain('Under Watch');
      expect(lines[0]!.text).not.toContain('{source}');
    });

    it('lifts by itself when the condition decays — no second lifecycle', () => {
      // The whole reason this reads the location's own `has_trait` edges: the same
      // edges `decayConditions` counts down. A modifier with its own expiry record
      // would outlive the state it reports.
      const graph = placeCarrying(UNDER_WATCH);
      expect(collectLocationConditionContributions(graph, 'loc-watched', 'shadow')).toHaveLength(1);

      const edge = graph.getOutgoingEdges('loc-watched', 'has_trait')[0]!;
      graph.updateEdge(edge.id, { properties: { ...edge.properties, ticksRemaining: 1 } } as never);
      decayConditions(graph, 1);

      expect(collectLocationConditionContributions(graph, 'loc-watched', 'shadow')).toEqual([]);
    });

    it('clamps the summed term so a bad corner of the map cannot decide a step', () => {
      // Conditions ADD here (movement taxes multiply), so the cap is what stops
      // accumulation from becoming a verdict. Falsified against the uncapped sum:
      // six watchers would be -0.36 without the clamp.
      const graph = placeCarrying();
      for (let i = 0; i < 6; i++) {
        graph.addEdge({
          id: `has_trait_loc-watched_stack_${i}`,
          source: 'loc-watched', target: UNDER_WATCH, type: 'has_trait',
          properties: { appliedAt: 0, ticksRemaining: 50 },
        } as never);
      }

      const total = collectLocationConditionContributions(graph, 'loc-watched', 'shadow')
        .reduce((sum, c) => sum + c.value, 0);

      const uncapped = 6 * LOCATION_WATCHED_SHADOW_PENALTY;
      expect(Math.abs(uncapped)).toBeGreaterThan(LOCATION_CONDITION_STEP_MODIFIER_CAP);
      expect(Math.abs(total)).toBeLessThanOrEqual(LOCATION_CONDITION_STEP_MODIFIER_CAP + 1e-9);
    });

    it('a step taken in a Place feels the enclosing Location\'s condition', () => {
      // The wiring arm, and the one that matters most in a live world. Both callers
      // of `computeResolutionModifiers` pass the actor's `located_at` target, which
      // under the three-tier position model is the MOST SPECIFIC node they occupy —
      // so it is a Place as often as a Location. `under_watch` is written onto a
      // settlement; an agent standing in that settlement's tavern would have felt
      // nothing at all if this read only the exact node, which is the same
      // write-with-no-reachable-reader defect the ticket closed, one tier along.
      const graph = placeCarrying(UNDER_WATCH);
      graph.addNode({
        id: 'sub-tavern-watched', type: 'location', name: 'The Broken Wheel',
        properties: { parentLocationId: 'loc-watched', sublocationCategory: 'tavern' },
      } as never);

      const inTavern = collectLocationConditionContributions(graph, 'sub-tavern-watched', 'shadow');
      expect(inTavern).toHaveLength(1);
      expect(inTavern[0]!.value).toBe(LOCATION_WATCHED_SHADOW_PENALTY);
    });

    it('does not reach sideways — a sibling Place\'s own condition stays its own', () => {
      // The falsification half of the tier walk: it resolves UP one step, not across
      // the whole settlement. Without this, "read the parent too" could have been
      // implemented as "read everything nearby", and a shrine tended in one corner
      // of a town would quietly help ritual work in every other corner of it.
      const graph = placeCarrying();
      for (const [id, name] of [['sub-a', 'The Shrine Yard'], ['sub-b', 'The Tannery']] as const) {
        graph.addNode({
          id, type: 'location', name,
          properties: { parentLocationId: 'loc-watched', sublocationCategory: 'tavern' },
        } as never);
      }
      graph.addEdge({
        id: 'has_trait_sub-a_shrine', source: 'sub-a', target: TENDED_SHRINE,
        type: 'has_trait', properties: { appliedAt: 0, ticksRemaining: 50 },
      } as never);

      // The Place that carries it feels it…
      expect(collectLocationConditionContributions(graph, 'sub-a', 'veil')).toHaveLength(1);
      // …its sibling does not, and neither does the parent that merely contains it.
      expect(collectLocationConditionContributions(graph, 'sub-b', 'veil')).toEqual([]);
      expect(collectLocationConditionContributions(graph, 'loc-watched', 'veil')).toEqual([]);
    });

    it('NFP #4: a location that does not resolve contributes nothing and throws nothing', () => {
      expect(
        collectLocationConditionContributions(new WorldGraph(), 'no-such-place', 'shadow'),
      ).toEqual([]);
    });

    it('NFP #4: an orphaned Place whose parent is gone still resolves to its own tier', () => {
      const graph = placeCarrying();
      graph.addNode({
        id: 'sub-orphan', type: 'location', name: 'A Room Somewhere',
        properties: { parentLocationId: 'loc-that-was-deleted' },
      } as never);
      graph.addEdge({
        id: 'has_trait_sub-orphan_watch', source: 'sub-orphan', target: UNDER_WATCH,
        type: 'has_trait', properties: { appliedAt: 0, ticksRemaining: 50 },
      } as never);

      // Its own condition still reads; the missing parent is skipped, not thrown on.
      expect(collectLocationConditionContributions(graph, 'sub-orphan', 'shadow')).toHaveLength(1);
    });

    it('every step-modifier key names a shipped condition and a real reach', () => {
      // Mirror of the movement-tax guard above: a table keyed on a phantom id is a
      // tuning knob wired to nothing, which is the defect class this ticket closed.
      const shipped = new Set(CONDITION_TRAIT_DEFINITIONS.map(n => n.id));
      const reaches = new Set<string>(REACH_DOMAINS);

      const entries = Object.entries(LOCATION_CONDITION_STEP_MODIFIER);
      expect(entries.length).toBeGreaterThan(0);

      for (const [id, bag] of entries) {
        expect(shipped.has(id), `${id} carries a step modifier but is not shipped`).toBe(true);
        for (const [reach, value] of Object.entries(bag)) {
          expect(reaches.has(reach), `${id} names "${reach}", which is not a reach`).toBe(true);
          expect(Number.isFinite(value) && value !== 0, `${id}.${reach} is inert`).toBe(true);
          expect(Math.abs(value as number)).toBeLessThanOrEqual(LOCATION_CONDITION_STEP_MODIFIER_CAP);
        }
      }
    });
  });
});
