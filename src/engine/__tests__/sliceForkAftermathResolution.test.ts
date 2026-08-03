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
function buildAction(): UnifiedAction {
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
  } as unknown as UnifiedAction;
}

/**
 * Run the real decision, then the real variant lookup. `profileValue` picks the
 * side: the fork reads the mortal's standing on its own axis, so a conviction
 * strong enough to clear the neutral band decides without consuming the coin.
 */
function resolveEnding(profileValue: number) {
  const state = buildState(profileValue);
  const decidingStep = SLICE_BARGAIN_AT_CROSSROADS.steps[FORK.branchOnStep] as ActionStep;

  const applied = applyAgentDecidedBranches(
    state,
    buildAction(),
    SLICE_BARGAIN_AT_CROSSROADS,
    decidingStep,
    TICK,
    () => 0.5,
  );

  const variant = resolveAftermathVariant(
    SLICE_BARGAIN_AT_CROSSROADS.aftermathConfig!,
    applied.action.choiceHistory,
    'success',
  );

  return { choiceHistory: applied.action.choiceHistory ?? [], variant };
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
