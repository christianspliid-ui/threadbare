/**
 * Content lint: aggregate phrase pool meets minimum coverage requirement.
 */
import { describe, it, expect } from 'vitest';
import {
  AGGREGATE_PHRASE_POOL_MIN,
  ALL_AGGREGATE_PHRASES,
  getAggregatePhrasePool,
} from '../../data/event-aggregation-content';

describe('event-aggregation-content lint', () => {
  it('total phrase pool meets AGGREGATE_PHRASE_POOL_MIN', () => {
    expect(ALL_AGGREGATE_PHRASES.length).toBeGreaterThanOrEqual(AGGREGATE_PHRASE_POOL_MIN);
  });

  it('all phraseIds are unique', () => {
    const ids = ALL_AGGREGATE_PHRASES.map(e => e.phraseId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each crowd-size pool is non-empty', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      expect(getAggregatePhrasePool(size).length).toBeGreaterThan(0);
    }
  });

  it('all templates contain at least one placeholder or are complete sentences', () => {
    for (const entry of ALL_AGGREGATE_PHRASES) {
      // Must be non-trivial (> 10 chars) and contain either {location} or {n}
      expect(entry.template.length).toBeGreaterThan(10);
      const hasPlaceholder = /\{(location|n)\}/.test(entry.template);
      expect(hasPlaceholder, `"${entry.phraseId}" missing placeholder`).toBe(true);
    }
  });
});
