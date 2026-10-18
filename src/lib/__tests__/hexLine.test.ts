/**
 * hexLine (THR-1898) — hoisted from world-gen pass09's private `hexLineDraw`.
 *
 * The interior-hex output is pinned on two coordinate pairs, captured from the
 * pass09 function before the hoist, so the land bridges world-gen draws are
 * unchanged. `includeEnds` adds both ends (the Trade lens's roads).
 */
import { describe, it, expect } from 'vitest';
import { hexLine } from '../hexMath';

describe('hexLine', () => {
  it('keeps pass09\'s interior output unchanged (pair 1)', () => {
    expect(hexLine({ col: 2, row: 3 }, { col: 9, row: 7 })).toEqual([
      { col: 3, row: 3 }, { col: 4, row: 4 }, { col: 5, row: 4 }, { col: 6, row: 5 },
      { col: 6, row: 6 }, { col: 7, row: 6 }, { col: 8, row: 7 },
    ]);
  });

  it('keeps pass09\'s interior output unchanged (pair 2)', () => {
    expect(hexLine({ col: 10, row: 1 }, { col: 4, row: 12 })).toEqual([
      { col: 10, row: 2 }, { col: 9, row: 2 }, { col: 9, row: 3 }, { col: 8, row: 4 },
      { col: 8, row: 5 }, { col: 7, row: 5 }, { col: 7, row: 6 }, { col: 7, row: 7 },
      { col: 6, row: 8 }, { col: 6, row: 9 }, { col: 5, row: 9 }, { col: 5, row: 10 },
      { col: 4, row: 11 },
    ]);
  });

  it('adds both ends with includeEnds', () => {
    const line = hexLine({ col: 2, row: 3 }, { col: 9, row: 7 }, { includeEnds: true });
    expect(line[0]).toEqual({ col: 2, row: 3 });
    expect(line[line.length - 1]).toEqual({ col: 9, row: 7 });
    expect(line).toHaveLength(9);
  });

  it('a zero-length line is empty, or the one hex with includeEnds', () => {
    expect(hexLine({ col: 4, row: 4 }, { col: 4, row: 4 })).toEqual([]);
    expect(hexLine({ col: 4, row: 4 }, { col: 4, row: 4 }, { includeEnds: true })).toEqual([{ col: 4, row: 4 }]);
  });
});
