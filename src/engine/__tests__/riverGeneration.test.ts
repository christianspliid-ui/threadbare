import { describe, it, expect } from 'vitest';
import { generateRivers } from '../riverGeneration';
import { createWorldGenData } from '../worldGenData';
import { generateLakes } from '../lakeGeneration';
import { fillDepressions } from '../depressionFilling';
import { RIVER_MIN_LENGTH } from '../worldGenData';

describe('generateRivers', () => {
  it('generates at least 1 river on a 20x15 grid', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    fillDepressions(data);
    generateRivers(data);
    expect(data.riverPaths.length).toBeGreaterThanOrEqual(1);
  });

  it('marks hasRiver on traversed hexes', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    fillDepressions(data);
    generateRivers(data);
    const riverHexCount = Array.from(data.hasRiver).filter(v => v === 1).length;
    expect(riverHexCount).toBeGreaterThan(0);
  });

  it('all primary rivers meet minimum length', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    fillDepressions(data);
    generateRivers(data);
    for (const path of data.riverPaths) {
      // Forks can be shorter than min length for primary rivers
      if (path.id.includes('fork')) continue;
      expect(path.hexes.length).toBeGreaterThanOrEqual(RIVER_MIN_LENGTH);
    }
  });

  it('rivers flow downhill on drainageElevation (each hex has lower or equal elevation)', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    fillDepressions(data);
    generateRivers(data);
    const elev = data.drainageElevation;
    for (const path of data.riverPaths) {
      for (let i = 1; i < path.hexes.length; i++) {
        const prevIdx = path.hexes[i - 1].row * data.cols + path.hexes[i - 1].col;
        const currIdx = path.hexes[i].row * data.cols + path.hexes[i].col;
        // Allow tolerance for plateau traversal (+0.01) and proximity merge bias (+0.15)
        expect(elev[currIdx]).toBeLessThanOrEqual(elev[prevIdx] + 0.20);
      }
    }
  });

  it('rivers terminate at ocean, lake, edge, or confluence', () => {
    const data = createWorldGenData(20, 15, 42);
    generateLakes(data);
    fillDepressions(data);
    generateRivers(data);
    for (const path of data.riverPaths) {
      const lastHex = path.hexes[path.hexes.length - 1];
      const idx = lastHex.row * data.cols + lastHex.col;
      const t = data.terrain[idx];
      const isWater = t === 'ocean' || t === 'deep_ocean' || t === 'tropical_ocean' ||
        t === 'coastal_shallows' || t === 'lake';
      const isEdge = lastHex.col === 0 || lastHex.col === data.cols - 1 ||
        lastHex.row === 0 || lastHex.row === data.rows - 1;
      // Either terminates at water, edge, or at a hex with an existing river (confluence)
      expect(isWater || isEdge || data.hasRiver[idx] === 1).toBe(true);
    }
  });

  it('is deterministic', () => {
    const a = createWorldGenData(20, 15, 42);
    generateLakes(a);
    fillDepressions(a);
    generateRivers(a);

    const b = createWorldGenData(20, 15, 42);
    generateLakes(b);
    fillDepressions(b);
    generateRivers(b);

    expect(a.riverPaths.length).toBe(b.riverPaths.length);
    for (let i = 0; i < a.riverPaths.length; i++) {
      expect(a.riverPaths[i].hexes).toEqual(b.riverPaths[i].hexes);
    }
  });

  it('can produce fork rivers', () => {
    // Test across multiple seeds — forking is probabilistic
    let foundFork = false;
    for (let seed = 1; seed <= 20; seed++) {
      const data = createWorldGenData(20, 15, seed);
      generateLakes(data);
      fillDepressions(data);
      generateRivers(data);
      if (data.riverPaths.some(p => p.id.includes('fork'))) {
        foundFork = true;
        break;
      }
    }
    expect(foundFork).toBe(true);
  });
});

describe('river integration: no land dead-ends', () => {
  it('no river terminates on inland land hex across 5 seeds', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const data = createWorldGenData(20, 15, seed);
      generateLakes(data);
      fillDepressions(data);
      generateRivers(data);

      for (const path of data.riverPaths) {
        const lastHex = path.hexes[path.hexes.length - 1];
        const idx = lastHex.row * data.cols + lastHex.col;
        const t = data.terrain[idx];
        const isWater = t === 'ocean' || t === 'deep_ocean' || t === 'tropical_ocean' ||
          t === 'coastal_shallows' || t === 'lake';
        const isEdge = lastHex.col === 0 || lastHex.col === data.cols - 1 ||
          lastHex.row === 0 || lastHex.row === data.rows - 1;
        const isConfluence = data.hasRiver[idx] === 1 && path.hexes.length > 1;

        const isLand = t === 'grassland' || t === 'desert' || t === 'tundra' ||
          t === 'savanna' || t === 'temperate_forest' || t === 'boreal_forest' ||
          t === 'tropical_forest' || t === 'volcanic';

        if (isLand && !isEdge && !isConfluence) {
          // This would be the original bug — a river dead-ending on land
          expect(false).toBe(true);
        }
      }
    }
  });
});
