/**
 * THR-979 regression: a personality-decided fork must resolve to an authored
 * *variant*, not `fallback`, and the Full Moon seed must actually be planted.
 *
 * Both ends of this test are real. The choice history comes from the engine's
 * own `applyAgentDecidedBranches` — not a hand-written fixture — and the variant
 * lookup comes from the shipped `SLICE_BARGAIN_AT_CROSSROADS.aftermathConfig`
 * via the shared `resolveAftermathVariant`. That pairing is the point: the
 * defect was a disagreement *between* those two surfaces about which step index
 * carries the decision, and any test that invents one side cannot see it. The
 * THR-971 adapter test invented both, agreed with itself, and shipped green
 * while the crossroads ending was unreachable in live play.
 *
 * Verified against the live sim before it was written (CLAUDE.md § Verify the
 * Noun Before the Verb): a CLI run of the real template produced
 * `choiceHistory: [{ stepIndex: 0, choiceId: 'negative', ... }]` while the
 * aftermath asked for step 1.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { applyAgentDecidedBranches } from '../encounters/branchDecision';
import { SLICE_BARGAIN_AT_CROSSROADS } from '../../data/encounters/vertical-slice';
import { isActionStepBranch, resolveAftermathVariant } from '../../types/unifiedAction';
import type { ActionStep, UnifiedAction } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const ACTOR = 'agent.traveler';
const TICK = 11;

/** The axis `CROSSROADS_FORK` decides on, read off the shipped template. */
const FORK = SLICE_BARGAIN_AT_CROSSROADS.steps
  .filter(isActionStepBranch)
  .find((step) => step.decidedBy)!;
const AXIS = (FORK.decidedBy as { axis: string }).axis;

function buildState(profileValue: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ACTOR,
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: {
      actorType: 'individual',
      axiologicalProfile: { [AXIS]: profileValue },
    },
  });
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
    archetypeDrift: [],
  } as unknown as GameState;
}

/** An action parked on the deciding step, as it stands when that step resolves. */
function buildAction(playedNudgeIds: readonly string[] = []): UnifiedAction {
  return {
    actionId: 'ua_crossroads_1',
    actorId: ACTOR,
    templateId: SLICE_BARGAIN_AT_CROSSROADS.id,
    targetId: 'loc.crossroads',
    scale: 'local',
    source: 'agent',
    startTick: 10,
    currentStep: FORK.branchOnStep,
    stepProgress: 0,
    stepDuration: 1,
    resolved: false,
    stepOutcomes: [],
    activeNudges: playedNudgeIds,
  } as unknown as UnifiedAction;
}

/**
 * Run the real decision, then the real variant lookup. `profileValue` picks the
 * side: the fork reads the mortal's standing on its own axis, so a conviction
 * strong enough to clear the neutral band decides without consuming the coin.
 *
 * `playedNudgeIds` are the cards the god committed on the deciding step, and
 * `rng` is the coin — both real inputs to `applyAgentDecidedBranches`, so a card
 * that decides the fork is proved to decide it *against* a coin pointing the
 * other way rather than merely alongside one that agrees.
 */
function resolveEnding(
  profileValue: number,
  playedNudgeIds: readonly string[] = [],
  rng: () => number = () => 0.5,
) {
  const state = buildState(profileValue);
  const decidingStep = SLICE_BARGAIN_AT_CROSSROADS.steps[FORK.branchOnStep] as ActionStep;

  const applied = applyAgentDecidedBranches(
    state,
    buildAction(playedNudgeIds),
    SLICE_BARGAIN_AT_CROSSROADS,
    decidingStep,
    TICK,
    rng,
  );

  const variant = resolveAftermathVariant(
    SLICE_BARGAIN_AT_CROSSROADS.aftermathConfig!,
    applied.action.choiceHistory,
    'success',
  );

  return {
    choiceHistory: applied.action.choiceHistory ?? [],
    variant,
    decision: applied.decision!,
  };
}

/** Seeds planted by a variant's reactions — the Full Moon payload, or nothing. */
function seedsOf(variant: { reactions?: readonly { effects: readonly { kind: string }[] }[] }) {
  return (variant.reactions ?? [])
    .flatMap((reaction) => reaction.effects)
    .filter((effect) => effect.kind === 'encounter_seed');
}

const FALLBACK_OVERVIEW = SLICE_BARGAIN_AT_CROSSROADS.aftermathConfig!.fallback.overview;

describe('THR-979 — the crossroads fork reaches its authored endings', () => {
  it('records the decision at the step the aftermath reads', () => {
    const { choiceHistory } = resolveEnding(-0.9);

    // The whole defect in one assertion: these two indices must agree.
    expect(choiceHistory).toHaveLength(1);
    expect(choiceHistory[0].stepIndex).toBe(
      SLICE_BARGAIN_AT_CROSSROADS.aftermathConfig!.branchOnStep,
    );
    expect(choiceHistory[0].interventionType).toBe('agent_decided');
  });

  it('a mortal who leans negative strikes the bargain and plants the Full Moon seed', () => {
    const { variant } = resolveEnding(-0.9);

    expect(variant.overview).not.toBe(FALLBACK_OVERVIEW);
    expect(variant.overview).toContain('The bargain is struck');

    const seeds = (variant.reactions ?? [])
      .flatMap((reaction) => reaction.effects)
      .filter((effect) => effect.kind === 'encounter_seed');

    expect(seeds).toHaveLength(1);
    expect(seeds[0]).toMatchObject({
      kind: 'encounter_seed',
      templateId: 'encounter.slice.full_moon_collection',
      targetAgentId: '$actor',
    });
  });

  it('a mortal who leans positive refuses, and plants nothing', () => {
    const { variant } = resolveEnding(0.9);

    expect(variant.overview).not.toBe(FALLBACK_OVERVIEW);
    expect(variant.overview).toContain('so was the refusal');

    const seeds = (variant.reactions ?? [])
      .flatMap((reaction) => reaction.effects)
      .filter((effect) => effect.kind === 'encounter_seed');

    // The falsification half: a resolver that always found a seed would be no
    // evidence the seed above is real.
    expect(seeds).toHaveLength(0);
  });

  it('the two poles resolve to different endings', () => {
    expect(resolveEnding(-0.9).variant.overview)
      .not.toBe(resolveEnding(0.9).variant.overview);
  });
});

/**
 * THR-1037: the same fork, reached the way a *player* reaches it.
 *
 * The suite above proves both endings reachable from the mortal's own standing,
 * with no cards in play. That is the wrong half for the question THR-1037 asked
 * — "is the accept branch reachable by a god's nudge choices?" — and asking only
 * the profile half is what let the gap survive THR-979's fix.
 *
 * It matters because the sanctioned review avatar makes the profile half
 * *unusable*: `applyBalancedTestAvatar` zeroes every value axis by design, so a
 * reviewer on `?spawn=`/`?testavatar` has `profileLean === 0` and the fork can
 * only be steered by cards or settled by the coin. THR-1037 reported four
 * playthroughs landing on the refuse branch with byte-identical prose; a neutral
 * profile plus no counted card leaves `netLean === 0`, which is the coin, and a
 * seeded coin drawn at the same point of an identical call sequence returns the
 * same side every run. The last test here is that observation, pinned.
 */
describe('THR-1037 — the god’s hand can decide the crossroads fork', () => {
  /** The two cards in the deciding step's hand that argue on the fork's axis. */
  const ACCEPT_CARD = 'slice.crossroads.a_taste_for_wonders'; // poleLean toward 'negative'
  const REFUSE_CARD = 'slice.crossroads.old_stories'; // poleLean toward 'positive'

  /** Coins that would settle an undecided fork the *opposite* way to the card. */
  const COIN_SAYS_POSITIVE = () => 0.1;
  const COIN_SAYS_NEGATIVE = () => 0.9;

  it('one committed card strikes the bargain on a neutral mortal, and plants the seed', () => {
    // Neutral profile — the balanced test avatar's exact standing — and a coin
    // pointing at 'positive', so only the card can produce this result.
    const { decision, variant } = resolveEnding(0, [ACCEPT_CARD], COIN_SAYS_POSITIVE);

    expect(decision.profileLean).toBe(0);
    expect(decision.cardLean).toBeLessThan(0);
    expect(decision.pole).toBe('negative');
    expect(decision.decidedBy).toBe('conviction');

    expect(variant.overview).toContain('The bargain is struck');
    expect(seedsOf(variant)).toMatchObject([
      { kind: 'encounter_seed', templateId: 'encounter.slice.full_moon_collection' },
    ]);
  });

  it('the opposing card refuses on the same neutral mortal, and plants nothing', () => {
    const { decision, variant } = resolveEnding(0, [REFUSE_CARD], COIN_SAYS_NEGATIVE);

    expect(decision.cardLean).toBeGreaterThan(0);
    expect(decision.pole).toBe('positive');
    expect(decision.decidedBy).toBe('conviction');

    expect(variant.overview).toContain('so was the refusal');
    // Falsification half: a hand that always found a seed would prove nothing above.
    expect(seedsOf(variant)).toHaveLength(0);
  });

  it('a card argues loudly enough to overturn the mortal’s own standing', () => {
    // The card's weight (0.35) exceeds a mild conviction, so the god genuinely
    // moves the mortal rather than only breaking ties.
    const unled = resolveEnding(0.2, [], COIN_SAYS_POSITIVE);
    const led = resolveEnding(0.2, [ACCEPT_CARD], COIN_SAYS_POSITIVE);

    expect(unled.decision.pole).toBe('positive');
    expect(led.decision.pole).toBe('negative');
  });

  it('a card that argues on another axis abstains, leaving the fork to the coin', () => {
    // `second_sight` carries no poleLean at all. Counting an unrelated card
    // would be the plausible-and-wrong sum `signedLeanWeight`'s axis check exists
    // to prevent, and it would silently make every hand a steering hand.
    const { decision } = resolveEnding(0, ['slice.crossroads.second_sight'], COIN_SAYS_POSITIVE);

    expect(decision.cardLean).toBe(0);
    expect(decision.decidedBy).toBe('coin');
  });

  it('with no card counted, a neutral mortal leaves the fork to the coin — THR-1037’s four identical runs', () => {
    // Not a defect: the coin is seeded, so an identical call sequence returns an
    // identical side. Both sides are reachable; the draw is what varies.
    expect(resolveEnding(0, [], COIN_SAYS_POSITIVE).decision).toMatchObject({
      netLean: 0, pole: 'positive', decidedBy: 'coin',
    });
    expect(resolveEnding(0, [], COIN_SAYS_NEGATIVE).decision).toMatchObject({
      netLean: 0, pole: 'negative', decidedBy: 'coin',
    });
  });
});
