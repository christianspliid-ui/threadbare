/**
 * THR-2257 — a lost chapter never raises reputation.
 *
 * Cold playtest round 8 (3/3 testers): two-step templates author about +0.02 on
 * a step's success and −0.01 on its failure, and each step's delta lands as the
 * step resolves. "Pass step 1, fail step 2" netted +0.01, so the ending read
 * "Seren lost Decipher Old Markings" over "Seren's reputation rose a little",
 * against the "At Stake" line that promised a fall on failure.
 *
 * The rule: a lost ending forfeits the earlier steps' gains. These arms pin it
 * through the real resolution path, the pure settle arithmetic, and the
 * "At Stake" line's agreement with the applied total.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { WorldGraph } from '../graph';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import {
  isLostActionOutcome,
  settleLostEncounterReputation,
} from '../reputationAftermathFold';
import { buildFalloutPreview, type BuildUnifiedEncounterStageModelArgs } from '../views/stage/buildUnifiedEncounterStageModel';
import type {
  ActionStep,
  StepOutcome,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';

const fixedRng = () => 0.5;
const START_SCORE = 0.5;

function createMinimalGameState(score = START_SCORE): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Seren',
    properties: { actorType: 'individual', reputationScore: score },
  });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Market', properties: {} });
  graph.addEdge({
    id: 'edge-loc-1', source: 'actor-1', target: 'loc-1',
    type: 'located_at', properties: {},
  });
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
    chronicle: {} as never,
  } as unknown as GameState;
}

/** The corpus shape: +0.02 on a step's success, −0.01 on its failure. */
function step(failBehavior: ActionStep['failBehavior'], success = 0.02, failure = -0.01): ActionStep {
  return {
    reach: 'eye',
    duration: { min: 1, max: 1 },
    difficulty: 0.42,
    onSuccess: [],
    onFailure: [],
    failBehavior,
    successMetadata: { reputationDelta: success },
    failureMetadata: { reputationDelta: failure },
  } as ActionStep;
}

function makeTemplate(steps: readonly ActionStep[]): UnifiedActionTemplate {
  return {
    id: 'encounter.test.decipher-old-markings',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Decipher Old Markings',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    steps,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  } as unknown as UnifiedActionTemplate;
}

function run(template: UnifiedActionTemplate, state: GameState, outcomes: readonly StepOutcome[]) {
  let action: UnifiedAction = createUnifiedAction({
    actorId: 'actor-1', templateId: template.id, targetId: 'loc-1',
    scale: 'local', source: 'agent', tick: 0, template, rng: fixedRng,
  });
  let beforeLast = action;
  for (const outcome of outcomes) {
    beforeLast = action;
    action = executeStepResult(action, template, outcome, [], state, fixedRng, 10).updatedAction;
  }
  return { action, beforeLast };
}

const reputationRows = (action: UnifiedAction) =>
  (action.aftermathChanges ?? []).filter(c => c.kind === 'reputation');
const scoreOf = (state: GameState) => state.graph.getNode('actor-1')!.properties.reputationScore as number;

describe('THR-2257 — a lost two-step encounter never nets a rise', () => {
  beforeEach(() => {
    resetUnifiedActionCounter();
    clearTraces();
    enableTracing();
  });
  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('pass step 1 (+0.02), fail step 2 (−0.01): the change is ≤ 0 and the row reads as a fall', () => {
    const state = createMinimalGameState();
    const { action } = run(makeTemplate([step('fail_action'), step('fail_action')]), state, ['success', 'failure']);

    expect(action.resolved).toBe(true);
    expect(isLostActionOutcome(action.outcome)).toBe(true);
    // The sheet: the step-1 gain is forfeited, the step-2 loss stands.
    expect(scoreOf(state) - START_SCORE).toBeCloseTo(-0.01, 6);
    const rows = reputationRows(action);
    expect(rows).toHaveLength(1);
    expect(rows[0].polarity).toBe('loss');
    expect(rows[0].magnitude?.raw).toBeCloseTo(-0.01, 6);
    expect(rows[0].detail).not.toMatch(/rose/);
  });

  it('traces the correction, keeping the step-level movement', () => {
    const state = createMinimalGameState();
    run(makeTemplate([step('fail_action'), step('fail_action')]), state, ['success', 'failure']);
    const settled = getTraces().filter(t => t.category === 'reputation_lost_encounter_settled');
    expect(settled).toHaveLength(1);
    const t = settled[0] as unknown as { priorNet: number; stepNet: number; correction: number; settledNet: number };
    expect(t.priorNet).toBeCloseTo(0.02, 6);
    expect(t.stepNet).toBeCloseTo(-0.01, 6);
    expect(t.correction).toBeCloseTo(-0.02, 6);
    expect(t.settledNet).toBeCloseTo(-0.01, 6);
  });

  it('a won two-step encounter still nets its gain (no regression)', () => {
    const state = createMinimalGameState();
    const { action } = run(makeTemplate([step('fail_action'), step('fail_action')]), state, ['success', 'success']);
    expect(isLostActionOutcome(action.outcome)).toBe(false);
    expect(scoreOf(state) - START_SCORE).toBeCloseTo(0.04, 6);
    const rows = reputationRows(action);
    expect(rows).toHaveLength(1);
    expect(rows[0].polarity).toBe('gain');
    expect(rows[0].magnitude?.raw).toBeCloseTo(0.04, 6);
    expect(getTraces().filter(t => t.category === 'reputation_lost_encounter_settled')).toHaveLength(0);
  });

  it('a chapter won at a price keeps what its steps earned — it is a win, not a loss', () => {
    const state = createMinimalGameState();
    const { action } = run(
      makeTemplate([step('continue_weakened'), step('continue_weakened')]), state, ['success', 'failure'],
    );
    expect(action.outcome).toBe('success_at_cost');
    expect(scoreOf(state) - START_SCORE).toBeCloseTo(0.01, 6);
  });

  it('an earlier gain with a silent ending step leaves no row and no rise', () => {
    const state = createMinimalGameState();
    const { action } = run(
      makeTemplate([step('fail_action'), step('fail_action', 0.02, 0)]), state, ['success', 'failure'],
    );
    expect(isLostActionOutcome(action.outcome)).toBe(true);
    expect(scoreOf(state)).toBeCloseTo(START_SCORE, 6);
    expect(reputationRows(action)).toHaveLength(0);
  });

  it('a chapter lost on its first step is unchanged — nothing to forfeit', () => {
    const state = createMinimalGameState();
    const { action } = run(makeTemplate([step('fail_action'), step('fail_action')]), state, ['failure']);
    expect(action.resolved).toBe(true);
    expect(scoreOf(state) - START_SCORE).toBeCloseTo(-0.01, 6);
    expect(reputationRows(action)[0].magnitude?.raw).toBeCloseTo(-0.01, 6);
    expect(getTraces().filter(t => t.category === 'reputation_lost_encounter_settled')).toHaveLength(0);
  });

  it('the "At Stake" line and the applied total agree for a lost encounter', () => {
    const template = makeTemplate([step('fail_action'), step('fail_action')]);
    const state = createMinimalGameState();
    const { action, beforeLast } = run(template, state, ['success', 'failure']);

    // What the player read on the step that lost it.
    const fallout = buildFalloutPreview({ template, activeAction: beforeLast } as BuildUnifiedEncounterStageModelArgs);
    const failureLine = fallout.find(f => f.kind === 'reputation' && /on failure/.test(f.label));
    expect(failureLine?.label).toBe('Reputation may decrease on failure');

    // What the ending applied: a fall, on the sheet and on the row.
    expect(scoreOf(state)).toBeLessThan(START_SCORE);
    expect(reputationRows(action)[0].polarity).toBe('loss');
  });
});

describe('THR-2257 — the settle arithmetic', () => {
  it('forfeits an earlier gain and keeps the ending step\'s loss', () => {
    const s = settleLostEncounterReputation({ priorNet: 0.02, stepNet: -0.01 });
    expect(s.settledNet).toBeCloseTo(-0.01, 6);
    expect(s.correction).toBeCloseTo(-0.02, 6);
  });

  it('keeps an earlier loss', () => {
    const s = settleLostEncounterReputation({ priorNet: -0.03, stepNet: -0.01 });
    expect(s.settledNet).toBeCloseTo(-0.04, 6);
    expect(s.correction).toBe(0);
  });

  it('never settles above zero, even when the ending step itself rose', () => {
    const s = settleLostEncounterReputation({ priorNet: 0, stepNet: 0.02 });
    expect(s.settledNet).toBe(0);
    expect(s.correction).toBeCloseTo(-0.02, 6);
  });

  it('an earlier loss can absorb an ending-step rise', () => {
    const s = settleLostEncounterReputation({ priorNet: -0.05, stepNet: 0.02 });
    expect(s.settledNet).toBeCloseTo(-0.03, 6);
    expect(s.correction).toBe(0);
  });

  it('names exactly the outcomes the ending sentence calls lost', () => {
    expect(isLostActionOutcome('failure')).toBe(true);
    expect(isLostActionOutcome('critical_failure')).toBe(true);
    expect(isLostActionOutcome('contested_lost')).toBe(true);
    expect(isLostActionOutcome('success_at_cost')).toBe(false);
    expect(isLostActionOutcome('contested_won')).toBe(false);
    expect(isLostActionOutcome(undefined)).toBe(false);
  });
});
