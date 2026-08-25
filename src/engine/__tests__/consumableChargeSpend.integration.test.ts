/**
 * THR-1239: consumable charges are spent by the real step-resolution path.
 *
 * The unit tests in `effects/__tests__/consumableCharges.test.ts` bind the
 * decrement helper. They cannot tell you the helper is *called* — and "the
 * behaviour is implemented but nothing reaches it" is precisely the failure
 * this ticket is repairing: `chargesRemaining` had a reader, an initialiser and
 * a destroy-at-0 branch, and no decrement anywhere, so every charged item in the
 * reward catalogs was unlimited while looking fully wired.
 *
 * So these drive `executeStepResult` itself — the same function the orchestrator
 * calls — and require the charge count on `state.effectStates` to move. A 60-tick
 * seeded CLI run does not settle this either way: only one charged artifact in
 * that world has a bearer at all, so a natural matching-reach step is a long shot
 * rather than a guarantee. This is the deterministic version of that evidence.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import type { GameState } from '../../types/gameState';
import type { AttachmentEffect, EffectRuntimeState } from '../../types/effects';
import type { ReachDomain } from '../../types/traits';
import type { UnifiedAction, UnifiedActionTemplate, StepOutcome } from '../../types/unifiedAction';

const START_TICK = 10;
const ITEM = 'item.charged';
const fixedRng = () => 0.5;

function buildState(chargeReach: ReachDomain, charges: number, destroyOnEmpty: boolean): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Alice', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Market', properties: {} });
  graph.addEdge({ id: 'edge-loc-1', source: 'actor-1', target: 'loc-1', type: 'located_at', properties: {} });

  const effects: AttachmentEffect[] = [
    { type: 'consumable_charge', charges, onUse: { reach: chargeReach, value: 0.05 }, destroyOnEmpty } as AttachmentEffect,
  ];
  graph.addNode({ id: ITEM, type: 'artifact', name: 'Charged Thing', properties: { effects } });
  graph.addEdge({ id: 'edge-item-1', source: 'actor-1', target: ITEM, type: 'possesses', properties: {} });

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
    effectStates: new Map<string, EffectRuntimeState>([[ITEM, { chargesRemaining: charges }]]),
  } as unknown as GameState;
}

/** One-step template whose single step runs at `stepReach`. */
function templateAtReach(stepReach: ReachDomain): UnifiedActionTemplate {
  return {
    id: 'encounter.charge-spend-test',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Charge Spend Test',
    reach: stepReach,
    crudType: 'update',
    scale: 'personal',
    steps: [{
      reach: stepReach,
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
  } as unknown as UnifiedActionTemplate;
}

function makeAction(templateId: string): UnifiedAction {
  return {
    actionId: 'ua_charge_spend', actorId: 'actor-1', templateId, targetId: 'actor-1',
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

/**
 * Drive one step. `tickOffset` advances the tick between calls in the
 * repeated-step cases — the event-node id is keyed on (actor, tick, step), so
 * replaying the same tick trips a (fail-soft) duplicate-id warning that has
 * nothing to do with charges.
 */
function runStep(
  state: GameState,
  stepReach: ReachDomain,
  outcome: StepOutcome,
  runtime: SimulationRuntime,
  tickOffset = 0,
): void {
  const template = templateAtReach(stepReach);
  executeStepResult(
    makeAction(template.id), template, outcome, [], state, fixedRng,
    START_TICK + tickOffset, undefined, runtime,
  );
}

const chargesOf = (state: GameState) => state.effectStates?.get(ITEM)?.chargesRemaining;

describe('THR-1239 — executeStepResult spends consumable charges', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('spends one charge when the step reach matches onUse.reach', () => {
    const state = buildState('iron', 3, true);
    runStep(state, 'iron', 'success', runtime);
    expect(chargesOf(state)).toBe(2);
  });

  it('spends on a failed step too — the item was still used', () => {
    // A charge pays for the attempt, not the result. Spending only on success
    // would quietly make every charged item strictly better than its card says.
    const state = buildState('iron', 3, true);
    runStep(state, 'iron', 'failure', runtime);
    expect(chargesOf(state)).toBe(2);
  });

  it('does not spend when the step runs at a different reach', () => {
    const state = buildState('iron', 3, true);
    runStep(state, 'heart', 'success', runtime);
    expect(chargesOf(state)).toBe(3);
  });

  it('spends once per step, so a three-charge item empties over three steps', () => {
    const state = buildState('iron', 3, true);
    const seen: Array<number | undefined> = [];
    for (let i = 0; i < 3; i++) {
      runStep(state, 'iron', 'success', runtime, i);
      seen.push(chargesOf(state));
    }
    expect(seen).toEqual([2, 1, 0]);
  });

  it('destroys the item on the step that empties it, and stops there', () => {
    const state = buildState('iron', 1, true);
    runStep(state, 'iron', 'success', runtime);

    expect(chargesOf(state)).toBe(0);
    expect(state.graph.getNode(ITEM)).toBeUndefined();
    expect(state.graph.getOutgoingEdges('actor-1', 'possesses')).toHaveLength(0);

    // A further matching step must not spend again — there is nothing left to spend.
    runStep(state, 'iron', 'success', runtime, 1);
    expect(chargesOf(state)).toBe(0);
  });

  it('emits an effect.charge_spent trace naming the bearer, reach and remainder', () => {
    const state = buildState('iron', 2, true);
    runStep(state, 'iron', 'success', runtime);

    const spent = getTraces().filter((t) => t.category === 'effect.charge_spent');
    expect(spent).toHaveLength(1);
    expect(spent[0]).toMatchObject({
      agentId: 'actor-1',
      attachmentId: ITEM,
      reach: 'iron',
      chargesRemaining: 1,
      destroyed: false,
    });
  });
});
