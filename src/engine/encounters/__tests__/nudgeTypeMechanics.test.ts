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
import { clearTraces, enableTracing, disableTracing } from '../../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../../simulationRuntime';
import { NUDGE_CARD_TYPES, type NudgeCardTypeId } from '../../../data/nudge-card-library';
import {
  HEAVY_HAND_DETECTION_DELTA,
  HEAVY_HAND_FORECAST_DELTA,
  LONG_GAME_MARK_SEVERITY,
  OMEN_CARD_INTENSITY,
  OMEN_CARD_DURATION_TICKS,
} from '../../../data/nudge-constants';
import type { GameState } from '../../../types/gameState';
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
    fiction: 'A test card.',
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

  // ─── Coverage guard ────────────────────────────────────────────────

  describe('coverage guard', () => {
    it('every type this file claims to cover is marked impl in the library', () => {
      for (const typeId of COVERED_TYPES) {
        const row = NUDGE_CARD_TYPES.find((t) => t.id === typeId);
        expect(row, `${typeId} should exist in NUDGE_CARD_TYPES`).toBeDefined();
        expect(row!.status, `${typeId} is proven live here and should read impl`).toBe('impl');
      }
    });

    it('names the types still unbuilt, so a silent flip cannot pass unnoticed', () => {
      // The inverse direction of the guard above: flipping a row to `impl`
      // without adding its liveness test here fails this assertion, which is the
      // whole point — `impl` is a claim about the engine, and a claim with no
      // exercise is how THR-844 stayed invisible for months.
      const unbuilt = NUDGE_CARD_TYPES
        .filter((t) => t.status !== 'impl')
        .map((t) => t.id)
        .sort();
      expect(unbuilt).toEqual(['stumble', 'undertow', 'whisper']);
    });
  });
});
