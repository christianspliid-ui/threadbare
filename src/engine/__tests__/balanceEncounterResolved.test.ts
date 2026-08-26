/**
 * THR-1284 — `encounter_resolved` on the unified-action resolution path.
 *
 * The counter existed, the summary read it, and nothing on any live path ever
 * emitted it: the only producer was the legacy progress block in
 * `orchestrator.ts`, while every `start_local` decision builds a *unified*
 * action from the encounter template. `balance summary` therefore printed
 * "Encounters: 0 attempted" on a seed-42 run carrying 398 `start_local`
 * decisions — a false zero on the instrument balance verdicts are read from.
 *
 * The discriminator is the load-bearing half. `action_resolved` already counts
 * every unified action, divine and strategic verbs included, so the encounter
 * emit has to fire on the encounter subset and *only* there. These tests drive
 * both arms through the real `executeStepResult`.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import { createSimulationRuntime } from '../simulationRuntime';
import { getBalanceEvents } from '../balanceTelemetry';
import { getAnyEncounterById } from '../../data/encounter-content';
import { isEncounterAction } from '../chapterArchive';
import { WorldGraph } from '../graph';
import { resetOpCounter } from '../graphOpExecutor';
import type { SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { BalanceEvent } from '../../types/balanceEval';
import type { RarityTier } from '../../types/rarity';

/**
 * A real, shipped encounter id. The test deliberately keys off live content
 * rather than a fixture: `isEncounterAction` resolves through the encounter
 * libraries, so a fixture id would make the encounter arm vacuous — it would
 * take the non-encounter branch and pass for the wrong reason.
 */
const REAL_ENCOUNTER_ID = 'encounter.deep_descent';

/** A real non-encounter unified action id shape — a divine/agent verb. */
const NON_ENCOUNTER_ID = 'action.iron.test';

const successRng = () => 0.01;

/**
 * One-step template carrying whichever id the arm is testing. The id is what
 * the predicate reads; the step shape is kept minimal so the action resolves in
 * a single `executeStepResult` call and the test measures the emit, not the
 * template's own content.
 */
function makeTemplate(id: string, rarityTier: RarityTier = 1): UnifiedActionTemplate {
  return {
    id,
    rarityTier,
    intrinsicTier: 'background',
    name: 'Telemetry Probe',
    reach: 'iron',
    crudType: 'update',
    scale: 'personal',
    steps: [{
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.3,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  };
}

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'agent-1',
    type: 'actor',
    name: 'Probe Actor',
    properties: {},
  });
  return { tick: 5, graph, unifiedActions: [] } as unknown as GameState;
}

/** Resolve a one-step action to completion and return the balance events emitted. */
function resolveOnce(template: UnifiedActionTemplate): {
  runtime: SimulationRuntime;
  events: readonly BalanceEvent[];
} {
  const runtime = createSimulationRuntime();
  const state = makeState();
  const action = createUnifiedAction({
    actorId: 'agent-1',
    templateId: template.id,
    targetId: 'agent-1',
    scale: template.scale,
    source: 'agent',
    template,
    tick: state.tick,
    rng: successRng,
  });

  executeStepResult(
    action,
    template,
    'success',
    [],
    state,
    successRng,
    state.tick,
    { capability: 40, probability: 0.7, roll: 2 },
    runtime,
  );

  return { runtime, events: getBalanceEvents(runtime) };
}

beforeEach(() => {
  resetUnifiedActionCounter();
  resetOpCounter();
});

describe('THR-1284 — encounter_resolved fires on the unified-action path', () => {
  it('the encounter arm is not vacuous: the chosen id is live content', () => {
    // If this fails the encounter arm below is silently testing the *non*-encounter
    // branch. Pin it explicitly rather than discovering it as a passing test.
    expect(getAnyEncounterById(REAL_ENCOUNTER_ID)).toBeDefined();
    expect(isEncounterAction(REAL_ENCOUNTER_ID)).toBe(true);
    expect(isEncounterAction(NON_ENCOUNTER_ID)).toBe(false);
  });

  it('emits encounter_resolved when a resolved unified action is an encounter', () => {
    const { events } = resolveOnce(makeTemplate(REAL_ENCOUNTER_ID));
    const resolved = events.filter(e => e.kind === 'encounter_resolved');

    expect(resolved).toHaveLength(1);
    expect(resolved[0].sourceSystem).toBe('unified_action');
    expect(resolved[0].encounterId).toBe(REAL_ENCOUNTER_ID);
    expect(resolved[0].finalStatus).toBe('completed');
  });

  it('does NOT emit encounter_resolved for a non-encounter unified action', () => {
    const { events } = resolveOnce(makeTemplate(NON_ENCOUNTER_ID));

    expect(events.filter(e => e.kind === 'encounter_resolved')).toHaveLength(0);
    // ...but the action counter still fires, so the absence above is the
    // discriminator doing its job and not the action failing to resolve.
    expect(events.filter(e => e.kind === 'action_resolved')).toHaveLength(1);
  });

  it('the two counters are independent — an encounter emits both', () => {
    const { events } = resolveOnce(makeTemplate(REAL_ENCOUNTER_ID));

    expect(events.filter(e => e.kind === 'action_resolved')).toHaveLength(1);
    expect(events.filter(e => e.kind === 'encounter_resolved')).toHaveLength(1);
  });

  it('bands the encounter from rarityTier rather than a threatRating field', () => {
    // `UnifiedActionTemplate` carries no `threatRating`, which is why the legacy
    // emit's read of one banded every legacy encounter 'unknown' and left
    // `completionByBand` a single dead row.
    const trivial = resolveOnce(makeTemplate(REAL_ENCOUNTER_ID, 1)).events
      .find(e => e.kind === 'encounter_resolved');
    const hard = resolveOnce(makeTemplate(REAL_ENCOUNTER_ID, 3)).events
      .find(e => e.kind === 'encounter_resolved');

    expect(trivial?.threatBand).toBe('trivial');
    expect(hard?.threatBand).toBe('hard');
  });

  it('drives the summary counters, not just the event stream', () => {
    const { runtime } = resolveOnce(makeTemplate(REAL_ENCOUNTER_ID));
    const counters = runtime.balanceTelemetry!.counters;

    expect(counters.totalEncountersAttempted).toBe(1);
    expect(counters.totalEncountersCompleted).toBe(1);
    expect(counters.completionByBand.trivial).toEqual({ attempts: 1, completions: 1 });
  });
});
