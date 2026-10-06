// THR-1740 — the forecast-window re-plan's two scoring changes:
// Decision 1 (branching quests face the window, except a threaded mortal's) and
// Decision 3 (value stops growing with the odds above the window's midpoint).
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { EncounterCacheEntry } from '../encounterCache';
import type { AxiologicalProfile, ValuePair } from '../../types/agent';
import { VALUE_PAIRS } from '../../types/agent';
import type { ReachDomain } from '../../types/traits';
import {
  scoreAndSelect,
  questKeepsShippedScoring,
  computeOddsNeutralScale,
  type ScoredCandidate,
} from '../encounterScoring';
import {
  ENGAGE_VALUE_ODDS_PIVOT,
  ENGAGE_TOO_EASY_AT,
  ENGAGE_TOO_EASY_FIT,
  ENGAGE_WINDOW_LOW,
  ENGAGE_WINDOW_HIGH,
} from '../../data/agent-behavior-constants';
import { BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE } from '../encounter/branchingConstants';

function zeroProfile(): AxiologicalProfile {
  return Object.fromEntries(VALUE_PAIRS.map((p) => [p, 0])) as AxiologicalProfile;
}

function makeEntry(overrides: Partial<EncounterCacheEntry> = {}): EncounterCacheEntry {
  return {
    templateId: 'tmpl_default',
    locationId: 'loc_a',
    sublocationId: null,
    sublocationTypeId: null,
    reachPrimary: 'iron' as ReachDomain,
    reachSecondary: 'gold' as ReachDomain,
    threatRating: 'moderate' as never,
    encounterType: 'combat' as never,
    motivations: ['mercy_ruthlessness'] as ValuePair[],
    requiresPresence: true,
    remotePenalty: 0,
    questPriority: 1.0,
    isQuestEncounter: false,
    totalTickCost: 3,
    successRewardEstimate: 2.0,
    stepCount: 1,
    stepDifficulties: [0.05],
    stepReaches: ['iron'] as ReachDomain[],
    ...overrides,
  };
}

/** A strong iron mortal at loc_a, optionally threaded to an ascendant. */
function buildGraph(threaded: boolean): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc_a', type: 'location', name: 'A', properties: { locationType: 'settlement', hexCol: 0, hexRow: 0 } });
  graph.addNode({
    id: 'agent_1', type: 'actor', name: 'Mortal',
    properties: { actorType: 'individual', axiologicalProfile: zeroProfile(), locationId: 'loc_a' },
  });
  graph.addNode({
    id: 'trait_combat', type: 'trait', name: 'Combat',
    properties: { subcategory: 'mastery', domainContributions: { iron: 5 } },
  });
  graph.addEdge({ id: 'e_trait', source: 'agent_1', target: 'trait_combat', type: 'has_trait', properties: { level: 5 } });
  if (threaded) {
    graph.addNode({ id: 'ascendant_1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addEdge({ id: 'e_thread', source: 'ascendant_1', target: 'agent_1', type: 'thread', properties: { courtPosition: 'the_first' } });
  }
  return graph;
}

function score(threaded: boolean, entry: EncounterCacheEntry, bypass = false): ScoredCandidate {
  const graph = buildGraph(threaded);
  const result = scoreAndSelect(
    [entry], 'agent_1', 'loc_a', graph, 1,
    undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
    { consecutiveFailures: 0, bypass },
  );
  const c = result.rankedCandidates.find(x => x.entry.templateId === entry.templateId);
  if (!c) throw new Error('candidate not scored');
  return c;
}

describe('questKeepsShippedScoring (THR-1740 Decision 1)', () => {
  it('ships with scope "threaded"', () => {
    expect(BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE).toBe('threaded');
  });

  it('only branching quests can keep the shipped scoring', () => {
    for (const scope of ['all', 'threaded', 'none'] as const) {
      expect(questKeepsShippedScoring(false, true, scope)).toBe(false);
    }
  });

  it('"threaded" keeps it for a threaded mortal only; "all" keeps today\'s for everyone; "none" for no one', () => {
    expect(questKeepsShippedScoring(true, true, 'threaded')).toBe(true);
    expect(questKeepsShippedScoring(true, false, 'threaded')).toBe(false);
    expect(questKeepsShippedScoring(true, false, 'all')).toBe(true);
    expect(questKeepsShippedScoring(true, true, 'none')).toBe(false);
  });

  it('reads an unknown scope as "all" (fail-soft to today)', () => {
    expect(questKeepsShippedScoring(true, false, 'bogus' as never)).toBe(true);
  });
});

describe('computeOddsNeutralScale (THR-1740 Decision 3)', () => {
  it('is 1 at and below the pivot, pivot/F above it', () => {
    expect(computeOddsNeutralScale(ENGAGE_VALUE_ODDS_PIVOT, false, false)).toBe(1);
    expect(computeOddsNeutralScale(0.4, false, false)).toBe(1);
    expect(computeOddsNeutralScale(0.95, false, false)).toBeCloseTo(ENGAGE_VALUE_ODDS_PIVOT / 0.95, 12);
  });

  it('the pivot is the window midpoint', () => {
    expect(ENGAGE_VALUE_ODDS_PIVOT).toBeCloseTo((ENGAGE_WINDOW_LOW + ENGAGE_WINDOW_HIGH) / 2, 12);
  });

  it('is 1 when the window is bypassed, when the candidate keeps shipped scoring, for a NaN F, a bad pivot, or switched off', () => {
    expect(computeOddsNeutralScale(0.95, true, false)).toBe(1);
    expect(computeOddsNeutralScale(0.95, false, true)).toBe(1);
    expect(computeOddsNeutralScale(NaN, false, false)).toBe(1);
    expect(computeOddsNeutralScale(0.95, false, false, true, 0)).toBe(1);
    expect(computeOddsNeutralScale(0.95, false, false, false)).toBe(1);
  });
});

describe('scoreAndSelect — quests and sure things in the window (THR-1740)', () => {
  const quest = makeEntry({ templateId: 'quest.sure', isQuestEncounter: true });
  const plain = makeEntry({ templateId: 'plain.sure' });

  it('the fixture is a near-certain challenge (beyond the too-easy edge)', () => {
    const c = score(false, quest);
    expect(c.engagementForecast).toBeGreaterThan(ENGAGE_TOO_EASY_AT);
  });

  it('a threaded mortal\'s quest keeps fit 1 and scale 1', () => {
    const c = score(true, quest);
    expect(c.questKeepsShipped).toBe(true);
    expect(c.engagementFit).toBe(1);
    expect(c.oddsNeutralScale).toBe(1);
  });

  it('an unthreaded mortal\'s quest gets the too-easy fit and pivot/F', () => {
    const c = score(false, quest);
    expect(c.questKeepsShipped).toBe(false);
    expect(c.engagementFit).toBeCloseTo(ENGAGE_TOO_EASY_FIT, 10);
    expect(c.oddsNeutralScale).toBeCloseTo(ENGAGE_VALUE_ODDS_PIVOT / c.engagementForecast, 10);
  });

  it('the scale is already inside valuePerTick: the threaded quest is worth F/pivot more per tick, same inputs', () => {
    const threaded = score(true, quest);
    const unthreaded = score(false, quest);
    expect(threaded.engagementForecast).toBeCloseTo(unthreaded.engagementForecast, 12);
    expect(unthreaded.valuePerTick).toBeCloseTo(threaded.valuePerTick * unthreaded.oddsNeutralScale, 10);
  });

  it('a non-quest sure thing is scaled for threaded and unthreaded mortals alike', () => {
    expect(score(true, plain).oddsNeutralScale).toBeLessThan(1);
    expect(score(false, plain).oddsNeutralScale).toBeLessThan(1);
    expect(score(true, plain).questKeepsShipped).toBe(false);
  });

  it('bypassed (not a free choice): scale 1, fit 1, window edges NaN', () => {
    const c = score(false, quest, true);
    expect(c.oddsNeutralScale).toBe(1);
    expect(c.engagementFit).toBe(1);
    expect(Number.isNaN(c.engagementWindowLow)).toBe(true);
    expect(Number.isNaN(c.engagementWindowHigh)).toBe(true);
  });

  it('carries the window edges the fit used', () => {
    const c = score(false, plain);
    expect(c.engagementWindowLow).toBeCloseTo(ENGAGE_WINDOW_LOW, 10);
    expect(c.engagementWindowHigh).toBeCloseTo(ENGAGE_WINDOW_HIGH, 10);
  });
});
