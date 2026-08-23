/**
 * Strand Content Tests
 *
 * Validates all strand content packages for structural integrity,
 * coverage requirements, and narrative quality.
 */

import { describe, it, expect } from 'vitest';
import {
  VALUE_LABELS,
  VALUE_NOUNS,
  INTENSITY_VALUE_LABELS,
  FEAR_DESCRIPTIONS,
  REACH_BASED_FEARS,
  REACH_FEAR_LABELS,
  STRAND_SECTION_TITLES,
  CONTENT_COUNTS,
} from '../strand-content';

describe('Strand Content', () => {
  // ==========================================================================
  // § 1 VALUE_LABELS TESTS
  // ==========================================================================

  describe('VALUE_LABELS', () => {
    it('has at least the expected minimum count', () => {
      expect(Object.keys(VALUE_LABELS).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.VALUE_LABELS);
    });

    it('covers all 9 standard value axes', () => {
      const expectedAxes = [
        'mercy_ruthlessness',
        'asceticism_extravagance',
        'honesty_cunning',
        'tradition_novelty',
        'loyalty_ambition',
        'revelation_discretion',
        'preservation_transformation',
        'sacrifice_survival',
        'courage_prudence',
      ];

      for (const axis of expectedAxes) {
        expect(VALUE_LABELS).toHaveProperty(axis);
      }
    });

    it('each axis has exactly 2 poles (positive and negative)', () => {
      for (const [axis, poles] of Object.entries(VALUE_LABELS)) {
        expect(Array.isArray(poles)).toBe(true);
        expect(poles.length).toBe(2);
        expect(typeof poles[0]).toBe('string');
        expect(typeof poles[1]).toBe('string');
      }
    });

    it('all pole labels are non-empty strings', () => {
      for (const [axis, [positive, negative]] of Object.entries(VALUE_LABELS)) {
        expect(positive.length).toBeGreaterThan(0);
        expect(negative.length).toBeGreaterThan(0);
      }
    });

    it('all axis names follow the format word_word', () => {
      for (const axis of Object.keys(VALUE_LABELS)) {
        expect(axis).toMatch(/^[a-z]+_[a-z]+$/);
      }
    });
  });

  // ==========================================================================
  // § 1b VALUE_NOUNS TESTS (THR-1200)
  // ==========================================================================

  describe('VALUE_NOUNS', () => {
    it('has at least the expected minimum count', () => {
      expect(Object.keys(VALUE_NOUNS).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.VALUE_NOUNS);
    });

    it('covers exactly the same axes as VALUE_LABELS', () => {
      expect(Object.keys(VALUE_NOUNS).sort()).toEqual(Object.keys(VALUE_LABELS).sort());
    });

    it('each axis has exactly 2 non-empty poles', () => {
      for (const poles of Object.values(VALUE_NOUNS)) {
        expect(poles.length).toBe(2);
        expect(poles[0].length).toBeGreaterThan(0);
        expect(poles[1].length).toBeGreaterThan(0);
      }
    });

    it('is the lowercase noun register — every pole is a single lowercase word', () => {
      // The register contract the FEAR_PROSE bodies are authored against: every {value}
      // slot in that table is mid-sentence and takes a bare noun, so a capitalised or
      // multi-word entry here is the defect THR-1200 fixed, arriving from the other side.
      for (const poles of Object.values(VALUE_NOUNS)) {
        for (const noun of poles) {
          expect(noun).toBe(noun.toLowerCase());
          expect(noun).toMatch(/^[a-z]+$/);
        }
      }
    });

    it('shares a spelling with VALUE_LABELS on exactly one pole', () => {
      // If a noun silently becomes its adjective, the register split has collapsed and every
      // assertion that distinguishes the two tables goes vacuous. So enumerate the overlap
      // rather than forbidding it: "cunning" is genuinely both an adjective and a noun in
      // English and is the one legitimate coincidence. Any second entry appearing here is
      // the register collapsing, not a new coincidence.
      const shared: string[] = [];
      for (const axis of Object.keys(VALUE_NOUNS) as (keyof typeof VALUE_NOUNS)[]) {
        for (const i of [0, 1] as const) {
          if (VALUE_NOUNS[axis][i].toLowerCase() === VALUE_LABELS[axis][i].toLowerCase()) {
            shared.push(`${axis}[${i}]`);
          }
        }
      }
      expect(shared).toEqual(['honesty_cunning[1]']);
    });

    it('matches the reviewed noun table', () => {
      // Pinned literally, like the VALUE_LABELS/FEAR_DESCRIPTIONS alignment table above: the
      // words a player reads are checked-in text, not something assembled at runtime.
      // Two entries deliberately do not echo their ValuePair key, both evidenced by the
      // prose — see the VALUE_NOUNS doc comment in src/data/strand-content.ts.
      expect(VALUE_NOUNS).toEqual({
        mercy_ruthlessness: ['mercy', 'ruthlessness'],
        asceticism_extravagance: ['asceticism', 'extravagance'],
        honesty_cunning: ['honesty', 'cunning'],
        tradition_novelty: ['tradition', 'innovation'],
        loyalty_ambition: ['loyalty', 'ambition'],
        revelation_discretion: ['candour', 'discretion'],
        preservation_transformation: ['preservation', 'transformation'],
        sacrifice_survival: ['sacrifice', 'survival'],
        courage_prudence: ['courage', 'prudence'],
      });
    });
  });

  // ==========================================================================
  // § 2 INTENSITY_VALUE_LABELS TESTS
  // ==========================================================================

  describe('INTENSITY_VALUE_LABELS', () => {
    it('has at least the expected minimum count', () => {
      expect(Object.keys(INTENSITY_VALUE_LABELS).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.INTENSITY_VALUE_LABELS);
    });

    it('covers exactly the same axes as VALUE_LABELS', () => {
      const valueLabelAxes = Object.keys(VALUE_LABELS).sort();
      const intensityAxes = Object.keys(INTENSITY_VALUE_LABELS).sort();
      expect(intensityAxes).toEqual(valueLabelAxes);
    });

    it('each axis has exactly 3 intensity levels', () => {
      for (const [axis, intensities] of Object.entries(INTENSITY_VALUE_LABELS)) {
        expect(intensities).toHaveProperty('weak');
        expect(intensities).toHaveProperty('moderate');
        expect(intensities).toHaveProperty('strong');
      }
    });

    it('each intensity level has exactly 2 poles (positive and negative)', () => {
      for (const [axis, intensities] of Object.entries(INTENSITY_VALUE_LABELS)) {
        for (const level of ['weak', 'moderate', 'strong'] as const) {
          const poles = intensities[level];
          expect(Array.isArray(poles)).toBe(true);
          expect(poles.length).toBe(2);
          expect(typeof poles[0]).toBe('string');
          expect(typeof poles[1]).toBe('string');
        }
      }
    });

    it('all intensity pole labels are non-empty strings', () => {
      for (const [axis, intensities] of Object.entries(INTENSITY_VALUE_LABELS)) {
        for (const level of ['weak', 'moderate', 'strong'] as const) {
          const [positive, negative] = intensities[level];
          expect(positive.length).toBeGreaterThan(0);
          expect(negative.length).toBeGreaterThan(0);
        }
      }
    });

    it('weak intensity uses tentative language (inclined, tends, somewhat)', () => {
      const tentativePatterns = /inclined|tends|somewhat|quick|slow/i;
      let foundExamples = 0;

      for (const [axis, intensities] of Object.entries(INTENSITY_VALUE_LABELS)) {
        const [positive, negative] = intensities.weak;
        if (tentativePatterns.test(positive) || tentativePatterns.test(negative)) {
          foundExamples++;
        }
      }

      expect(foundExamples).toBeGreaterThan(0);
    });

    it('strong intensity uses absolute language (consumed, entirely, fanatically, enslaved)', () => {
      const absolutePatterns = /consumed|entirely|fanatically|enslaved|cannot|must/i;
      let foundExamples = 0;

      for (const [axis, intensities] of Object.entries(INTENSITY_VALUE_LABELS)) {
        const [positive, negative] = intensities.strong;
        if (absolutePatterns.test(positive) || absolutePatterns.test(negative)) {
          foundExamples++;
        }
      }

      expect(foundExamples).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // § 3 FEAR_DESCRIPTIONS TESTS
  // ==========================================================================

  describe('FEAR_DESCRIPTIONS', () => {
    it('has at least the expected minimum count', () => {
      expect(Object.keys(FEAR_DESCRIPTIONS).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.FEAR_DESCRIPTIONS);
    });

    it('covers all 9 standard value axes', () => {
      const expectedAxes = [
        'mercy_ruthlessness',
        'asceticism_extravagance',
        'honesty_cunning',
        'tradition_novelty',
        'loyalty_ambition',
        'revelation_discretion',
        'preservation_transformation',
        'sacrifice_survival',
        'courage_prudence',
      ];

      for (const axis of expectedAxes) {
        expect(FEAR_DESCRIPTIONS).toHaveProperty(axis);
      }
    });

    it('each axis has exactly 2 fear descriptions (positive and negative poles)', () => {
      for (const [axis, fears] of Object.entries(FEAR_DESCRIPTIONS)) {
        expect(Array.isArray(fears)).toBe(true);
        expect(fears.length).toBe(2);
        expect(typeof fears[0]).toBe('string');
        expect(typeof fears[1]).toBe('string');
      }
    });

    it('all fear descriptions are non-empty strings', () => {
      for (const [axis, [positiveFear, negativeFear]] of Object.entries(FEAR_DESCRIPTIONS)) {
        expect(positiveFear.length).toBeGreaterThan(0);
        expect(negativeFear.length).toBeGreaterThan(0);
      }
    });

    it('fear descriptions follow Threadbare aesthetic (dark, evocative, terse)', () => {
      const threadbarePatterns = /fear|dread|void|dust|hollow|haunt|shadow|decay|terror/i;
      let threadbareMatches = 0;

      for (const [axis, [positive, negative]] of Object.entries(FEAR_DESCRIPTIONS)) {
        if (threadbarePatterns.test(positive) || threadbarePatterns.test(negative)) {
          threadbareMatches++;
        }
      }

      expect(threadbareMatches).toBeGreaterThan(0);
    });

    it('fear descriptions start with narrative voice (Fears, anxiety, dread)', () => {
      for (const [axis, [positiveFear, negativeFear]] of Object.entries(FEAR_DESCRIPTIONS)) {
        const narrativeStart = /^(Fears|fears|Dreads|dreads|Terror|terror|Anxiety|anxiety|Horror|horror|Fear|fear)/;
        const bothValid = narrativeStart.test(positiveFear) || narrativeStart.test(negativeFear);
        expect(bothValid).toBe(true);
      }
    });

    // THR-1187 — reviewed label/fear alignment.
    //
    // `honesty_cunning` shipped as ['Fears being outwitted', 'Fears having to deceive'],
    // giving Honest the cunning agent's fear and Cunning the honest agent's. Every test
    // above passed on it: they check count, shape, non-emptiness, tone and opening word,
    // none of which can see which pole a fear belongs to.
    //
    // The table is written as literals rather than derived from FEAR_DESCRIPTIONS — a check
    // built from the constant it is checking cannot fail. Each row states the pole LABEL it
    // was reviewed against, so the pairing is legible without opening strand-content.ts, and
    // the labels are asserted against VALUE_LABELS below so the two files cannot drift apart
    // silently. Because this is a whole-record toEqual, a new value pair fails until someone
    // adds a reviewed row.
    //
    // The convention every row follows: each pole fears the UNDOING of what that pole is
    // committed to. Loyal fears betrayal, not disloyalty in others generally; Traditional
    // fears the loss of the old ways; Courageous fears showing weakness.
    it('pairs each fear with the correct pole label (reviewed alignment)', () => {
      const REVIEWED: Record<string, { positive: [string, string]; negative: [string, string] }> = {
        // pair: { positive: [label, fear], negative: [label, fear] }
        mercy_ruthlessness: {
          positive: ['Merciful', 'Fears vulnerability from showing mercy'],
          negative: ['Ruthless', 'Fears becoming heartless'],
        },
        asceticism_extravagance: {
          positive: ['Ascetic', 'Fears poverty and scarcity'],
          negative: ['Extravagant', 'Fears becoming selfish'],
        },
        honesty_cunning: {
          positive: ['Honest', 'Fears having to deceive'],
          negative: ['Cunning', 'Fears being outwitted'],
        },
        tradition_novelty: {
          positive: ['Traditional', 'Fears the loss of the old ways'],
          negative: ['Innovative', 'Fears stagnation'],
        },
        loyalty_ambition: {
          positive: ['Loyal', 'Fears betrayal by those they trust'],
          negative: ['Ambitious', 'Fears irrelevance and failure'],
        },
        revelation_discretion: {
          positive: ['Revealing', 'Fears being kept blind by those they trust'],
          negative: ['Discreet', 'Fears the harm their knowledge might cause'],
        },
        preservation_transformation: {
          positive: ['Preserving', 'Fears all they have built crumbling to nothing'],
          negative: ['Transforming', 'Fears being enslaved by what they cannot change'],
        },
        sacrifice_survival: {
          positive: ['Self-Sacrificing', 'Fears abandonment by their cause'],
          negative: ['Self-Preserving', 'Fears losing freedom'],
        },
        courage_prudence: {
          positive: ['Courageous', 'Fears showing weakness'],
          negative: ['Prudent', 'Fears reckless consequences'],
        },
      };

      const expectedFears = Object.fromEntries(
        Object.entries(REVIEWED).map(([pair, r]) => [pair, [r.positive[1], r.negative[1]]]),
      );
      const expectedLabels = Object.fromEntries(
        Object.entries(REVIEWED).map(([pair, r]) => [pair, [r.positive[0], r.negative[0]]]),
      );

      expect(FEAR_DESCRIPTIONS).toEqual(expectedFears);
      expect(VALUE_LABELS).toEqual(expectedLabels);
    });
  });

  // ==========================================================================
  // § 4 REACH_BASED_FEARS TESTS
  // ==========================================================================

  describe('REACH_BASED_FEARS', () => {
    it('has at least 8 reaches (Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star)', () => {
      expect(Object.keys(REACH_BASED_FEARS).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.REACH_BASED_FEARS);
    });

    it('covers all Eight Reaches (Flesh removed in TB-075)', () => {
      const expectedReaches = ['Iron', 'Gold', 'Shadow', 'Veil', 'Heart', 'Eye', 'Stone', 'Star'];

      for (const reach of expectedReaches) {
        expect(REACH_BASED_FEARS).toHaveProperty(reach);
      }
    });

    it('each reach has exactly 2 fear descriptions', () => {
      for (const [reach, fears] of Object.entries(REACH_BASED_FEARS)) {
        expect(Array.isArray(fears)).toBe(true);
        expect(fears.length).toBe(2);
      }
    });

    it('all reach fear descriptions are non-empty', () => {
      for (const [reach, [fear1, fear2]] of Object.entries(REACH_BASED_FEARS)) {
        expect(fear1.length).toBeGreaterThan(0);
        expect(fear2.length).toBeGreaterThan(0);
      }
    });

    it('reach-based fears mention action domain themes (combat, trade, exposure, magic, etc)', () => {
      const themePatterns = {
        Iron: /combat|violence|conflict|warfare/i,
        Gold: /trade|poverty|scarcity|wealth|want/i,
        Shadow: /exposure|secrecy|unmasking|light/i,
        Veil: /magic|enchantment|sorcery|wonder/i,
        Heart: /isolation|bonds|belonging|crowd|connection/i,
        Eye: /ignorance|knowledge|blind|unknowable/i,
        Stone: /collapse|structure|foundation|collapse|trapped/i,
        Star: /lost|path|navigation|direction|bound/i,
      };

      for (const [reach, [fear1, fear2]] of Object.entries(REACH_BASED_FEARS)) {
        const pattern = themePatterns[reach as keyof typeof themePatterns];
        if (pattern) {
          const matchFound = pattern.test(fear1) || pattern.test(fear2);
          expect(matchFound).toBe(true);
        }
      }
    });
  });

  // ==========================================================================
  // § 5 REACH_FEAR_LABELS TESTS
  // ==========================================================================

  describe('REACH_FEAR_LABELS', () => {
    it('covers all Eight Reaches (Flesh removed in TB-075)', () => {
      const expectedReaches = ['Iron', 'Gold', 'Shadow', 'Veil', 'Heart', 'Eye', 'Stone', 'Star'];

      for (const reach of expectedReaches) {
        expect(REACH_FEAR_LABELS).toHaveProperty(reach);
      }
    });

    it('each reach has exactly 2 labels (positive and negative pole)', () => {
      for (const [reach, labels] of Object.entries(REACH_FEAR_LABELS)) {
        expect(Array.isArray(labels)).toBe(true);
        expect(labels.length).toBe(2);
      }
    });

    it('all labels are non-empty strings', () => {
      for (const [reach, [label1, label2]] of Object.entries(REACH_FEAR_LABELS)) {
        expect(label1.length).toBeGreaterThan(0);
        expect(label2.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // § 6 STRAND_SECTION_TITLES TESTS
  // ==========================================================================

  describe('STRAND_SECTION_TITLES', () => {
    it('has strand titles', () => {
      expect(Object.keys(STRAND_SECTION_TITLES).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.STRAND_SECTION_TITLES);
    });

    it('covers all six strands (Presence, Desires, Bonds, Ambitions, Beliefs, Fears)', () => {
      const expectedStrands = ['Presence', 'Desires', 'Bonds', 'Ambitions', 'Beliefs', 'Fears'];

      for (const strand of expectedStrands) {
        expect(STRAND_SECTION_TITLES).toHaveProperty(strand);
      }
    });

    it('all titles are non-empty strings', () => {
      for (const [strand, title] of Object.entries(STRAND_SECTION_TITLES)) {
        expect(typeof title).toBe('string');
        expect(title.length).toBeGreaterThan(0);
      }
    });

    it('all titles follow poetic/Threadbare naming (Where, What, etc)', () => {
      const titleValues = Object.values(STRAND_SECTION_TITLES);
      const poeticPatterns = /Where|What|How|When|Why/i;
      const poeticCount = titleValues.filter(t => poeticPatterns.test(t)).length;

      expect(poeticCount).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // § 7 DEDUPLICATION TESTS
  // ==========================================================================

  describe('Deduplication', () => {
    it('VALUE_LABELS contains no duplicate positive labels', () => {
      const positiveLabels = Object.values(VALUE_LABELS).map(([p]) => p.toLowerCase());
      const unique = new Set(positiveLabels);
      expect(unique.size).toBe(positiveLabels.length);
    });

    it('VALUE_LABELS contains no duplicate negative labels', () => {
      const negativeLabels = Object.values(VALUE_LABELS).map(([, n]) => n.toLowerCase());
      const unique = new Set(negativeLabels);
      expect(unique.size).toBe(negativeLabels.length);
    });

    it('STRAND_SECTION_TITLES contains no duplicate titles', () => {
      const titles = Object.values(STRAND_SECTION_TITLES).map(t => t.toLowerCase());
      const unique = new Set(titles);
      expect(unique.size).toBe(titles.length);
    });
  });

  // ==========================================================================
  // § 8 CONSISTENCY TESTS
  // ==========================================================================

  describe('Consistency', () => {
    it('VALUE_LABELS and INTENSITY_VALUE_LABELS share the same axes', () => {
      const valueLabelKeys = Object.keys(VALUE_LABELS).sort();
      const intensityKeys = Object.keys(INTENSITY_VALUE_LABELS).sort();
      expect(intensityKeys).toEqual(valueLabelKeys);
    });

    it('all fear descriptions are in a consistent voice', () => {
      const allFears = [
        ...Object.values(FEAR_DESCRIPTIONS).flat(),
        ...Object.values(REACH_BASED_FEARS).flat(),
      ];

      // All should start with narrative voice or Threadbare keywords
      const validStarts = /^(Fears|fears|Dreads|dreads|Terror|terror|Fear|fear|Dread|dread|Horror|horror)/;
      const validCount = allFears.filter(f => validStarts.test(f)).length;

      expect(validCount).toBeGreaterThan(allFears.length * 0.8);
    });
  });

  // ==========================================================================
  // § 9 CONTENT_COUNTS VALIDATION
  // ==========================================================================

  describe('CONTENT_COUNTS', () => {
    it('all expected minimums are positive integers', () => {
      for (const [key, value] of Object.entries(CONTENT_COUNTS)) {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('all actual content meets or exceeds minimum counts', () => {
      expect(Object.keys(VALUE_LABELS).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.VALUE_LABELS);
      expect(Object.keys(INTENSITY_VALUE_LABELS).length).toBeGreaterThanOrEqual(
        CONTENT_COUNTS.INTENSITY_VALUE_LABELS,
      );
      expect(Object.keys(FEAR_DESCRIPTIONS).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.FEAR_DESCRIPTIONS);
      expect(Object.keys(REACH_BASED_FEARS).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.REACH_BASED_FEARS);
      expect(Object.keys(STRAND_SECTION_TITLES).length).toBeGreaterThanOrEqual(CONTENT_COUNTS.STRAND_SECTION_TITLES);
    });
  });
});
