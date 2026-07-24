import { describe, it, expect } from 'vitest';
import { collectStatContributions } from '../effects/effectQueries';
import type { GraphNode } from '../../types/graph';

/** Build a minimal artifact node carrying the given effects[]. */
function node(effects: unknown): GraphNode {
  return { id: 'n', type: 'artifact', name: 'N', properties: { effects } } as GraphNode;
}

describe('collectStatContributions (THR-718)', () => {
  it('returns {} for an undefined node', () => {
    expect(collectStatContributions(undefined)).toEqual({});
  });

  it('returns {} when the node has no effects', () => {
    expect(collectStatContributions({ id: 'n', type: 'artifact', name: 'N', properties: {} } as GraphNode)).toEqual({});
  });

  it('returns {} when effects is malformed (non-array)', () => {
    expect(collectStatContributions(node('nonsense'))).toEqual({});
  });

  it('sums a single stat_contribution effect', () => {
    expect(collectStatContributions(node([
      { type: 'stat_contribution', contributions: { iron: 2, star: 0.5 } },
    ]))).toEqual({ iron: 2, star: 0.5 });
  });

  it('sums multiple stat_contribution effects on the same node', () => {
    expect(collectStatContributions(node([
      { type: 'stat_contribution', contributions: { iron: 1 } },
      { type: 'stat_contribution', contributions: { iron: 1, gold: 2 } },
    ]))).toEqual({ iron: 2, gold: 2 });
  });

  it('ignores non-stat_contribution effects', () => {
    expect(collectStatContributions(node([
      { type: 'passive', reach: 'iron', value: 0.03 },
      { type: 'stat_contribution', contributions: { iron: 1 } },
      { type: 'reveal', target: 'encounters', range: 2 },
    ]))).toEqual({ iron: 1 });
  });

  it('skips non-numeric and NaN contribution values (fail-soft)', () => {
    expect(collectStatContributions(node([
      { type: 'stat_contribution', contributions: { iron: 'oops', gold: NaN, star: 1 } },
    ]))).toEqual({ star: 1 });
  });

  it('skips a stat_contribution with a malformed contributions bag', () => {
    expect(collectStatContributions(node([
      { type: 'stat_contribution', contributions: null },
      { type: 'stat_contribution', contributions: { iron: 1 } },
    ]))).toEqual({ iron: 1 });
  });
});
