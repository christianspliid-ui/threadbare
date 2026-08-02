/**
 * THR-894: agent-decided branches — the mortal chooses, the god leans.
 *
 * `ActionStepBranch` picked a variant by a recorded `choiceId`, and the only
 * thing that ever recorded one was the retired player-pick. A branch authored
 * today could therefore only ever take `fallback`: the fork was in the schema
 * and unreachable in the world. These tests bind the *reachability*, not the
 * schema.
 *
 * The falsification set is deliberate. A test that only asserted "a decided
 * branch resolves to some pole" would pass on an implementation that always
 * returned `'positive'`, so each of the three inputs is moved independently and
 * required to move the answer:
 *
 *  1. flip the profile's sign  → the other pole
 *  2. add one leaning card     → carries a mortal across the threshold
 *  3. replay the same seed     → the same pole, including in the coin band
 *
 * Every path here drives the real `executeStepResult` → `advanceStep` →
 * `resolveStepDefinition` chain rather than calling the decision function
 * directly, because the thing that was broken was the *wiring*: the decision
 * has to arrive as an ordinary choice-history entry, or the branch it was
 * computed for still takes `fallback`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import {
  decideBranchPole,
  decideBranchRoute,
  driftAxisIdForValuePair,
  readLiveAxisLean,
  scoreRoutes,
} from '../encounters/branchDecision';
import {
  classifyNetLean,
  routeLeanWeight,
  signedLeanWeight,
  sumHandLean,
  sumRouteLean,
} from '../encounters/poleLean';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { assertValidStep, collectUnleanableBranchWarnings } from '../../testing/contentInvariants';
import {
  BRANCH_DECISION_DRIFT_MAGNITUDE,
  BRANCH_DECISION_NEUTRAL_EPSILON,
  MAX_BRANCH_ROUTES,
  POLE_LEAN_DEFAULT_WEIGHT,
  ROUTE_DECISION_AXIS_WEIGHT,
  ROUTE_DECISION_CAPABILITY_WEIGHT,
  ROUTE_DECISION_CARD_WEIGHT,
} from '../../data/nudge-constants';
import type { GameState } from '../../types/gameState';
import type {
  ActionStep,
  ActionStepBranch,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

const START_TICK = 10;
const AXIS = 'honesty_cunning' as const;
const ACTOR = 'actor-1';

/**
 * Traces read as loose records.
 *
 * The encounter trace interfaces are not members of the `TraceEntry` union —
 * a long-standing gap that also forces every *emitter* of these categories to
 * cast (see `phaseChoiceResolution`). Reading them back needs the same widening,
 * or `category === 'branch_decided'` is a compile error for having "no overlap".
 */
function tracesOfCategory(category: string): Array<Record<string, unknown>> {
  return (getTraces() as unknown as Array<Record<string, unknown>>)
    .filter((t) => t.category === category);
}

/** A deterministic stream that records how many draws were taken. */
function countingRng(value = 0.99): { rng: () => number; draws: () => number } {
  let draws = 0;
  return { rng: () => { draws++; return value; }, draws: () => draws };
}

function buildState(profileValue: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ACTOR,
    type: 'actor',
    name: 'Alice',
    properties: {
      actorType: 'individual',
      axiologicalProfile: { [AXIS]: profileValue },
    },
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
    archetypeDrift: [],
  } as unknown as GameState;
}

function concreteStep(overrides: Partial<ActionStep> = {}): ActionStep {
  return {
    reach: 'shadow',
    duration: { min: 1, max: 1 },
    difficulty: 0.3,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    ...overrides,
  } as ActionStep;
}

function leaningCard(id: string, toward: 'positive' | 'negative', weight?: number): StepNudge {
  return {
    id,
    name: 'Lean',
    essenceCost: 0,
    forecastDelta: 0,
    fiction: 'A hand on the scale.',
    effectLine: 'Argues a direction.',
    poleLean: { axis: AXIS, toward, ...(weight === undefined ? {} : { weight }) },
  } as StepNudge;
}

/**
 * Two-step template: step 0 deals the hand, step 1 is the decided fork.
 * The two variants carry different durations so the resolved branch is
 * observable from the action alone.
 */
function decidedTemplate(nudges: readonly StepNudge[] = []): UnifiedActionTemplate {
  const branch: ActionStepBranch = {
    branchOnStep: 0,
    decidedBy: { axis: AXIS },
    variants: {
      positive: concreteStep({ duration: { min: 7, max: 7 } }),
      negative: concreteStep({ duration: { min: 3, max: 3 } }),
    },
    fallback: concreteStep({ duration: { min: 1, max: 1 } }),
  };

  return {
    id: 'encounter.branch-decision-test',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Branch Decision Test',
    reach: 'shadow',
    crudType: 'update',
    scale: 'personal',
    steps: [concreteStep({ nudges }), branch],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['honesty_cunning'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  } as unknown as UnifiedActionTemplate;
}

function makeAction(template: UnifiedActionTemplate, activeNudges: string[] = []): UnifiedAction {
  return {
    actionId: 'ua_branch', actorId: ACTOR, templateId: template.id, targetId: ACTOR,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    activeNudges,
  } as unknown as UnifiedAction;
}

/**
 * Drive the real resolution of step 0 and report what the branch became.
 * `stepDuration` is the tell: 7 = positive variant, 3 = negative, 1 = fallback.
 */
function resolveFork(
  profileValue: number,
  nudges: readonly StepNudge[] = [],
  activeNudges: string[] = [],
  rng: () => number = () => 0.99,
): { pole: 'positive' | 'negative' | 'fallback'; state: GameState; action: UnifiedAction } {
  const state = buildState(profileValue);
  const template = decidedTemplate(nudges);
  const action = makeAction(template, activeNudges);

  const { updatedAction } = executeStepResult(
    action, template, 'success', [], state, rng, START_TICK,
  );

  const pole = updatedAction.stepDuration === 7
    ? 'positive'
    : updatedAction.stepDuration === 3
      ? 'negative'
      : 'fallback';

  return { pole, state, action: updatedAction };
}

describe('THR-894 — agent-decided branches reach their variants', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); });

  it('an honest mortal takes the positive pole — and it is NOT the fallback', () => {
    const { pole, action } = resolveFork(0.8);
    expect(pole).toBe('positive');
    // The bug this ticket closes: a branch with no recorded choice silently
    // takes `fallback` forever. Naming it explicitly keeps the test honest.
    expect(action.currentStep).toBe(1);
    expect(action.choiceHistory?.find(c => c.stepIndex === 0)?.choiceId).toBe('positive');
  });

  it('FALSIFIER 1 — flipping the profile sign flips the pole', () => {
    expect(resolveFork(0.8).pole).toBe('positive');
    expect(resolveFork(-0.8).pole).toBe('negative');
  });

  it('FALSIFIER 2 — one leaning card carries a mortal across the threshold', () => {
    // A mortal sitting just on the cunning side of neutral.
    const nearNeutral = -0.2;
    expect(nearNeutral).toBeLessThan(-BRANCH_DECISION_NEUTRAL_EPSILON);
    expect(resolveFork(nearNeutral).pole).toBe('negative');

    // The same mortal, with one honest card committed, chooses the other way.
    const card = leaningCard('n1', 'positive');
    expect(POLE_LEAN_DEFAULT_WEIGHT).toBeGreaterThan(Math.abs(nearNeutral));
    expect(resolveFork(nearNeutral, [card], ['n1']).pole).toBe('positive');
  });

  it('a card the god did NOT commit does not move the decision', () => {
    const card = leaningCard('n1', 'positive');
    // Dealt on the step, absent from `activeNudges` — never played, never counts.
    expect(resolveFork(-0.2, [card], []).pole).toBe('negative');
  });

  it('a card leaning on a DIFFERENT axis abstains', () => {
    const offAxis = {
      ...leaningCard('n1', 'positive'),
      poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
    } as StepNudge;
    expect(resolveFork(-0.2, [offAxis], ['n1']).pole).toBe('negative');
  });

  it('FALSIFIER 3 — the near-zero coin is seed-stable across replays', () => {
    const neutral = 0;
    // Below the coin threshold ⇒ positive; above ⇒ negative. Both must be stable.
    const low = () => 0.1;
    const high = () => 0.9;
    expect(resolveFork(neutral, [], [], low).pole).toBe('positive');
    expect(resolveFork(neutral, [], [], low).pole).toBe('positive');
    expect(resolveFork(neutral, [], [], high).pole).toBe('negative');
    expect(resolveFork(neutral, [], [], high).pole).toBe('negative');
  });

  it('the decided pole drifts the mortal toward the pole they took', () => {
    const axisId = driftAxisIdForValuePair(AXIS);

    const positive = resolveFork(0.8);
    const posEntry = positive.state.archetypeDrift.find(d => d.agentId === ACTOR && d.axisId === axisId);
    expect(posEntry?.toPosition).toBeCloseTo(BRANCH_DECISION_DRIFT_MAGNITUDE, 6);

    const negative = resolveFork(-0.8);
    const negEntry = negative.state.archetypeDrift.find(d => d.agentId === ACTOR && d.axisId === axisId);
    expect(negEntry?.toPosition).toBeCloseTo(-BRANCH_DECISION_DRIFT_MAGNITUDE, 6);
  });

  it('accumulated drift feeds back into the next decision (choices become character)', () => {
    const state = buildState(0);
    const axisId = driftAxisIdForValuePair(AXIS);
    expect(readLiveAxisLean(state, ACTOR, AXIS)).toBe(0);

    state.archetypeDrift = [{
      agentId: ACTOR, axisId, fromPosition: 0, toPosition: 0.3, lastUpdatedTick: START_TICK,
    }];
    // Baseline 0 + drift 0.3 — the mortal now leans, on past choices alone.
    expect(readLiveAxisLean(state, ACTOR, AXIS)).toBeCloseTo(0.3, 6);
  });

  it('emits exactly one branch_decided trace carrying every decision input', () => {
    resolveFork(0.8, [leaningCard('n1', 'positive')], ['n1']);
    const decided = tracesOfCategory('branch_decided');
    expect(decided).toHaveLength(1);
    expect(decided[0].axis).toBe(AXIS);
    expect(decided[0].resolvedPole).toBe('positive');
    expect(decided[0].decidedBy).toBe('conviction');
    expect(decided[0].profileLean).toBeCloseTo(0.8, 6);
    expect(decided[0].cardLean).toBeCloseTo(POLE_LEAN_DEFAULT_WEIGHT, 6);
  });
});

describe('THR-894 — a branch without decidedBy is untouched (NFP #6)', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); });

  it('still takes fallback, records no choice, and emits no decision trace', () => {
    const template = decidedTemplate();
    const branch = template.steps[1] as ActionStepBranch;
    const undecided = {
      ...template,
      steps: [template.steps[0], { ...branch, decidedBy: undefined }],
    } as unknown as UnifiedActionTemplate;

    const state = buildState(0.8);
    const { updatedAction } = executeStepResult(
      makeAction(undecided), undecided, 'success', [], state, () => 0.5, START_TICK,
    );

    expect(updatedAction.stepDuration).toBe(1); // fallback
    expect(updatedAction.choiceHistory ?? []).toHaveLength(0);
    expect(state.archetypeDrift).toHaveLength(0);
    expect(tracesOfCategory('branch_decided')).toHaveLength(0);
  });

  it('takes no rng draw when no branch decides on the resolved step', () => {
    const template = decidedTemplate();
    const branch = template.steps[1] as ActionStepBranch;
    const undecided = {
      ...template,
      steps: [template.steps[0], { ...branch, decidedBy: undefined }],
    } as unknown as UnifiedActionTemplate;

    const decidedCounter = countingRng();
    executeStepResult(
      makeAction(decidedTemplate()), decidedTemplate(), 'success', [], buildState(0),
      decidedCounter.rng, START_TICK,
    );
    const undecidedCounter = countingRng();
    executeStepResult(
      makeAction(undecided), undecided, 'success', [], buildState(0),
      undecidedCounter.rng, START_TICK,
    );

    // The neutral profile forces the coin on the decided template, so it must
    // draw strictly more than the undecided one. This is what proves the coin
    // is drawn only where its value is used.
    expect(decidedCounter.draws()).toBeGreaterThan(undecidedCounter.draws());
  });
});

describe('THR-894 — pole lean arithmetic', () => {
  it('an axis-explicit card counts only on its own axis', () => {
    const lean = { axis: AXIS, toward: 'positive' } as const;
    expect(signedLeanWeight(lean, AXIS)).toBeCloseTo(POLE_LEAN_DEFAULT_WEIGHT, 6);
    expect(signedLeanWeight(lean, 'mercy_ruthlessness')).toBe(0);
  });

  it('the a/b shorthand counts only where the host owns the axis', () => {
    // Meeting form: caller passes no axis.
    expect(signedLeanWeight('a')).toBeCloseTo(POLE_LEAN_DEFAULT_WEIGHT, 6);
    expect(signedLeanWeight('b')).toBeCloseTo(-POLE_LEAN_DEFAULT_WEIGHT, 6);
    // Branch form: the shorthand names no axis, so it abstains.
    expect(signedLeanWeight('a', AXIS)).toBe(0);
  });

  it('a non-finite authored weight abstains rather than poisoning the sum', () => {
    const bad = { axis: AXIS, toward: 'positive', weight: Number.NaN } as const;
    expect(signedLeanWeight(bad, AXIS)).toBe(0);
    expect(sumHandLean([{ ...leaningCard('n1', 'positive'), poleLean: bad } as StepNudge], ['n1'], AXIS)).toBe(0);
  });

  it('an unknown played id is skipped, matching every other activeNudges reader', () => {
    expect(sumHandLean([leaningCard('n1', 'positive')], ['nope'], AXIS)).toBe(0);
  });

  it('classifyNetLean respects the caller-supplied neutral band', () => {
    expect(classifyNetLean(0.02, BRANCH_DECISION_NEUTRAL_EPSILON)).toBe('none');
    expect(classifyNetLean(0.02, 0)).toBe('a');
    expect(classifyNetLean(-0.5, BRANCH_DECISION_NEUTRAL_EPSILON)).toBe('b');
  });

  it('decideBranchPole takes the coin exactly once, and only inside the band', () => {
    const decided = countingRng();
    expect(decideBranchPole(0.8, 0, decided.rng).decidedBy).toBe('conviction');
    expect(decided.draws()).toBe(0);

    const undecided = countingRng(0.1);
    const result = decideBranchPole(0, 0, undecided.rng);
    expect(result.decidedBy).toBe('coin');
    expect(result.pole).toBe('positive');
    expect(undecided.draws()).toBe(1);
  });
});

// ─── THR-898: N-route agent-decided forks ────────────────────────────

/**
 * Three routes to one door, separated primarily by which reach the mortal is
 * good at. `capabilities` seeds the actor's raw domain scores so a route can be
 * made genuinely theirs — the same `computeCapability` read resolution uses.
 */
function buildRouteState(
  capabilities: Partial<Record<string, number>>,
  profile: Partial<Record<string, number>> = {},
): GameState {
  const state = buildState(0);
  state.graph.updateNode(ACTOR, {
    properties: {
      actorType: 'individual',
      axiologicalProfile: profile,
      domainCapabilities: capabilities,
    },
  });
  return state;
}

function routeCard(id: string, route: string, weight?: number): StepNudge {
  return {
    id,
    name: 'Nudge a course',
    essenceCost: 0,
    forecastDelta: 0,
    fiction: 'A purse, or a threat, or a kindness.',
    effectLine: 'Argues for one way in.',
    poleLean: { route, ...(weight === undefined ? {} : { weight }) },
  } as unknown as StepNudge;
}

/** The Broken Wheel shape: bribe (gold) / intimidate (iron) / persuade (heart). */
function routeTemplate(nudges: readonly StepNudge[] = []): UnifiedActionTemplate {
  const branch: ActionStepBranch = {
    branchOnStep: 0,
    decidedBy: {
      routes: [
        { key: 'bribe', reach: 'gold' },
        { key: 'intimidate', reach: 'iron' },
        { key: 'persuade', reach: 'heart', axis: AXIS, toward: 'positive' },
      ],
    },
    variants: {
      bribe: concreteStep({ duration: { min: 7, max: 7 } }),
      intimidate: concreteStep({ duration: { min: 5, max: 5 } }),
      persuade: concreteStep({ duration: { min: 3, max: 3 } }),
    },
    fallback: concreteStep({ duration: { min: 1, max: 1 } }),
  } as unknown as ActionStepBranch;

  return {
    ...decidedTemplate(nudges),
    id: 'encounter.route-decision-test',
    steps: [concreteStep({ nudges }), branch],
  } as unknown as UnifiedActionTemplate;
}

/** Drive the real resolution and report which route the branch became. */
function resolveRoute(
  capabilities: Partial<Record<string, number>>,
  options: {
    profile?: Partial<Record<string, number>>;
    nudges?: readonly StepNudge[];
    activeNudges?: string[];
    rng?: () => number;
  } = {},
): { route: string; state: GameState; action: UnifiedAction } {
  const state = buildRouteState(capabilities, options.profile ?? {});
  const template = routeTemplate(options.nudges ?? []);
  const action = makeAction(template, options.activeNudges ?? []);

  const { updatedAction } = executeStepResult(
    action, template, 'success', [], state, options.rng ?? (() => 0.99), START_TICK,
  );

  const byDuration: Record<number, string> = { 7: 'bribe', 5: 'intimidate', 3: 'persuade', 1: 'fallback' };
  return { route: byDuration[updatedAction.stepDuration] ?? 'unknown', state, action: updatedAction };
}

describe('THR-898 — N-route forks reach their variants', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { disableTracing(); });

  it('the mortal takes the course they are actually good at — and it is NOT the fallback', () => {
    const { route, action } = resolveRoute({ gold: 40, iron: 10, heart: 10 });
    expect(route).toBe('bribe');
    expect(action.currentStep).toBe(1);
    expect(action.choiceHistory?.find(c => c.stepIndex === 0)?.choiceId).toBe('bribe');
  });

  it('FALSIFIER 1 — flipping the capability ranking flips the route', () => {
    expect(resolveRoute({ gold: 40, iron: 10, heart: 10 }).route).toBe('bribe');
    expect(resolveRoute({ gold: 10, iron: 40, heart: 10 }).route).toBe('intimidate');
    expect(resolveRoute({ gold: 10, iron: 10, heart: 40 }).route).toBe('persuade');
  });

  // Raw scores sit near the sigmoid's midpoint (10, k=0.4) deliberately: above
  // ~20 the curve saturates and a 6-point raw gap compresses to <0.01
  // capability, which lands inside ROUTE_DECISION_TIE_EPSILON and makes a
  // "clear leader" fixture silently a tie.
  const GOLD_LEADS = { gold: 12, iron: 10, heart: 4 };

  it('FALSIFIER 2 — one route card carries a mortal across to a rival course', () => {
    expect(resolveRoute(GOLD_LEADS).route).toBe('bribe');

    // The same mortal, with one committed card arguing for the harder line.
    const card = routeCard('n1', 'intimidate', 1);
    expect(resolveRoute(GOLD_LEADS, { nudges: [card], activeNudges: ['n1'] }).route).toBe('intimidate');
  });

  it('a route card the god did NOT commit does not move the decision', () => {
    const card = routeCard('n1', 'intimidate', 1);
    expect(resolveRoute(GOLD_LEADS, { nudges: [card] }).route).toBe('bribe');
  });

  it('a card naming a DIFFERENT route abstains from this one', () => {
    // Backs persuade, which trails far enough that a default-weight card cannot
    // close the gap — so the winner is unchanged, and neither bribe nor
    // intimidate absorbed any of it.
    const card = routeCard('n1', 'persuade');
    expect(
      resolveRoute(GOLD_LEADS, { nudges: [card], activeNudges: ['n1'] }).route,
    ).toBe('bribe');

    // ...and the card is not merely inert: weighted enough, it does carry its
    // own route. Without this the assertion above would pass on a card that
    // contributed nothing anywhere.
    const heavy = routeCard('n1', 'persuade', 1);
    expect(
      resolveRoute(GOLD_LEADS, { nudges: [heavy], activeNudges: ['n1'] }).route,
    ).toBe('persuade');
  });

  it('a route-explicit card abstains from every two-pole decision', () => {
    // The pole fork asks about an axis; a route key names no axis and must not
    // be read as one. Same mortal, same card, decided by profile alone.
    const card = routeCard('n1', 'positive', 1);
    expect(resolveFork(-0.2, [card], ['n1']).pole).toBe('negative');
  });

  it('a route declaring an axis is moved by the mortal standing on it', () => {
    // Heart and iron tie on capability; persuade also asks about honesty.
    const capabilities = { gold: 2, iron: 22, heart: 22 };
    expect(resolveRoute(capabilities, { profile: { [AXIS]: 0.9 } }).route).toBe('persuade');
    expect(resolveRoute(capabilities, { profile: { [AXIS]: -0.9 } }).route).toBe('intimidate');
  });

  it('FALSIFIER 3 — a tie is settled by the seed, and the same seed replays it', () => {
    const tied = { gold: 25, iron: 25, heart: 25 };
    const low = () => 0;
    const high = () => 0.99;

    const first = resolveRoute(tied, { rng: low }).route;
    expect(resolveRoute(tied, { rng: low }).route).toBe(first);

    const other = resolveRoute(tied, { rng: high }).route;
    expect(resolveRoute(tied, { rng: high }).route).toBe(other);
    // The draw must actually select — two ends of the stream reaching the same
    // route would pass a tiebreak that ignored its input entirely.
    expect(other).not.toBe(first);
  });

  it('takes no draw when one route wins outright', () => {
    const decisive = countingRng();
    executeStepResult(
      makeAction(routeTemplate()), routeTemplate(), 'success', [],
      buildRouteState({ gold: 40, iron: 5, heart: 5 }), decisive.rng, START_TICK,
    );
    const outrightDraws = decisive.draws();

    const tiedCounter = countingRng();
    executeStepResult(
      makeAction(routeTemplate()), routeTemplate(), 'success', [],
      buildRouteState({ gold: 25, iron: 25, heart: 25 }), tiedCounter.rng, START_TICK,
    );

    expect(tiedCounter.draws()).toBeGreaterThan(outrightDraws);
  });

  it('an axis-declaring route drifts the mortal; a pure-competence route does not', () => {
    const axisId = driftAxisIdForValuePair(AXIS);

    const persuaded = resolveRoute({ gold: 2, iron: 2, heart: 40 }, { profile: { [AXIS]: 0.5 } });
    expect(persuaded.route).toBe('persuade');
    const entry = persuaded.state.archetypeDrift.find(d => d.agentId === ACTOR && d.axisId === axisId);
    expect(entry?.toPosition).toBeCloseTo(BRANCH_DECISION_DRIFT_MAGNITUDE, 6);

    // Bribe declares no axis — there is no claim about character to record.
    const bribed = resolveRoute({ gold: 40, iron: 5, heart: 5 });
    expect(bribed.route).toBe('bribe');
    expect(bribed.state.archetypeDrift).toHaveLength(0);
  });

  it('emits one branch_decided trace carrying every route score', () => {
    resolveRoute({ gold: 40, iron: 10, heart: 10 });
    const decided = tracesOfCategory('branch_decided');
    expect(decided).toHaveLength(1);
    expect(decided[0].mode).toBe('route');
    expect(decided[0].resolvedRoute).toBe('bribe');
    expect(decided[0].decidedBy).toBe('fit');

    const scores = decided[0].routeScores as Array<Record<string, unknown>>;
    expect(scores.map(s => s.key)).toEqual(['bribe', 'intimidate', 'persuade']);
    expect(scores[0].capability as number).toBeGreaterThan(scores[1].capability as number);
  });
});

describe('THR-898 — route scoring and lean arithmetic', () => {
  it('scoreRoutes weights capability, axis standing, and cards by their constants', () => {
    const state = buildRouteState({ gold: 20, heart: 20 }, { [AXIS]: 1 });
    const cards = [routeCard('n1', 'bribe', 1)];
    const scores = scoreRoutes(
      state, ACTOR,
      [{ key: 'bribe', reach: 'gold' }, { key: 'persuade', reach: 'heart', axis: AXIS, toward: 'positive' }],
      cards, ['n1'],
    );

    const bribe = scores.find(s => s.key === 'bribe')!;
    const persuade = scores.find(s => s.key === 'persuade')!;

    expect(bribe.axisLean).toBe(0);            // declares no axis
    expect(bribe.cardLean).toBeCloseTo(1, 6);  // one card, weight 1
    expect(bribe.score).toBeCloseTo(
      ROUTE_DECISION_CAPABILITY_WEIGHT * bribe.capability + ROUTE_DECISION_CARD_WEIGHT * 1, 6,
    );

    expect(persuade.axisLean).toBeCloseTo(1, 6); // profile +1, toward positive
    expect(persuade.cardLean).toBe(0);           // the card names another route
    expect(persuade.score).toBeCloseTo(
      ROUTE_DECISION_CAPABILITY_WEIGHT * persuade.capability + ROUTE_DECISION_AXIS_WEIGHT * 1, 6,
    );
  });

  it('a route at the negative pole is served by a mortal leaning negative', () => {
    const state = buildRouteState({ shadow: 20 }, { [AXIS]: -1 });
    const [negative] = scoreRoutes(
      state, ACTOR, [{ key: 'cunning', reach: 'shadow', axis: AXIS, toward: 'negative' }], [], [],
    );
    // Without the toward-sign, a -1 standing would *subtract* from a route built
    // for exactly that mortal.
    expect(negative.axisLean).toBeCloseTo(1, 6);
  });

  it('sumRouteLean counts only cards naming the route, and skips unknown ids', () => {
    const cards = [routeCard('n1', 'bribe'), routeCard('n2', 'intimidate')];
    expect(sumRouteLean(cards, ['n1'], 'bribe')).toBeCloseTo(POLE_LEAN_DEFAULT_WEIGHT, 6);
    expect(sumRouteLean(cards, ['n2'], 'bribe')).toBe(0);
    expect(sumRouteLean(cards, ['nope'], 'bribe')).toBe(0);
  });

  it('a non-finite route weight abstains rather than poisoning the sum', () => {
    const bad = { ...routeCard('n1', 'bribe'), poleLean: { route: 'bribe', weight: Number.NaN } } as unknown as StepNudge;
    expect(routeLeanWeight(bad.poleLean, 'bribe')).toBe(0);
    expect(sumRouteLean([bad], ['n1'], 'bribe')).toBe(0);
  });

  it('an axis-explicit card contributes nothing to a route lean by name', () => {
    expect(routeLeanWeight({ axis: AXIS, toward: 'positive' }, 'bribe')).toBe(0);
    expect(routeLeanWeight('a', 'bribe')).toBe(0);
  });

  it('decideBranchRoute draws once for a tie and never for a clear winner', () => {
    const clear = countingRng();
    const won = decideBranchRoute(
      [{ key: 'a', capability: 0.9, axisLean: 0, cardLean: 0, score: 0.9 },
       { key: 'b', capability: 0.2, axisLean: 0, cardLean: 0, score: 0.2 }],
      clear.rng,
    );
    expect(won.routeKey).toBe('a');
    expect(won.decidedBy).toBe('fit');
    expect(clear.draws()).toBe(0);

    const tie = countingRng(0);
    const drawn = decideBranchRoute(
      [{ key: 'a', capability: 0.5, axisLean: 0, cardLean: 0, score: 0.5 },
       { key: 'b', capability: 0.5, axisLean: 0, cardLean: 0, score: 0.5 }],
      tie.rng,
    );
    expect(drawn.decidedBy).toBe('tiebreak');
    expect(tie.draws()).toBe(1);
  });

  it('an rng returning exactly 1 stays inside the tied set', () => {
    const result = decideBranchRoute(
      [{ key: 'a', capability: 0.5, axisLean: 0, cardLean: 0, score: 0.5 },
       { key: 'b', capability: 0.5, axisLean: 0, cardLean: 0, score: 0.5 }],
      () => 1,
    );
    expect(['a', 'b']).toContain(result.routeKey);
  });

  it('an empty route list resolves fail-soft rather than throwing (NFP #4)', () => {
    expect(() => decideBranchRoute([], () => 0.5)).not.toThrow();
    expect(decideBranchRoute([], () => 0.5).routeKey).toBe('');
  });
});

describe('THR-898 — route branch validation', () => {
  it('accepts a route branch whose variants key exactly its routes', () => {
    expect(() => assertValidStep(routeTemplate().steps[1], 'ok')).not.toThrow();
  });

  it('rejects a route branch with a variant key matching no route', () => {
    const branch = routeTemplate().steps[1] as ActionStepBranch;
    const typo = {
      ...branch,
      variants: { bribe: branch.variants.bribe, intimidat: branch.variants.intimidate, persuade: branch.variants.persuade },
    } as unknown as ActionStepBranch;
    expect(() => assertValidStep(typo, 'typo')).toThrow(/must key exactly its routes/);
  });

  it('rejects duplicate route keys', () => {
    const branch = routeTemplate().steps[1] as ActionStepBranch;
    const dupe = {
      ...branch,
      decidedBy: { routes: [{ key: 'bribe', reach: 'gold' }, { key: 'bribe', reach: 'iron' }] },
      variants: { bribe: branch.variants.bribe },
    } as unknown as ActionStepBranch;
    expect(() => assertValidStep(dupe, 'dupe')).toThrow(/duplicate route key/);
  });

  it('rejects a route naming a reach that does not exist', () => {
    const branch = routeTemplate().steps[1] as ActionStepBranch;
    const bogus = {
      ...branch,
      decidedBy: { routes: [{ key: 'bribe', reach: 'coin' }, { key: 'intimidate', reach: 'iron' }] },
      variants: { bribe: branch.variants.bribe, intimidate: branch.variants.intimidate },
    } as unknown as ActionStepBranch;
    expect(() => assertValidStep(bogus, 'bogus')).toThrow(/invalid reach/);
  });

  it('rejects a route declaring an axis with no toward pole', () => {
    const branch = routeTemplate().steps[1] as ActionStepBranch;
    const unsigned = {
      ...branch,
      decidedBy: { routes: [{ key: 'bribe', reach: 'gold' }, { key: 'persuade', reach: 'heart', axis: AXIS }] },
      variants: { bribe: branch.variants.bribe, persuade: branch.variants.persuade },
    } as unknown as ActionStepBranch;
    expect(() => assertValidStep(unsigned, 'unsigned')).toThrow(/no toward pole/);
  });

  it('rejects a route branch over the MAX_BRANCH_ROUTES cap', () => {
    const branch = routeTemplate().steps[1] as ActionStepBranch;
    const routes = Array.from({ length: MAX_BRANCH_ROUTES + 1 }, (_, i) => ({ key: `r${i}`, reach: 'gold' }));
    const variants = Object.fromEntries(routes.map(r => [r.key, branch.variants.bribe]));
    const tooMany = { ...branch, decidedBy: { routes }, variants } as unknown as ActionStepBranch;
    expect(() => assertValidStep(tooMany, 'toomany')).toThrow(/over the MAX_BRANCH_ROUTES cap/);
  });

  it('warns per route the god cannot argue for', () => {
    // No cards at all: all three routes unsteerable.
    expect(collectUnleanableBranchWarnings(routeTemplate())).toHaveLength(3);
    // One card for bribe leaves the other two.
    expect(collectUnleanableBranchWarnings(routeTemplate([routeCard('n1', 'bribe')]))).toHaveLength(2);
  });

  it('an axis card counts as a lever on the route that declares that axis', () => {
    // `persuade` declares AXIS, so an axis-explicit card steers it without
    // naming it — the warn is about steerability, not authoring form.
    const warnings = collectUnleanableBranchWarnings(routeTemplate([leaningCard('n1', 'positive')]));
    expect(warnings.map(w => w.includes("route 'persuade'"))).not.toContain(true);
    expect(warnings).toHaveLength(2);
  });
});

describe('THR-894 — template validation', () => {
  it('accepts a decidedBy branch keyed on exactly the two poles', () => {
    expect(() => assertValidStep(decidedTemplate().steps[1], 'ok')).not.toThrow();
  });

  it('rejects a decidedBy branch with a typo\'d variant key', () => {
    const branch = decidedTemplate().steps[1] as ActionStepBranch;
    const typo = {
      ...branch,
      variants: { positve: branch.variants.positive, negative: branch.variants.negative },
    } as unknown as ActionStepBranch;
    expect(() => assertValidStep(typo, 'typo')).toThrow(/must key exactly/);
  });

  it('rejects a decidedBy branch naming an axis that does not exist', () => {
    const branch = decidedTemplate().steps[1] as ActionStepBranch;
    const bogus = { ...branch, decidedBy: { axis: 'honour_treachery' } } as unknown as ActionStepBranch;
    expect(() => assertValidStep(bogus, 'bogus')).toThrow(/unknown axis/);
  });

  it('rejects a card whose poleLean names an axis that does not exist', () => {
    const step = concreteStep({
      nudges: [{ ...leaningCard('n1', 'positive'), poleLean: { axis: 'nope', toward: 'positive' } } as unknown as StepNudge],
    });
    expect(() => assertValidStep(step, 'bogus-card')).toThrow(/unknown axis/);
  });

  it('warns — but does not fail — when the god has no lever on the direction', () => {
    expect(collectUnleanableBranchWarnings(decidedTemplate())).toHaveLength(1);
    expect(collectUnleanableBranchWarnings(decidedTemplate([leaningCard('n1', 'positive')]))).toHaveLength(0);
  });

  it('the warn fires on an off-axis card, which is its whole point', () => {
    const offAxis = {
      ...leaningCard('n1', 'positive'),
      poleLean: { axis: 'mercy_ruthlessness', toward: 'positive' },
    } as StepNudge;
    // Reads as leaning, contributes nothing — exactly the silent authoring error
    // the warn exists to surface.
    expect(collectUnleanableBranchWarnings(decidedTemplate([offAxis]))).toHaveLength(1);
  });
});
