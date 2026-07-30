/**
 * Meet The First nudge conversion — band mapping, scarring, affordability. THR-868.
 *
 * These pin the three things the conversion can silently get wrong: the band →
 * pole mapping (including the "fate overrode your lean" case that is the whole
 * point), the scarring floor, and the authored affordability guarantee.
 */

import { describe, it, expect } from 'vitest';
import type { StepOutcome } from '../../types/unifiedAction';
import type { BondTest, FormativeTest, MeetingEncounterResult } from '../../types/meetingEncounter';
import {
  BOND_RECEPTION_BY_BAND,
  MEETING_FORMATIVE_TEST_COUNT,
  MEETING_POLE_SHIFT_BY_BAND,
  MEETING_QUINTESSENCE_FLOOR,
  MEETING_SCAR_EROSION_BY_BAND,
  MEETING_TEST_COUNT_TOTAL,
  meetingNudgeCostCap,
  type BondReception,
} from '../../data/meeting-nudge-constants';
import { MEETING_BOND_TEST } from '../../data/meeting-bond-test';
import {
  applyMeetingOutcomes,
  computeNetPoleLean,
  resolveBondTest,
  resolveFormativeTest,
} from '../meetingEncounter';
import { QUINTESSENCE_DEFAULT, getQuintessenceThresholdState } from '../../types/quintessence';
import { INITIAL_ESSENCE_PER_SPHERE } from '../influence';

/** Every band on the shared ladder, best → worst. */
const ALL_BANDS: readonly StepOutcome[] = [
  'critical_success',
  'success',
  'success_at_cost',
  'near_miss',
  'failure',
  'critical_failure',
];

function makeTest(overrides: Partial<FormativeTest> = {}): FormativeTest {
  return {
    valuePair: 'mercy_ruthlessness',
    purposeLine: 'Who he spares',
    difficulty: 0.4,
    factorLines: [
      { text: 'The man on the ground is unarmed.', polarity: 'for' },
      { text: 'His own people are watching him decide.', polarity: 'against' },
    ],
    nudges: [
      {
        id: 't.mercy',
        name: 'His mother speaks',
        essenceCost: 1,
        forecastDelta: 0.1,
        poleLean: 'a',
        fiction: 'He hears his mother telling him what he owes the beaten.',
        effectLine: 'An old voice pulls him toward sparing.',
      },
      {
        id: 't.ruth',
        name: 'The cold settles',
        essenceCost: 1,
        forecastDelta: 0.1,
        poleLean: 'b',
        fiction: 'The cold of the morning gets into him and stays.',
        effectLine: 'A hard morning pulls him toward finishing it.',
      },
      {
        id: 't.common',
        name: 'Steady his hands',
        essenceCost: 0,
        forecastDelta: 0.05,
        fiction: 'His hands stop shaking. He notices they have.',
        effectLine: 'Steadier hands, either way.',
      },
    ],
    bandProse: {
      cleanA: 'He lets the man up and walks away first.',
      cleanB: 'He finishes it, and does not look at the others.',
      tempered: 'He lets the man up, and takes his boots.',
      brokenIntoA: 'He means to finish it and cannot make himself.',
      brokenIntoB: 'He means to let the man up, and his arm goes anyway.',
    },
    ...overrides,
  };
}

describe('MEETING_POLE_SHIFT_BY_BAND', () => {
  it('covers every band on the six-value ladder', () => {
    for (const band of ALL_BANDS) {
      expect(MEETING_POLE_SHIFT_BY_BAND[band]).toBeTypeOf('number');
    }
    // Guards against a band being added to StepOutcome without a shift.
    expect(Object.keys(MEETING_POLE_SHIFT_BY_BAND).sort()).toEqual([...ALL_BANDS].sort());
  });

  it('is monotone non-increasing — a better roll never writes less', () => {
    const shifts = ALL_BANDS.map((b) => MEETING_POLE_SHIFT_BY_BAND[b]);
    for (let i = 1; i < shifts.length; i++) {
      expect(shifts[i]).toBeLessThanOrEqual(shifts[i - 1]);
    }
  });

  it('splits the ladder into pole-writing and pole-reversing halves', () => {
    expect(MEETING_POLE_SHIFT_BY_BAND.critical_success).toBeGreaterThan(0);
    expect(MEETING_POLE_SHIFT_BY_BAND.success).toBeGreaterThan(0);
    expect(MEETING_POLE_SHIFT_BY_BAND.success_at_cost).toBeGreaterThan(0);
    expect(MEETING_POLE_SHIFT_BY_BAND.near_miss).toBeLessThan(0);
    expect(MEETING_POLE_SHIFT_BY_BAND.failure).toBeLessThan(0);
    expect(MEETING_POLE_SHIFT_BY_BAND.critical_failure).toBeLessThan(0);
  });
});

describe('computeNetPoleLean', () => {
  const test = makeTest();

  it('reads the majority lean', () => {
    expect(computeNetPoleLean(test.nudges, ['t.mercy'])).toBe('a');
    expect(computeNetPoleLean(test.nudges, ['t.ruth'])).toBe('b');
    expect(computeNetPoleLean(test.nudges, ['t.mercy', 't.mercy', 't.ruth'])).toBe('a');
  });

  it('treats a tie and an abstaining hand alike — both get pure fate', () => {
    expect(computeNetPoleLean(test.nudges, ['t.mercy', 't.ruth'])).toBe('none');
    expect(computeNetPoleLean(test.nudges, ['t.common'])).toBe('none');
    expect(computeNetPoleLean(test.nudges, [])).toBe('none');
  });

  it('ignores ids with no authored card', () => {
    expect(computeNetPoleLean(test.nudges, ['t.mercy', 'nonexistent'])).toBe('a');
  });
});

describe('resolveFormativeTest', () => {
  it('is deterministic for a given seed', () => {
    const test = makeTest();
    const a = resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy'], 4242);
    const b = resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy'], 4242);
    expect(a).toEqual(b);
  });

  it('separates the two formative tests into different streams', () => {
    const test = makeTest();
    // Same seed, different testIndex — the salt differs, so the rolls must be
    // able to diverge. Sweeping seeds proves the streams are actually distinct
    // rather than accidentally aligned.
    const diverged = Array.from({ length: 40 }, (_, i) => {
      const first = resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy'], i);
      const second = resolveFormativeTest(test, 1, 'tpl.a', ['t.mercy'], i);
      return first.band !== second.band;
    });
    expect(diverged.some(Boolean)).toBe(true);
  });

  it('writes the leaned pole on success bands and the opposite on failure bands', () => {
    const test = makeTest();
    // Sweep seeds so every band is exercised, then assert the invariant rather
    // than a specific roll — the mapping is the contract, not the PRNG.
    const seen = new Set<StepOutcome>();
    for (let seed = 0; seed < 400; seed++) {
      const outcome = resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy'], seed);
      seen.add(outcome.band);
      const shift = MEETING_POLE_SHIFT_BY_BAND[outcome.band];
      if (shift >= 0) {
        expect(outcome.writtenPole).toBe('a');
        expect(outcome.shift).toBeGreaterThan(0);
      } else {
        expect(outcome.writtenPole).toBe('b');
        expect(outcome.shift).toBeLessThan(0);
      }
    }
    // The sweep has to actually reach both halves or the assertion above is
    // vacuous — a probe that matches nothing prints PASS.
    const successBands = [...seen].filter((b) => MEETING_POLE_SHIFT_BY_BAND[b] >= 0);
    const failureBands = [...seen].filter((b) => MEETING_POLE_SHIFT_BY_BAND[b] < 0);
    expect(successBands.length).toBeGreaterThan(0);
    expect(failureBands.length).toBeGreaterThan(0);
  });

  it('reaches "fate overrode the lean" — the design\'s load-bearing case', () => {
    const test = makeTest();
    const overridden = Array.from({ length: 400 }, (_, seed) =>
      resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy'], seed),
    ).filter((o) => o.netLean === 'a' && o.writtenPole === 'b');
    expect(overridden.length).toBeGreaterThan(0);
  });

  it('gives a zero-lean hand both poles across seeds — pure fate, not a default', () => {
    const test = makeTest();
    const poles = new Set(
      Array.from({ length: 200 }, (_, seed) =>
        resolveFormativeTest(test, 0, 'tpl.a', ['t.common'], seed).writtenPole,
      ),
    );
    expect(poles).toEqual(new Set(['a', 'b']));
  });

  it('charges the authored cost of the played hand', () => {
    const test = makeTest();
    expect(resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy', 't.ruth'], 1).essenceSpent).toBe(2);
    expect(resolveFormativeTest(test, 0, 'tpl.a', ['t.common'], 1).essenceSpent).toBe(0);
    expect(resolveFormativeTest(test, 0, 'tpl.a', [], 1).essenceSpent).toBe(0);
  });

  it('erodes only on the two clear-failure bands', () => {
    const test = makeTest();
    for (let seed = 0; seed < 300; seed++) {
      const outcome = resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy'], seed);
      expect(outcome.quintessenceErosion).toBe(MEETING_SCAR_EROSION_BY_BAND[outcome.band]);
    }
  });

  it('always selects a non-empty prose slot', () => {
    const test = makeTest();
    for (let seed = 0; seed < 200; seed++) {
      expect(resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy'], seed).prose).not.toBe('');
    }
  });
});

describe('BOND_RECEPTION_BY_BAND', () => {
  it('maps every band', () => {
    expect(Object.keys(BOND_RECEPTION_BY_BAND).sort()).toEqual([...ALL_BANDS].sort());
  });

  it('leaves no reception unreachable — dead content check', () => {
    const reachable = new Set<BondReception>(Object.values(BOND_RECEPTION_BY_BAND));
    expect(reachable).toEqual(new Set(['awe', 'devotion', 'bargain', 'doubt', 'defiance']));
  });
});

describe('resolveBondTest', () => {
  it('is deterministic for a given seed', () => {
    const a = resolveBondTest(MEETING_BOND_TEST, ['bond.name_them'], 77);
    const b = resolveBondTest(MEETING_BOND_TEST, ['bond.name_them'], 77);
    expect(a).toEqual(b);
  });

  it('always produces a bond — every band yields prose and a trait seed', () => {
    const bands = new Set<StepOutcome>();
    for (let seed = 0; seed < 400; seed++) {
      const outcome = resolveBondTest(MEETING_BOND_TEST, ['bond.say_nothing'], seed);
      bands.add(outcome.band);
      expect(outcome.prose).not.toBe('');
      expect(outcome.traitSeed).not.toBe('');
      expect(outcome.reception).toBe(BOND_RECEPTION_BY_BAND[outcome.band]);
    }
    // Pin the population: the loop must reach more than one band, or "always
    // produces a bond" is a claim about a single case.
    expect(bands.size).toBeGreaterThan(1);
  });

  it('falls back to bargain rather than throwing on a malformed template', () => {
    const malformed = {
      ...MEETING_BOND_TEST,
      // Strip every reception except the fallback — any band must still resolve.
      receptions: { bargain: MEETING_BOND_TEST.receptions.bargain },
    } as unknown as BondTest;
    for (let seed = 0; seed < 60; seed++) {
      const outcome = resolveBondTest(malformed, [], seed);
      expect(outcome.reception).toBe('bargain');
      expect(outcome.prose).not.toBe('');
    }
  });
});

describe('applyMeetingOutcomes', () => {
  function baseResult(): MeetingEncounterResult {
    return {
      name: 'Kael',
      archetypeId: 'arch.test',
      cultureId: 'cul.test',
      axiologicalProfile: {
        mercy_ruthlessness: 0,
        asceticism_extravagance: 0,
        honesty_cunning: 0,
        tradition_novelty: 0,
        loyalty_ambition: 0,
        revelation_discretion: 0,
        preservation_transformation: 0,
        sacrifice_survival: 0,
        courage_prudence: 0,
      },
      reachCapabilities: {
        iron: 0.4, gold: 0.1, shadow: 0.1, veil: 0.1,
        heart: 0.25, eye: 0.1, stone: 0.1, star: 0.1,
      },
      primaryReach: 'iron',
      secondaryReach: 'heart',
      sphere: 'force',
      cooperationStrategy: 'tit-for-tat',
      foundingGateTags: [],
      traitSeeds: ['existing_seed'],
      appearanceSeed: 1,
      locationId: 'loc.test',
      meetingChoiceRecord: {
        encounterTick: 5,
        locationId: 'loc.test',
        candidateIndex: 0,
        archetypeId: 'arch.test',
        dilemmaChoices: [],
        sparkVisionId: 'vision.test',
        ascendantSphere: 'force',
        foundingGateTags: [],
      },
    };
  }

  it('folds signed shifts into the profile and clamps to [-1, 1]', () => {
    const test = makeTest();
    const big = resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy'], 3);
    const folded = applyMeetingOutcomes(baseResult(), [big], undefined);
    expect(folded.axiologicalProfile.mercy_ruthlessness).toBeCloseTo(big.shift, 6);
    expect(folded.axiologicalProfile.mercy_ruthlessness).toBeGreaterThanOrEqual(-1);
    expect(folded.axiologicalProfile.mercy_ruthlessness).toBeLessThanOrEqual(1);
  });

  it('never mutates the input result', () => {
    const input = baseResult();
    const test = makeTest();
    const outcome = resolveFormativeTest(test, 0, 'tpl.a', ['t.mercy'], 9);
    applyMeetingOutcomes(input, [outcome], undefined);
    expect(input.axiologicalProfile.mercy_ruthlessness).toBe(0);
    expect(input.traitSeeds).toEqual(['existing_seed']);
    expect(input.meetingChoiceRecord.formativeOutcomes).toBeUndefined();
  });

  it('leaves quintessence unset when nothing scarred', () => {
    const clean = {
      testIndex: 0, templateId: 'tpl.a', valuePair: 'mercy_ruthlessness' as const,
      netLean: 'a' as const, playedNudgeIds: [], band: 'success' as const,
      writtenPole: 'a' as const, shift: 0.3, quintessenceErosion: 0,
      essenceSpent: 0, prose: 'x',
    };
    expect(applyMeetingOutcomes(baseResult(), [clean], undefined).startingQuintessence)
      .toBeUndefined();
  });

  it('accumulates scarring across tests and clamps at the floor', () => {
    const worst = ALL_BANDS.map((band, i) => ({
      testIndex: i, templateId: `tpl.${i}`, valuePair: 'mercy_ruthlessness' as const,
      netLean: 'a' as const, playedNudgeIds: [], band,
      writtenPole: 'b' as const, shift: -0.1,
      quintessenceErosion: MEETING_SCAR_EROSION_BY_BAND[band],
      essenceSpent: 0, prose: 'x',
    }));
    const folded = applyMeetingOutcomes(baseResult(), worst, undefined);
    const totalErosion = worst.reduce((s, o) => s + o.quintessenceErosion, 0);
    expect(totalErosion).toBeGreaterThan(0);
    expect(folded.startingQuintessence).toBeCloseTo(QUINTESSENCE_DEFAULT - totalErosion, 6);
    expect(folded.startingQuintessence!).toBeGreaterThanOrEqual(MEETING_QUINTESSENCE_FLOOR);
  });

  it('never lets a First start critical or broken, even at maximum scarring', () => {
    // Far more scarring than the real flow can produce, to prove the clamp is
    // the thing holding the floor rather than the arithmetic happening to.
    const brutal = Array.from({ length: 50 }, (_, i) => ({
      testIndex: i, templateId: `tpl.${i}`, valuePair: 'mercy_ruthlessness' as const,
      netLean: 'a' as const, playedNudgeIds: [], band: 'critical_failure' as const,
      writtenPole: 'b' as const, shift: -0.35,
      quintessenceErosion: MEETING_SCAR_EROSION_BY_BAND.critical_failure,
      essenceSpent: 0, prose: 'x',
    }));
    const q = applyMeetingOutcomes(baseResult(), brutal, undefined).startingQuintessence!;
    expect(q).toBe(MEETING_QUINTESSENCE_FLOOR);
    // Reads the real classifier against the node shape `createAgentFromMeeting`
    // writes, so the floor is proven in the units the engine actually judges.
    const state = getQuintessenceThresholdState({
      properties: { quintessence: q, quintessenceMax: 1 },
    });
    expect(state).not.toBe('broken');
    expect(state).not.toBe('critical');
  });

  it('records the bond reception and appends its trait seed', () => {
    const bond = resolveBondTest(MEETING_BOND_TEST, [], 11);
    const folded = applyMeetingOutcomes(baseResult(), [], bond);
    expect(folded.bondReception).toBe(bond.reception);
    expect(folded.meetingChoiceRecord.bondReception).toBe(bond.reception);
    expect(folded.traitSeeds).toContain(bond.traitSeed);
    expect(folded.traitSeeds).toContain('existing_seed');
  });
});

describe('authored meeting content invariants', () => {
  it('the bond hand respects the affordability cost cap', () => {
    // The binding pool is one sphere's starting essence: a sphere-gated card can
    // only draw on its own sphere.
    const cap = meetingNudgeCostCap(INITIAL_ESSENCE_PER_SPHERE);
    expect(MEETING_BOND_TEST.nudges.length).toBeGreaterThan(0);
    for (const nudge of MEETING_BOND_TEST.nudges) {
      expect(nudge.essenceCost).toBeLessThanOrEqual(cap);
    }
  });

  it('the bond hand is authored to spec — size, common option, sphere coverage', () => {
    const hand = MEETING_BOND_TEST.nudges;
    expect(hand.length).toBeGreaterThanOrEqual(6);
    expect(hand.length).toBeLessThanOrEqual(8);
    expect(hand.some((n) => n.sphere === undefined)).toBe(true);
    const spheres = new Set(hand.map((n) => n.sphere).filter(Boolean));
    expect(spheres.size).toBeGreaterThanOrEqual(4);
  });

  it('carries no inert pole leans — the bond resolves a reception, not a pole', () => {
    for (const nudge of MEETING_BOND_TEST.nudges) {
      expect(nudge.poleLean).toBeUndefined();
    }
  });

  it('shows no digits on any player-facing bond string', () => {
    const surfaces = [
      MEETING_BOND_TEST.setup,
      MEETING_BOND_TEST.purposeLine,
      ...MEETING_BOND_TEST.factorLines.map((f) => f.text),
      ...MEETING_BOND_TEST.nudges.flatMap((n) => [n.name, n.fiction, n.effectLine]),
      ...Object.values(MEETING_BOND_TEST.receptions).map((r) => r.prose),
      ...Object.values(MEETING_BOND_TEST.godVoiceByHunger),
      MEETING_BOND_TEST.godVoiceFallback,
    ];
    for (const text of surfaces) {
      expect(text).not.toMatch(/\d/);
    }
  });

  it('authors a god-voice line for every hunger in the catalog', async () => {
    const { HUNGER_CATALOG } = await import('../../types/hunger');
    expect(HUNGER_CATALOG.length).toBeGreaterThan(0);
    for (const hunger of HUNGER_CATALOG) {
      expect(MEETING_BOND_TEST.godVoiceByHunger[hunger.id]).toBeTypeOf('string');
    }
  });

  it('prices the cap off the real test count', () => {
    expect(MEETING_TEST_COUNT_TOTAL).toBe(MEETING_FORMATIVE_TEST_COUNT + 1);
    expect(meetingNudgeCostCap(60)).toBeCloseTo(10, 6);
    // Fail-soft on nonsense input rather than producing NaN caps.
    expect(meetingNudgeCostCap(Number.NaN)).toBe(0);
    expect(meetingNudgeCostCap(-5)).toBe(0);
  });
});
