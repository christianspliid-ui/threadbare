import { describe, it, expect } from 'vitest';
import {
  loadArchetypeStageNames,
  loadDefaultThresholds,
  loadDoomVocabulary,
  validateArchetypeJson,
} from '../doom-loader';

// ── loadArchetypeStageNames ───────────────────────────────────────

describe('loadArchetypeStageNames', () => {
  const stageNames = loadArchetypeStageNames();

  it('loads stage names for all 7 archetypes', () => {
    expect(Object.keys(stageNames)).toHaveLength(7);
  });

  it('includes all expected archetype keys', () => {
    const expected = ['breach', 'convergence', 'changing', 'sundering', 'failing', 'ascension', 'reckoning'];
    expect(Object.keys(stageNames).sort()).toEqual(expected.sort());
  });

  it('each archetype has exactly 5 stage names', () => {
    for (const [key, names] of Object.entries(stageNames)) {
      expect(names, `${key} stage names`).toHaveLength(5);
      for (const name of names) {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      }
    }
  });
});

// ── loadDefaultThresholds ─────────────────────────────────────────

describe('loadDefaultThresholds', () => {
  it('returns the same thresholds from all archetypes (they share defaults)', () => {
    const thresholds = loadDefaultThresholds();
    expect(thresholds).toHaveLength(5);
    expect(thresholds[0]).toBe(0.20);
    expect(thresholds[4]).toBe(1.0);
  });

  it('thresholds are monotonically increasing', () => {
    const thresholds = loadDefaultThresholds();
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
    }
  });
});

// ── loadDoomVocabulary ────────────────────────────────────────────

describe('loadDoomVocabulary', () => {
  const vocab = loadDoomVocabulary();

  it('has 7 stage entries', () => {
    expect(Object.keys(vocab)).toHaveLength(7);
  });

  it('stages are named correctly', () => {
    const expected = ['whispers', 'signs', 'tremors', 'cracks', 'the_breaking', 'the_breach', 'the_unmaking'];
    expect(Object.keys(vocab)).toEqual(expected);
  });

  it('each stage has 5 adjectives, 5 verbs, 3 nouns, and atmosphere', () => {
    for (const [stage, entry] of Object.entries(vocab)) {
      expect(entry.adjectives, `${stage} adjectives`).toHaveLength(5);
      expect(entry.verbs, `${stage} verbs`).toHaveLength(5);
      expect(entry.nouns, `${stage} nouns`).toHaveLength(3);
      expect(entry.atmosphere.length, `${stage} atmosphere`).toBeGreaterThan(10);
    }
  });
});

// ── validateArchetypeJson ─────────────────────────────────────────

describe('validateArchetypeJson', () => {
  const validArchetype = {
    archetype: 'breach',
    description: 'An outside force breaking through reality',
    stageNames: ['A', 'B', 'C', 'D', 'E'],
    thresholds: [0.2, 0.4, 0.6, 0.8, 1.0],
  };

  it('accepts a valid archetype JSON', () => {
    expect(() => validateArchetypeJson(validArchetype, 'test.json')).not.toThrow();
  });

  it('rejects invalid archetype name', () => {
    expect(() => validateArchetypeJson({ ...validArchetype, archetype: 'invalid' }, 'test.json'))
      .toThrow(/invalid archetype/);
  });

  it('rejects wrong number of stage names', () => {
    expect(() => validateArchetypeJson({ ...validArchetype, stageNames: ['A', 'B'] }, 'test.json'))
      .toThrow(/exactly 5 stage names/);
  });

  it('rejects non-monotonic thresholds', () => {
    expect(() => validateArchetypeJson({ ...validArchetype, thresholds: [0.2, 0.1, 0.6, 0.8, 1.0] }, 'test.json'))
      .toThrow(/monotonically increasing/);
  });

  it('rejects thresholds not ending at 1.0', () => {
    expect(() => validateArchetypeJson({ ...validArchetype, thresholds: [0.2, 0.4, 0.6, 0.8, 0.9] }, 'test.json'))
      .toThrow(/must end at 1\.0/);
  });

  it('rejects missing description', () => {
    const { description, ...noDesc } = validArchetype;
    expect(() => validateArchetypeJson(noDesc, 'test.json'))
      .toThrow(/missing 'description'/);
  });
});
