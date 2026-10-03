/**
 * Nudge detection escalation — THR-1690.
 *
 * A committed card's `detectionDelta` writes regional pressure through
 * `applyRawDetectionDelta`. Before THR-1690 that write stopped there: the
 * crossing-and-seed block (`recordDetectionCrossings`) had lost its only caller
 * with the retired choice-commit loop (THR-964), so no amount of nudge attention
 * ever traced a `detection_threshold_crossed` or planted a `shadow.rival_strike`.
 *
 * These tests drive the **real** dispatcher across all three bands, threading the
 * returned state from one hand to the next exactly as the aftermath phase does.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { dispatchNudgeCommitments } from '../nudgeDispatch';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../../simulationRuntime';
import type { GameState } from '../../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction } from '../../../types/unifiedAction';

const ACTOR = 'actor-hero';
const REGION = 'region-vale';
/** Four hands of this delta walk 0 → 0.3 → 0.6 → 0.9 → 1.0 (clamped): one band per hand after the first. */
const STEP_DELTA = 0.3;

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
    tick: 50, seed: 42, graph,
    unifiedActions: [], hiddenMarks: [], emittedOmens: [],
    regionalDetectionPressure: [],
  } as unknown as GameState;
}

function makeAction(actorId: string | undefined = ACTOR): UnifiedAction {
  return {
    actionId: 'ua_test', actorId, templateId: 'enc.test', targetId: actorId,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome: 'success', stepOutcomes: [],
  } as unknown as UnifiedAction;
}

function card(detectionDelta: number): StepNudge {
  return {
    id: `card.detect.${detectionDelta}`,
    name: 'Test Card',
    essenceCost: 2,
    forecastDelta: 0.05,
    effectLine: 'It draws the eye.',
    costs: { detectionDelta },
  } as StepNudge;
}

function play(state: GameState, delta: number, tick: number, runtime: SimulationRuntime, actorId?: string): GameState {
  const c = card(delta);
  const step = { nudges: [c] } as Pick<ActionStep, 'nudges'>;
  return dispatchNudgeCommitments(state, makeAction(actorId), step, [c.id], tick, runtime).state;
}

function crossings(): string[] {
  return getTraces()
    .filter((t) => t.category === 'detection_threshold_crossed')
    .map((t) => (t as { thresholdCrossed?: string }).thresholdCrossed ?? '?');
}

describe('nudge detection pressure escalates (THR-1690)', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('traces one crossing per band and plants one rival strike at the encounter band', () => {
    let state = buildState();
    state = play(state, STEP_DELTA, 50, runtime);
    expect(crossings()).toEqual([]);
    state = play(state, STEP_DELTA, 51, runtime);
    expect(crossings()).toEqual(['notice']);
    state = play(state, STEP_DELTA, 52, runtime);
    expect(crossings()).toEqual(['notice', 'turn']);
    expect(state.pendingEncounterSeeds ?? []).toHaveLength(0);
    state = play(state, STEP_DELTA, 53, runtime);
    expect(crossings()).toEqual(['notice', 'turn', 'encounter']);

    const seeds = state.pendingEncounterSeeds ?? [];
    expect(seeds).toHaveLength(1);
    expect(seeds[0].encounterFamily).toBe('shadow.rival_strike');
    expect(seeds[0].targetAgentId).toBe(ACTOR);
    expect(seeds[0].sourceEncounterId).toBe(`detection.escalation.${REGION}`);

    // Pinned at the ceiling: nothing left to cross, and no second strike.
    state = play(state, STEP_DELTA, 54, runtime);
    expect(crossings()).toHaveLength(3);
    expect(state.pendingEncounterSeeds ?? []).toHaveLength(1);
  });

  it('a lowering card (The Veil) crosses nothing', () => {
    let state = buildState();
    state = play(state, 0.9, 50, runtime);
    clearTraces();
    state = play(state, -0.5, 51, runtime);
    expect(crossings()).toEqual([]);
    expect(state.pendingEncounterSeeds ?? []).toHaveLength(0);
  });

  it('a jump across every band in one hand traces all three and seeds once', () => {
    const state = play(buildState(), 1, 50, runtime);
    expect(crossings()).toEqual(['notice', 'turn', 'encounter']);
    expect(state.pendingEncounterSeeds ?? []).toHaveLength(1);
  });

  it('leaves the seed queue untouched when no band is crossed', () => {
    const before = buildState();
    const after = play(before, 0.1, 50, runtime);
    expect(after.pendingEncounterSeeds).toBeUndefined();
  });

  it('fail-soft: no actor still traces the crossing but plants no strike', () => {
    const state = play(buildState(), 1, 50, runtime, '');
    expect(crossings()).toContain('encounter');
    expect(state.pendingEncounterSeeds ?? []).toHaveLength(0);
  });
});
