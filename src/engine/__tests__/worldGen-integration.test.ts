import { describe, it, expect } from 'vitest';
import { createWorldGenData, toHexTiles, RIVER_MIN_LENGTH } from '../worldGenData';
import { generateRivers } from '../riverGeneration';
import { fillDepressions } from '../depressionFilling';
import { promoteDepressionLakes } from '../depressionLakes';

describe('World generation pipeline integration', () => {
  const seeds = [1, 2, 3, 4, 5];

  for (const seed of seeds) {
    describe(`seed ${seed}`, () => {
      it('generates a complete world with rivers and lakes', () => {
        const data = createWorldGenData(20, 15, seed);
        // Live hydrology order (pass05-hydrology): fill → rivers → depression lakes
        fillDepressions(data);
        generateRivers(data);
        promoteDepressionLakes(data);
        const tiles = toHexTiles(data);

        // Correct tile count
        expect(tiles).toHaveLength(300);

        // At least 1 river
        expect(data.riverPaths.length).toBeGreaterThanOrEqual(1);

        // Primary rivers (non-forks) flow downhill on drainageElevation
        for (const path of data.riverPaths) {
          if (!path.id.includes('fork')) {
            expect(path.hexes.length).toBeGreaterThanOrEqual(RIVER_MIN_LENGTH);
          }
          for (let i = 1; i < path.hexes.length; i++) {
            const prevIdx = path.hexes[i - 1].row * data.cols + path.hexes[i - 1].col;
            const currIdx = path.hexes[i].row * data.cols + path.hexes[i].col;
            // Tolerance accounts for plateau traversal and proximity merge bias
            expect(data.drainageElevation[currIdx]).toBeLessThanOrEqual(
              data.drainageElevation[prevIdx] + 0.20
            );
          }
        }

        // Every promoted lake hex carries lake terrain
        for (let i = 0; i < data.lakeIds.length; i++) {
          if (data.lakeIds[i] >= 0) expect(data.terrain[i]).toBe('lake');
        }

        // hasRiver flag propagated to tiles
        const riverTiles = tiles.filter(t => t.hasRiver);
        expect(riverTiles.length).toBeGreaterThan(0);
      });
    });
  }

  it('pipeline completes in < 500ms for 20x15 grid', () => {
    const start = performance.now();
    const data = createWorldGenData(20, 15, 42);
    fillDepressions(data);
    generateRivers(data);
    promoteDepressionLakes(data);
    toHexTiles(data);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });
});
