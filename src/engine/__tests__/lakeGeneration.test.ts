import { describe, it, expect } from 'vitest';
import { generateLakes } from '../lakeGeneration';
import { createWorldGenData } from '../worldGenData';
import { LAKE_SIZE_MAX, GREAT_LAKE_SIZE_MAX, GREAT_LAKE_COUNT } from '../worldGenData';

describe('generateLakes', () => {
  it('generates at least 1 lake on a 20x15 grid', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    const lakeCount = new Set(
      Array.from(data.lakeIds).filter(id => id >= 0)
    ).size;
    expect(lakeCount).toBeGreaterThanOrEqual(1);
  });

  it('normal lakes are within size constraints', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    const lakeSizes = new Map<number, number>();
    for (const id of data.lakeIds) {
      if (id >= 0) lakeSizes.set(id, (lakeSizes.get(id) ?? 0) + 1);
    }
    // At most 1 great lake
    let greatLakeCount = 0;
    for (const [, size] of lakeSizes) {
      if (size > LAKE_SIZE_MAX) {
        greatLakeCount++;
        expect(size).toBeLessThanOrEqual(GREAT_LAKE_SIZE_MAX);
      }
    }
    expect(greatLakeCount).toBeLessThanOrEqual(GREAT_LAKE_COUNT);
  });

  it('marks lake hexes with lake terrain', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    for (let i = 0; i < data.lakeIds.length; i++) {
      if (data.lakeIds[i] >= 0) {
        expect(data.terrain[i]).toBe('lake');
      }
    }
  });

  it('is deterministic', () => {
    const a = createWorldGenData(20, 15, 42);
    generateLakes(a);
    const b = createWorldGenData(20, 15, 42);
    generateLakes(b);
    expect(Array.from(a.lakeIds)).toEqual(Array.from(b.lakeIds));
  });
});
