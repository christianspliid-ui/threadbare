// src/types/__tests__/trace-categories.test.ts
import { describe, it, expect } from 'vitest';
import { TRACE_CATEGORIES } from '../trace';
import type { TraceCategory } from '../trace';

describe('TraceCategory registration', () => {
  const requiredCategories: TraceCategory[] = [
    'settlement_genome',
    'settlement_reassessment',
    'culture_generation',
    'culture_sublocation',
  ];

  for (const cat of requiredCategories) {
    it(`includes ${cat} in TRACE_CATEGORIES array`, () => {
      expect(TRACE_CATEGORIES).toContain(cat);
    });
  }

  it('TRACE_CATEGORIES has no duplicates', () => {
    const unique = new Set(TRACE_CATEGORIES);
    expect(unique.size).toBe(TRACE_CATEGORIES.length);
  });
});
