/**
 * THR-783: a step's authored outcome effects must actually fire.
 *
 * The THR-101 tavern migration replaced the legacy `appliesWound` flag with a
 * `failureMetadata.onFailureEffects` block at five sites. That key was never
 * declared on `ActionStepOutcomeMetadata` and never read by any engine module,
 * so losing a tavern brawl marked no one — the effect existed only as content.
 *
 * These tests bind the *effect*, not the authoring: each drives the real
 * `executeStepResult` and requires the condition edge to exist afterwards, then
 * drives the real `decayConditions` loop and requires it to be gone on its
 * authored tick (THR-761 — expiry rides `ticksRemaining`). A test that only
 * asserted the content declares the key would pass on the unwired code.
 *
 * The outcome-side split is `isStepSuccess`, which counts `near_miss` as a
 * success — so a near miss must *not* fire `failureMetadata.effects`. That is
 * asserted rather than assumed, because it is the one band a reader is likely to
 * guess wrong.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import { decayConditions } from '../conditionDecay';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import { CONDITION_WOUNDED_DURATION } from '../../data/condition-trait-content';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import type {
  ActionStep,
  UnifiedAction,
  UnifiedActionTemplate,
  StepOutcome,
  EncounterAftermathReactionEffect,
} from '../../types/unifiedAction';

const START_TICK = 10;
const WOUNDED = 'trait.condition.wounded';
const fixedRng = () => 0.5;

function buildState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'actor-1', type: 'actor', name: 'Alice', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Market', properties: {} });
  graph.addEdge({ id: 'edge-loc-1', source: 'actor-1', target: 'loc-1', type: 'located_at', properties: {} });
  graph.addNode({
    id: WOUNDED, type: 'trait', name: 'Wounded',
    properties: { subcategory: 'condition', tags: ['#condition', '#combat', '#negative'] },
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
  } as unknown as GameState;
}

const WOUND_EFFECT: EncounterAftermathReactionEffect = {
  kind: 'condition_attachment',
  templateId: WOUNDED,
} as EncounterAftermathReactionEffect;

/** One-step template carrying the given effects on one outcome side. */
function templateWithEffects(
  side: 'successMetadata' | 'failureMetadata',
  effects: readonly EncounterAftermathReactionEffect[] = [WOUND_EFFECT],
): UnifiedActionTemplate {
  return {
    id: 'encounter.step-effects-test',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Step Effects Test',
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
      [side]: { effects },
    }],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
  } as unknown as UnifiedActionTemplate;
}

function makeAction(templateId: string): UnifiedAction {
  return {
    actionId: 'ua_step_effects', actorId: 'actor-1', templateId, targetId: 'actor-1',
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

function woundEdges(state: GameState): number {
  return state.graph.getOutgoingEdges('actor-1', 'has_trait').filter(e => e.target === WOUNDED).length;
}

/** Drive the real decay loop `n` times, as the orchestrator does once per tick. */
function advance(state: GameState, n: number): void {
  for (let i = 0; i < n; i++) decayConditions(state.graph, START_TICK + i + 1);
}

function runStep(
  state: GameState,
  template: UnifiedActionTemplate,
  outcome: StepOutcome,
  runtime: SimulationRuntime | undefined,
): void {
  executeStepResult(
    makeAction(template.id), template, outcome, [], state, fixedRng, START_TICK, undefined, runtime,
  );
}

describe('THR-783 — step outcome effects fire through executeStepResult', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('applies a failure-side condition and expires it on its authored tick', () => {
    const state = buildState();
    runStep(state, templateWithEffects('failureMetadata'), 'failure', runtime);

    expect(woundEdges(state)).toBe(1);

    // Duration comes from CONDITION_DURATIONS; expiry rides ticksRemaining (THR-761).
    advance(state, CONDITION_WOUNDED_DURATION - 1);
    expect(woundEdges(state)).toBe(1); // still inside its duration

    advance(state, 1);
    expect(woundEdges(state)).toBe(0); // expired
  });

  it('applies the failure side on critical_failure too', () => {
    const state = buildState();
    runStep(state, templateWithEffects('failureMetadata'), 'critical_failure', runtime);
    expect(woundEdges(state)).toBe(1);
  });

  it('does not apply failure effects when the step succeeds', () => {
    const state = buildState();
    runStep(state, templateWithEffects('failureMetadata'), 'success', runtime);
    expect(woundEdges(state)).toBe(0);
  });

  it('treats near_miss as success, so failure effects do not fire', () => {
    const state = buildState();
    runStep(state, templateWithEffects('failureMetadata'), 'near_miss', runtime);
    expect(woundEdges(state)).toBe(0);
  });

  it('reads the success side symmetrically', () => {
    const state = buildState();
    runStep(state, templateWithEffects('successMetadata'), 'success', runtime);
    expect(woundEdges(state)).toBe(1);

    const clean = buildState();
    runStep(clean, templateWithEffects('successMetadata'), 'failure', runtime);
    expect(woundEdges(clean)).toBe(0);
  });

  it('bumps the structural cache version so the new edge is not served stale', () => {
    const state = buildState();
    const before = runtime.structuralCacheVersion;
    runStep(state, templateWithEffects('failureMetadata'), 'failure', runtime);
    expect(runtime.structuralCacheVersion).toBeGreaterThan(before);
  });

  it('emits a step_outcome_effects trace naming the effect kinds', () => {
    const state = buildState();
    runStep(state, templateWithEffects('failureMetadata'), 'failure', runtime);

    const trace = getTraces().find(
      t => (t as { effectKind?: string }).effectKind === 'step_outcome_effects',
    ) as { reactionId?: string; summary?: string } | undefined;
    expect(trace).toBeDefined();
    expect(trace?.reactionId).toContain('step_outcome_effects');
    expect(trace?.summary).toContain('condition_attachment');
  });

  it('is a no-op for a step that authors no effects', () => {
    const state = buildState();
    const bare = templateWithEffects('failureMetadata', []);
    runStep(state, bare, 'failure', runtime);
    expect(woundEdges(state)).toBe(0);
  });

  it('fails soft with no runtime rather than throwing', () => {
    const state = buildState();
    expect(() => runStep(state, templateWithEffects('failureMetadata'), 'failure', undefined)).not.toThrow();
    expect(woundEdges(state)).toBe(0);
  });
});

/**
 * `steps` is `ActionStepOrBranch[]`; only the non-branch arm carries outcome
 * metadata. Flatten a branch into the concrete steps it can resolve to so the
 * sweep sees the nested authoring sites too (two of the five live under
 * `tavern.the_challenge`'s branch/fallback).
 */
function concreteSteps(template: UnifiedActionTemplate): ActionStep[] {
  const out: ActionStep[] = [];
  for (const step of template.steps) {
    if (!isActionStepBranch(step)) { out.push(step); continue; }
    // The branch arm keys its alternatives under `variants` (not `branches`) and
    // carries a `fallback` for the unmatched case. Both hold authoring sites:
    // tavern.the_challenge puts one wound on a variant and one on the fallback.
    const branch = step as unknown as {
      variants?: Record<string, ActionStep>;
      fallback?: ActionStep;
    };
    if (branch.variants) out.push(...Object.values(branch.variants));
    if (branch.fallback) out.push(branch.fallback);
  }
  return out;
}

describe('THR-783 — shipped tavern content reaches the wired field', () => {
  it('tavern.brawl authors failure-side effects the engine now reads', () => {
    const brawl = UNIFIED_ACTION_TEMPLATES.find(t => t.id === 'tavern.brawl');
    expect(brawl).toBeDefined();

    const wounding = concreteSteps(brawl!).filter(
      s => (s.failureMetadata?.effects?.length ?? 0) > 0,
    );
    expect(wounding.length).toBeGreaterThan(0);
    for (const step of wounding) {
      expect(
        step.failureMetadata!.effects!.every(
          (e: EncounterAftermathReactionEffect) => e.kind === 'condition_attachment',
        ),
      ).toBe(true);
    }
  });

  it('every formerly-dead authoring site is now on the wired key', () => {
    // The five THR-101 sites, by predicate rather than count: any step whose
    // failure side attaches a wound condition must reach it through `effects`.
    const wired = UNIFIED_ACTION_TEMPLATES.flatMap(t =>
      concreteSteps(t)
        .filter(s => (s.failureMetadata?.effects?.length ?? 0) > 0)
        .map(() => t.id),
    );
    expect(wired.length).toBeGreaterThanOrEqual(5);
  });

  it('no template still authors the dead onFailureEffects key', () => {
    const stale = UNIFIED_ACTION_TEMPLATES.filter(t =>
      concreteSteps(t).some(s =>
        'onFailureEffects' in (s.failureMetadata ?? {}) ||
        'onFailureEffects' in (s.successMetadata ?? {}),
      ),
    );
    expect(stale.map(t => t.id)).toEqual([]);
  });
});
