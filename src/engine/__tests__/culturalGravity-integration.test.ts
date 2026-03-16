/**
 * Integration tests for the full cultural gravity pipeline.
 *
 * Verifies end-to-end: culture generation → signature extraction → gravity scoring → tension.
 */

import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { culturalGravity, extractCultureSignature } from '../culturalGravity';
import { computeCulturalTensionScore } from '../culturalTension';
import { REACH_DOMAINS } from '../../types/traits';
import type { ReachDomain } from '../../types/traits';
import type { CultureIdentity } from '../../types/culture';
import type { CosmologyProfile, HexTile, TerrainType } from '../../types/index';

// ─── Test Helpers ────────────────────────────────────────────────

function balancedCosmology(): CosmologyProfile {
  return {
    force: 0.125, matter: 0.125, energy: 0.125, life: 0.125,
    mind: 0.125, spirit: 0.125, time: 0.125, entropy: 0.125,
  };
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

function getCultureIdentities(result: ReturnType<typeof seedWorld>): Map<string, CultureIdentity> {
  const identities = new Map<string, CultureIdentity>();
  for (const cId of result.cultureIds) {
    const node = result.graph.getNode(cId)!;
    identities.set(cId, node.properties.cultureIdentity as CultureIdentity);
  }
  return identities;
}

// ─── Tests ───────────────────────────────────────────────────────

describe('cultural gravity integration', () => {

  it('generated cultures produce valid reachPreferences with all 9 domains in [-1, 1]', () => {
    const result = seedWorld(balancedCosmology(), diverseTiles(), 42);

    for (const cId of result.cultureIds) {
      const node = result.graph.getNode(cId)!;
      const identity = node.properties.cultureIdentity as CultureIdentity;

      expect(identity.reachPreferences).toBeDefined();

      for (const domain of REACH_DOMAINS) {
        const value = identity.reachPreferences[domain];
        expect(value).toBeDefined();
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }

      // Verify all 9 domains are present
      const domainKeys = Object.keys(identity.reachPreferences) as ReachDomain[];
      expect(domainKeys).toHaveLength(9);
      for (const d of REACH_DOMAINS) {
        expect(domainKeys).toContain(d);
      }
    }
  });

  it('cultures sharing a venerated sphere have positive gravity', () => {
    // Use multiple seeds to find at least one pair sharing a sphere
    let foundPositivePair = false;

    for (let seed = 0; seed < 20 && !foundPositivePair; seed++) {
      const result = seedWorld(balancedCosmology(), diverseTiles(), seed);
      const identities = getCultureIdentities(result);
      const ids = result.cultureIds;

      for (let i = 0; i < ids.length && !foundPositivePair; i++) {
        for (let j = i + 1; j < ids.length && !foundPositivePair; j++) {
          const idA = identities.get(ids[i])!;
          const idB = identities.get(ids[j])!;

          const sharedSpheres = idA.veneratedSpheres.filter(
            s => idB.veneratedSpheres.includes(s),
          );

          if (sharedSpheres.length > 0) {
            const sigA = extractCultureSignature(idA);
            const sigB = extractCultureSignature(idB);
            const gravity = culturalGravity(sigA, sigB);

            // Shared sphere contributes +1.0 * weight, so overall should be positive
            // unless reach/foundation strongly oppose
            expect(gravity).toBeGreaterThan(0);
            foundPositivePair = true;
          }
        }
      }
    }

    expect(foundPositivePair).toBe(true);
  });

  it('is deterministic across 8 seeds — same seed produces identical reachPreferences', () => {
    const seeds = [0, 7, 42, 99, 256, 1000, 31415, 65535];

    for (const seed of seeds) {
      const result1 = seedWorld(balancedCosmology(), diverseTiles(), seed);
      const result2 = seedWorld(balancedCosmology(), diverseTiles(), seed);

      expect(result1.cultureIds).toEqual(result2.cultureIds);

      for (const cId of result1.cultureIds) {
        const identity1 = result1.graph.getNode(cId)!.properties.cultureIdentity as CultureIdentity;
        const identity2 = result2.graph.getNode(cId)!.properties.cultureIdentity as CultureIdentity;

        // Verify exact match of reachPreferences across runs
        for (const domain of REACH_DOMAINS) {
          expect(identity1.reachPreferences[domain]).toBe(identity2.reachPreferences[domain]);
        }

        // Also verify other identity fields match
        expect(identity1.veneratedSpheres).toEqual(identity2.veneratedSpheres);
        expect(identity1.foundationBias).toBe(identity2.foundationBias);
        expect(identity1.primaryBiome).toBe(identity2.primaryBiome);
      }
    }
  });

  it('cultural tension score for an actor at a mismatched location is >= 0', () => {
    const result = seedWorld(balancedCosmology(), diverseTiles(), 42);

    // Find an individual with a culture assignment and a location
    for (const indId of result.individualIds) {
      const locEdges = result.graph.getOutgoingEdges(indId, 'located_at');
      const cultureEdges = result.graph.getAllEdgesForNode(indId)
        .filter(e => e.type === 'belongs_to');

      if (locEdges.length > 0 && cultureEdges.length > 0) {
        const { score, tensions } = computeCulturalTensionScore(result.graph, indId);

        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(tensions)).toBe(true);

        // Each tension should have valid fields
        for (const t of tensions) {
          expect(['mismatch', 'conquest', 'dual', 'fanaticism']).toContain(t.type);
          expect(t.severity).toBeGreaterThanOrEqual(0);
          expect(t.cultureIds.length).toBeGreaterThan(0);
        }

        // We found a testable actor — one is enough
        return;
      }
    }

    // If no actor has both a location and a culture, the score should still be 0
    // (fail-soft behavior)
    const { score } = computeCulturalTensionScore(result.graph, result.individualIds[0]);
    expect(score).toBe(0);
  });

  it('gravity between identical signatures is positive', () => {
    const result = seedWorld(balancedCosmology(), diverseTiles(), 42);
    const identities = getCultureIdentities(result);
    const firstId = result.cultureIds[0];
    const identity = identities.get(firstId)!;

    const sig = extractCultureSignature(identity);
    const gravity = culturalGravity(sig, sig);

    // Cosine similarity of identical vectors = 1, same spheres = +1, same foundation = +0.5
    expect(gravity).toBeGreaterThan(0);
  });

  it('extracted signatures have the correct shape', () => {
    const result = seedWorld(balancedCosmology(), diverseTiles(), 77);

    for (const cId of result.cultureIds) {
      const identity = result.graph.getNode(cId)!.properties.cultureIdentity as CultureIdentity;
      const sig = extractCultureSignature(identity);

      expect(sig.spheres).toEqual(identity.veneratedSpheres);
      expect(sig.foundation).toBe(identity.foundationBias);
      expect(sig.reaches).toEqual(identity.reachPreferences);
    }
  });
});
