import { describe, it, expect } from 'vitest';
import {
  loadArchetypeStageNames,
  loadDefaultThresholds,
  loadDoomVocabulary,
  validateArchetypeJson,
} from '../doom-loader';

// contentInvariants sweep v2 (THR-245): kept 4 structural (fixed-enum), replaced 0 growth-tracking

// ── loadArchetypeStageNames ───────────────────────────────────────

describe('loadArchetypeStageNames', () => {
  const stageNames = loadArchetypeStageNames();

  it('loads stage names for archetypes', () => {
    expect(Object.keys(stageNames).length).toBeGreaterThan(0);
  });

  it('includes all expected archetype keys', () => {
    const expected = ['breach', 'convergence', 'changing', 'sundering', 'failing', 'ascension', 'reckoning'];
    expect(Object.keys(stageNames).sort()).toEqual(expected.sort());
  });

  it('each archetype has exactly 5 stage names', () => {
    for (const [key, names] of Object.entries(stageNames)) {
      // Archetype schema fixes each progression to five stage names.
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
  it('returns thresholds starting at 0.20 and ending at 1.0', () => {
    const thresholds = loadDefaultThresholds();
    expect(thresholds.length).toBeGreaterThan(0);
    expect(thresholds[0]).toBe(0.20);
    expect(thresholds[thresholds.length - 1]).toBe(1.0);
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

  it('has stage entries', () => {
    expect(Object.keys(vocab).length).toBeGreaterThan(0);
  });

  it('stages are named correctly', () => {
    const expected = ['whispers', 'signs', 'tremors', 'cracks', 'the_breaking', 'the_breach', 'the_unmaking'];
    expect(Object.keys(vocab)).toEqual(expected);
  });

  it('each stage has 5 adjectives, 5 verbs, 3 nouns, and atmosphere', () => {
    for (const [stage, entry] of Object.entries(vocab)) {
      // Doom vocabulary schema uses 5 adjectives per stage.
      expect(entry.adjectives, `${stage} adjectives`).toHaveLength(5);
      // Doom vocabulary schema uses 5 verbs per stage.
      expect(entry.verbs, `${stage} verbs`).toHaveLength(5);
      // Doom vocabulary schema uses 3 nouns per stage.
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
