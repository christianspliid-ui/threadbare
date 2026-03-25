/**
 * hexKey.ts — Canonical hex coordinate key generation.
 *
 * Centralizes the "col,row" string pattern used across 18+ files for Map keys,
 * Set membership, and hex lookups. Single place to change if the key format
 * ever needs to evolve (e.g., multi-map support).
 *
 * NFP #1: Named utility replaces ~50 inline template literals.
 */

import type { HexCoord } from '../types';

/** Create a hex key string from col/row numbers. */
export function hexKey(col: number, row: number): string {
  return `${col},${row}`;
}

/** Create a hex key string from a HexCoord. */
export function hexKeyFromCoord(coord: HexCoord): string {
  return `${coord.col},${coord.row}`;
}

/** Parse a hex key string back to col/row numbers. Returns { col: NaN, row: NaN } for invalid input. */
export function parseHexKey(key: string): { col: number; row: number } {
  const idx = key.indexOf(',');
  if (idx === -1) return { col: NaN, row: NaN };
  return {
    col: Number(key.slice(0, idx)),
    row: Number(key.slice(idx + 1)),
  };
}
