/**
 * THR-1473 — a chip's sentence is a caption, not a second telling of the ending.
 *
 * Director ruling, 2026-09-12, on the Snow on the Pass aftermath: *"for both scars
 * the flavour text is way too long. I suggest we keep it to max 15 words, and a
 * test that it does not communicate any of the same info as the aftermath."* Two
 * rules, so two arms — length, and redundancy against the band overview the chip
 * renders under.
 *
 * Every rule is **falsified first**: the pre-fix sentence must go red, or the green
 * arm proves only that the fixture is short. That matters here because the field
 * had no budget row at all, so a test asserting the migrated slice is green would
 * pass identically against a check that reports nothing.
 */

import { describe, expect, it } from 'vitest';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import {
  chipSentenceOf,
  chipSentenceProblems,
  chipSentenceWordCount,
  doctrineV2Warnings,
} from '../doctrineV2Checks';
import {
  CHIP_OVERVIEW_OVERLAP_RUN_WORDS,
  NUDGE_WORD_BUDGETS,
} from '../nudgeAuthoringConstants';
import { UNIFIED_ACTION_TEMPLATES } from '../../unified-action-templates';

/** One authored chip on a template's fallback face, under a chosen overview. */
function withChip(
  chip: Record<string, unknown>,
  overview = 'They came down the far side and the road went on.',
): UnifiedActionTemplate {
  return {
    id: 'encounter.test.thr1473_fixture',
    name: 'THR-1473 fixture',
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview,
        changes: [
          {
            id: 'fixture.the_chip',
            kind: 'trait',
            title: 'The Chip',
            polarity: 'loss',
            category: 'scar',
            direction: 'loss',
            stateNoun: { text: 'exhausted', entityId: 'trait.condition.exhausted' },
            ...chip,
          },
        ],
        reactions: [{ id: 'fixture.walk', label: 'Walk on', intent: 'Go.', effects: [] }],
      },
    },
  } as unknown as UnifiedActionTemplate;
}

describe('THR-1473 — the sentence runs long', () => {
  it("flags the director's own counter-example at its filed length", () => {
    const out = chipSentenceProblems(
      withChip({
        causeClause: 'The snow caught them below the saddle and the fire had to be made twice',
        detail:
          'They walk down worn through, having burned every dry scrap they were carrying to see morning.',
      }),
    );
    const lengths = out.filter(v => v.includes('budget'));
    expect(lengths).toHaveLength(1);
    expect(lengths[0]).toContain('runs 31 words');
  });

  it('passes the same chip once it is cut to the budget', () => {
    expect(
      chipSentenceProblems(
        withChip({
          causeClause: 'A night bought with everything dry they carried',
          detail: 'They walk down worn through.',
        }),
      ),
    ).toEqual([]);
  });

  it('prices both fields together, so 15 + 15 is not two lawful halves', () => {
    const fifteen = 'one two three four five six seven eight nine ten more words to make fifteen';
    expect(chipSentenceWordCount({ causeClause: fifteen })).toBe(NUDGE_WORD_BUDGETS.chipSentence);
    expect(chipSentenceProblems(withChip({ causeClause: fifteen }))).toEqual([]);
    const both = chipSentenceProblems(withChip({ causeClause: fifteen, detail: fifteen }));
    expect(both.filter(v => v.includes('budget'))).toHaveLength(1);
  });

  it('does not charge the chip for the em-dash the surface draws between the fields', () => {
    // The separator is punctuation, not a word. Counting the joined string prices
    // every two-field chip one word high and turns a 15-word budget into 14 —
    // which is exactly what the first re-authoring pass hit, on 15 chips at once.
    const chip = {
      causeClause: 'one two three four five six seven',
      detail: 'eight nine ten eleven twelve thirteen fourteen fifteen',
    };
    expect(chipSentenceOf(chip).trim().split(/\s+/)).toHaveLength(16);
    expect(chipSentenceWordCount(chip)).toBe(15);
    expect(chipSentenceProblems(withChip(chip))).toEqual([]);
  });

  it('says nothing about an uncategorised change, which draws no tag', () => {
    const long = 'one two three four five six seven eight nine ten eleven twelve '
      + 'thirteen fourteen fifteen sixteen seventeen';
    expect(chipSentenceProblems(withChip({ causeClause: long }))).not.toEqual([]);
    expect(chipSentenceProblems(withChip({ causeClause: long, category: undefined }))).toEqual([]);
  });
});

describe('THR-1473 — the sentence retells its overview', () => {
  const OVERVIEW = 'The snow caught them below the saddle and the fire had to be made twice.';

  it('flags a clause the overview already carried', () => {
    const out = chipSentenceProblems(
      withChip({ detail: 'The fire had to be made twice.' }, OVERVIEW),
    );
    const overlaps = out.filter(v => v.includes('retells'));
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]).toContain('fire had to be');
  });

  it('passes the same chip once the fact is the overview\'s alone', () => {
    expect(
      chipSentenceProblems(withChip({ detail: 'They walk down worn through.' }, OVERVIEW)),
    ).toEqual([]);
  });

  it(`needs a run of ${CHIP_OVERVIEW_OVERLAP_RUN_WORDS}, so a shorter echo is not a finding`, () => {
    // Falsification of the threshold itself: three shared words is ordinary
    // English, and a check that fired on it would report every chip in the corpus.
    const three = chipSentenceProblems(withChip({ detail: 'Below the saddle, cold.' }, OVERVIEW));
    expect(three).toEqual([]);
    const four = chipSentenceProblems(
      withChip({ detail: 'Caught them below the saddle again.' }, OVERVIEW),
    );
    expect(four.filter(v => v.includes('retells'))).toHaveLength(1);
  });

  it('compares against the band overview, not the variant\'s, when a band overrides it', () => {
    const template = {
      id: 'encounter.test.thr1473_band',
      name: 'THR-1473 band fixture',
      aftermathConfig: {
        branchOnStep: 0,
        variants: {},
        fallback: {
          overview: 'A wholly unrelated ending about a river crossing.',
          changes: [],
          reactions: [],
          byOutcome: {
            failure: {
              overview: 'The snow caught them below the saddle and the fire went out.',
              changes: [
                {
                  id: 'band.the_chip',
                  kind: 'trait',
                  title: 'The Chip',
                  detail: 'The snow caught them below the saddle.',
                  polarity: 'loss',
                  category: 'scar',
                  direction: 'loss',
                },
              ],
            },
          },
        },
      },
    } as unknown as UnifiedActionTemplate;
    const out = chipSentenceProblems(template);
    expect(out.filter(v => v.includes('retells'))).toHaveLength(1);
    expect(out[0]).toContain('fallback/failure');
  });
});

describe('THR-1473 — the warn channel carries it', () => {
  it('reaches doctrineV2Warnings, which is what check:encounter reports', () => {
    const long = 'one two three four five six seven eight nine ten eleven twelve '
      + 'thirteen fourteen fifteen sixteen';
    const warnings = doctrineV2Warnings(withChip({ causeClause: long }));
    expect(warnings.some(w => w.startsWith('[chip sentence]'))).toBe(true);
  });
});

describe('THR-1473 — the vertical slice is migrated', () => {
  const sliceTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('encounter.slice.'));

  it('finds the slice to measure', () => {
    // Population guard — an empty filter would make the sweep below pass
    // vacuously, which is the failure mode this repo names most often.
    expect(sliceTemplates.length).toBeGreaterThan(5);
  });

  it('carries chips that would have been reported before the migration', () => {
    // The guard's own falsification: prove the sweep below is measuring a real
    // population by showing the check fires on that population's own shape.
    const overLength = sliceTemplates.flatMap(t =>
      chipSentenceProblems({
        ...t,
        aftermathConfig: {
          ...t.aftermathConfig,
          fallback: {
            ...t.aftermathConfig?.fallback,
            changes: [
              {
                id: 'probe.chip',
                kind: 'trait',
                title: 'Probe',
                causeClause: 'one two three four five six seven eight',
                detail: 'nine ten eleven twelve thirteen fourteen fifteen sixteen',
                polarity: 'loss',
                category: 'scar',
              },
            ],
          },
        },
      } as unknown as UnifiedActionTemplate),
    );
    expect(overLength.length).toBeGreaterThan(0);
  });

  it('leaves no chip over budget and none retelling its overview', () => {
    const offenders = sliceTemplates.flatMap(t =>
      chipSentenceProblems(t).map(v => `${t.id}: ${v}`),
    );
    expect(offenders).toEqual([]);
  });
});
