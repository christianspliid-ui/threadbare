import { describe, it, expect } from 'vitest';
import { createWorldGenData, toHexTiles, RIVER_MIN_LENGTH } from '../worldGenData';
import { generateRivers } from '../riverGeneration';
import { generateLakes } from '../lakeGeneration';
import { LAKE_SIZE_MAX, GREAT_LAKE_SIZE_MAX, GREAT_LAKE_COUNT } from '../worldGenData';

describe('World generation pipeline integration', () => {
  const seeds = [1, 2, 3, 4, 5];

  for (const seed of seeds) {
    describe(`seed ${seed}`, () => {
      it('generates a complete world with rivers and lakes', () => {
        const data = createWorldGenData(20, 15, seed);
        generateLakes(data);
        generateRivers(data);
        const tiles = toHexTiles(data);

        // Correct tile count
        expect(tiles).toHaveLength(300);

        // At least 1 river
        expect(data.riverPaths.length).toBeGreaterThanOrEqual(1);

        // Rivers flow downhill
        for (const path of data.riverPaths) {
          expect(path.hexes.length).toBeGreaterThanOrEqual(RIVER_MIN_LENGTH);
          for (let i = 1; i < path.hexes.length; i++) {
            const prevIdx = path.hexes[i - 1].row * data.cols + path.hexes[i - 1].col;
            const currIdx = path.hexes[i].row * data.cols + path.hexes[i].col;
            expect(data.elevation[currIdx]).toBeLessThanOrEqual(data.elevation[prevIdx] + 0.01);
          }
        }

        // Lake size constraints
        const lakeSizes = new Map<number, number>();
        for (const id of data.lakeIds) {
          if (id >= 0) lakeSizes.set(id, (lakeSizes.get(id) ?? 0) + 1);
        }
        let greatLakeCount = 0;
        for (const [, size] of lakeSizes) {
          if (size > LAKE_SIZE_MAX) {
            greatLakeCount++;
            expect(size).toBeLessThanOrEqual(GREAT_LAKE_SIZE_MAX);
          }
        }
        expect(greatLakeCount).toBeLessThanOrEqual(GREAT_LAKE_COUNT);

        // hasRiver flag propagated to tiles
        const riverTiles = tiles.filter(t => t.hasRiver);
        expect(riverTiles.length).toBeGreaterThan(0);
      });
    });
  }

  it('pipeline completes in < 500ms for 20x15 grid', () => {
    const start = performance.now();
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    generateRivers(data);
    toHexTiles(data);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
