// src/types/__tests__/hexVignette.test.ts
import { describe, it, expect } from 'vitest';
import {
  WORD_REVEAL_INTERVAL_MS,
  LETTER_STAGGER_MS,
  LETTER_FADE_DURATION_MS,
  MAX_TIER2_SENTENCES,
  MAX_TIER3_SENTENCES,
  SPHERE_AURA_THRESHOLD,
  MAX_LOCATION_SPOTLIGHTS,
  TEMPERATURE_THRESHOLDS,
  MOISTURE_THRESHOLDS,
  POPULATION_THRESHOLDS,
} from '../hexVignette';

describe('hexVignette types', () => {
  it('animation constants are positive numbers', () => {
    expect(WORD_REVEAL_INTERVAL_MS).toBeGreaterThan(0);
    expect(LETTER_STAGGER_MS).toBeGreaterThan(0);
    expect(LETTER_FADE_DURATION_MS).toBeGreaterThan(0);
  });

  it('tier caps are reasonable', () => {
    expect(MAX_TIER2_SENTENCES).toBeGreaterThanOrEqual(1);
    expect(MAX_TIER2_SENTENCES).toBeLessThanOrEqual(5);
    expect(MAX_TIER3_SENTENCES).toBeGreaterThanOrEqual(1);
    expect(MAX_TIER3_SENTENCES).toBeLessThanOrEqual(6);
  });

  it('temperature thresholds divide 0-1 into 5 bands', () => {
    expect(TEMPERATURE_THRESHOLDS).toHaveLength(4);
    for (let i = 1; i < TEMPERATURE_THRESHOLDS.length; i++) {
      expect(TEMPERATURE_THRESHOLDS[i]).toBeGreaterThan(TEMPERATURE_THRESHOLDS[i - 1]);
    }
  });

  it('moisture thresholds divide 0-1 into 5 bands', () => {
    expect(MOISTURE_THRESHOLDS).toHaveLength(4);
  });

  it('population thresholds are monotonically increasing', () => {
    expect(POPULATION_THRESHOLDS.sparse).toBeLessThan(POPULATION_THRESHOLDS.moderate);
    expect(POPULATION_THRESHOLDS.moderate).toBeLessThan(POPULATION_THRESHOLDS.bustling);
  });

  it('sphere aura threshold is between 0 and 1', () => {
    expect(SPHERE_AURA_THRESHOLD).toBeGreaterThan(0);
    expect(SPHERE_AURA_THRESHOLD).toBeLessThan(1);
  });

  it('max location spotlights is positive', () => {
    expect(MAX_LOCATION_SPOTLIGHTS).toBeGreaterThanOrEqual(1);
  });
});
