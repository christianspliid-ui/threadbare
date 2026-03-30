import { describe, it, expect } from 'vitest';
import { hexKey, hexKeyFromCoord, parseHexKey } from '../hexKey';

describe('hexKey', () => {
  it('creates key from col and row', () => {
    expect(hexKey(3, 7)).toBe('3,7');
  });

  it('handles zero coordinates', () => {
    expect(hexKey(0, 0)).toBe('0,0');
  });

  it('handles negative coordinates', () => {
    expect(hexKey(-1, -5)).toBe('-1,-5');
  });
});

describe('hexKeyFromCoord', () => {
  it('creates key from HexCoord object', () => {
    expect(hexKeyFromCoord({ col: 5, row: 10 })).toBe('5,10');
  });

  it('produces same result as hexKey', () => {
    const coord = { col: 12, row: 4 };
    expect(hexKeyFromCoord(coord)).toBe(hexKey(coord.col, coord.row));
  });
});

describe('parseHexKey', () => {
  it('round-trips with hexKey', () => {
    const result = parseHexKey(hexKey(3, 7));
    expect(result).toEqual({ col: 3, row: 7 });
  });

  it('round-trips with negative coordinates', () => {
    const result = parseHexKey(hexKey(-2, -8));
    expect(result).toEqual({ col: -2, row: -8 });
  });

  it('round-trips with zero', () => {
    const result = parseHexKey(hexKey(0, 0));
    expect(result).toEqual({ col: 0, row: 0 });
  });

  it('returns NaN for invalid input', () => {
    const result = parseHexKey('invalid');
    expect(Number.isNaN(result.col)).toBe(true);
    expect(Number.isNaN(result.row)).toBe(true);
  });

  it('handles empty string', () => {
    const result = parseHexKey('');
    expect(Number.isNaN(result.col)).toBe(true);
    expect(Number.isNaN(result.row)).toBe(true);
  });
});
