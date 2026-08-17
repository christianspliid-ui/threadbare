/**
 * THR-1146 — `reward_draw`: a tag-filtered random prize as a band/reaction effect.
 *
 * Three things are worth testing here and they are not equally interesting.
 *
 * ## 1. Path identity (`describe('one draw path')`)
 *
 * The ticket asks that the aftermath route and the step-metadata route resolve
 * through *the same* seeded draw rather than a copy. The change delivers that
 * structurally — `resolveUnifiedReward` was moved onto `drawSeededReward` in the
 * same commit, so there is exactly one implementation — and the test asserts the
 * property that structure is supposed to buy: identical inputs, identical prize.
 *
 * A test that only ran the aftermath route and checked "something was granted"
 * would pass against two independent implementations that agreed today and
 * diverged the first time either was tuned. So the assertion is comparative: the
 * dispatcher's prize is compared against a direct `drawSeededReward` call with
 * the same seed key, and a *different* key is shown to produce a different draw
 * — otherwise "identical" would be satisfied by a draw that ignores its seed.
 *
 * ## 2. The gate, falsified in both directions (`describe('the empty-pool gate')`)
 *
 * This is the THR-844 rot class: a `tagFilters` entry matching zero templates is
 * a silently empty pool, and the prose still promises a prize. A gate asserted
 * only on the live corpus is worthless — a validator with `return true` in it
 * passes that test forever. So both arms run:
 *
 *  • a recipe naming `'weapon'` (no `#`) and one naming a tag nobody wrote must
 *    both go **red** — the `#` omission is the realistic authoring slip, and it
 *    is invisible to the type system;
 *  • the shipped corpus must go **green**, which is what makes the red arm
 *    evidence of a discriminating gate rather than a broken one.
 *
 * ## 3. Fail-soft (`describe('fail-soft')`)
 *
 * NFP #4. An empty pool at runtime emits `aftermath_reward_draw_empty` and the
 * encounter proceeds. Asserted by driving the real dispatcher, because the
 * contract is about what the tick loop does, not what a helper returns.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { drawSeededReward, mapActionOutcomeToRewardOutcome } from '../rewardPool';
import {
  validateRewardDrawPools,
  rewardRecipeHasCandidates,
  formatEmptyRewardDrawPools,
} from '../nudgeGrantLiveness';
import { REWARD_POSSESSIONS } from '../../data/reward-attachment-catalog';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type { RewardPoolRecipe } from '../../types/attachments';
import type {
  EncounterAftermathReaction,
  EncounterAftermathReactionEffect,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

/**
 * A hero, and the real reward catalog seeded into the graph.
 *
 * The catalog is the shipped one rather than a hand-built pair of artifacts:
 * the whole subject is whether a *tag query* finds real content, and a fixture
 * that invented its own tagged artifacts would verify the fixture (the
 * `fixture_invents_both_sides` failure), not the library.
 */
function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Maret',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'actor-second', type: 'actor', name: 'Dellin',
    properties: { actorType: 'individual' },
  });
  for (const node of REWARD_POSSESSIONS) graph.addNode(node);

  return {
    tick: 50, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'actor-hero', essencePool: {} as never,
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

function makeAction(over: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_test', actorId: 'actor-hero', templateId: 'mc.quest.collect_bounty',
    targetId: 'actor-hero', scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
    ...over,
  } as UnifiedAction;
}

function apply(
  state: GameState,
  effects: EncounterAftermathReactionEffect[],
  runtime: SimulationRuntime,
  action: UnifiedAction = makeAction(),
  tick = 50,
) {
  const reaction = { id: 'rx-prize', label: 'Whatever the mark was carrying.', effects } as EncounterAftermathReaction;
  return applyEncounterAftermathReaction(state, action, reaction, tick, runtime);
}

const tracesOfCategory = (category: string) =>
  getTraces().filter(t => (t as unknown as { category: string }).category === category);

/**
 * The exemplar recipe: some weapon, any weapon. 24 live templates, all four tiers.
 *
 * Typed rather than `as const` — `RewardPoolRecipe.tagFilters` is a mutable
 * `string[]`, so a `readonly` tuple is not assignable to it.
 */
const WEAPON_POOL: RewardPoolRecipe = {
  categoryWeights: { possession: 1 },
  tagFilters: ['#weapon'],
};

/** Every `possesses` edge the recipient holds — the prize is one of these. */
const heldItems = (state: GameState, agentId: string) =>
  state.graph.getOutgoingEdges(agentId, 'possesses');

// ═══════════════════════════════════════════════════════════════════
// 1. One draw path
// ═══════════════════════════════════════════════════════════════════

describe('reward_draw — one draw path', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('the dispatcher draws exactly what the shared path draws for the same inputs', () => {
    const action = makeAction();

    // The prediction is made on a *separate* graph, so the comparison cannot be
    // satisfied by both sides reading one mutated world.
    const predicted = drawSeededReward(buildState().graph, {
      recipe: WEAPON_POOL,
      outcomeType: mapActionOutcomeToRewardOutcome(action.outcome),
      seed: 42,
      tick: 50,
      actorId: 'actor-hero',
      templateId: 'mc.quest.collect_bounty',
      recipientId: 'actor-hero',
    });
    expect(predicted.drawnTemplateId).not.toBeNull();

    const state = buildState();
    const result = apply(state, [{ kind: 'reward_draw', pool: WEAPON_POOL }], runtime, action);

    const trace = tracesOfCategory('aftermath_reward_draw')[0] as unknown as {
      drawnTemplateId: string; poolSize: number; roll: number;
    };
    expect(trace).toBeDefined();
    expect(trace.drawnTemplateId).toBe(predicted.drawnTemplateId);
    expect(trace.poolSize).toBe(predicted.poolSize);
    expect(trace.roll).toBe(predicted.drawRoll);

    // And the prize actually landed on the recipient, not merely in a trace.
    const held = heldItems(result.state, 'actor-hero');
    expect(held).toHaveLength(1);
    expect(held[0].target).toContain(predicted.drawnTemplateId!);
  });

  it('the draw is keyed — a different actor draws differently', () => {
    // Without this, "identical inputs give identical output" would also be
    // satisfied by a draw that ignores its seed entirely and always returns the
    // first pool entry.
    const drawFor = (actorId: string, tick: number) => drawSeededReward(buildState().graph, {
      recipe: WEAPON_POOL,
      outcomeType: 'success',
      seed: 42, tick, actorId,
      templateId: 'mc.quest.collect_bounty',
    });

    const rolls = new Set([
      drawFor('actor-hero', 50).drawRoll,
      drawFor('actor-second', 50).drawRoll,
      drawFor('actor-hero', 51).drawRoll,
      drawFor('actor-hero', 77).drawRoll,
    ]);
    expect(rolls.size).toBe(4);

    // …and repeating one of them reproduces it exactly (determinism, NFP #3).
    expect(drawFor('actor-hero', 50).drawRoll).toBe(drawFor('actor-hero', 50).drawRoll);
    expect(drawFor('actor-hero', 50).drawnTemplateId)
      .toBe(drawFor('actor-hero', 50).drawnTemplateId);
  });

  it('the outcome band sets the tier curve — a critical success reaches tier 4, a failure cannot', () => {
    // The claim the ticket makes for free ("a better ending draws a better
    // prize") is a claim about the tier curve, so assert the curve rather than
    // one lucky draw: TIER_CURVE_CRITICAL_FAILURE gives tier 4 weight 0.
    const drawAt = (outcome: 'critical_success' | 'critical_failure', tick: number) =>
      drawSeededReward(buildState().graph, {
        recipe: WEAPON_POOL, outcomeType: outcome,
        seed: 42, tick, actorId: 'actor-hero', templateId: 'mc.quest.collect_bounty',
      });

    const critSuccessPool = drawAt('critical_success', 50).poolSize;
    const critFailurePool = drawAt('critical_failure', 50).poolSize;

    // A critical failure mostly flips to the harmful table, and even when it
    // does not, its curve zeroes the top tier — so its weapon pool is strictly
    // smaller than a critical success's.
    expect(critSuccessPool).toBeGreaterThan(0);
    expect(critFailurePool).toBeLessThan(critSuccessPool);
  });

  it('names a recipient other than the actor when the effect targets one', () => {
    const state = buildState();
    const result = apply(
      state,
      [{ kind: 'reward_draw', pool: WEAPON_POOL, targetAgentId: 'actor-second' }],
      runtime,
    );

    expect(heldItems(result.state, 'actor-second')).toHaveLength(1);
    expect(heldItems(result.state, 'actor-hero')).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. The empty-pool gate — falsified in both directions
// ═══════════════════════════════════════════════════════════════════

describe('reward_draw — the empty-pool gate', () => {
  /** A template carrying one `reward_draw` on its fallback aftermath. */
  const templateWithPool = (pool: unknown): UnifiedActionTemplate => ({
    id: 'test.gate_probe',
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview: 'x',
        changes: [],
        reactions: [{
          id: 'rx', label: 'x',
          effects: [{ kind: 'reward_draw', pool } as EncounterAftermathReactionEffect],
        }],
      },
    },
  } as unknown as UnifiedActionTemplate);

  it('RED: a tag written without its # matches nothing', () => {
    // The realistic slip. The library writes '#weapon'; 'weapon' is a perfectly
    // well-typed string that selects the empty set.
    const report = validateRewardDrawPools([
      templateWithPool({ categoryWeights: { possession: 1 }, tagFilters: ['weapon'] }),
    ]);
    expect(report.checkedRecipes).toBe(1);
    expect(report.empty).toHaveLength(1);
    expect(formatEmptyRewardDrawPools(report.empty)).toContain('no candidate matches');
  });

  it('RED: a tag nobody ever wrote matches nothing', () => {
    const report = validateRewardDrawPools([
      templateWithPool({ categoryWeights: { possession: 1 }, tagFilters: ['#trebuchet'] }),
    ]);
    expect(report.empty).toHaveLength(1);
  });

  it('RED: a combination that is individually live but jointly empty', () => {
    // Both tags exist; nothing carries both. This is the case a
    // per-tag existence check would wave through, which is why the gate
    // resolves the whole query instead.
    const report = validateRewardDrawPools([
      templateWithPool({ categoryWeights: { possession: 1 }, tagFilters: ['#weapon', '#potion'] }),
    ]);
    expect(report.empty).toHaveLength(1);
  });

  it('GREEN: the exemplar recipe resolves', () => {
    const report = validateRewardDrawPools([templateWithPool(WEAPON_POOL)]);
    expect(report.checkedRecipes).toBe(1);
    expect(report.empty).toEqual([]);
  });

  it('GREEN: the shipped corpus carries no empty pool', () => {
    // `check:encounter --all` only sees the `encounter.*` prefix (191 of 683
    // templates), so the corpus-wide invariant has to live here or the exemplar
    // — an `mc.*` id — would be gated by nothing at all.
    const report = validateRewardDrawPools(UNIFIED_ACTION_TEMPLATES);
    expect(formatEmptyRewardDrawPools(report.empty)).toBe('');

    // Guard against the vacuous pass: if the sweep stops finding the exemplar,
    // "no empty pools" would be true of an empty search.
    expect(report.checkedRecipes).toBeGreaterThan(0);
  });

  it('the sweep reads bands and cards, not just variant reactions', () => {
    // A band authors its own `reactions`, and a sweep reading only
    // `variant.reactions` cannot see what a critical_failure pays out (THR-973).
    const dead = { categoryWeights: { possession: 1 }, tagFilters: ['#trebuchet'] };
    const inBand = {
      id: 'test.band_probe',
      aftermathConfig: {
        branchOnStep: 0,
        variants: {},
        fallback: {
          overview: 'x', changes: [],
          byOutcome: {
            critical_failure: {
              reactions: [{ id: 'rx', label: 'x', effects: [{ kind: 'reward_draw', pool: dead }] }],
            },
          },
        },
      },
    } as unknown as UnifiedActionTemplate;

    const inCard = {
      id: 'test.card_probe',
      steps: [{
        id: 's1',
        nudges: [{ id: 'card', grants: [{ kind: 'reward_draw', pool: dead }] }],
      }],
    } as unknown as UnifiedActionTemplate;

    expect(validateRewardDrawPools([inBand]).empty).toHaveLength(1);
    expect(validateRewardDrawPools([inCard]).empty).toHaveLength(1);
  });

  it('a registry-backed category resolves through the registry, not the node catalog', () => {
    // Companions and agreements are not graph nodes. A gate that only swept
    // artifact/trait nodes would call every companion recipe empty.
    expect(rewardRecipeHasCandidates({ categoryWeights: { companion: 1 } })).toBe(true);
    expect(rewardRecipeHasCandidates({ categoryWeights: { agreement: 1 } })).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Fail-soft
// ═══════════════════════════════════════════════════════════════════

describe('reward_draw — fail-soft', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('an empty pool traces and proceeds — never throws, never grants', () => {
    const state = buildState();
    const deadPool = { categoryWeights: { possession: 1 }, tagFilters: ['#trebuchet'] };

    let result!: ReturnType<typeof apply>;
    expect(() => {
      result = apply(state, [{ kind: 'reward_draw', pool: deadPool }], runtime);
    }).not.toThrow();

    expect(heldItems(result.state, 'actor-hero')).toHaveLength(0);

    const empty = tracesOfCategory('aftermath_reward_draw_empty')[0] as unknown as {
      tagFilters: string[]; recipientId: string;
    };
    expect(empty).toBeDefined();
    // The trace carries the whole recipe, because it is the only evidence a
    // content author gets that the fiction promised a prize and paid nothing.
    expect(empty.tagFilters).toEqual(['#trebuchet']);
    expect(empty.recipientId).toBe('actor-hero');
  });

  it('sibling effects in the same reaction still apply after an empty draw', () => {
    // The failure that matters is not the missing prize — it is an empty draw
    // aborting the rest of the ending.
    const state = buildState();
    const result = apply(state, [
      { kind: 'reward_draw', pool: { categoryWeights: { possession: 1 }, tagFilters: ['#trebuchet'] } },
      { kind: 'recent_event', message: 'The ending still happened.' },
    ] as EncounterAftermathReactionEffect[], runtime);

    expect(result.state.recentEvents.some(e => e.message === 'The ending still happened.')).toBe(true);
  });

  it('an unresolvable actor no-ops rather than throwing', () => {
    const state = buildState();
    const orphan = makeAction({ actorId: '' });

    let result!: ReturnType<typeof apply>;
    expect(() => {
      result = apply(state, [{ kind: 'reward_draw', pool: WEAPON_POOL }], runtime, orphan);
    }).not.toThrow();

    expect(heldItems(result.state, 'actor-hero')).toHaveLength(0);
  });

  it('every action outcome maps to a curve the tier tables actually have', () => {
    // `OutcomeType` carries `success_at_cost`, which `getTierCurveForOutcome`
    // has no arm for — an unmapped band would destructure `undefined` and throw
    // inside the tick loop. Both mappers are pinned here.
    const outcomes = [
      'success', 'failure', 'critical_success', 'critical_failure',
      'success_at_cost', 'contested_won', 'contested_lost', undefined,
    ] as const;
    for (const outcome of outcomes) {
      const mapped = mapActionOutcomeToRewardOutcome(outcome);
      expect(['success', 'failure', 'critical_success', 'critical_failure']).toContain(mapped);
      expect(() => drawSeededReward(buildState().graph, {
        recipe: WEAPON_POOL, outcomeType: mapped,
        seed: 42, tick: 50, actorId: 'actor-hero', templateId: 't',
      })).not.toThrow();
    }
  });
});
