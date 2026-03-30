import { describe, it, expect } from 'vitest';
import { ARCHETYPE_STAGE_NAMES, DEFAULT_THRESHOLDS, DOOM_VOCABULARY } from '../doom-content';

describe('doom-content', () => {
  it('exports stage names for all 7 archetypes', () => {
    expect(Object.keys(ARCHETYPE_STAGE_NAMES)).toHaveLength(7);
  });

  it('each archetype has exactly 5 stage names', () => {
    for (const names of Object.values(ARCHETYPE_STAGE_NAMES)) {
      expect(names).toHaveLength(5);
      for (const name of names) {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      }
    }
  });

  it('exports 5 default thresholds summing to progression', () => {
    expect(DEFAULT_THRESHOLDS).toHaveLength(5);
    expect(DEFAULT_THRESHOLDS[0]).toBe(0.20);
    expect(DEFAULT_THRESHOLDS[4]).toBe(1.0);
  });

  it('thresholds are monotonically increasing', () => {
    for (let i = 1; i < DEFAULT_THRESHOLDS.length; i++) {
      expect(DEFAULT_THRESHOLDS[i]).toBeGreaterThan(DEFAULT_THRESHOLDS[i - 1]);
    }
  });
});

describe('doom vocabulary', () => {
  it('should have 7 stage entries', () => {
    expect(Object.keys(DOOM_VOCABULARY)).toHaveLength(7);
  });

  it('each stage should have 5 adjectives, 5 verbs, 3 nouns, and 1 atmosphere phrase', () => {
    for (const [stage, vocab] of Object.entries(DOOM_VOCABULARY)) {
      expect(vocab.adjectives, `${stage} adjectives`).toHaveLength(5);
      expect(vocab.verbs, `${stage} verbs`).toHaveLength(5);
      expect(vocab.nouns, `${stage} nouns`).toHaveLength(3);
      expect(vocab.atmosphere.length, `${stage} atmosphere`).toBeGreaterThan(10);
    }
  });

  it('stages should be named correctly', () => {
    const expected = ['whispers', 'signs', 'tremors', 'cracks', 'the_breaking', 'the_breach', 'the_unmaking'];
    expect(Object.keys(DOOM_VOCABULARY)).toEqual(expected);
  });
});
