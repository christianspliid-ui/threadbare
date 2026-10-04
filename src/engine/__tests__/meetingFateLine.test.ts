/**
 * Show the roll — THR-1714.
 *
 * The meeting reveals now open with a fate line: what the hand made the odds,
 * then what fate did with the lean. These tests pin four things:
 *
 * 1. **The roll did not move.** Over every converted dilemma × 20 seeds × four
 *    hands, `band` and `writtenPole` equal a verbatim copy of the pre-change
 *    resolver. The forecasts are stamped without an rng draw.
 * 2. **The table is total.** Every (lean state × fate answer) cell fills every
 *    token, for formative tests and the bond, and all 9 value pairs resolve to
 *    words — never a raw `mercy_ruthlessness` key.
 * 3. **The line never lies.** On real resolutions, "went with you" means the
 *    leaned pole was written; "turned against you" means the other one was.
 * 4. **The dormant traces fire.** One `meeting.test_resolved` per formative test
 *    and one `meeting.bond_resolved` per meeting, each with a fate-line key.
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  createAgentFromMeeting,
  meetingResolutionInput,
  resolveBondTest,
  resolveFormativeTest,
  resetMeetingCounter,
} from '../meetingEncounter';
import {
  FATE_LINE_NO_FORECAST_SUFFIX,
  fateAnswerForBand,
  leanTagFor,
  poleWordsFor,
  selectBondFateLine,
  selectFormativeFateLine,
} from '../meetingFateLine';
import { forecastAction, resolveAction } from '../resolutionService';
import { mapResolverOutcomeToStep } from '../unifiedActionResolution';
import { applyRider, selectActiveRider } from '../encounters/nudges';
import { computeNetPoleLean } from '../meetingEncounter';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import { WorldGraph } from '../graph';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import { MEETING_BOND_TEST } from '../../data/meeting-bond-test';
import {
  MEETING_NEUTRAL_LEAN_COIN,
  MEETING_POLE_SHIFT_BY_BAND,
  MEETING_TEST_ACTOR_ID,
  MEETING_TEST_CAPABILITY,
  MEETING_TEST_REACH,
  MEETING_TEST_SPHERE_FACTOR,
} from '../../data/meeting-nudge-constants';
import { FATE_ANSWER_BY_BAND } from '../../data/meeting-narrative-prose';
import { FORECAST_TIER_WORDS } from '../../data/nudge-stage-content';
import { buildMeetingNudgePhaseModel } from '../../components/MeetTheFirst/buildMeetingNudgePhaseModel';
import { VALUE_PAIRS } from '../../types/agent';
import { REACH_DOMAINS } from '../../types/traits';
import { STEP_OUTCOMES, type StepOutcome } from '../../types/unifiedAction';
import type {
  BondOutcome,
  FormativeOutcome,
  FormativeTest,
  MeetingEncounterResult,
  MeetingStepNudge,
} from '../../types/meetingEncounter';
import type { ForecastTier } from '../../types/resolution';

const CONVERTED = ENRICHED_DILEMMA_LIBRARY.filter((t) => t.test != null);
const SEEDS = Array.from({ length: 20 }, (_, i) => 1000 + i * 7919);

// ─── The pre-change resolver, verbatim ────────────────────────────────
//
// Copied from `meetingEncounter.ts` as it stood before THR-1714 (origin/main
// 15a9d7c2) — the private seeded rng, the hand-built `ResolutionInput`, the
// rider, and the conditional neutral-lean coin. If the new code drew from rng
// anywhere before the band, or built a different input, the pin breaks.

function legacySeededRng(baseSeed: number, salt: string): () => number {
  let h = baseSeed;
  for (let i = 0; i < salt.length; i++) {
    h = ((h << 5) - h + salt.charCodeAt(i)) | 0;
  }
  let s = h;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function legacyBand(
  difficulty: number,
  nudges: readonly MeetingStepNudge[],
  played: readonly string[],
  rng: () => number,
): StepOutcome {
  const byId = new Map(nudges.map((n) => [n.id, n]));
  const nudgeDelta = played.reduce((sum, id) => sum + (byId.get(id)?.forecastDelta ?? 0), 0);
  const result = resolveAction(
    {
      actorId: MEETING_TEST_ACTOR_ID,
      domain: MEETING_TEST_REACH,
      capability: MEETING_TEST_CAPABILITY,
      difficulty: Math.max(0, Math.min(1, Number.isFinite(difficulty) ? difficulty : 0.5)),
      sphereFactor: MEETING_TEST_SPHERE_FACTOR,
      actionModifiers: nudgeDelta,
    },
    rng,
    undefined,
    'encounter',
  );
  const band = mapResolverOutcomeToStep(result.outcome, result.rollBreakdown?.nearMiss ?? false);
  return applyRider(band, selectActiveRider({ nudges }, played, 'meeting.formative_test'));
}

function legacyFormative(test: FormativeTest, index: number, played: readonly string[], seed: number) {
  const rng = legacySeededRng(seed, `meeting_test_${index}`);
  const netLean = computeNetPoleLean(test.nudges, played);
  const band = legacyBand(test.difficulty, test.nudges, played, rng);
  const magnitude = MEETING_POLE_SHIFT_BY_BAND[band] ?? 0;
  let writtenPole: 'a' | 'b';
  if (netLean === 'none') writtenPole = rng() < MEETING_NEUTRAL_LEAN_COIN ? 'a' : 'b';
  else writtenPole = magnitude >= 0 ? netLean : netLean === 'a' ? 'b' : 'a';
  return { band, writtenPole };
}

/** Four hands per test: silent, every pole-`a` card, every card, the first card. */
function handsFor(test: FormativeTest): string[][] {
  return [
    [],
    test.nudges.filter((n) => n.poleLean === 'a').map((n) => n.id),
    test.nudges.map((n) => n.id),
    test.nudges.slice(0, 1).map((n) => n.id),
  ];
}

// ─── Fixtures ───────────────────────────────────────────────────────

function formativeFixture(over: Partial<FormativeOutcome>): FormativeOutcome {
  return {
    testIndex: 0,
    templateId: 'tmpl',
    valuePair: 'mercy_ruthlessness',
    netLean: 'a',
    playedNudgeIds: ['n1'],
    band: 'success',
    writtenPole: 'a',
    shift: 0.3,
    quintessenceErosion: 0,
    essenceSpent: 1,
    prose: '',
    baseForecastTier: 'perilous',
    handForecastTier: 'favorable',
    ...over,
  };
}

function bondFixture(over: Partial<BondOutcome>): BondOutcome {
  return {
    band: 'success',
    reception: 'devotion',
    playedNudgeIds: ['n1'],
    essenceSpent: 1,
    prose: '',
    traitSeed: '',
    baseForecastTier: 'uncertain',
    handForecastTier: 'favorable',
    ...over,
  };
}

/** The band that reads as each answer, with the pole it writes for a leaned hand. */
const BAND_FOR_ANSWER = {
  with: 'success',
  half: 'success_at_cost',
  turned_soft: 'near_miss',
  turned: 'failure',
} as const satisfies Record<string, StepOutcome>;

// ─── 1. The roll did not move ───────────────────────────────────────

describe('THR-1714 — determinism pin', () => {
  it('the converted population is real (a vacuous pin passes over nothing)', () => {
    expect(CONVERTED.length).toBeGreaterThanOrEqual(64);
    expect(CONVERTED.every((t) => t.test!.nudges.some((n) => n.poleLean))).toBe(true);
  });

  it('every converted test × 20 seeds × 4 hands: band and pole match the pre-change resolver', () => {
    let compared = 0;
    for (const template of CONVERTED) {
      const test = template.test!;
      for (const hand of handsFor(test)) {
        for (const seed of SEEDS) {
          for (const index of [0, 1]) {
            const before = legacyFormative(test, index, hand, seed);
            const after = resolveFormativeTest(test, index, template.id, hand, seed);
            if (after.band !== before.band || after.writtenPole !== before.writtenPole) {
              throw new Error(`${template.id} seed ${seed} hand [${hand}] diverged`);
            }
            compared++;
          }
        }
      }
    }
    expect(compared).toBe(CONVERTED.length * 4 * SEEDS.length * 2);
  });

  it('the bond test rolls the same band as the pre-change resolver', () => {
    const hands = [[], MEETING_BOND_TEST.nudges.map((n) => n.id)];
    for (const hand of hands) {
      for (const seed of SEEDS) {
        const rng = legacySeededRng(seed, 'meeting_bond');
        const before = legacyBand(MEETING_BOND_TEST.difficulty, MEETING_BOND_TEST.nudges, hand, rng);
        expect(resolveBondTest(MEETING_BOND_TEST, hand, seed).band).toBe(before);
      }
    }
  });
});

// ─── Forecasts on the outcome ──────────────────────────────────────────

describe('THR-1714 — the forecast going in rides on the outcome', () => {
  it('base is the silent forecast, hand is the played hand — the word the header showed', () => {
    for (const template of CONVERTED.slice(0, 12)) {
      const test = template.test!;
      const hand = test.nudges.slice(0, 2).map((n) => n.id);
      const delta = test.nudges.slice(0, 2).reduce((s, n) => s + n.forecastDelta, 0);
      const o = resolveFormativeTest(test, 0, template.id, hand, 42);
      expect(o.baseForecastTier).toBe(forecastAction(meetingResolutionInput(test.difficulty, 0)).forecastTier);
      expect(o.handForecastTier).toBe(forecastAction(meetingResolutionInput(test.difficulty, delta)).forecastTier);

      // The stage reads the same input the engine rolls against: one builder.
      const phase = buildMeetingNudgePhaseModel({ test, testId: template.id, stepIndex: 0 });
      expect(phase.forecastInput).toEqual(meetingResolutionInput(test.difficulty, 0));
      expect(
        forecastAction({ ...phase.forecastInput, actionModifiers: delta }).forecastTier,
      ).toBe(o.handForecastTier);
    }
  });

  it('a silent hand forecasts the same with and without the hand', () => {
    const test = CONVERTED[0].test!;
    const o = resolveFormativeTest(test, 0, CONVERTED[0].id, [], 1);
    expect(o.handForecastTier).toBe(o.baseForecastTier);
    const b = resolveBondTest(MEETING_BOND_TEST, [], 1);
    expect(b.handForecastTier).toBe(b.baseForecastTier);
  });
});

// ─── 2. The table is total ─────────────────────────────────────────

describe('THR-1714 — fate line table', () => {
  it('every StepOutcome reads as an answer', () => {
    for (const band of STEP_OUTCOMES) {
      expect(FATE_ANSWER_BY_BAND[band], band).toBeDefined();
      expect(fateAnswerForBand(band)).toBe(FATE_ANSWER_BY_BAND[band]);
    }
  });

  it('every formative cell fills every token and names the candidate', () => {
    const states = [
      { state: 'leaned', played: ['n1'], netLean: 'a' as const },
      { state: 'odds_only', played: ['n1'], netLean: 'none' as const },
      { state: 'silent', played: [], netLean: 'none' as const },
    ];
    for (const { state, played, netLean } of states) {
      for (const [answer, band] of Object.entries(BAND_FOR_ANSWER)) {
        const goodBand = (MEETING_POLE_SHIFT_BY_BAND[band] ?? 0) >= 0;
        const writtenPole = netLean === 'none' ? 'b' : goodBand ? 'a' : 'b';
        const line = selectFormativeFateLine(
          formativeFixture({ playedNudgeIds: played, netLean, band, writtenPole }),
          'Kael',
        );
        expect(line.key).toBe(`${state}.${answer}`);
        expect(line.text, line.key).not.toMatch(/[{}]/);
        expect(line.text).toContain('Kael');
        expect(line.text).not.toMatch(/\d/);
      }
    }
  });

  it('every bond cell fills', () => {
    for (const played of [['n1'], []]) {
      for (const [answer, band] of Object.entries(BAND_FOR_ANSWER)) {
        const line = selectBondFateLine(bondFixture({ playedNudgeIds: played, band }), 'Kael');
        expect(line.key).toBe(`bond.${played.length ? 'leaned' : 'silent'}.${answer}`);
        expect(line.text).toBeTruthy();
        expect(line.text).not.toMatch(/[{}\d]/);
      }
    }
  });

  it('the worked examples read as the plan wrote them', () => {
    expect(
      selectFormativeFateLine(
        formativeFixture({ band: 'failure', writtenPole: 'b', handForecastTier: 'favorable' }),
        'Kael',
      ).text,
    ).toBe('Your hand made it Favorable. Fate turned against you: Kael came out Power-Hungry.');
    expect(
      selectBondFateLine(
        bondFixture({ playedNudgeIds: [], band: 'success', baseForecastTier: 'uncertain', handForecastTier: 'uncertain' }),
        'Kael',
      ).text,
    ).toBe('You stayed silent. It stood Uncertain. Fate answered alone, and kindly.');
  });

  it('all 9 value pairs resolve to words; courage_prudence falls back to its halves', () => {
    expect(VALUE_PAIRS).toHaveLength(9);
    for (const pair of VALUE_PAIRS) {
      const words = poleWordsFor(pair);
      expect(words.a, pair).toMatch(/^[A-Z][A-Za-z-]+$/);
      expect(words.b, pair).toMatch(/^[A-Z][A-Za-z-]+$/);
      expect(words.a).not.toBe(words.b);
    }
    expect(poleWordsFor('courage_prudence')).toEqual({ a: 'Courage', b: 'Prudence' });
    expect(poleWordsFor('mercy_ruthlessness')).toEqual({ a: 'Brave', b: 'Power-Hungry' });
  });

  it('an outcome without forecast fields drops the forecast clause and says so in the key', () => {
    const line = selectFormativeFateLine(
      formativeFixture({ baseForecastTier: undefined, handForecastTier: undefined }),
      'Kael',
    );
    expect(line.key).toBe(`leaned.with${FATE_LINE_NO_FORECAST_SUFFIX}`);
    expect(line.text).toBe('Fate went with you: Kael came out Brave.');
  });

  it('an empty name reads as the shared stand-in, never a blank', () => {
    const line = selectFormativeFateLine(formativeFixture({}), '  ');
    expect(line.text).toContain('The acting hand');
  });

  it('the lean tag is the sheet word, and only a leaning card carries one', () => {
    expect(leanTagFor('mercy_ruthlessness', 'a')).toBe('Leans Brave');
    expect(leanTagFor('mercy_ruthlessness', 'b')).toBe('Leans Power-Hungry');
    expect(leanTagFor('mercy_ruthlessness', undefined)).toBeUndefined();
    expect(leanTagFor(undefined, 'a')).toBeUndefined();

    const test = CONVERTED[0].test!;
    const phase = buildMeetingNudgePhaseModel({ test, testId: CONVERTED[0].id, stepIndex: 0 });
    for (const card of phase.cards) {
      const nudge = test.nudges.find((n) => n.id === card.id)!;
      expect(card.leanLabel, card.id).toBe(leanTagFor(test.valuePair, nudge.poleLean));
    }
    // The bond test has no poles, so none of its cards lean.
    const bondPhase = buildMeetingNudgePhaseModel({ test: MEETING_BOND_TEST, testId: 'bond', stepIndex: 2 });
    expect(bondPhase.cards.every((c) => c.leanLabel === undefined)).toBe(true);
  });
});

// ─── 3. The line never lies ────────────────────────────────────────

describe('THR-1714 — the fate line agrees with what fate wrote', () => {
  it('on real resolutions, "with you" means the leaned pole was written and "against you" the other', () => {
    let leanedSeen = 0;
    for (const template of CONVERTED) {
      const test = template.test!;
      const hand = test.nudges.filter((n) => n.poleLean === 'a').map((n) => n.id);
      for (const seed of SEEDS.slice(0, 5)) {
        const o = resolveFormativeTest(test, 0, template.id, hand, seed);
        const line = selectFormativeFateLine(o, 'Kael');
        const words = poleWordsFor(o.valuePair);
        if (line.key.startsWith('leaned.')) {
          leanedSeen++;
          if (line.key.startsWith('leaned.with') || line.key.startsWith('leaned.half')) {
            expect(o.writtenPole).toBe(o.netLean);
          } else {
            expect(o.writtenPole).not.toBe(o.netLean);
          }
        }
        // Whatever the row, the pole word the line ends on is the one written.
        expect(line.text).toContain(words[o.writtenPole]);
        const handWord = FORECAST_TIER_WORDS[o.handForecastTier as ForecastTier];
        if (o.playedNudgeIds.length > 0) expect(line.text).toContain(handWord);
      }
    }
    expect(leanedSeen).toBeGreaterThan(0);
  });
});

// ─── 4. The dormant traces fire ────────────────────────────────────

describe('THR-1714 — meeting traces are emitted at the fold', () => {
  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  function result(over: Partial<MeetingEncounterResult>): MeetingEncounterResult {
    const axiologicalProfile = {} as MeetingEncounterResult['axiologicalProfile'];
    for (const pair of VALUE_PAIRS) axiologicalProfile[pair] = 0;
    const reachCapabilities = {} as MeetingEncounterResult['reachCapabilities'];
    for (const r of REACH_DOMAINS) reachCapabilities[r] = 0.3;
    return {
      name: 'Kael',
      archetypeId: 'iron_heart',
      cultureId: 'culture_1',
      axiologicalProfile,
      reachCapabilities,
      primaryReach: 'iron',
      secondaryReach: 'heart',
      sphere: 'force',
      cooperationStrategy: 'tit-for-tat',
      foundingGateTags: [],
      traitSeeds: [],
      appearanceSeed: 1,
      locationId: 'loc_village',
      meetingChoiceRecord: {
        encounterTick: 10,
        locationId: 'loc_village',
        candidateIndex: 0,
        archetypeId: 'iron_heart',
        dilemmaChoices: [],
        sparkVisionId: 'spark_iron_will',
        ascendantSphere: 'life',
        foundingGateTags: [],
      },
      ...over,
    };
  }

  function graph(): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'loc_village', type: 'location', name: 'Ashenmoor', properties: {} });
    return g;
  }

  it('two formative tests and a bond emit two test traces and one bond trace, each keyed', () => {
    resetMeetingCounter();
    enableTracing();
    clearTraces();
    const outcomes = CONVERTED.slice(0, 2).map((t, i) =>
      resolveFormativeTest(t.test!, i, t.id, t.test!.nudges.slice(0, 1).map((n) => n.id), 42 + i),
    );
    const bond = resolveBondTest(MEETING_BOND_TEST, [], 42);
    const r = result({
      meetingChoiceRecord: { ...result({}).meetingChoiceRecord, formativeOutcomes: outcomes },
      bondOutcome: bond,
    });
    const agentId = createAgentFromMeeting(graph(), r, 'asc', 10);

    const tests = getTraces().filter((t) => t.category === 'meeting.test_resolved');
    const bonds = getTraces().filter((t) => t.category === 'meeting.bond_resolved');
    expect(tests).toHaveLength(2);
    expect(bonds).toHaveLength(1);
    for (const [i, t] of tests.entries()) {
      if (t.category !== 'meeting.test_resolved') throw new Error('narrowing');
      expect(t.agentId).toBe(agentId);
      expect(t.fateLineKey).toBe(selectFormativeFateLine(outcomes[i], 'Kael').key);
      expect(t.handForecastTier).toBe(outcomes[i].handForecastTier);
      expect(t.baseForecastTier).toBe(outcomes[i].baseForecastTier);
    }
    const b = bonds[0];
    if (b.category !== 'meeting.bond_resolved') throw new Error('narrowing');
    expect(b.fateLineKey).toBe(selectBondFateLine(bond, 'Kael').key);
    expect(b.fateLineKey.startsWith('bond.silent.')).toBe(true);
    expect(b.receptionId).toBe(bond.reception);
  });

  it('a legacy-path meeting with no outcomes emits nothing', () => {
    enableTracing();
    clearTraces();
    createAgentFromMeeting(graph(), result({}), 'asc', 10);
    expect(getTraces().filter((t) => t.category.startsWith('meeting.'))).toHaveLength(0);
  });
});
