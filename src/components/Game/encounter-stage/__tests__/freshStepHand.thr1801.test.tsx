// @vitest-environment jsdom
/**
 * THR-1801 — a chapter's second step opens with an empty hand.
 *
 * Cold playtest round 3 (skimmer): "my cards were silently re-used and charged
 * for step 2." Step 2 of a two-step chapter opened with step 1's cards already
 * pressed, and committing it billed them again. Three leaks, one per layer:
 *
 *  - engine: `advanceStep` carried `activeNudges` into the next step, so the
 *    builder restored step 1's hand as step 2's `committedIds` (and step 2
 *    resolved with cards nobody paid for — dealt ids repeat across steps);
 *  - hook: `useNudgeHand` seeded its selection once, and the veil stays
 *    mounted across a step change, so the selection survived by itself;
 *  - the commit then charged whatever was selected.
 *
 * The test drives a two-step chapter through the real builder, the real step
 * advance and the real hook: commit on step 1, advance, open step 2.
 */

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { WorldGraph } from '../../../../engine/graph';
import { advanceStep } from '../../../../engine/unifiedActionLifecycle';
import type { GameState } from '../../../../types/gameState';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';
import { buildNudgePhaseModel } from '../adapters/buildNudgePhaseModel';
import { handStepKey, useNudgeHand } from '../useNudgeHand';

// The same two cards on both steps — what dealt cards look like (`dealt.<id>`
// is minted identically on every step), and exactly why the leak matched.
const NUDGES: StepNudge[] = [
  { id: 'light_the_deed', name: 'Light The Deed', essenceCost: 3, forecastDelta: 0.05, effectLine: 'The deed is seen.' },
  { id: 'press_the_odds', name: 'Press The Odds', essenceCost: 2, forecastDelta: 0.05, effectLine: 'The odds lean.' },
];

function step(narrativeTemplate: string): ActionStep {
  return {
    reach: 'mind',
    duration: { min: 1, max: 1 },
    difficulty: 0.5,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    narrativeTemplate,
    nudges: NUDGES,
  };
}

const TEMPLATE: UnifiedActionTemplate = {
  id: 'test.decipher_old_markings',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'Decipher Old Markings',
  reach: 'mind',
  crudType: 'read',
  scale: 'local',
  steps: [step('The first line.'), step('The second line.')],
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence'],
  narrativeTemplates: { initiation: 'Markings.', success: 'Read.', failure: 'Unread.' },
};

const STEP_ONE_COMMITTED: UnifiedAction = {
  actionId: 'ua_decipher',
  actorId: 'agent.reader',
  templateId: TEMPLATE.id,
  targetId: 'loc.ruin',
  scale: 'local',
  source: 'agent',
  startTick: 3,
  currentStep: 0,
  stepProgress: 1,
  stepDuration: 1,
  resolved: false,
  stepOutcomes: [],
  // Step 1's hand, as GameView's commit writes it.
  activeNudges: ['light_the_deed', 'press_the_odds'],
  choiceHistory: [{
    stepIndex: 0,
    stepId: `${TEMPLATE.id}.1`,
    choiceId: 'light_the_deed',
    choiceText: 'Light The Deed, Press The Odds',
    interventionType: 'nudge_committed',
    essenceSpent: 5,
    probabilityBoost: 0,
    tick: 3,
  }],
};

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'agent.reader', type: 'actor', name: 'Thessa', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc.ruin', type: 'location', name: 'The Ruin', properties: {} });
  return graph;
}

function buildState(): GameState {
  return {
    essencePool: { mind: 39 },
    unlockedActionIds: [],
    ascendantIdentity: {
      hungerId: 'hunger.witness',
      sphereAlignment: { primary: 'mind', secondary: 'force' },
    },
  } as unknown as GameState;
}

function phaseFor(action: UnifiedAction) {
  return buildNudgePhaseModel({
    template: TEMPLATE,
    activeAction: action,
    step: TEMPLATE.steps[action.currentStep] as ActionStep,
    graph: buildGraph(),
    gameState: buildState(),
  })!;
}

const stepTwo = () => advanceStep(STEP_ONE_COMMITTED, 'success', TEMPLATE, () => 0.5);

describe('THR-1801 — the step advance spends the hand', () => {
  it('drops activeNudges on advancing to the next step, and keeps the per-step record', () => {
    const next = stepTwo();
    expect(next.currentStep).toBe(1);
    expect(next.activeNudges).toBeUndefined();
    expect(next.choiceHistory?.map((e) => e.stepIndex)).toEqual([0]);
  });

  it('keeps the hand on the final step, where the aftermath dispatch reads it', () => {
    const last = advanceStep({ ...STEP_ONE_COMMITTED, currentStep: 1 }, 'success', TEMPLATE, () => 0.5);
    expect(last.resolved).toBe(true);
    expect(last.activeNudges).toEqual(['light_the_deed', 'press_the_odds']);
  });

  it('step 2 restores no committed cards and owes nothing', () => {
    const phase = phaseFor(stepTwo());
    expect(phase.stepIndex).toBe(1);
    expect(phase.committedIds).toEqual([]);
    expect(phase.committedCost).toBe(0);
  });

  it('a re-opened step still restores its own committed hand', () => {
    const phase = phaseFor(STEP_ONE_COMMITTED);
    expect(phase.committedIds).toEqual(['light_the_deed', 'press_the_odds']);
  });
});

describe('THR-1801 — the hand restarts on a new step', () => {
  it('nothing is pre-selected on step 2 and the pool reads unspent', () => {
    const stepOnePhase = phaseFor({ ...STEP_ONE_COMMITTED, activeNudges: undefined, choiceHistory: [] });
    const { result, rerender } = renderHook(({ phase }) => useNudgeHand(phase), {
      initialProps: { phase: stepOnePhase },
    });

    act(() => {
      result.current.toggle('light_the_deed');
      result.current.toggle('press_the_odds');
    });
    expect(result.current.selectedIds).toEqual(['light_the_deed', 'press_the_odds']);

    // Same mounted hook — the veil does not remount between steps.
    const stepTwoPhase = phaseFor(stepTwo());
    rerender({ phase: stepTwoPhase });

    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.cards.every((c) => !c.selected)).toBe(true);
    expect(result.current.selectedCost).toBe(0);
    expect(result.current.remainingEssence).toBe(stepTwoPhase.availableEssence);
    expect(result.current.budget).toEqual({ sphere: 'mind', remaining: 39 });
  });

  it('a re-render of the same step keeps the player\'s picks', () => {
    const phase = phaseFor({ ...STEP_ONE_COMMITTED, activeNudges: undefined, choiceHistory: [] });
    const { result, rerender } = renderHook(({ p }) => useNudgeHand(p), { initialProps: { p: phase } });
    act(() => result.current.toggle('press_the_odds'));
    // A fresh model object for the same step (the builder re-runs every tick).
    rerender({ p: phaseFor({ ...STEP_ONE_COMMITTED, activeNudges: undefined, choiceHistory: [] }) });
    expect(result.current.selectedIds).toEqual(['press_the_odds']);
  });

  it('handStepKey separates steps and actions', () => {
    const a = phaseFor(STEP_ONE_COMMITTED);
    const b = phaseFor(stepTwo());
    expect(handStepKey(a)).not.toBe(handStepKey(b));
    expect(handStepKey(undefined)).toBe('');
  });
});
