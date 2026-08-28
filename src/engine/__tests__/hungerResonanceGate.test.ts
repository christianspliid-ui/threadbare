/**
 * The no-op gate for hunger resonance (THR-1213 slice 3, landed advisory with
 * slice 2; **blocking** as of the slice-4 content pass).
 *
 * This exists because the thing it guards was dead for the entire life of the
 * feature and every test in the tree was green throughout. `hungerResonance`
 * held bare hunger ids; the reader compared them against theme tags; the
 * vocabularies were disjoint; the weight fired **zero times across all 167
 * shipped dilemmas, for every god, always** (THR-1158). Nothing failed, because
 * nothing asserted that a weight has to *do* something.
 *
 * So this gate runs the real library through the real picker and asks whether
 * the god's Hunger changed the deal. Three assertions, in this order:
 *
 *   1. **Population non-empty, first.** A coverage sweep over an empty library
 *      passes vacuously; that is how a dead channel stays green. Prove there is
 *      something to measure before measuring it.
 *   2. **Coverage** — how many dilemmas each hunger resonates with.
 *   3. **Non-vacuity** — at least one hunger's dealt selection differs from the
 *      no-lens deal at the same seed. This is the assertion that cannot be
 *      satisfied by a lens that is wired but inert.
 *
 * Assertion 3 is only meaningful because `pickFromPool` consumes the same draws
 * with and without a lens (see its doc comment). Were the draw count
 * lens-conditional, *every* deal would differ from the no-lens deal by stream
 * offset alone, this assertion would pass unconditionally, and the gate would
 * certify a dead weight — the failure it exists to catch, reproduced by its own
 * measuring instrument.
 */

import { describe, it, expect } from 'vitest';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import { HUNGER_CATALOG } from '../../data/hunger-catalog';
import { selectDilemmas, selectDilemmasScored, scoreDilemmaResonance } from '../meetingEncounter';
import type { AscendantLens } from '../../types/hunger';
import type { ReachDomain } from '../../types/traits';
import type { SphereName } from '../../types/index';

/**
 * Dilemmas each hunger must resonate with. **Blocking as of the content pass**
 * (THR-1213 slice 4), which authored `emotionalRegister` + `driveResonance` for
 * the 157 dilemmas whose resonance blocks were empty — every one of the 167
 * shipped dilemmas now carries a register.
 *
 * Measured after that pass: `gather`=59, `witness`=58, `reclaim`=26,
 * `reshape`=40, `preserve`=65, `kindle`=20, `sever`=8, `bind`=26, `wander`=32,
 * `consume`=18, `haunt`=37, `illuminate`=50. The floor sits at 6 rather than at
 * the observed minimum on purpose: it is the point below which a hunger's deal
 * stops being meaningfully steerable, not a snapshot of today's corpus, so
 * authoring a new batch of dilemmas cannot fail this by accident.
 *
 * `sever` is the thin one, and honestly so — freedom, rebellion, independence,
 * chains, escape and solitude are a narrow band in a corpus of scenes set
 * inside settlements a mortal is bound to. Its eight are the scenes that
 * genuinely turn on getting out; spraying `freedom` across the rest to flatter
 * the distribution would restore the exact defect this file exists to catch,
 * one layer up — a number that looks alive because the labels were written to
 * make it look alive.
 */
const HUNGER_RESONANCE_MIN_COVERAGE = 6;

/** A lens per hunger, sharing the drive tags so the hunger axis is what varies. */
function lensFor(hungerId: string): AscendantLens {
  const hunger = HUNGER_CATALOG.find((h) => h.id === hungerId);
  if (!hunger) throw new Error(`no catalog entry for ${hungerId}`);
  return {
    hunger,
    mortalOrigin: 'test',
    drive: 'test',
    driveTags: [],
    timeSinceAscension: 'ancient',
    mortalName: 'test',
  };
}

/** Fixed selection inputs, so the only thing varying across arms is the lens. */
const PRIMARY_REACH: ReachDomain = 'iron';
const SECONDARY_REACH: ReachDomain = 'heart';
const SPHERE: SphereName = 'force';
const ARCHETYPE = 'iron_heart';
const SUBTYPE = 'village';

describe('THR-1213 — hunger resonance fires in the live picker', () => {
  it('the shipped library is non-empty and carries resonance data (vacuous-guard)', () => {
    expect(ENRICHED_DILEMMA_LIBRARY.length).toBeGreaterThan(0);
    expect(HUNGER_CATALOG.length).toBe(12);

    const withRegister = ENRICHED_DILEMMA_LIBRARY.filter(
      (t) => t.resonance.emotionalRegister.length > 0,
    );
    expect(withRegister.length).toBeGreaterThan(0);
  });

  it('every hunger resonates with at least HUNGER_RESONANCE_MIN_COVERAGE dilemmas', () => {
    const coverage = new Map<string, number>();
    for (const hunger of HUNGER_CATALOG) {
      const lens = lensFor(hunger.id);
      const n = ENRICHED_DILEMMA_LIBRARY.filter(
        (t) => scoreDilemmaResonance(t, lens) > 0,
      ).length;
      coverage.set(hunger.id, n);
    }

    const report = [...coverage.entries()].map(([id, n]) => `${id}=${n}`).join(', ');
    const below = [...coverage.entries()].filter(
      ([, n]) => n < HUNGER_RESONANCE_MIN_COVERAGE,
    );

    expect(
      below.map(([id, n]) => `${id}=${n}`),
      `${below.length}/12 hungers resonate with fewer than ` +
        `HUNGER_RESONANCE_MIN_COVERAGE=${HUNGER_RESONANCE_MIN_COVERAGE} dilemmas. ` +
        `A hunger below the floor barely steers its god's deal, which is the ` +
        `dead-channel defect in miniature. Either the new content needs a ` +
        `register the starved hungers can see, or a hunger's ` +
        `dilemmaResonanceTags have drifted out of the dilemmas' vocabulary. ` +
        `Full coverage: ${report}`,
    ).toEqual([]);
  });

  it('at least one hunger deals differently from the no-lens deal at the same seed', () => {
    const seed = 42;
    const templates = [...ENRICHED_DILEMMA_LIBRARY];

    const baseline = selectDilemmas(
      templates, PRIMARY_REACH, SECONDARY_REACH, SPHERE, ARCHETYPE, SUBTYPE, seed,
    ).map((d) => d.templateId);

    // Not a vacuous comparison: the baseline itself has to be a real deal.
    expect(baseline.length).toBeGreaterThanOrEqual(2);

    const differing = HUNGER_CATALOG.filter((hunger) => {
      const dealt = selectDilemmas(
        templates, PRIMARY_REACH, SECONDARY_REACH, SPHERE, ARCHETYPE, SUBTYPE, seed,
        lensFor(hunger.id),
      ).map((d) => d.templateId);
      return dealt.join('|') !== baseline.join('|');
    });

    console.warn(
      `[THR-1213 non-vacuity] ${differing.length}/12 hungers dealt differently ` +
        `from the no-lens baseline at seed ${seed}: ` +
        (differing.map((h) => h.id).join(', ') || '(none)'),
    );

    expect(
      differing.length,
      'no hunger changed the deal — the weight is wired but inert',
    ).toBeGreaterThan(0);

    // The other half of the same claim, and the one that catches stream drift.
    // A lens changes the deal only where its resonance actually reorders the
    // top of a pool the deal draws from; a hunger whose tags do not reach this
    // seed's pools must land on *exactly* the baseline. So some hunger has to
    // agree with the no-lens deal, and if all 12 differed the difference would
    // be draw-offset rather than scoring — the gate certifying a dead weight.
    //
    // Before the content pass this held for the plain reason that 8 of the 12
    // hungers resonated with nothing at all. That reason is gone — every hunger
    // now clears the coverage floor above — and the assertion is unchanged and
    // still passing, which is the useful reading: 4 of 12 differ at seed 42, so
    // eight hungers hold the baseline on coverage they *have* rather than
    // coverage they lack. Measure it here rather than reasoning about it; the
    // count is a property of the seed and the pools, not a constant.
    expect(
      differing.length,
      'every hunger changed the deal — that is stream drift, not resonance',
    ).toBeLessThan(HUNGER_CATALOG.length);
  });

  it('the deal carries its own explanation (the DilemmaSelectionRecord)', () => {
    const lens = lensFor('gather');
    const { dilemmas, record } = selectDilemmasScored(
      [...ENRICHED_DILEMMA_LIBRARY],
      PRIMARY_REACH, SECONDARY_REACH, SPHERE, ARCHETYPE, SUBTYPE, 42, lens,
    );

    expect(record.hungerId).toBe('gather');
    // One slot per dealt dilemma, in the same order — an explanation shorter
    // than the deal is an explanation with a hole in it.
    expect(record.slots.map((s) => s.templateId)).toEqual(
      dilemmas.map((d) => d.templateId),
    );
    // Non-vacuous: at least one slot beat a real field of candidates, and at
    // least one records the score that decided it.
    expect(record.slots.some((s) => s.poolSize > 1)).toBe(true);
    expect(record.slots.some((s) => s.score > 0)).toBe(true);

    // With no lens there is no hunger to name, and the slots still explain the
    // deal — the record degrades, it does not vanish.
    const unlensed = selectDilemmasScored(
      [...ENRICHED_DILEMMA_LIBRARY],
      PRIMARY_REACH, SECONDARY_REACH, SPHERE, ARCHETYPE, SUBTYPE, 42,
    );
    expect(unlensed.record.hungerId).toBeUndefined();
    expect(unlensed.record.slots.length).toBe(unlensed.dilemmas.length);
  });

  it('the same lens and seed deal the same dilemmas (determinism, NFP #3)', () => {
    const lens = lensFor('witness');
    const templates = [...ENRICHED_DILEMMA_LIBRARY];
    const a = selectDilemmas(
      templates, PRIMARY_REACH, SECONDARY_REACH, SPHERE, ARCHETYPE, SUBTYPE, 7, lens,
    ).map((d) => d.templateId);
    const b = selectDilemmas(
      templates, PRIMARY_REACH, SECONDARY_REACH, SPHERE, ARCHETYPE, SUBTYPE, 7, lens,
    ).map((d) => d.templateId);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(2);
  });
});
