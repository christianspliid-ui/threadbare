/**
 * Tests for Quintessence type system — thresholds, helper functions, constants.
 */

import { describe, it, expect } from 'vitest';
import {
  quintessenceToWord,
  QUINTESSENCE_THRESHOLDS,
  QUINTESSENCE_PASSIVE_REGEN,
  QUINTESSENCE_DEFAULT,
  QUINTESSENCE_ENCOUNTER_FAILURE_EROSION,
} from '../quintessence';

describe('quintessenceToWord', () => {
  it('returns Fraying at 0.0 (dissolution boundary)', () => {
    expect(quintessenceToWord(0.0)).toBe('Fraying');
  });

  it('returns Fraying at 0.05 (mid first band)', () => {
    expect(quintessenceToWord(0.05)).toBe('Fraying');
  });

  it('returns Flickering at 0.15 (second band)', () => {
    expect(quintessenceToWord(0.15)).toBe('Flickering');
  });

  it('returns Absolute at 0.95 (last band)', () => {
    expect(quintessenceToWord(0.95)).toBe('Absolute');
  });

  it('returns Absolute at 1.0 (maximum)', () => {
    expect(quintessenceToWord(1.0)).toBe('Absolute');
  });

  it('clamps negative values to Fraying', () => {
    expect(quintessenceToWord(-0.5)).toBe('Fraying');
  });

  it('clamps values > 1 to Absolute', () => {
    expect(quintessenceToWord(1.5)).toBe('Absolute');
  });

  it('returns correct word at 0.5 (Resonant)', () => {
    expect(quintessenceToWord(0.5)).toBe('Resonant');
  });

  it('returns distinct words at each 0.1 boundary', () => {
    const words = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(v =>
      quintessenceToWord(v)
    );
    // All 10 should be distinct
    expect(new Set(words).size).toBe(10);
  });
});

describe('QUINTESSENCE_THRESHOLDS', () => {
  it('WEAKENED is 0.25', () => {
    expect(QUINTESSENCE_THRESHOLDS.WEAKENED).toBe(0.25);
  });

  it('CRITICAL is 0.10', () => {
    expect(QUINTESSENCE_THRESHOLDS.CRITICAL).toBe(0.10);
  });

  it('DISSOLUTION is 0.0', () => {
    expect(QUINTESSENCE_THRESHOLDS.DISSOLUTION).toBe(0.0);
  });
});

describe('QUINTESSENCE_PASSIVE_REGEN', () => {
  it('is a positive number', () => {
    expect(QUINTESSENCE_PASSIVE_REGEN).toBeGreaterThan(0);
  });

  it('is small enough to not fully recover in one tick', () => {
    // Should take more than 1 tick to fully recover from 0 to 1
    expect(QUINTESSENCE_PASSIVE_REGEN).toBeLessThan(1.0);
  });
});

describe('QUINTESSENCE_DEFAULT', () => {
  it('is 1.0', () => {
    expect(QUINTESSENCE_DEFAULT).toBe(1.0);
  });
});

describe('QUINTESSENCE_ENCOUNTER_FAILURE_EROSION', () => {
  it('is a positive number (erosion magnitude)', () => {
    expect(QUINTESSENCE_ENCOUNTER_FAILURE_EROSION).toBeGreaterThan(0);
  });
});
