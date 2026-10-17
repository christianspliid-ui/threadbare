/**
 * THR-1936 S1 — a mortal's Means.
 *
 * Binds the plan's S1 Done-when predicates (Docs/plans/2026-10-15-thr-1936-mortal-wealth.md):
 * deciders are born with role Means plus a home shift; an outcome table pays its actor
 * exactly once per resolution at each band, whoever is acting and whatever reaction
 * follows; the poor lose less and never go below 0; and the aftermath gains an `economy`
 * change that names the band word only when the band was crossed.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { executeStepResult } from '../unifiedActionResolution';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { createSimulationRuntime, type SimulationRuntime } from '../simulationRuntime';
import {
  applyMeansShift,
  birthMeansFor,
  defaultMeansReason,
  ensureDeciderMeans,
  meansChangeSentence,
  selectOutcomeEffects,
  templatePaysActorOnSuccess,
} from '../mortalMeans';
import { DEFAULT_WEALTH, ROLE_WEALTH } from '../npcGraduation';
import { getProsperityTier } from '../phaseProsperity';
import {
  MEANS_BIRTH_HOME_SHIFT,
  MEANS_POOR_LOSS_SCALE,
  MEANS_STEP,
} from '../../data/mortal-means-constants';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { GameState } from '../../types/gameState';
import type {
  StepOutcome,
  UnifiedAction,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

const START_TICK = 10;
const fixedRng = () => 0.5;

function buildState(wealth?: number): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Kael Thornweaver',
    properties: { actorType: 'individual', ...(wealth !== undefined ? { wealth } : {}) },
  });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Market', properties: {} });
  graph.addEdge({ id: 'edge-loc-1', source: 'actor-1', target: 'loc-1', type: 'located_at', properties: {} });
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

/** A one-step trade template whose outcome table pays on a win and costs on a loss. */
function tradeTemplate(): UnifiedActionTemplate {
  return {
    id: 'encounter.means-test',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Means Test',
    reach: 'gold',
    crudType: 'read',
    encounterType: 'trade',
    scale: 'personal',
    steps: [{
      reach: 'gold',
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
    outcomeEffects: {
      critical_success: [{ kind: 'economy_shift', quantity: 'means', amount: MEANS_STEP }],
      success: [{ kind: 'economy_shift', quantity: 'means', amount: MEANS_STEP }],
      failure: [{ kind: 'economy_shift', quantity: 'means', amount: -MEANS_STEP }],
      critical_failure: [{ kind: 'economy_shift', quantity: 'means', amount: -MEANS_STEP }],
    },
  } as unknown as UnifiedActionTemplate;
}

function makeAction(templateId: string): UnifiedAction {
  return {
    actionId: 'ua_means', actorId: 'actor-1', templateId, targetId: 'actor-1',
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

function wealthOf(state: GameState): number {
  return state.graph.getNode('actor-1')!.properties.wealth as number;
}

describe('THR-1936 — born with Means', () => {
  it('gives every decider without wealth its role Means plus the home shift', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', prosperity: 90 } });
    graph.addNode({ id: 'merchant', type: 'actor', name: 'M', properties: { actorType: 'individual', npcRole: 'merchant' } });
    graph.addNode({ id: 'drifter', type: 'actor', name: 'D', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'rich', type: 'actor', name: 'R', properties: { actorType: 'individual', wealth: 77 } });
    graph.addNode({ id: 'ambient', type: 'actor', name: 'A', properties: { actorType: 'individual', spotlightTier: 'ambient' } });
    graph.addNode({ id: 'avatar', type: 'actor', name: 'V', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e1', source: 'merchant', target: 'town', type: 'located_at', properties: {} });

    clearTraces(); enableTracing();
    const born = ensureDeciderMeans(graph, 0, new Set(['avatar']));
    const traces = getTraces().filter(t => t.category === 'economy.means.birth');
    disableTracing(); clearTraces();

    const tier = getProsperityTier(90);
    expect(graph.getNode('merchant')!.properties.wealth)
      .toBe(Math.min(100, ROLE_WEALTH.merchant + MEANS_BIRTH_HOME_SHIFT[tier]));
    expect(birthMeansFor('merchant', tier)).toBe(graph.getNode('merchant')!.properties.wealth);
    expect(graph.getNode('drifter')!.properties.wealth).toBe(DEFAULT_WEALTH);
    expect(graph.getNode('drifter')!.properties.lastWealthReason).toBe('birth');
    expect(graph.getNode('rich')!.properties.wealth).toBe(77);
    expect(graph.getNode('ambient')!.properties.wealth).toBeUndefined();
    expect(graph.getNode('avatar')!.properties.wealth).toBeUndefined();
    expect(born).toBe(2);
    expect(traces).toHaveLength(2);
  });

  it('is idempotent', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'actor', name: 'A', properties: { actorType: 'individual', npcRole: 'monk' } });
    ensureDeciderMeans(graph, 0);
    graph.getNode('a')!.properties.wealth = 33;
    expect(ensureDeciderMeans(graph, 5)).toBe(0);
    expect(graph.getNode('a')!.properties.wealth).toBe(33);
  });
});

describe('THR-1936 — economy_shift arithmetic', () => {
  it('halves a loss below Getting by and never goes below 0', () => {
    const poor: Record<string, unknown> = { wealth: 10 };
    const shift = applyMeansShift(poor, -MEANS_STEP, 'venture_loss')!;
    expect(shift.amount).toBe(-MEANS_STEP * MEANS_POOR_LOSS_SCALE);
    expect(poor.wealth).toBe(10 - MEANS_STEP * MEANS_POOR_LOSS_SCALE);

    const broke: Record<string, unknown> = { wealth: 1 };
    applyMeansShift(broke, -MEANS_STEP, 'venture_loss');
    expect(broke.wealth).toBe(0);
    // At the floor nothing moves, so nothing is reported (Law 56).
    expect(applyMeansShift(broke, -MEANS_STEP, 'venture_loss')).toBeNull();
    expect(broke.lastWealthReason).toBe('venture_loss');
  });

  it('does not scale a loss at or above Getting by, nor any gain', () => {
    const mid: Record<string, unknown> = { wealth: 30 };
    expect(applyMeansShift(mid, -MEANS_STEP, 'x')!.amount).toBe(-MEANS_STEP);
    const poor: Record<string, unknown> = { wealth: 5 };
    expect(applyMeansShift(poor, MEANS_STEP, 'x')!.amount).toBe(MEANS_STEP);
  });

  it('defaults the reason by sign and encounter type', () => {
    expect(defaultMeansReason(6, 'trade')).toBe('trade_success');
    expect(defaultMeansReason(-6, 'trade')).toBe('trade_failure');
    expect(defaultMeansReason(6, 'steal')).toBe('theft');
    expect(defaultMeansReason(6, 'hire')).toBe('paid_work');
    expect(defaultMeansReason(6, 'explore')).toBe('venture_gain');
    expect(defaultMeansReason(-6, undefined)).toBe('venture_loss');
  });

  it('names the band word only when the band was crossed', () => {
    expect(meansChangeSentence('Kael', { wealthBefore: 38, wealthAfter: 44, bandBefore: 'Getting by', bandAfter: 'Comfortable' }))
      .toEqual({ title: 'Better off', detail: 'Kael is now Comfortable.', polarity: 'gain' });
    expect(meansChangeSentence('Kael', { wealthBefore: 44, wealthAfter: 38, bandBefore: 'Comfortable', bandAfter: 'Getting by' }).title)
      .toBe('Worse off');
    expect(meansChangeSentence('Kael', { wealthBefore: 30, wealthAfter: 24, bandBefore: 'Getting by', bandAfter: 'Getting by' }))
      .toEqual({ title: 'Fortunes turn down', detail: 'Kael comes away a little poorer.', polarity: 'loss' });
    expect(meansChangeSentence('', { wealthBefore: 30, wealthAfter: 36, bandBefore: 'Getting by', bandAfter: 'Getting by' }).detail)
      .toBe('They come away a little richer.');
  });

  it('prefers the variant table over the template table', () => {
    const t = tradeTemplate();
    const variantEffects = [{ kind: 'economy_shift' as const, quantity: 'means' as const, amount: 12 }];
    expect(selectOutcomeEffects(t, { outcomeEffects: { success: variantEffects } }, 'success')).toBe(variantEffects);
    expect(selectOutcomeEffects(t, undefined, 'success')).toBe(t.outcomeEffects!.success);
    expect(selectOutcomeEffects(t, undefined, 'success_at_cost')).toEqual([]);
    expect(templatePaysActorOnSuccess(t)).toBe(true);
  });
});

describe('THR-1936 — the outcome table pays once at the roll', () => {
  let runtime: SimulationRuntime;
  beforeEach(() => { clearTraces(); enableTracing(); runtime = createSimulationRuntime(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  const cases: [StepOutcome, UnifiedActionOutcome, number][] = [
    ['critical_success', 'critical_success', MEANS_STEP],
    ['success', 'success', MEANS_STEP],
    ['success_at_cost', 'success_at_cost', 0],
    ['failure', 'failure', -MEANS_STEP],
    ['critical_failure', 'critical_failure', -MEANS_STEP],
  ];

  for (const [stepOutcome, band, expected] of cases) {
    it(`writes ${expected} at ${band}, exactly once`, () => {
      const state = buildState(30);
      const template = tradeTemplate();
      const { updatedAction } = executeStepResult(
        makeAction(template.id), template, stepOutcome, [], state, fixedRng, START_TICK, undefined, runtime,
      );
      expect(updatedAction.resolved).toBe(true);
      expect(updatedAction.outcome).toBe(band);
      expect(wealthOf(state)).toBe(30 + expected);

      const economy = (updatedAction.aftermathSummary?.changes ?? []).filter(c => c.kind === 'economy');
      expect(economy).toHaveLength(expected === 0 ? 0 : 1);
      if (expected !== 0) {
        expect(updatedAction.outcomeEffectsApplied).toBe(true);
        expect(economy[0].detail).toContain('Kael Thornweaver');
        expect(economy[0].detail).not.toMatch(/\d/);
        const shiftTraces = getTraces().filter(t => t.category === 'economy.means.shift');
        expect(shiftTraces).toHaveLength(1);
      }

      // Whichever reaction follows — the autonomous phase or the player's pick — the
      // table is not run again: reactions carry their own effects, never the table.
      for (const reaction of updatedAction.aftermathSummary?.reactions ?? []) {
        const { state: next } = applyEncounterAftermathReaction(state, updatedAction, reaction, START_TICK, runtime);
        Object.assign(state, next);
      }
      expect(wealthOf(state)).toBe(30 + expected);
    });
  }

  it('pays a mortal with no wealth recorded (old save) from 0', () => {
    const state = buildState(undefined);
    const template = tradeTemplate();
    executeStepResult(makeAction(template.id), template, 'success', [], state, fixedRng, START_TICK, undefined, runtime);
    expect(wealthOf(state)).toBe(MEANS_STEP);
    expect(state.graph.getNode('actor-1')!.properties.lastWealthReason).toBe('trade_success');
  });

  it('does not apply a table twice for an action already marked applied', () => {
    const state = buildState(30);
    const template = tradeTemplate();
    const action = { ...makeAction(template.id), outcomeEffectsApplied: true } as UnifiedAction;
    executeStepResult(action, template, 'success', [], state, fixedRng, START_TICK, undefined, runtime);
    expect(wealthOf(state)).toBe(30);
  });
});

describe('THR-1936 — the seed row', () => {
  it('merchants_gambit keeps its outcome table through the converter', () => {
    const t = getUnifiedTemplateById('encounter.merchants_gambit');
    expect(t).toBeDefined();
    expect(t!.outcomeEffects?.failure?.[0]).toMatchObject({ kind: 'economy_shift', quantity: 'means', amount: -MEANS_STEP });
    expect(t!.outcomeEffects?.success?.[0]).toMatchObject({ kind: 'economy_shift', amount: MEANS_STEP });
    expect(t!.stakes?.risk).toMatch(/coin/);
    expect(t!.stakes?.lost).toMatch(/poorer/);
  });
});
