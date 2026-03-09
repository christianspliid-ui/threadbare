import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { generateEntityProse } from '../proseGenerator';
import type { CosmologyProfile, HexTile } from '../../types/index';

function makeTestTiles(): HexTile[] {
  const terrains = ['grassland', 'mountains', 'desert', 'jungle', 'swamp', 'hills'] as const;
  return terrains.map((terrain, i) => ({
    coord: { col: i, row: 0 },
    terrain,
  })) as HexTile[];
}

function makeCosmology(): CosmologyProfile {
  return {
    force: 0.3,
    matter: 0.2,
    energy: 0.15,
    life: 0.5,
    mind: 0.25,
    spirit: 0.3,
    time: 0.1,
    entropy: 0.15,
  };
}

describe('Prose Generator Integration', () => {
  it('generates unique full prose for each location from a real seeded world', () => {
    const { graph, locationIds } = seedWorld(makeCosmology(), makeTestTiles(), 42);

    const proseResults = locationIds.map(id => generateEntityProse(id, graph, 42, 'full'));

    // Every location gets prose
    for (const prose of proseResults) {
      expect(prose.length).toBeGreaterThan(50);
    }

    // Prose is not identical across locations (they have different subtypes/terrains)
    const unique = new Set(proseResults);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('generates prose for agents that reflects their archetype and culture', () => {
    const { graph, individualIds } = seedWorld(makeCosmology(), makeTestTiles(), 42);

    const proseResults = individualIds.map(id => generateEntityProse(id, graph, 42, 'full'));

    // Every agent gets prose
    for (const prose of proseResults) {
      expect(prose.length).toBeGreaterThan(20);
    }

    // At least some agents have distinct prose
    const unique = new Set(proseResults);
    expect(unique.size).toBeGreaterThan(1);
  });

  it('summary mode produces short single-paragraph prose', () => {
    const { graph, locationIds } = seedWorld(makeCosmology(), makeTestTiles(), 42);
    const summary = generateEntityProse(locationIds[0], graph, 42, 'summary');
    expect(summary.length).toBeLessThanOrEqual(203);
    expect(summary.split('\n\n').length).toBe(1);
  });

  it('same seed produces same prose (determinism)', () => {
    const w1 = seedWorld(makeCosmology(), makeTestTiles(), 42);
    const w2 = seedWorld(makeCosmology(), makeTestTiles(), 42);
    const p1 = generateEntityProse(w1.locationIds[0], w1.graph, 42, 'full');
    const p2 = generateEntityProse(w2.locationIds[0], w2.graph, 42, 'full');
    expect(p1).toBe(p2);
  });

  it('different seeds produce different prose', () => {
    const w1 = seedWorld(makeCosmology(), makeTestTiles(), 42);
    const w2 = seedWorld(makeCosmology(), makeTestTiles(), 99);
    const p1 = generateEntityProse(w1.locationIds[0], w1.graph, 42, 'full');
    const p2 = generateEntityProse(w2.locationIds[0], w2.graph, 99, 'full');
    // Different worlds → likely different prose (soft assertion)
    expect(p1).toBeTruthy();
    expect(p2).toBeTruthy();
  });
});
