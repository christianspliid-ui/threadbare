import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import type { CosmologyProfile, HexTile, TerrainType } from '../../types/index';
import type { CultureIdentity } from '../../types/culture';
import { CULTURE_COUNT } from '../../types/culture';

function balancedCosmology(): CosmologyProfile {
  return { chaos: 1/12, order: 1/12, light: 1/12, darkness: 1/12,
           force: 1/12, matter: 1/12, energy: 1/12, life: 1/12,
           mind: 1/12, spirit: 1/12, time: 1/12, entropy: 1/12 };
}

function skewedCosmology(): CosmologyProfile {
  return { chaos: 0.02, order: 0.02, light: 0.02, darkness: 0.02,
           force: 0.34, matter: 0.18, energy: 0.10, life: 0.10,
           mind: 0.05, spirit: 0.05, time: 0.05, entropy: 0.05 };
}

function diverseTiles(): HexTile[] {
  const terrains: TerrainType[] = [
    'desert', 'mountains', 'jungle', 'grassland', 'tundra',
    'swamp', 'hills', 'volcano', 'temperate_forest', 'steppe',
  ];
  return terrains.map((terrain, i) => ({
    coord: { col: i % 5, row: Math.floor(i / 5) },
    geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
    terrain,
  }));
}

describe('culture generation integration', () => {
  it('full flow: seed → cultures → actor assignment → location assignment', () => {
    const result = seedWorld(balancedCosmology(), diverseTiles(), 42);

    // Cultures exist
    expect(result.cultureIds.length).toBeGreaterThanOrEqual(CULTURE_COUNT.min);
    expect(result.cultureIds.length).toBeLessThanOrEqual(CULTURE_COUNT.max);

    // Each culture has a composed identity
    for (const cId of result.cultureIds) {
      const node = result.graph.getNode(cId)!;
      const identity = node.properties.cultureIdentity as CultureIdentity;
      expect(identity.foundationBias).toBeTruthy();
      expect(identity.veneratedSpheres.length).toBeGreaterThanOrEqual(1);
      expect(identity.behavioralKeywords.length).toBeGreaterThan(0);
      expect(identity.materialVocabulary.length).toBeGreaterThan(0);
      expect(identity.metaphorPalette.length).toBeGreaterThan(0);
    }

    // Locations have dual-layer culture assignment
    for (const locId of result.locationIds) {
      const edges = result.graph.getAllEdgesForNode(locId)
        .filter(e => e.type === 'belongs_to');
      const layers = edges.map(e => e.properties.cultureLayer);
      expect(layers).toContain('historical');
      expect(layers).toContain('current');
    }

    // Factions all have exactly 1 culture
    for (const facId of result.factionIds) {
      const edges = result.graph.getAllEdgesForNode(facId)
        .filter(e => e.type === 'belongs_to');
      expect(edges).toHaveLength(1);
    }

    // Most individuals have cultures (budget model)
    let withCulture = 0;
    for (const indId of result.individualIds) {
      const edges = result.graph.getAllEdgesForNode(indId)
        .filter(e => e.type === 'belongs_to');
      if (edges.length > 0) withCulture++;
    }
    expect(withCulture).toBeGreaterThan(0);
  });

  it('skewed cosmology biases sphere selection', () => {
    const results: string[][] = [];
    for (let seed = 0; seed < 10; seed++) {
      const result = seedWorld(skewedCosmology(), diverseTiles(), seed);
      for (const cId of result.cultureIds) {
        const identity = result.graph.getNode(cId)!.properties.cultureIdentity as CultureIdentity;
        results.push(identity.veneratedSpheres);
      }
    }
    const forceCount = results.filter(spheres => spheres.includes('force')).length;
    const entropyCount = results.filter(spheres => spheres.includes('entropy')).length;
    expect(forceCount).toBeGreaterThan(entropyCount);
  });

  it('fundament sphere weights bias culture foundation selection', () => {
    // Create a fundament with high order weight to bias toward order foundations
    const orderFundament = {
      sphereWeights: {
        chaos: 0.02, order: 0.30, light: 1/12, darkness: 1/12,
        force: 1/12, matter: 1/12, energy: 1/12, life: 1/12,
        mind: 1/12, spirit: 1/12, time: 1/12, entropy: 1/12,
      },
      cycleCount: 0,
    };
    const results: string[] = [];
    for (let seed = 0; seed < 10; seed++) {
      const result = seedWorld(balancedCosmology(), diverseTiles(), seed, undefined, orderFundament);
      for (const cId of result.cultureIds) {
        const identity = result.graph.getNode(cId)!.properties.cultureIdentity as CultureIdentity;
        results.push(identity.foundationBias);
      }
    }
    const orderCount = results.filter(f => f === 'order').length;
    const chaosCount = results.filter(f => f === 'chaos').length;
    expect(orderCount).toBeGreaterThan(chaosCount);
  });

  it('cultures have unique names', () => {
    const result = seedWorld(balancedCosmology(), diverseTiles(), 42);
    const names = result.cultureIds.map(id => result.graph.getNode(id)!.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});
