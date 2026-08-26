/**
 * Per-type card mechanic liveness — THR-1179 (workstream C).
 *
 * **What a `status: 'impl'` row promises, and what this file pins.** The library's
 * own definition is "the mechanic is shipped and a card of this type resolves
 * today" — not "somebody authored an exerciser". That distinction is already load-
 * bearing in shipped content: The Veil and The Bargain have carried `impl` since
 * THR-885 while **no** template authors `costs:` at all, because their mechanic is
 * the dispatcher's cost channel, and that channel works whether or not a scene has
 * been written against it yet.
 *
 * Which is exactly the hole this file fills. A type's host path can rot — an effect
 * kind stops being handled, a channel stops reaching its API — and nothing fails,
 * because a grant that no-ops deep in the applier still prints its fiction. That is
 * THR-844's failure verbatim (66 of 138 hidden-mark entries pointing at a reveal
 * family that never existed, silent for months), and the reason `nudgeGrantLiveness`
 * is a build gate rather than a lint. This is the same idea one layer up: not "does
 * the id resolve" but "does a committed card of this type still change the world".
 *
 * So each test below drives the **real** dispatcher over a synthesized card and
 * asserts the **host system's own** state moved — detection pressure, `hiddenMarks`,
 * `emittedOmens`, the artifact node, the `has_trait` edge. Asserting
 * `dispatchedGrantKinds` instead would pass against a fully broken applier, since
 * that field is computed from the authored grants before any of them are applied:
 * it reports what was *asked for*, never what happened.
 *
 * Ticket: THR-1179 · Plan: `Docs/plans/2026-08-18-thr-1178-nudge-library-completion.md`
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { dispatchNudgeCommitments } from '../nudgeDispatch';
import { deriveEmittedOmenEncounterBias } from '../../phaseOmenAgenda';
import { collectNudgeModifiers, CAST_MODIFIER_SOURCE_PREFIX, difficultyWord } from '../nudges';
import { deriveWhisperRevealLine } from '../stepFactorLines';
import { driftDeltaFor } from '../driftAccumulator';
import { driftAxisIdForValuePair } from '../branchDecision';
import { clearTraces, enableTracing, disableTracing } from '../../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../../simulationRuntime';
import { NUDGE_CARD_TYPES, type NudgeCardTypeId } from '../../../data/nudge-card-library';
import {
  HEAVY_HAND_DETECTION_DELTA,
  HEAVY_HAND_FORECAST_DELTA,
  LONG_GAME_MARK_SEVERITY,
  OMEN_CARD_INTENSITY,
  OMEN_CARD_DURATION_TICKS,
  STUMBLE_CONDITION_DURATION_TICKS,
  STUMBLE_CONDITION_INTENSITY,
  STUMBLE_FORECAST_DELTA,
  UNDERTOW_DRIFT_MAGNITUDE,
  UNDERTOW_FORECAST_DELTA,
} from '../../../data/nudge-constants';
import type { ValuePair } from '../../../types/agent';
import type { GameState } from '../../../types/gameState';
import type { EncounterSupportBinding } from '../../../types/encounter';
import type {
  ActionStep,
  EncounterAftermathReactionEffect,
  NudgeCostChannels,
  StepNudge,
  UnifiedAction,
} from '../../../types/unifiedAction';

const ACTOR = 'actor-hero';
const REGION = 'region-vale';
const TICK = 50;
/**
 * Axis The Undertow drags along in these tests. Typed as `ValuePair` and not
 * cast: the first draft wrote a plausible-looking axis that does not exist, and
 * the cast hid it from tsc until the assertion read NaN at runtime.
 */
const UNDERTOW_AXIS: ValuePair = 'mercy_ruthlessness';

/**
 * A world with the actor placed in a resolvable region.
 *
 * The region matters: `dispatchNudgeCommitments` walks `located_at` → the node's
 * `regionId` to decide where a detection cost lands, and falls back to a sentinel
 * when it cannot. A test that skipped the placement would still see pressure move
 * — on the fallback region — and so would pass with the position walk broken.
 */
function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ACTOR, type: 'actor', name: 'Hero', properties: { actorType: 'individual' } });
  graph.addNode({
    id: 'loc-hold',
    type: 'location',
    name: 'The Hold',
    properties: { regionId: REGION, hexCol: 4, hexRow: 4 },
  });
  graph.addEdge({ id: 'hero_at_hold', source: ACTOR, target: 'loc-hold', type: 'located_at', properties: {} });
  return {
    tick: TICK, seed: 42, cycle: 1, phase: 'playing', graph,
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
    hiddenMarks: [],
    emittedOmens: [],
    regionalDetectionPressure: [],
  } as unknown as GameState;
}

function makeAction(): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: ACTOR, templateId: 'enc.test', targetId: ACTOR,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
}

/** One committed card of the type under test, in the authored `StepNudge` shape. */
function makeCard(opts: {
  readonly id: string;
  readonly forecastDelta: number;
  readonly costs?: NudgeCostChannels;
  readonly grants?: readonly EncounterAftermathReactionEffect[];
}): StepNudge {
  return {
    id: opts.id,
    name: 'Test Card',
    essenceCost: 2,
    forecastDelta: opts.forecastDelta,
    effectLine: 'It does the thing the keyword promises.',
    ...(opts.costs ? { costs: opts.costs } : {}),
    ...(opts.grants ? { grants: opts.grants } : {}),
  } as StepNudge;
}

function dispatch(state: GameState, card: StepNudge, runtime: SimulationRuntime) {
  const step = { nudges: [card] } as Pick<ActionStep, 'nudges'>;
  return dispatchNudgeCommitments(state, makeAction(), step, [card.id], TICK, runtime);
}

/** Types this file proves live. Read by the coverage guard at the bottom. */
const COVERED_TYPES: readonly NudgeCardTypeId[] = [
  'heavy_hand',
  'long_game',
  'kindled_ambition',
  'omen',
  'cache',
  'balm',
  'stumble',
  'undertow',
  'whisper',
];

describe('nudge card type mechanics — host-path liveness (THR-1179)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  // ─── Heavy Hand → Stealth & detection ──────────────────────────────

  describe('heavy_hand (host: Stealth & detection)', () => {
    it('raises detection pressure in the actor’s own region', () => {
      const state = buildState();
      const card = makeCard({
        id: 'card.heavy_hand.test',
        forecastDelta: HEAVY_HAND_FORECAST_DELTA,
        costs: { detectionDelta: HEAVY_HAND_DETECTION_DELTA },
      });

      const result = dispatch(state, card, runtime);

      const entry = result.state.regionalDetectionPressure?.find((r) => r.regionId === REGION);
      expect(entry, 'detection pressure should land on the actor’s resolved region').toBeDefined();
      expect(entry!.pressure).toBeGreaterThan(0);
      expect(result.chargedCosts.detectionDelta).toBe(HEAVY_HAND_DETECTION_DELTA);
    });

    it('nets off against a Veil committed in the same hand', () => {
      // The pair is designed to cancel — this is the property that makes The Veil
      // a real answer to The Heavy Hand rather than a differently-priced card.
      const state = buildState();
      const heavy = makeCard({
        id: 'card.heavy_hand.test',
        forecastDelta: HEAVY_HAND_FORECAST_DELTA,
        costs: { detectionDelta: HEAVY_HAND_DETECTION_DELTA },
      });
      const veil = makeCard({
        id: 'card.veil.test',
        forecastDelta: 0,
        costs: { detectionDelta: -HEAVY_HAND_DETECTION_DELTA },
      });
      const step = { nudges: [heavy, veil] } as Pick<ActionStep, 'nudges'>;

      const result = dispatchNudgeCommitments(
        state, makeAction(), step, [heavy.id, veil.id], TICK, runtime,
      );

      expect(result.chargedCosts.detectionDelta).toBeUndefined();
    });
  });

  // ─── Long Game → Traits trigger layer ──────────────────────────────

  describe('long_game (host: Traits trigger layer)', () => {
    it('plants a hidden mark future encounters can fire on', () => {
      const state = buildState();
      const card = makeCard({
        id: 'card.long_game.test',
        forecastDelta: 0.04,
        grants: [{
          kind: 'hidden_mark',
          category: 'divine_favor',
          severity: LONG_GAME_MARK_SEVERITY,
          label: 'Touched at the ford',
        }],
      });

      const result = dispatch(state, card, runtime);

      expect(result.state.hiddenMarks).toHaveLength(1);
      const mark = result.state.hiddenMarks![0]!;
      expect(mark.targetAgentId).toBe(ACTOR);
      expect(mark.severity).toBe(LONG_GAME_MARK_SEVERITY);
      expect(mark.placedTick).toBe(TICK);
    });
  });

  // ─── Kindled Ambition → Ambitions ──────────────────────────────────

  describe('kindled_ambition (host: Ambitions)', () => {
    it('mints an ambition on the mortal through the shared assignment path', () => {
      const state = buildState();
      const card = makeCard({
        id: 'card.kindled_ambition.test',
        forecastDelta: 0.03,
        grants: [{ kind: 'assign_ambition', templateId: 'ambition_dominate_trade' }],
      });

      const result = dispatch(state, card, runtime);

      // The card-planted ambition must be indistinguishable on the graph from one
      // `ambitionTick` mints — that is the whole reason it routes through the
      // shared helper rather than writing its own edge.
      const pursues = result.state.graph.getAllEdges()
        .filter((e) => e.source === ACTOR && e.type === 'pursues');
      expect(pursues.length).toBeGreaterThan(0);
      expect(result.mutationSummary.touchedWorld).toBe(true);
    });
  });

  // ─── Omen → Omens ──────────────────────────────────────────────────

  describe('omen (host: Omens)', () => {
    it('emits a bounded, expiring omen that biases future encounter draws', () => {
      const state = buildState();
      const card = makeCard({
        id: 'card.omen.test',
        forecastDelta: 0,
        grants: [{
          kind: 'emit_omen',
          category: 'sphere_surge',
          intensity: OMEN_CARD_INTENSITY,
          durationTicks: OMEN_CARD_DURATION_TICKS,
          narrativeHook: 'The birds went the wrong way over the ford.',
          scope: { kind: 'global' },
        }],
      });

      const result = dispatch(state, card, runtime);

      expect(result.state.emittedOmens).toHaveLength(1);
      const omen = result.state.emittedOmens![0]!;
      expect(omen.intensity).toBe(OMEN_CARD_INTENSITY);
      expect(omen.expiresTick).toBe(TICK + OMEN_CARD_DURATION_TICKS);

      // The draw bias is the card's actual promise ("steer the story, not the
      // roll"). An omen that lands in state but biases nothing is the failure
      // this assertion exists to catch.
      const bias = deriveEmittedOmenEncounterBias(result.state.emittedOmens!, 4, 4);
      expect(Object.keys(bias).length).toBeGreaterThan(0);
    });
  });

  // ─── Cache → Attachments & items ───────────────────────────────────

  describe('cache (host: Attachments & items)', () => {
    it('leaves a built item the mortal actually holds', () => {
      const state = buildState();
      const card = makeCard({
        id: 'card.cache.test',
        forecastDelta: 0,
        grants: [{
          kind: 'spawn_artifact',
          tier: 'common',
          category: 'talisman',
          nameOverride: 'Ford-Stone',
        }],
      });

      const result = dispatch(state, card, runtime);

      // "Ships with the item built" is the card's printed promise, so an edge to
      // a node that does not exist would satisfy a laxer assertion and break the
      // card. Check both halves.
      const edge = result.state.graph.getAllEdges()
        .find((e) => e.source === ACTOR && (e.type === 'possesses' || e.type === 'bonded_to'));
      expect(edge, 'the mortal should hold the cached item').toBeDefined();
      expect(result.state.graph.getNode(edge!.target)).toBeDefined();
    });
  });

  // ─── Balm → Effects & conditions ───────────────────────────────────

  describe('balm (host: Effects & conditions)', () => {
    it('removes the named condition from the mortal', () => {
      const state = buildState();
      // The graph refuses an edge to a node that does not exist, so the condition
      // has to be a real node before the mortal can carry it — which is also why
      // the removal below is a genuine graph write and not a bookkeeping delete.
      state.graph.addNode({
        id: 'trait.condition.wounded',
        type: 'trait',
        name: 'Wounded',
        properties: {},
      });
      state.graph.addEdge({
        id: 'hero_wounded',
        source: ACTOR,
        target: 'trait.condition.wounded',
        type: 'has_trait',
        properties: {},
      });
      const card = makeCard({
        id: 'card.balm.test',
        forecastDelta: 0.05,
        grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.wounded' }],
      });

      const result = dispatch(state, card, runtime);

      const stillWounded = result.state.graph.getOutgoingEdges(ACTOR, 'has_trait')
        .some((e) => e.target === 'trait.condition.wounded');
      expect(stillWounded).toBe(false);
    });

    it('is fail-soft when the condition is absent', () => {
      // A Balm dealt into a scene where the suffering already lifted must not
      // throw — the tick loop never crashes (NFP #4).
      const state = buildState();
      const card = makeCard({
        id: 'card.balm.test',
        forecastDelta: 0.05,
        grants: [{ kind: 'remove_condition', conditionTraitId: 'trait.condition.wounded' }],
      });

      expect(() => dispatch(state, card, runtime)).not.toThrow();
    });
  });

  // --- Stumble -> Encounter cast ---

  describe('stumble (host: Encounter cast)', () => {
    const CAST_KEY = 'warden';
    const CAST_NODE = 'actor-bridge-warden';

    function withCast(state: GameState): EncounterSupportBinding[] {
      state.graph.addNode({
        id: CAST_NODE, type: 'actor', name: 'The Bridge-Warden',
        properties: { actorType: 'individual' },
      });
      // Real union members, and deliberately not cast: the first draft invented
      // `delivery: 'present'` / `persistence: 'scene'` and the cast hid both from
      // tsc, exactly as it hid a non-existent axis name one describe block down.
      const binding: EncounterSupportBinding = {
        key: CAST_KEY, nodeId: CAST_NODE, kind: 'actor',
        delivery: 'pre-seeded', persistence: 'scene-only', reused: false,
      };
      return [binding];
    }

    it('attributes its forecast modifier to the cast member, not to the card', () => {
      // The delta is the same either way -- what the card buys is *whose doing*
      // it was. A modifier still sourced `nudge:<id>` would render "your hand
      // steadied" on the panel, which is the Boost's line, not the Stumble's.
      const state = buildState();
      const bindings = withCast(state);
      const stumble = {
        ...makeCard({ id: 'card.stumble.test', forecastDelta: STUMBLE_FORECAST_DELTA }),
        opposes: CAST_KEY,
      } as StepNudge;

      const modifiers = collectNudgeModifiers(
        { nudges: [stumble] } as Pick<ActionStep, 'nudges' | 'carryoverFactorLines'>,
        [stumble.id], [], undefined, bindings,
      );

      expect(modifiers).toHaveLength(1);
      expect(modifiers[0]!.source).toBe(`${CAST_MODIFIER_SOURCE_PREFIX}${CAST_NODE}`);
      expect(modifiers[0]!.delta).toBe(STUMBLE_FORECAST_DELTA);
    });

    it('falls back to card attribution when the scene bound no such cast member', () => {
      // Fail-soft (NFP #4): the boost the player paid for lands regardless. The
      // card simply cannot name who faltered, which is the honest degradation --
      // dropping the modifier would charge essence for nothing.
      const state = buildState();
      const stumble = {
        ...makeCard({ id: 'card.stumble.test', forecastDelta: STUMBLE_FORECAST_DELTA }),
        opposes: 'nobody-cast-this',
      } as StepNudge;

      const modifiers = collectNudgeModifiers(
        { nudges: [stumble] } as Pick<ActionStep, 'nudges' | 'carryoverFactorLines'>,
        [stumble.id], [], undefined, withCast(state),
      );

      expect(modifiers).toHaveLength(1);
      expect(modifiers[0]!.source).toBe('nudge:card.stumble.test');
      expect(modifiers[0]!.delta).toBe(STUMBLE_FORECAST_DELTA);
    });

    it('lands its condition on the cast member rather than on the acting mortal', () => {
      // The half that makes this an *encounter cast* mechanic and not a forecast
      // one: the world change happens to somebody else. Asserting only that a
      // condition exists would pass with the effect landing on the actor -- which
      // would be the opposite card, and a much worse one.
      const state = buildState();
      const bindings = withCast(state);
      state.graph.addNode({
        id: 'trait.condition.unfooted', type: 'trait', name: 'Unfooted', properties: {},
      });
      const card = makeCard({
        id: 'card.stumble.test',
        forecastDelta: STUMBLE_FORECAST_DELTA,
        grants: [{
          kind: 'apply_condition',
          conditionTraitId: 'trait.condition.unfooted',
          intensity: STUMBLE_CONDITION_INTENSITY,
          durationTicks: STUMBLE_CONDITION_DURATION_TICKS,
          targetAgentId: `$cast:${CAST_KEY}`,
        }],
      });
      const action = { ...makeAction(), supportBindings: bindings } as UnifiedAction;

      const result = dispatchNudgeCommitments(
        state, action, { nudges: [card] } as Pick<ActionStep, 'nudges'>,
        [card.id], TICK, runtime,
      );

      const castHasIt = result.state.graph.getOutgoingEdges(CAST_NODE, 'has_trait')
        .some((e) => e.target === 'trait.condition.unfooted');
      const actorHasIt = result.state.graph.getOutgoingEdges(ACTOR, 'has_trait')
        .some((e) => e.target === 'trait.condition.unfooted');
      expect(castHasIt, 'the opposition should carry the condition').toBe(true);
      expect(actorHasIt, 'the acting mortal must not').toBe(false);
    });
  });

  // --- Undertow -> Pole-shift ---

  describe('undertow (host: Pole-shift / drift accumulator)', () => {
    it('drags the mortal along its axis through the shared drift accumulator', () => {
      const state = buildState();
      const undertow = {
        ...makeCard({ id: 'card.undertow.test', forecastDelta: UNDERTOW_FORECAST_DELTA }),
        valueDrift: { axis: UNDERTOW_AXIS, toward: 'negative' },
      } as StepNudge;

      const result = dispatch(state, undertow, runtime);

      const axisId = driftAxisIdForValuePair(UNDERTOW_AXIS);
      const position = driftDeltaFor(result.state.archetypeDrift ?? [], ACTOR, axisId);
      expect(position).toBeCloseTo(-UNDERTOW_DRIFT_MAGNITUDE, 5);
      expect(result.driftedAxisIds).toEqual([axisId]);
    });

    it('accumulates on the same axis a branch decision writes, not beside it', () => {
      // The whole reason this rides `driftTowardPole`. If the card wrote its own
      // store, this second play would start from zero again and the mortal's
      // drift would depend on *which system* moved them -- an invisible split,
      // since each path's own tests would still pass.
      const state = buildState();
      const axisId = driftAxisIdForValuePair(UNDERTOW_AXIS);
      const undertow = {
        ...makeCard({ id: 'card.undertow.test', forecastDelta: UNDERTOW_FORECAST_DELTA }),
        valueDrift: { axis: UNDERTOW_AXIS, toward: 'positive' },
      } as StepNudge;

      const once = dispatch(state, undertow, runtime);
      const twice = dispatch(once.state, undertow, runtime);

      expect(driftDeltaFor(twice.state.archetypeDrift ?? [], ACTOR, axisId))
        .toBeCloseTo(UNDERTOW_DRIFT_MAGNITUDE * 2, 5);
    });

    it('moves nothing when the committed hand declares no drift', () => {
      // Falsifies the assertions above: without this, a dispatcher that drifted
      // every hand on a default axis would pass both of them.
      const state = buildState();
      const plain = makeCard({ id: 'card.boost.test', forecastDelta: 0.06 });

      const result = dispatch(state, plain, runtime);

      expect(result.driftedAxisIds).toEqual([]);
      expect(result.state.archetypeDrift ?? []).toHaveLength(0);
    });
  });

  // --- Whisper -> Intelligence (the reveal) ---

  describe('whisper (host: Intelligence)', () => {
    it('reads the next step demand in words, never digits', () => {
      const line = deriveWhisperRevealLine({
        nextStep: { kind: 'demand', reach: 'iron', difficulty: 0.7 },
        difficultyWord,
      });

      expect(line.text).toContain('iron');
      expect(line.text).toContain(difficultyWord(0.7).toLowerCase());
      // UI Law 13/14 -- a reveal that leaked the raw difficulty would be the one
      // card in the deck printing an internal number on a mortal-facing surface.
      expect(line.text).not.toMatch(/[0-9]/);
    });

    it('says so plainly when this is the last step', () => {
      const line = deriveWhisperRevealLine({ nextStep: { kind: 'none' }, difficultyWord });
      expect(line.text).toBeTruthy();
      expect(line.text).not.toMatch(/[0-9]/);
    });

    it('refuses to quote a demand that is not settled yet', () => {
      // A branching next step has no fixed reach or difficulty. The three
      // readings must be distinct sentences -- collapsing `unsettled` into either
      // neighbour makes the card lie on exactly the steps that matter most.
      const settled = deriveWhisperRevealLine({
        nextStep: { kind: 'demand', reach: 'iron', difficulty: 0.7 }, difficultyWord,
      });
      const unsettled = deriveWhisperRevealLine({ nextStep: { kind: 'unsettled' }, difficultyWord });
      const none = deriveWhisperRevealLine({ nextStep: { kind: 'none' }, difficultyWord });

      expect(new Set([settled.text, unsettled.text, none.text]).size).toBe(3);
      expect(unsettled.text).not.toContain('iron');
    });

    it('shifts no odds -- it is a read, not a modifier', () => {
      // The structural guarantee against THR-138's rejected intel-gating, stated
      // as an assertion: the reveal contributes zero delta, so it can neither
      // move the roll nor draw a pip claiming it did.
      const line = deriveWhisperRevealLine({
        nextStep: { kind: 'demand', reach: 'gold', difficulty: 0.3 }, difficultyWord,
      });
      expect(line.delta).toBe(0);
      expect(line.kind).toBe('reveal');
    });
  });

  // ─── Coverage guard ────────────────────────────────────────────────

  describe('coverage guard', () => {
    it('every type this file claims to cover is marked impl in the library', () => {
      for (const typeId of COVERED_TYPES) {
        const row = NUDGE_CARD_TYPES.find((t) => t.id === typeId);
        expect(row, `${typeId} should exist in NUDGE_CARD_TYPES`).toBeDefined();
        expect(row!.status, `${typeId} is proven live here and should read impl`).toBe('impl');
      }
    });

    it('leaves no type unbuilt — every row is impl and every row is exercised', () => {
      // The inverse direction of the guard above, and as of THR-1179 the
      // stronger claim: the unbuilt set is *empty*. A type added later starts at
      // `design`, fails here by name, and so cannot reach the library without
      // someone deciding whether it is built. A future row that legitimately
      // ships unbuilt updates this list deliberately — which is the point.
      const unbuilt = NUDGE_CARD_TYPES
        .filter((t) => t.status !== 'impl')
        .map((t) => t.id)
        .sort();
      expect(unbuilt).toEqual([]);
    });

    it('pins the closed set of types, so a new one cannot ship unnoticed', () => {
      // With the unbuilt set empty, "flipping a badge" is no longer the way a
      // type can arrive unexercised — *adding a row* is. This pin is what makes
      // that a named failure: a new type breaks this list, and whoever adds it
      // has to decide, in the open, whether it ships built and where it is
      // driven. (The twelve types not in COVERED_TYPES predate THR-1179 and are
      // exercised by their own suites; this file owns the nine it built.)
      const ids = NUDGE_CARD_TYPES.map((t) => t.id).sort();
      expect(ids).toEqual([
        'balm', 'bargain', 'boost', 'cache', 'compulsion', 'fellowship',
        'favor', 'gambit', 'heavy_hand', 'insurance', 'kindled_ambition',
        'long_game', 'mercy', 'omen', 'side_bet', 'signature', 'stumble',
        'trait_card', 'undertow', 'veil', 'whisper',
      ].sort());
    });
  });
});
