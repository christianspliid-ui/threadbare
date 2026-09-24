/**
 * THR-1535 — the odds shown are the odds rolled.
 *
 * Before this ticket the attended forecast (`buildNudgePhaseModel`) added a
 * mortal's standing modifiers — items, conditions, the effect family, terrain,
 * place conditions, sphere alignment — and the unified road's roll did not, so
 * every item bonus moved the shown percentage and never the dice. It also forecast
 * an ordinary step without its scale, so a `local` step's 0.65 floor never reached
 * the shown odds (the addendum).
 *
 * Three clauses:
 *  1. A mortal carrying a `passive` +0.05 item on the step's reach rolls 0.05
 *     higher, and the forecast shows exactly that.
 *  2. Over a sample of real unified-road steps, with the mortal carrying gear and
 *     standing on rough ground, the forecast (before the hand's own deltas) equals
 *     the probability the resolver rolls against — including `local` steps that sit
 *     on their floor.
 *  3. With a card selected, forecast and roll still agree.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { EncounterCacheManager } from '../encounterCache';
import { previewStepProbability } from '../unifiedActionResolution';
import { resolveStepDefinition } from '../unifiedActionLifecycle';
import { isPushEligible } from '../plannerForecast';
import { disableTracing } from '../traceBuffer';
import { MIN_PROBABILITY_BY_SCALE } from '../resolutionScaleAdjust';
import { computeStandingModifierTotal } from '../resolutionModifiers';
import { getAnyEncounterById } from '../../data/encounter-content';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { buildNudgePhaseModel } from '../../components/Game/encounter-stage/adapters/buildNudgePhaseModel';
import { forecastWithNudges } from '../../components/Game/encounter-stage/useNudgeHand';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import type { ActionStep, StepNudge, UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { AttachmentEffect } from '../../types/effects';
import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';

beforeEach(() => disableTracing());
afterEach(() => disableTracing());

const TICK = 50;
const ITEM_BONUS = 0.05;
const LOCATION_TYPES = ['hamlet', 'town', 'city', 'capital', 'ruins', 'mining', 'ruined_city', 'wilderness', 'wayside', 'temple'];

function stateOf(graph: WorldGraph): GameState {
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
    pendingQuintessenceEvents: [],
    effectStates: new Map(),
  } as unknown as GameState;
}

interface WorldOpts {
  raw: number;
  /** Reaches the mortal's charm lifts by `ITEM_BONUS`. */
  itemReaches?: readonly ReachDomain[];
  /** Terrain under the mortal's place (mountain = a standing terrain term). */
  terrain?: string;
}

function world({ raw, itemReaches = [], terrain }: WorldOpts): WorldGraph {
  const graph = new WorldGraph();
  const caps: Record<string, number> = {};
  for (const r of REACH_DOMAINS) caps[r] = raw;
  graph.addNode({ id: 'mortal', type: 'actor', name: 'Mortal', properties: { actorType: 'individual', domainCapabilities: caps } });
  graph.addNode({ id: 'loc.here', type: 'location', name: 'Here', properties: terrain ? { terrainType: terrain } : {} });
  graph.addEdge({ id: 'e.at', source: 'mortal', target: 'loc.here', type: 'located_at', properties: {} });
  if (itemReaches.length > 0) {
    graph.addNode({
      id: 'item.charm', type: 'artifact', name: 'Luck Charm',
      properties: {
        tier: 1,
        effects: itemReaches.map((reach) => ({ type: 'passive', reach, value: ITEM_BONUS }) as AttachmentEffect),
      },
    });
    graph.addEdge({ id: 'e.charm', source: 'mortal', target: 'item.charm', type: 'possesses', properties: {} });
  }
  return graph;
}

function templateOf(id: string): UnifiedActionTemplate | undefined {
  return (getUnifiedTemplateById(id) ?? getAnyEncounterById(id)) as UnifiedActionTemplate | undefined;
}

function actionAt(templateId: string, step: number, activeNudges?: string[]): UnifiedAction {
  return {
    actionId: 'ua_standing', actorId: 'mortal', templateId, targetId: 'loc.here',
    scale: 'regional', source: 'agent',
    startTick: TICK - 1, currentStep: step, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...(activeNudges ? { activeNudges } : {}),
  } as unknown as UnifiedAction;
}

/** The probability the forecast shows before the hand's own deltas. */
function shown(state: GameState, tmpl: UnifiedActionTemplate, stepIndex: number, selected: string[] = []): number {
  const action = actionAt(tmpl.id, stepIndex);
  const step = resolveStepDefinition(tmpl, stepIndex, []) as ActionStep;
  const phase = buildNudgePhaseModel({
    template: tmpl, activeAction: action, step, graph: state.graph, gameState: state, allowEmptyHand: true,
  });
  if (!phase) throw new Error(`no phase for ${tmpl.id}#${stepIndex}`);
  return forecastWithNudges(phase, selected).probability;
}

/**
 * The forecast quantises to whole percent (flooring); `0.29 * 100` is 28.999… in
 * floating point, so the shown side is rounded and the rolled side floored.
 */
function shownPct(state: GameState, tmpl: UnifiedActionTemplate, stepIndex: number, selected: string[] = []): number {
  return Math.round(shown(state, tmpl, stepIndex, selected) * 100);
}
const rolledPct = (p: number): number => Math.floor(p * 100 + 1e-9);

/** One ordinary unified-road step per template, sampled from the real encounter cache. */
function sampleSteps(): Array<{ tmpl: UnifiedActionTemplate; step: number }> {
  const graph = new WorldGraph();
  LOCATION_TYPES.forEach((t, i) => {
    graph.addNode({ id: `loc.${i}`, type: 'location', name: t, properties: { locationType: t } });
  });
  const cache = new EncounterCacheManager();
  cache.buildFullCache(graph, TICK);
  const seen = new Set<string>();
  const out: Array<{ tmpl: UnifiedActionTemplate; step: number }> = [];
  for (const e of cache.getAllEntries()) {
    if (seen.has(e.templateId)) continue;
    seen.add(e.templateId);
    // Push is the mortal's own pre-roll spend; the forecast deliberately omits it.
    if (isPushEligible(e.templateId)) continue;
    const tmpl = templateOf(e.templateId);
    if (!tmpl) continue;
    tmpl.steps.forEach((sb, i) => {
      const authored = isActionStepBranch(sb) ? sb.fallback : sb;
      // Per-roll difficulty reads (target tier, intelligence) and fight steps are
      // priced elsewhere; carryover lines depend on a prior band. Not this contract.
      if (authored.difficultyContext || authored.fightRole || authored.carryover) return;
      out.push({ tmpl, step: i });
    });
  }
  return out;
}

const REACHES_ALL = REACH_DOMAINS;

describe('THR-1535 — a passive item moves the roll, and the forecast shows it', () => {
  const steps = sampleSteps();

  it('a passive +0.05 item on the step\'s reach lifts the roll by 0.05, and forecast equals roll', () => {
    let checked = 0;
    // Several skill levels, so the sample reaches steps clear of both floor and ceiling.
    for (const raw of [2, 4, 6, 10, 18, 25]) {
      const bare = stateOf(world({ raw }));
      const geared = stateOf(world({ raw, itemReaches: REACHES_ALL }));
      for (const { tmpl, step } of steps) {
        const before = previewStepProbability(actionAt(tmpl.id, step), tmpl, bare);
        const after = previewStepProbability(actionAt(tmpl.id, step), tmpl, geared);
        if (before === undefined || after === undefined) continue;
        // Only where neither the scale floor nor the ceiling bites, so the +0.05 shows whole.
        const floor = MIN_PROBABILITY_BY_SCALE[tmpl.scale ?? 'regional'];
        if (before <= floor + 0.001 || before >= 0.9) continue;
        expect(after - before, `${tmpl.id}#${step}`).toBeCloseTo(ITEM_BONUS, 9);
        expect(shownPct(geared, tmpl, step), `${tmpl.id}#${step}`).toBe(rolledPct(after));
        checked++;
      }
    }
    console.info(`[THR-1535] +0.05 item verified on ${checked} unclamped steps`);
    expect(checked).toBeGreaterThan(0);
  });

  it('a bare mortal carries no standing term, which is why the golden fixtures did not move', () => {
    // `stepResolutionGolden` rolls a mortal with no gear, traits or terrain: the new
    // term is exactly 0 there, so its rows are byte-identical by construction.
    const graph = world({ raw: 10 });
    for (const reach of REACH_DOMAINS) {
      expect(computeStandingModifierTotal(graph, 'mortal', reach, undefined, new Map())).toBe(0);
    }
    const geared = world({ raw: 10, itemReaches: ['iron'] });
    expect(computeStandingModifierTotal(geared, 'mortal', 'iron', undefined, new Map())).toBeCloseTo(ITEM_BONUS, 12);
    expect(computeStandingModifierTotal(geared, 'mortal', 'heart', undefined, new Map())).toBe(0);
  });
});

describe('THR-1535 — the forecast equals the resolver over real unified-road steps', () => {
  const steps = sampleSteps();

  it.each([
    ['a novice with gear on rough ground', { raw: 2, itemReaches: ['iron', 'heart', 'eye'] as ReachDomain[], terrain: 'mountain' }],
    ['a journeyman with gear', { raw: 10, itemReaches: REACHES_ALL }],
    ['a specialist on bad ground', { raw: 25, terrain: 'swamp' }],
  ])('%s', (_label, opts) => {
    const state = stateOf(world(opts));
    let compared = 0;
    let floored = 0;
    for (const { tmpl, step } of steps) {
      const rolled = previewStepProbability(actionAt(tmpl.id, step), tmpl, state);
      if (rolled === undefined) continue;
      expect(shownPct(state, tmpl, step), `${tmpl.id}#${step}`).toBe(rolledPct(rolled));
      compared++;
      if ((tmpl.scale === 'local' || tmpl.scale === 'personal') && rolled <= MIN_PROBABILITY_BY_SCALE[tmpl.scale] + 1e-9) floored++;
    }
    expect(compared).toBeGreaterThanOrEqual(50);
    if (opts.raw === 2) {
      // The addendum's case: a novice on a local step sits on the 0.65 floor, and
      // the forecast now shows the floor instead of the raw odds under it.
      expect(floored).toBeGreaterThan(0);
    }
  });
});

describe('THR-1535 — with a card selected, forecast and roll still agree', () => {
  const CARD: StepNudge = {
    id: 'card_steady', name: 'Steady Hand', effectLine: 'Their hand stops shaking.', essenceCost: 0, forecastDelta: 0.1,
  } as StepNudge;

  it('a local step, geared mortal, one card played', () => {
    const base = sampleSteps().find(({ tmpl }) => tmpl.scale === 'local' && tmpl.steps.length > 0);
    expect(base).toBeDefined();
    const { tmpl: src, step } = base!;
    const authored = resolveStepDefinition(src, step, []) as ActionStep;
    const steps = src.steps.slice();
    steps[step] = { ...authored, nudges: [...(authored.nudges ?? []), CARD] };
    const tmpl = { ...src, steps } as UnifiedActionTemplate;
    const state = stateOf(world({ raw: 10, itemReaches: REACHES_ALL }));
    const rolled = previewStepProbability(actionAt(tmpl.id, step, [CARD.id]), tmpl, state)!;
    expect(rolled).toBeDefined();
    expect(shownPct(state, tmpl, step, [CARD.id])).toBe(rolledPct(rolled));
  });
});
