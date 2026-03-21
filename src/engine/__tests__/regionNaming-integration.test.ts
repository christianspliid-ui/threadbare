import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { generateWorld } from '../hexGrid';
import type { CosmologyProfile } from '../../types';
import { SPHERE_NAMES } from '../../types';

function makeCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

describe('region naming integration', () => {
  const seeds = [1, 2, 3, 42, 99, 100, 7919, 12345];

  for (const seed of seeds) {
    describe(`seed ${seed}`, () => {
      const cosmology = makeCosmology();
      const tiles = generateWorld(cosmology, 20, 15, seed).tiles;
      const result = seedWorld(cosmology, tiles, seed);

      it('produces at least 1 region', () => {
        expect(result.regionIds.length).toBeGreaterThan(0);
      });

      it('every region has a non-empty name', () => {
        for (const id of result.regionIds) {
          const node = result.graph.getNode(id);
          expect(node, `Region ${id} not in graph`).toBeDefined();
          expect(node!.name, `Region ${id} has empty name`).toBeTruthy();
        }
      });

      it('no duplicate region names', () => {
        const names = result.regionIds.map(id => result.graph.getNode(id)!.name);
        expect(new Set(names).size).toBe(names.length);
      });

      it('produces historical cultures', () => {
        expect(result.historicalCultureIds.length).toBeGreaterThanOrEqual(2);
        for (const id of result.historicalCultureIds) {
          const node = result.graph.getNode(id);
          expect(node).toBeDefined();
          expect(node!.properties.cultureEra).toBe('historical');
        }
      });

      it('most regions are claimed by a historical culture', () => {
        const histEdges = result.graph.getEdgesByType('belongs_to')
          .filter(e => e.properties.cultureLayer === 'historical'
            && result.regionIds.includes(e.source));
        const coverage = histEdges.length / result.regionIds.length;
        expect(coverage).toBeGreaterThan(0.6);
        expect(coverage).toBeLessThanOrEqual(1.0);
      });

      it('tiles have regionId set', () => {
        const withRegion = tiles.filter(t => t.regionId);
        expect(withRegion.length).toBeGreaterThan(0);
      });
    });
  }

  it('is deterministic across runs', () => {
    const cosmology = makeCosmology();
    const tiles1 = generateWorld(cosmology, 20, 15, 42).tiles;
    const tiles2 = generateWorld(cosmology, 20, 15, 42).tiles;
    const r1 = seedWorld(cosmology, tiles1, 42);
    const r2 = seedWorld(cosmology, tiles2, 42);
    expect(r1.regionIds).toEqual(r2.regionIds);
    for (let i = 0; i < r1.regionIds.length; i++) {
      expect(r1.graph.getNode(r1.regionIds[i])!.name)
        .toBe(r2.graph.getNode(r2.regionIds[i])!.name);
    }
  });
});
