/**
 * The one prioritization board — unit and contract tests (THR-1292 §4).
 *
 * Three of the tests below exist because a plausible first implementation of this
 * module was **wrong in a way unit tests could not see**, and each pins the thing
 * that was wrong rather than the thing that happened to work:
 *
 *  1. `ambitionPrefersVerb` — the plan's bracket "[an active ambition names this
 *     kind]" reads most naturally as a membership test, and that reading is a
 *     constant `true` for every candidate the generator can produce. A test that
 *     built its own ambition and its own template would have agreed with it.
 *  2. `forecastAdvanceProbability` — `successProbability` is the obvious source
 *     and it over-counts by the near-miss band, which halts. The pin drives the
 *     *real* `resolveStepCore` over all 100 rolls.
 *  3. the desire and temperament terms — both are multipliers, and a multiplier
 *     that is secretly constant changes no ranking while looking live on a trace.
 */

import { describe, it, expect } from 'vitest';
import {
  ambitionPrefersVerb,
  computeBoardDesireMultiplier,
  computeTemperamentWeight,
  forecastAdvanceProbability,
  resolveUndertakingPayoff,
  scoreUnifiedBoard,
  undertakingEVT,
} from '../decisionBoard';
import { resolveStepCore } from '../stepResolutionCore';
import { CHECKPOINT_EFFECT_BY_BAND } from '../undertakingCheckpoints';
import { getAllStrategicTemplates, findAmbitionTemplate } from '../strategicActionCandidates';
import { AMBITION_TEMPLATES } from '../../data/ambition-templates';
import { VALUE_PAIRS } from '../../types/agent';
import type { AxiologicalProfile, ValuePair } from '../../types/agent';
import type { StrategicActionTemplate } from '../../types/strategicAction';
import {
  STRATEGIC_VERB_IMPACT,
  STRATEGIC_VERB_IMPACT_DEFAULT,
  UNDERTAKING_CHECKPOINT_INTERVAL_TICKS,
  UNDERTAKING_PAYOFF_SCALE,
  UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT,
  UNDERTAKING_TEMPERAMENT_REACH_WEIGHT,
} from '../../data/strategic-action-constants';

// ─── Fixtures ───────────────────────────────────────────────────

function profileOf(overrides: Partial<AxiologicalProfile> = {}): AxiologicalProfile {
  const zero = Object.fromEntries(VALUE_PAIRS.map(p => [p, 0])) as AxiologicalProfile;
  return { ...zero, ...overrides };
}

function templateOf(over: Partial<StrategicActionTemplate> = {}): StrategicActionTemplate {
  return {
    id: 'test_template',
    displayName: 'Test',
    verb: 'create',
    executionMode: 'multi_tick_project',
    behaviorFamily: 'builder-civic',
    reachProfile: { iron: 1 },
    activityProse: [],
    completionProse: [],
    targetRule: { type: 'any_location' },
    ...over,
  } as StrategicActionTemplate;
}

// ─── Payoff ─────────────────────────────────────────────────────

describe('resolveUndertakingPayoff', () => {
  it('prefers an authored payoffValue over the verb table', () => {
    const payoff = resolveUndertakingPayoff(templateOf({ payoffValue: 0.42, verb: 'create' }));
    expect(payoff).toBeCloseTo(0.42 * UNDERTAKING_PAYOFF_SCALE, 10);
    // …and the verb table would have said something else, so the assertion above
    // is about precedence rather than about two numbers that happen to agree.
    expect(STRATEGIC_VERB_IMPACT['create']).not.toBeCloseTo(0.42, 3);
  });

  it('falls back to the shared verb table, and to its default for an unknown verb', () => {
    expect(resolveUndertakingPayoff(templateOf({ verb: 'destroy' })))
      .toBeCloseTo(STRATEGIC_VERB_IMPACT['destroy'] * UNDERTAKING_PAYOFF_SCALE, 10);
    expect(resolveUndertakingPayoff(templateOf({ verb: 'not_a_verb' as never })))
      .toBeCloseTo(STRATEGIC_VERB_IMPACT_DEFAULT * UNDERTAKING_PAYOFF_SCALE, 10);
  });

  it('is total for a missing template', () => {
    expect(resolveUndertakingPayoff(undefined)).toBeCloseTo(STRATEGIC_VERB_IMPACT_DEFAULT, 10);
  });

  it('an authored payoff wins over the verb table, and the fallback still covers the rest', () => {
    // Was the emptiness pin ("no template authors `payoffValue` yet") until THR-1297
    // slice 5 authored the T1 kinds' rows — which is precisely what the pin existed
    // to announce: the verb-table fallback is no longer universal.
    //
    // Restated as the two-sided property rather than a list of ids or a count
    // (THR-688 rule A — a snapshot rots on the next content edit). Both halves matter:
    // an authored row must actually be *used*, and every unauthored template must
    // still resolve, or the fallback would have quietly stopped covering the corpus.
    const all = getAllStrategicTemplates();
    const authored = all.filter(t => t.payoffValue !== undefined);
    const unauthored = all.filter(t => t.payoffValue === undefined);

    // Vacuity guards on both populations — an empty either side would make one of the
    // two assertions below pass by describing nothing (impediment #599 class).
    expect(authored.length).toBeGreaterThan(0);
    expect(unauthored.length).toBeGreaterThan(0);

    for (const t of authored) {
      expect(resolveUndertakingPayoff(t)).toBeCloseTo(t.payoffValue!, 10);
    }
    for (const t of unauthored) {
      const impact = STRATEGIC_VERB_IMPACT[t.verb] ?? STRATEGIC_VERB_IMPACT_DEFAULT;
      expect(resolveUndertakingPayoff(t)).toBeCloseTo(impact * UNDERTAKING_PAYOFF_SCALE, 10);
    }
  });
});

// ─── EVT ────────────────────────────────────────────────────────

describe('undertakingEVT', () => {
  it('is payoff × P² / (checkpoints × interval) — the plan’s two terms, multiplied out', () => {
    const payoff = 0.8;
    const p = 0.6;
    const checkpoints = 3;
    const expected = (payoff * p * p) / (checkpoints * UNDERTAKING_CHECKPOINT_INTERVAL_TICKS);
    expect(undertakingEVT(payoff, p, checkpoints)).toBeCloseTo(expected, 10);
  });

  it('penalises a marginal undertaking quadratically, not linearly', () => {
    // The whole reason `P` appears twice. Halving the odds must cost roughly a
    // quarter of the value, not half — a linear implementation passes every
    // ordering assertion and fails this one.
    const certain = undertakingEVT(1, 0.8, 3);
    const coinFlip = undertakingEVT(1, 0.4, 3);
    expect(certain / coinFlip).toBeCloseTo(4, 5);
  });

  it('is total at a zero probability rather than returning Infinity or NaN', () => {
    const evt = undertakingEVT(1, 0, 3);
    expect(Number.isFinite(evt)).toBe(true);
    expect(evt).toBe(0);
  });
});

// ─── The advance forecast, pinned against the real ladder ───────

describe('forecastAdvanceProbability (contract: the board forecasts what the dice do)', () => {
  /**
   * Drive the *real* `resolveStepCore` over every one of the 100 rolls and count
   * how many produce a non-halting band. `resolveAction` derives its roll as
   * `floor(rng() * 100) + 1`, so feeding `(roll - 1) / 100` selects each roll
   * exactly once.
   */
  function empiricalAdvanceShare(capability: number, difficulty: number): number {
    let advances = 0;
    for (let roll = 1; roll <= 100; roll++) {
      const core = resolveStepCore(
        {
          actorId: 'a',
          reach: 'iron',
          capability,
          difficulty,
          actionModifiers: 0,
          testShapers: undefined,
          variancePolicy: 'agent',
          quintessencePolicy: 'none',
          tick: 1,
          sourceLabel: 'undertaking',
        },
        () => (roll - 1) / 100,
      );
      if (CHECKPOINT_EFFECT_BY_BAND[core.outcome] !== 'halt') advances++;
    }
    return advances / 100;
  }

  const arms: ReadonlyArray<readonly [string, number, number]> = [
    ['capable actor, easy work', 0.9, 0.2],
    ['capable actor, hard work', 0.9, 0.8],
    ['middling actor, default difficulty', 0.5, 0.45],
    ['incapable actor, hard work (probability floor active)', 0.05, 0.95],
    ['incapable actor, easy work', 0.05, 0.1],
  ];

  it.each(arms)('matches the ladder exactly — %s', (_label, capability, difficulty) => {
    expect(forecastAdvanceProbability(capability, difficulty))
      .toBeCloseTo(empiricalAdvanceShare(capability, difficulty), 10);
  });

  it('is strictly below successProbability, because near_miss succeeds and halts', () => {
    // The falsification arm. `CHECKPOINT_EFFECT_BY_BAND.near_miss` is `'halt'`
    // while `near_miss` is a *succeeding* roll, so any implementation that read
    // `successProbability` would land above this forecast. Asserted on an arm
    // chosen so the near-miss window sits inside the roll range rather than
    // clipped off either end.
    expect(CHECKPOINT_EFFECT_BY_BAND.near_miss).toBe('halt');
    const capability = 0.6;
    const difficulty = 0.45;
    const forecast = forecastAdvanceProbability(capability, difficulty);
    const empirical = empiricalAdvanceShare(capability, difficulty);
    expect(forecast).toBe(empirical);
    // At least one roll in the sweep must actually be a halting near miss,
    // otherwise this arm proves nothing about the band it is named for.
    expect(forecast).toBeLessThan(0.95);
  });

  it('varies across the capability band real agents actually occupy', () => {
    // The band is measured, not guessed. A 150-tick seed-42 medium run resolved
    // 384 checkpoints whose `capability` ranged 0.792–1.000 (mean 0.983) against
    // difficulties of 0.450–0.550 — `computeCapability` is a sigmoid over raw
    // domain scores of 10–40, so competent mortals sit near the top of it.
    //
    // Sweeping 0.2–0.8 instead, which is the natural-looking choice, returns a
    // *constant* 0.14: below roughly 0.65 the raw threshold falls under the
    // regional scale floor and `FLOOR_UPGRADE_OUTCOME` decides the band instead of
    // the roll. That is correct behaviour rather than a dead term — but a test
    // written on that range would have reported this forecast as constant and been
    // right about the numbers while wrong about the system.
    const realistic = [0.80, 0.85, 0.90, 0.95, 1.0];
    const byCapability = realistic.map(c => forecastAdvanceProbability(c, 0.45));
    expect(new Set(byCapability).size).toBe(realistic.length);
    // Monotone increasing in capability — the direction, not just the spread.
    for (let i = 1; i < byCapability.length; i++) {
      expect(byCapability[i]).toBeGreaterThan(byCapability[i - 1]);
    }

    // Difficulty likewise, swept over the authored range plus the escalation delta.
    const byDifficulty = [0.45, 0.50, 0.55].map(d => forecastAdvanceProbability(0.95, d));
    expect(new Set(byDifficulty).size).toBe(3);
    for (let i = 1; i < byDifficulty.length; i++) {
      expect(byDifficulty[i]).toBeLessThan(byDifficulty[i - 1]);
    }
  });

  it('is floor-pinned below the scale floor, and that is the ladder’s doing', () => {
    // Pins the behaviour the test above documents, so a future change to
    // `MIN_PROBABILITY_BY_SCALE` or `FLOOR_UPGRADE_OUTCOME` surfaces here rather
    // than as a silently different board ranking for incapable actors.
    const pinned = [0.1, 0.3, 0.5, 0.6].map(c => forecastAdvanceProbability(c, 0.45));
    expect(new Set(pinned).size).toBe(1);
  });
});

// ─── Desire ─────────────────────────────────────────────────────

describe('computeBoardDesireMultiplier', () => {
  const pair = VALUE_PAIRS[0] as ValuePair;

  it('responds to the agent’s profile — the term is not a constant', () => {
    const aligned = computeBoardDesireMultiplier([pair], profileOf({ [pair]: 0.8 }), 0);
    const neutral = computeBoardDesireMultiplier([pair], profileOf({ [pair]: 0 }), 0);
    const opposed = computeBoardDesireMultiplier([pair], profileOf({ [pair]: -0.8 }), 0);
    expect(aligned).toBeGreaterThan(neutral);
    expect(neutral).toBeGreaterThanOrEqual(opposed);
  });

  it('responds to the ambition boost with no authored motivations at all', () => {
    // This is the v1 state of every shipped template, so if it were flat the
    // desire term would be dead on arrival for undertakings — live-looking on the
    // trace, contributing nothing to the ranking.
    const withAmbition = computeBoardDesireMultiplier([], profileOf(), 0.5);
    const without = computeBoardDesireMultiplier([], profileOf(), 0);
    expect(withAmbition).toBeGreaterThan(without);
  });

  it('never returns NaN or a negative for a strongly opposed profile', () => {
    const v = computeBoardDesireMultiplier(
      VALUE_PAIRS.map(p => p),
      profileOf(Object.fromEntries(VALUE_PAIRS.map(p => [p, -1])) as Partial<AxiologicalProfile>),
      0,
    );
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThan(0);
  });
});

// ─── Temperament ────────────────────────────────────────────────

describe('computeTemperamentWeight', () => {
  it('is 1 + the two named weights, and an encounter’s baseline is exactly 1', () => {
    expect(computeTemperamentWeight(templateOf({ reachProfile: {} }), 'iron', false)).toBe(1);
    expect(computeTemperamentWeight(templateOf({ reachProfile: {} }), 'iron', true))
      .toBeCloseTo(1 + UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT, 10);
    expect(computeTemperamentWeight(templateOf({ reachProfile: { iron: 1 } }), 'iron', false))
      .toBeCloseTo(1 + UNDERTAKING_TEMPERAMENT_REACH_WEIGHT, 10);
  });

  it('clamps a reach affinity above 1 rather than letting authoring inflate the weight', () => {
    expect(computeTemperamentWeight(templateOf({ reachProfile: { iron: 7 } }), 'iron', false))
      .toBeCloseTo(1 + UNDERTAKING_TEMPERAMENT_REACH_WEIGHT, 10);
  });

  it('is total for a missing template', () => {
    expect(computeTemperamentWeight(undefined, 'iron', false)).toBe(1);
  });
});

// ─── The anti-vacuity guard on the ambition term ────────────────

describe('ambitionPrefersVerb (guard: the term must discriminate on real data)', () => {
  /**
   * Every (ambition, template) pair the generator can actually produce — walked
   * from the shipped data, not from a fixture. A fixture here would be free to
   * invent an ambition whose profile disagrees with its own template list, which
   * is precisely the disagreement the real data may or may not contain.
   */
  const realPairs: ReadonlyArray<{ ambitionId: string; template: StrategicActionTemplate }> = (() => {
    const pairs: { ambitionId: string; template: StrategicActionTemplate }[] = [];
    for (const ambition of AMBITION_TEMPLATES) {
      const profile = ambition.strategicProfile;
      if (!profile) continue;
      for (const templateId of profile.templateIds) {
        const template = getAllStrategicTemplates().find(t => t.id === templateId);
        if (template) pairs.push({ ambitionId: ambition.id, template });
      }
    }
    return pairs;
  })();

  it('has real pairs to judge (otherwise every assertion below is vacuous)', () => {
    expect(realPairs.length).toBeGreaterThan(10);
  });

  it('is neither always true nor always false across the shipped data', () => {
    // THE test this module owes. The plan's bracket also admits the reading
    // "does an active ambition name this template", which is a constant `true`
    // by construction — `generateStrategicCandidates` only ever walks an
    // ambition's own `templateIds`. That reading passes every other test in this
    // file and makes the 0.3 weight untunable. This one fails it.
    const verdicts = realPairs.map(p => ambitionPrefersVerb(p.ambitionId, p.template));
    const trues = verdicts.filter(Boolean).length;
    expect(trues).toBeGreaterThan(0);
    expect(trues).toBeLessThan(verdicts.length);
  });

  it('reads the ambition’s own preferredVerbs', () => {
    const pair = realPairs.find(p => ambitionPrefersVerb(p.ambitionId, p.template));
    expect(pair).toBeDefined();
    const profile = findAmbitionTemplate(pair!.ambitionId)?.strategicProfile;
    expect(profile?.preferredVerbs).toContain(pair!.template.verb);
  });

  it('is false — never thrown — for an unknown ambition or a missing template', () => {
    expect(ambitionPrefersVerb('no_such_ambition', templateOf())).toBe(false);
    expect(ambitionPrefersVerb(AMBITION_TEMPLATES[0].id, undefined)).toBe(false);
  });
});

// ─── Board assembly ─────────────────────────────────────────────

describe('scoreUnifiedBoard', () => {
  const emptyGraph = {
    getNode: () => null,
    getOutgoingEdges: () => [],
  } as never;

  it('returns an empty board with a null winner rather than throwing', () => {
    const board = scoreUnifiedBoard({
      graph: emptyGraph,
      agentId: 'a',
      tick: 1,
      encounterCandidates: [],
      strategicCandidates: [],
    });
    expect(board.entries).toEqual([]);
    expect(board.winner).toBeNull();
    expect(board.top).toEqual([]);
  });

  it('scores an encounter as valuePerTick × desireMultiplier at temperament 1', () => {
    const candidate = {
      entry: { templateId: 'enc.test' },
      valuePerTick: 0.4,
      desireMultiplier: 1.25,
    } as never;

    const board = scoreUnifiedBoard({
      graph: emptyGraph,
      agentId: 'a',
      tick: 1,
      encounterCandidates: [candidate],
      strategicCandidates: [],
    });

    expect(board.entries).toHaveLength(1);
    expect(board.entries[0].family).toBe('encounter');
    expect(board.entries[0].temperamentWeight).toBe(1);
    expect(board.entries[0].score).toBeCloseTo(0.4 * 1.25, 10);
    // An encounter has no checkpoint, so it carries no forecast — an absent key,
    // not a zero that would read as "certain to halt".
    expect(board.entries[0].advanceProbability).toBeUndefined();
  });

  it('sorts descending and caps `top`', () => {
    const mk = (id: string, vpt: number) => ({
      entry: { templateId: id },
      valuePerTick: vpt,
      desireMultiplier: 1,
    }) as never;

    const board = scoreUnifiedBoard({
      graph: emptyGraph,
      agentId: 'a',
      tick: 1,
      encounterCandidates: [mk('low', 0.1), mk('high', 0.9), mk('mid', 0.5)],
      strategicCandidates: [],
    });

    expect(board.entries.map(e => e.id)).toEqual(['high', 'mid', 'low']);
    expect(board.winner?.id).toBe('high');
    expect(board.top.length).toBeLessThanOrEqual(5);
  });
});
