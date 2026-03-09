import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import type { CosmologyProfile, HexTile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function mockTiles(): HexTile[] {
  const tiles: HexTile[] = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 5; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland',
      });
    }
  }
  return tiles;
}

describe('worldSeed culture flags', () => {
  it('every culture node has a flagSvg property', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const cultureNodes = result.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    expect(cultureNodes.length).toBeGreaterThan(0);
    for (const node of cultureNodes) {
      const props = node.properties as Record<string, unknown>;
      expect(typeof props.flagSvg).toBe('string');
      expect((props.flagSvg as string).includes('<svg')).toBe(true);
    }
  });

  it('flag SVGs are deterministic per seed', () => {
    const result1 = seedWorld(balancedCosmology(), mockTiles(), 42);
    const result2 = seedWorld(balancedCosmology(), mockTiles(), 42);
    const cultures1 = result1.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture')
      .sort((a, b) => a.id.localeCompare(b.id));
    const cultures2 = result2.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture')
      .sort((a, b) => a.id.localeCompare(b.id));
    expect(cultures1.length).toBe(cultures2.length);
    for (let i = 0; i < cultures1.length; i++) {
      expect((cultures1[i].properties as any).flagSvg)
        .toBe((cultures2[i].properties as any).flagSvg);
    }
  });

  it('different culture seeds produce different flags', () => {
    const result = seedWorld(balancedCosmology(), mockTiles(), 42);
    const cultures = result.graph.getNodesByType('actor')
      .filter(n => (n.properties as Record<string, unknown>).actorType === 'culture');
    if (cultures.length > 1) {
      const flags = cultures.map(n => (n.properties as any).flagSvg);
      // At least some flags should be different (very unlikely to be all the same)
      const uniqueFlags = new Set(flags);
      expect(uniqueFlags.size).toBeGreaterThan(1);
    }
  });
});
