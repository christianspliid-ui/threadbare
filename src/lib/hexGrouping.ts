/**
 * hexGrouping.ts — Group entities by hex coordinate into a Map.
 *
 * Replaces the repeated "build Map, push, sort, slice" pattern found in
 * agent animation, sprite mesh, and border detection code.
 *
 * NFP #1: Sorting and capping are tunable parameters.
 */

import { hexKey } from './hexKey';

/**
 * Group items by their hex coordinate (hexCol, hexRow).
 *
 * @param items - Array of items with hexCol/hexRow properties
 * @param sortKey - Optional comparator to sort each group (e.g., by ID for determinism)
 * @param maxPerHex - Optional cap on items per hex (applied after sorting)
 * @returns Map from hex key string to array of items
 */
export function groupByHex<T extends { hexCol: number; hexRow: number }>(
  items: T[],
  sortKey?: (a: T, b: T) => number,
  maxPerHex?: number,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = hexKey(item.hexCol, item.hexRow);
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(item);
  }
  if (sortKey) {
    for (const group of groups.values()) {
      group.sort(sortKey);
    }
  }
  if (maxPerHex !== undefined && maxPerHex >= 0) {
    for (const [key, group] of groups) {
      if (group.length > maxPerHex) {
        groups.set(key, group.slice(0, maxPerHex));
      }
    }
  }
  return groups;
}
