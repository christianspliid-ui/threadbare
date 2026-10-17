import { describe, it, expect } from 'vitest';
import { planFolds, type FoldableGroup } from '../planFolds';

const g = (id: string, total: number, rowH = 30, foldAfter = 6): FoldableGroup => ({
  id,
  total,
  fullHeight: 40 + total * rowH,
  foldedHeight: 40 + Math.min(total, foldAfter) * rowH + 30,
});

describe('planFolds — fit, then fold (THR-1876 § D6, Law 57)', () => {
  it('a page that fits folds nothing', () => {
    expect(planFolds([g('who', 10), g('story', 3)], 200, 2000, 6)).toEqual({ folded: [], scrolls: false });
  });

  it('an overflowing page folds the largest group first, one at a time, until it fits', () => {
    const groups = [g('who', 30), g('holds', 12), g('story', 3)];
    // fixed 200 + who 940 + holds 400 + story 130 = 1670; who folds to 250 → 980 fits 1000.
    expect(planFolds(groups, 200, 1000, 6)).toEqual({ folded: ['who'], scrolls: false });
    // Tighter: both long groups fold.
    expect(planFolds(groups, 200, 850, 6)).toEqual({ folded: ['who', 'holds'], scrolls: false });
  });

  it('when every long group is folded and it still overflows, the column scrolls', () => {
    expect(planFolds([g('who', 30), g('story', 3)], 900, 1000, 6)).toEqual({ folded: ['who'], scrolls: true });
  });

  it('a short group never folds, and a group the player opened stays open', () => {
    expect(planFolds([g('who', 5)], 900, 1000, 6).folded).toEqual([]);
    expect(planFolds([g('who', 30), g('holds', 12)], 200, 800, 6, new Set(['who'])).folded).toEqual(['holds']);
  });

  it('no measurement (non-finite height) shows every group whole', () => {
    expect(planFolds([g('who', 30)], 0, Number.POSITIVE_INFINITY, 6)).toEqual({ folded: [], scrolls: false });
  });
});
