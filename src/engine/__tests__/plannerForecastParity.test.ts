/**
 * THR-1579 (forecast window S2) — the forecast is the roll.
 *
 * Plan doc `Docs/plans/2026-09-24-thr-1575-forecast-window.md` § Done when S2.
 * Three clauses, one `describe` each:
 *
 * 1. **Parity.** Over ≥ 200 real cache-entry steps across every scale, the planner's
 *    step probability equals the probability the resolver rolls the d100 against
 *    (`previewStepProbability` — the roll's own derivation, run dry). Excluded, as the
 *    plan excludes them: nudges, push, company and standing modifiers — the things a
 *    mortal cannot foresee, or (standing modifiers) that the roll does not yet read
 *    (THR-1535 extends this test when it lands).
 * 2. **`F`.** On a fixture with one `fail_action` and one `continue_weakened` step, the
 *    engagement forecast is the exact product and differs from `completionProb`.
 * 3. **Growth.** The growth term varies with difficulty (it was constant: the 0–1
 *    difficulty fell in `difficultyScaling`'s bottom 0–100 band every time).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { EncounterCacheManager, type EncounterCacheEntry } from '../encounterCache';
import { previewStepProbability } from '../unifiedActionResolution';
import { estimateEncounterGrowthValue, estimateStepProbability, scoreAndSelect } from '../encounterScoring';
import {
  forecastEncounterExpectedUtility,
  forecastStepProbabilities,
  isPushEligible,
  stepEngagementSurvival,
} from '../plannerForecast';
import { computeCapability, computeTier } from '../domainCapability';
import { disableTracing } from '../traceBuffer';
import { getAnyEncounterById } from '../../data/encounter-content';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { KPI_FORECAST_PARITY_MAX } from '../kpi/kpiConstants';
import { isActionStepBranch } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import type { ActionScale, UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import type { ReachDomain } from '../../types/traits';

beforeEach(() => disableTracing());
afterEach(() => disableTracing());

const TICK = 50;
const ALL_REACHES: ReachDomain[] = ['iron', 'gold', 'heart', 'veil', 'eye', 'hand', 'root', 'star'];
/** Location kinds sampled — enough to put every scale in the sample. */
const LOCATION_TYPES = ['hamlet', 'town', 'city', 'capital', 'ruins', 'mining', 'ruined_city', 'wilderness', 'wayside', 'temple'];
/** Raw capabilities the sampled mortal is given — a novice, a journeyman and a specialist. */
const RAW_LEVELS = [2, 10, 25];

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

function worldWithActor(raw: number): WorldGraph {
  const graph = new WorldGraph();
  const caps: Record<string, number> = {};
  for (const r of ALL_REACHES) caps[r] = raw;
  graph.addNode({
    id: 'mortal', type: 'actor', name: 'Mortal',
    properties: { actorType: 'individual', domainCapabilities: caps },
  });
  return graph;
}

/** Real cache entries: the cache builder run over a location of each sampled kind. */
function sampleCacheEntries(): EncounterCacheEntry[] {
  const graph = new WorldGraph();
  LOCATION_TYPES.forEach((t, i) => {
    graph.addNode({ id: `loc.${i}`, type: 'location', name: t, properties: { locationType: t } });
  });
  const cache = new EncounterCacheManager();
  cache.buildFullCache(graph, TICK);
  const seen = new Set<string>();
  const out: EncounterCacheEntry[] = [];
  for (const e of cache.getAllEntries()) {
    if (seen.has(e.templateId)) continue;
    seen.add(e.templateId);
    out.push(e);
  }
  return out;
}

function templateOf(id: string): UnifiedActionTemplate | undefined {
  return (getUnifiedTemplateById(id) ?? getAnyEncounterById(id)) as UnifiedActionTemplate | undefined;
}

function actionAt(templateId: string, step: number): UnifiedAction {
  return {
    actionId: 'ua_parity', actorId: 'mortal', templateId, targetId: 'loc.0',
    scale: 'regional', source: 'agent',
    startTick: TICK - 1, currentStep: step, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

interface ParitySample {
  templateId: string;
  step: number;
  scale: ActionScale | undefined;
  planner: number;
  plannerQuantised: number;
  resolver: number;
}

function collectParitySamples(): ParitySample[] {
  const entries = sampleCacheEntries();
  const samples: ParitySample[] = [];
  for (const raw of RAW_LEVELS) {
    const graph = worldWithActor(raw);
    const state = stateOf(graph);
    for (const entry of entries) {
      // Push is a mortal's own spend, excluded as the plan excludes it.
      if (isPushEligible(entry.templateId)) continue;
      const tmpl = templateOf(entry.templateId);
      if (!tmpl) continue;
      const forecast = forecastEncounterExpectedUtility(entry, 'mortal', graph);
      for (let i = 0; i < entry.stepCount; i++) {
        const sb = tmpl.steps[i];
        const authored = isActionStepBranch(sb) ? sb.fallback : sb;
        // A difficulty priced from the target or from intelligence is a per-roll
        // read the cache cannot carry; it is not what this contract pins.
        if (authored.difficultyContext) continue;
        const resolver = previewStepProbability(actionAt(entry.templateId, i), tmpl, state);
        if (resolver === undefined) continue; // no roll: difficulty 0, a fight's no-roll end
        const cap = computeCapability(graph, 'mortal', entry.stepReaches[i]);
        samples.push({
          templateId: entry.templateId,
          step: i,
          scale: entry.scale,
          planner: estimateStepProbability(cap, entry.stepDifficulties[i], undefined, entry.scale),
          plannerQuantised: forecast.stepForecasts[i].successProbability,
          resolver,
        });
      }
    }
  }
  return samples;
}

describe('the planner forecasts the odds the dice use (planner-forecast-equals-roll)', () => {
  const samples = collectParitySamples();

  it('samples at least 200 cache-entry steps, across more than one scale', () => {
    expect(samples.length).toBeGreaterThanOrEqual(200);
    console.info(`[THR-1579 parity] ${samples.length} steps; scales ${[...new Set(samples.map((s) => s.scale ?? 'regional'))].join('/')}`);
    const scales = new Set(samples.map((s) => s.scale ?? 'regional'));
    expect(scales.size).toBeGreaterThanOrEqual(2);
    expect(scales.has('local')).toBe(true);
  });

  it(`mean |planner P − resolver P| ≤ KPI_FORECAST_PARITY_MAX (${KPI_FORECAST_PARITY_MAX})`, () => {
    const meanAbs = samples.reduce((s, x) => s + Math.abs(x.planner - x.resolver), 0) / samples.length;
    expect(meanAbs).toBeLessThanOrEqual(KPI_FORECAST_PARITY_MAX);
    // Stronger than the KPI: with nothing unforeseeable in play, the two are equal.
    for (const x of samples) expect(x.planner, `${x.templateId}#${x.step}`).toBeCloseTo(x.resolver, 9);
  });

  it('the expected-utility forecast reads the same odds, to d100 resolution', () => {
    for (const x of samples) {
      expect(Math.abs(x.plannerQuantised - x.resolver), `${x.templateId}#${x.step}`).toBeLessThan(0.01 + 1e-9);
    }
  });

  it('the case the plan names: a local step at difficulty 0.45 plans with what it rolls', () => {
    // Capability 0.55 against d 0.45 at local scale: the old planner read 0.10 → floor 0.05
    // while the roll applied the −0.10 offset and the 0.65 floor.
    const rolled = estimateStepProbability(0.55, 0.45, undefined, 'local');
    expect(rolled).toBeGreaterThanOrEqual(0.65);
    expect(forecastStepProbabilities(0.55, 0.45, undefined, 'local').successProbability).toBeCloseTo(0.65, 2);
  });
});

// ─── F — the engagement forecast ────────────────────────────────

function fixtureEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'fixture.two_step',
    locationId: 'loc.0', sublocationId: null, sublocationTypeId: null,
    reachPrimary: 'iron', reachSecondary: 'iron',
    threatRating: 'moderate', encounterType: 'explore',
    motivations: [], requiresPresence: true, remotePenalty: 0,
    questPriority: 1, isQuestEncounter: false,
    totalTickCost: 2, successRewardEstimate: 1,
    stepCount: 2,
    stepDifficulties: [0.4, 0.5],
    stepReaches: ['iron', 'heart'],
    scale: 'regional',
    stepFailBehaviors: ['fail_action', 'continue_weakened'],
    ...overrides,
  };
}

describe('F — the probability the action ends in the success family', () => {
  it('is the exact product of per-step survival, and differs from completionProb', () => {
    const graph = worldWithActor(25);
    const entry = fixtureEntry();
    const forecast = forecastEncounterExpectedUtility(entry, 'mortal', graph);
    const [s0, s1] = forecast.stepForecasts;

    // Step 0 is fail_action: any failure ends it. Step 1 is continue_weakened: only
    // a critical failure ends it; a plain failure pushes on to success_at_cost.
    const expected = (1 - s0.failureProbability) * (1 - s1.critFailureProbability);
    expect(forecast.engagementForecast).toBeCloseTo(expected, 12);
    expect(stepEngagementSurvival(s0, 'fail_action')).toBeCloseTo(s0.successProbability, 12);
    expect(stepEngagementSurvival(s1, 'continue_weakened')).toBeCloseTo(1 - s1.critFailureProbability, 12);

    // completionProb counts the continue-weakened failure as a loss; F does not.
    expect(forecast.completionProb).toBeCloseTo(s0.successProbability * s1.successProbability, 12);
    expect(forecast.engagementForecast).toBeGreaterThan(forecast.completionProb);
  });

  it('reads a missing fail behaviour as continue_weakened (fail-soft)', () => {
    const graph = worldWithActor(10);
    const bare = forecastEncounterExpectedUtility(fixtureEntry({ stepFailBehaviors: undefined }), 'mortal', graph);
    const expected = bare.stepForecasts.reduce((p, s) => p * (1 - s.critFailureProbability), 1);
    expect(bare.engagementForecast).toBeCloseTo(expected, 12);
  });

  it('every step fail_action → F equals completionProb', () => {
    const graph = worldWithActor(10);
    const f = forecastEncounterExpectedUtility(
      fixtureEntry({ stepFailBehaviors: ['fail_action', 'fail_action'] }), 'mortal', graph,
    );
    expect(f.engagementForecast).toBeCloseTo(f.completionProb, 12);
  });

  it('rides the scored candidate and its trace', () => {
    const graph = worldWithActor(10);
    graph.addNode({ id: 'loc.0', type: 'location', name: 'Here', properties: { hexCol: 0, hexRow: 0 } });
    graph.addEdge({ id: 'e.at', source: 'mortal', target: 'loc.0', type: 'located_at', properties: {} });
    const entry = fixtureEntry();
    const result = scoreAndSelect([entry], 'mortal', 'loc.0', graph, TICK);
    const scored = result.rankedCandidates[0];
    expect(scored).toBeDefined();
    expect(scored.engagementForecast).toBeGreaterThan(0);
    expect(scored.engagementForecast).toBeLessThanOrEqual(1);
    expect(result.trace.topCandidates[0].engagementForecast).toBe(scored.engagementForecast);
  });
});

// ─── Growth term units ──────────────────────────────────────────

describe('the growth term varies with difficulty', () => {
  // A capability just under a tier boundary, so the proximity factor is > 0.
  const nearBoundary = computeTier(0.45) / 10 - 0.01;
  const at = (difficulty: number) => estimateEncounterGrowthValue(
    fixtureEntry({ stepDifficulties: [difficulty, difficulty] }), nearBoundary,
  );

  it('a hard encounter offers more growth credit than an easy one', () => {
    expect(at(0.1)).toBeGreaterThan(0);
    expect(at(0.3)).toBeGreaterThan(at(0.1));
    expect(at(0.5)).toBeGreaterThan(at(0.3));
    expect(at(0.7)).toBeGreaterThan(at(0.5));
  });

  it('distinct difficulty bands give distinct credit (it was one value for all)', () => {
    const credits = new Set([0.1, 0.3, 0.5, 0.7, 0.9].map((d) => at(d).toFixed(9)));
    expect(credits.size).toBe(5);
  });
});
