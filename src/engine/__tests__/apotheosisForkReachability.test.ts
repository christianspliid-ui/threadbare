/**
 * The Apotheosis — the converted fork is reachable BOTH ways, and the grant is
 * band-gated (THR-1086, closing THR-866).
 *
 * ─── Why this test exists as an engine test, not a data test ─────────
 *
 * The template's own test (`src/data/encounters/__tests__/apotheosis-ascension.test.ts`)
 * asserts the *authored shape*: the pole keys, the band coverage, the hand. None
 * of that proves the engine ever takes either branch. The ticket's Done-when is
 * explicit that reachability must be "demonstrated on a real draw — not asserted
 * from the schema", and this is that demonstration: the choice history comes from
 * the engine's own `applyAgentDecidedBranches`, and the ending comes from the
 * shipped `resolveAftermathVariant` over the shipped `aftermathConfig`.
 *
 * ─── The observation that made it necessary ──────────────────────────
 *
 * Driving the live sim during verification, five consecutive apotheosis draws all
 * ended on the Survivor pole. That is exactly what a fork which *never fires*
 * looks like, because `fallback` is the Survivor variant — and, worse, it is
 * indistinguishable from the outside: `fallback: { ...WITHHOLD_AFTERMATH }` is a
 * spread copy, so `variants.negative` and `fallback` render byte-identical prose.
 * A browser observation cannot tell those two apart on any number of draws. This
 * test can, because it reads the recorded `choiceId`.
 *
 * Modelled on `sliceForkAftermathResolution.test.ts` (THR-979), which caught the
 * same class of defect on the crossroads fork.
 */

import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { applyAgentDecidedBranches } from '../encounters/branchDecision';
import { APOTHEOSIS_ASCENSION_TEMPLATE as TEMPLATE } from '../../data/encounters/apotheosis-ascension';
import {
  isActionStepBranch,
  isStepSuccess,
  resolveAftermathVariant,
} from '../../types/unifiedAction';
import { resolveStepDefinition } from '../unifiedActionLifecycle';
import type { ActionStep, StepOutcome, UnifiedAction } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const ACTOR = 'agent.devotee';
const TICK = 40;

/** Read the fork off the shipped template — never re-declared here. */
const FORK = TEMPLATE.steps.filter(isActionStepBranch).find(step => step.decidedBy)!;
const AXIS = (FORK.decidedBy as { axis: string }).axis;

function buildState(profileValue: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ACTOR,
    type: 'actor',
    name: 'The Faithful One',
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
function buildAction(activeNudges?: readonly string[]): UnifiedAction {
  return {
    actionId: 'ua_apotheosis_1',
    actorId: ACTOR,
    templateId: TEMPLATE.id,
    targetId: ACTOR,
    scale: 'local',
    source: 'agent',
    startTick: TICK - 2,
    currentStep: FORK.branchOnStep,
    stepProgress: 0,
    stepDuration: 1,
    resolved: false,
    stepOutcomes: [],
    activeNudges,
  } as unknown as UnifiedAction;
}

/**
 * Run the real decision, then the real step lookup and the real ending lookup.
 * `rng` is pinned so a decision that reaches the coin is still deterministic —
 * but every assertion below is written against a conviction strong enough to
 * clear `BRANCH_DECISION_NEUTRAL_EPSILON`, so the coin is never the thing under
 * test.
 */
function draw(profileValue: number, activeNudges?: readonly string[], outcome: 'success' | 'failure' = 'success') {
  const state = buildState(profileValue);
  const decidingStep = TEMPLATE.steps[FORK.branchOnStep] as ActionStep;

  const applied = applyAgentDecidedBranches(
    state, buildAction(activeNudges), TEMPLATE, decidingStep, TICK, () => 0.5,
  );

  const history = applied.action.choiceHistory ?? [];
  return {
    history,
    choiceId: history[0]?.choiceId,
    // The step the engine will actually run for step 1, given that decision.
    step: resolveStepDefinition(TEMPLATE, 1, history) as ActionStep,
    ending: resolveAftermathVariant(TEMPLATE.aftermathConfig!, history, outcome),
  };
}

const FALLBACK_OVERVIEW = TEMPLATE.aftermathConfig!.fallback.overview;

describe('the fork fires at all', () => {
  it('records a decision at the step the aftermath reads', () => {
    const { history } = draw(0.9);
    expect(history).toHaveLength(1);
    expect(history[0].stepIndex).toBe(TEMPLATE.aftermathConfig!.branchOnStep);
    expect(history[0].interventionType).toBe('agent_decided');
  });
});

describe('reachable BOTH ways, on the mortal’s own conviction', () => {
  it('a Martyr pours through', () => {
    const { choiceId, step } = draw(0.9);
    expect(choiceId).toBe('positive');
    expect(step.purposeLine).toBe('Fill the vessel');
  });

  it('a Survivor keeps themselves', () => {
    const { choiceId, step } = draw(-0.9);
    expect(choiceId).toBe('negative');
    expect(step.purposeLine).toBe('Close it gently');
  });

  it('the two draws take genuinely different steps', () => {
    // Guards against both poles resolving to the same variant — which is what a
    // mis-keyed `variants` map produces, via `fallback`, on every draw.
    expect(draw(0.9).step.purposeLine).not.toBe(draw(-0.9).step.purposeLine);
  });
});

describe('the god’s hand can carry an undecided mortal to either pole', () => {
  // A neutral mortal is the case the cards exist for. These assert the *cards*
  // move the decision, which is the whole substitution the Nudge Model made:
  // the god argues, the mortal chooses.
  const martyrCards = ['apotheosis.the_years_they_gave', 'apotheosis.one_more_breath'];
  const survivorCards = ['apotheosis.let_the_morning_in', 'apotheosis.count_what_it_costs'];

  it('committed Martyr cards carry a neutral mortal to the vessel', () => {
    expect(draw(0, martyrCards).choiceId).toBe('positive');
  });

  it('committed Survivor cards carry a neutral mortal to the morning', () => {
    expect(draw(0, survivorCards).choiceId).toBe('negative');
  });

  it('a god that commits nothing gets the mortal’s own answer, not a default', () => {
    // Conviction, not the coin: a mortal who leans decides for themselves even
    // when the god spends no essence at all.
    expect(draw(0.5, []).choiceId).toBe('positive');
    expect(draw(-0.5, []).choiceId).toBe('negative');
  });
});

describe('each pole reaches its OWN authored ending, never the fallback', () => {
  it('the Martyr ending is the vessel opening', () => {
    const { ending } = draw(0.9);
    expect(ending.overview).not.toBe(FALLBACK_OVERVIEW);
    expect(ending.overview).toContain('aspect of the god moves among mortals');
  });

  it('the Survivor ending is the doorway closing', () => {
    const { ending } = draw(-0.9);
    expect(ending.overview).toContain('wholly and finitely their own');
  });

  it('a band override reaches the player, layered on the decided pole', () => {
    // choice → band → base. Both halves have to agree or the band is dead prose.
    const state = buildState(0.9);
    const applied = applyAgentDecidedBranches(
      state, buildAction(), TEMPLATE, TEMPLATE.steps[0] as ActionStep, TICK, () => 0.5,
    );
    const unmade = resolveAftermathVariant(
      TEMPLATE.aftermathConfig!, applied.action.choiceHistory, 'failure',
    );
    expect(unmade.overview).toContain('The frame did not hold');
    expect(unmade.changes.some(c => c.title === 'Unmade')).toBe(true);
  });
});

describe('the grant is gated on the band, and only on the Martyr pole', () => {
  const UPPER: StepOutcome[] = ['critical_success', 'success', 'success_at_cost', 'near_miss'];
  const LOWER: StepOutcome[] = ['failure', 'critical_failure'];

  function grantsOn(profileValue: number, outcome: StepOutcome): boolean {
    const { step } = draw(profileValue);
    // The engine's own split — `getStepOutcomeMetadata` picks by `isStepSuccess`.
    const metadata = isStepSuccess(outcome) ? step.successMetadata : step.failureMetadata;
    return (metadata?.effects ?? []).some(e => e.kind === 'grant_aspect');
  }

  it('sweeps a non-empty band set', () => {
    // Both loops below would pass vacuously over an empty list.
    expect(UPPER.length + LOWER.length).toBe(6);
  });

  it.each(UPPER)('Martyr + %s grants the aspect', (outcome) => {
    expect(grantsOn(0.9, outcome)).toBe(true);
  });

  it.each(LOWER)('Martyr + %s does NOT grant — this is the unmade ending', (outcome) => {
    expect(grantsOn(0.9, outcome)).toBe(false);
  });

  it.each([...UPPER, ...LOWER])('Survivor + %s never grants', (outcome) => {
    expect(grantsOn(-0.9, outcome)).toBe(false);
  });
});

describe('taking the fork moves the mortal', () => {
  it('drifts the decided pole onto the mortal’s axis', () => {
    // The loop that makes repeated choices become character. Without it the fork
    // reads the mortal and never writes back, and a god cannot shape anyone.
    const martyr = applyAgentDecidedBranches(
      buildState(0.9), buildAction(), TEMPLATE, TEMPLATE.steps[0] as ActionStep, TICK, () => 0.5,
    );
    const survivor = applyAgentDecidedBranches(
      buildState(-0.9), buildAction(), TEMPLATE, TEMPLATE.steps[0] as ActionStep, TICK, () => 0.5,
    );
    expect(martyr.archetypeDrift.length).toBeGreaterThan(0);
    expect(survivor.archetypeDrift.length).toBeGreaterThan(0);
    // `ArchetypeDrift` records positions, not a delta — the movement is
    // `toPosition - fromPosition` on the axis this fork decides.
    const movement = (d: GameState['archetypeDrift']): number =>
      d.reduce((sum, entry) => sum + (entry.toPosition - entry.fromPosition), 0);
    // Opposite directions, which is what "the choice is theirs to keep" means.
    expect(movement(martyr.archetypeDrift)).toBeGreaterThan(0);
    expect(movement(survivor.archetypeDrift)).toBeLessThan(0);
  });
});
