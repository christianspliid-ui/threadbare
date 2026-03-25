import { describe, it, expect } from 'vitest';
import { groupByHex } from '../hexGrouping';

interface TestItem {
  id: string;
  hexCol: number;
  hexRow: number;
}

const items: TestItem[] = [
  { id: 'c', hexCol: 0, hexRow: 0 },
  { id: 'a', hexCol: 0, hexRow: 0 },
  { id: 'b', hexCol: 1, hexRow: 2 },
  { id: 'd', hexCol: 0, hexRow: 0 },
  { id: 'e', hexCol: 1, hexRow: 2 },
];

describe('groupByHex', () => {
  it('groups items by hex key', () => {
    const groups = groupByHex(items);
    expect(groups.size).toBe(2);
    expect(groups.get('0,0')!.length).toBe(3);
    expect(groups.get('1,2')!.length).toBe(2);
  });

  it('sorts groups when comparator provided', () => {
    const groups = groupByHex(items, (a, b) => a.id.localeCompare(b.id));
    const group00 = groups.get('0,0')!;
    expect(group00.map(i => i.id)).toEqual(['a', 'c', 'd']);
  });

  it('caps items per hex with maxPerHex', () => {
    const groups = groupByHex(items, undefined, 2);
    expect(groups.get('0,0')!.length).toBe(2);
    expect(groups.get('1,2')!.length).toBe(2);
  });

  it('sorts then caps', () => {
    const groups = groupByHex(
      items,
      (a, b) => a.id.localeCompare(b.id),
      2,
    );
    const group00 = groups.get('0,0')!;
    expect(group00.map(i => i.id)).toEqual(['a', 'c']);
  });

  it('returns empty map for empty input', () => {
    const groups = groupByHex([]);
    expect(groups.size).toBe(0);
  });

  it('handles single item', () => {
    const groups = groupByHex([{ id: 'x', hexCol: 5, hexRow: 3 }]);
    expect(groups.size).toBe(1);
    expect(groups.get('5,3')!.length).toBe(1);
  });

  it('maxPerHex of 0 returns empty groups', () => {
    const groups = groupByHex(items, undefined, 0);
    for (const group of groups.values()) {
      expect(group.length).toBe(0);
    }
  });
});
