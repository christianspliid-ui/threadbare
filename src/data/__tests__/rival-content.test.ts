import { describe, it, expect } from 'vitest';
import {
  RIVAL_NAME_PREFIXES,
  RIVAL_NAME_SUFFIXES,
  BEHAVIORS,
  BEHAVIOR_WEIGHTS,
} from '../rival-content';

describe('rival-content', () => {
  it('exports 12 name prefixes', () => {
    expect(RIVAL_NAME_PREFIXES).toHaveLength(12);
  });

  it('exports 12 name suffixes', () => {
    expect(RIVAL_NAME_SUFFIXES).toHaveLength(12);
  });

  it('all prefixes are unique', () => {
    expect(new Set(RIVAL_NAME_PREFIXES).size).toBe(RIVAL_NAME_PREFIXES.length);
  });

  it('all suffixes are unique', () => {
    expect(new Set(RIVAL_NAME_SUFFIXES).size).toBe(RIVAL_NAME_SUFFIXES.length);
  });

  it('exports 4 behaviors', () => {
    expect(BEHAVIORS).toHaveLength(4);
  });

  it('exports behavior weights for all 4 behaviors', () => {
    expect(Object.keys(BEHAVIOR_WEIGHTS)).toHaveLength(4);
    for (const weights of Object.values(BEHAVIOR_WEIGHTS)) {
      const sum = Object.values(weights).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    }
  });
});
