import { describe, it, expect } from 'vitest';
import {
  ATTRIBUTE_FLOORS,
  DEFAULT_FLOOR,
} from '../modifiers';
import type { ModifierSource, ModifierResolutionTrace } from '../modifiers';

describe('modifier types and constants', () => {
  it('exports ATTRIBUTE_FLOORS with los_range floor at 0', () => {
    expect(ATTRIBUTE_FLOORS.los_range).toBe(0);
  });

  it('exports DEFAULT_FLOOR as -Infinity', () => {
    expect(DEFAULT_FLOOR).toBe(-Infinity);
  });

  it('ModifierSource has required fields', () => {
    const source: ModifierSource = {
      edgeId: 'e.has_trait.1',
      edgeType: 'has_trait',
      sourceName: 'Eagle-Eyed',
      delta: 1,
    };
    expect(source.delta).toBe(1);
    expect(source.edgeType).toBe('has_trait');
  });

  it('ModifierResolutionTrace has required fields', () => {
    const trace: ModifierResolutionTrace = {
      id: 0,
      tick: 1,
      timestamp: Date.now(),
      category: 'modifier_resolution',
      summary: 'los_range: 0 + 1 = 1',
      nodeId: 'actor.1',
      attribute: 'los_range',
      baseValue: 0,
      modifiers: [{ edgeId: 'e.1', edgeType: 'has_trait', sourceName: 'Eagle-Eyed', delta: 1 }],
      finalValue: 1,
    };
    expect(trace.category).toBe('modifier_resolution');
    expect(trace.finalValue).toBe(1);
  });
});
