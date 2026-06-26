/**
 * Ascendant-reach fixtures + harness tests (THR-494).
 *
 * Asserts the acceptance criteria: all 8 fixtures construct valid initial state
 * across multiple seeds, builds are deterministic per (reach, seed), and an
 * unknown reach fails soft with a clear error.
 */

import { describe, it, expect } from 'vitest';

import { resetEventCounter, resetDecisionCache } from '../../engine/orchestrator';
import { resetReputationTraitInit } from '../../engine/phaseReputationTraits';
import type { GameState } from '../../types/gameState';
import type { ReachDomain } from '../../types/traits';
import { buildAscendantReachState } from '../ascendantReachHarness';
import {
  REPORT_ASCENDANT_REACHES,
  REACH_PRIMARY_SPHERE,
  ASCENDANT_REACH_FIXTURES,
  getAscendantReachIdentity,
} from '../../data/__fixtures__/ascendant-reach-fixtures';

const SEEDS = [42, 99, 7, 1];

/** Reset per-run module globals so back-to-back builds share the harness's inputs. */
function resetRunGlobals(): void {
  resetDecisionCache();
  resetEventCounter();
  resetReputationTraitInit();
}

/** Stable structural fingerprint of an initial game state (no PRNG-sensitive ordering). */
function fingerprint(state: GameState): string {
  const stats = state.graph.getStats();
  const edges = state.graph.getAllEdges().map(e => e.id).sort();
  const asc = state.graph.getNode(state.ascendantId);
  return JSON.stringify({
    stats,
    edges,
    cosmology: state.cosmology,
    sphereAlignment: asc?.properties.sphereAlignment ?? null,
  });
}

describe('ascendant-reach fixtures', () => {
  it('exposes exactly 8 fixtures, one per primary reach', () => {
    expect(REPORT_ASCENDANT_REACHES).toHaveLength(8);
    expect(new Set(REPORT_ASCENDANT_REACHES).size).toBe(8);
    for (const reach of REPORT_ASCENDANT_REACHES) {
      expect(ASCENDANT_REACH_FIXTURES[reach]).toBeDefined();
    }
  });

  it('pins each fixture to its paired sphere and dominant reach', () => {
    for (const reach of REPORT_ASCENDANT_REACHES) {
      const identity = ASCENDANT_REACH_FIXTURES[reach];
      // Primary sphere matches the canonical 1:1 map.
      expect(identity.sphereAlignment.primary).toBe(REACH_PRIMARY_SPHERE[reach]);
      // Secondary sphere is distinct from primary.
      expect(identity.sphereAlignment.secondary).not.toBe(identity.sphereAlignment.primary);
      // The pinned reach is the dominant domain affinity.
      const entries = Object.entries(identity.domainAffinities) as [ReachDomain, number][];
      const top = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
      expect(top[0]).toBe(reach);
    }
  });

  it('builds valid initial state for all 8 reaches across 4 seeds without throwing', () => {
    for (const reach of REPORT_ASCENDANT_REACHES) {
      for (const seed of SEEDS) {
        resetRunGlobals();
        const { state } = buildAscendantReachState(reach, seed, { mapSize: 'small' });
        // Ascendant exists in the graph.
        expect(state.ascendantId).toBeTruthy();
        expect(state.graph.getNode(state.ascendantId)).toBeDefined();
        // World is populated with actors.
        expect(state.graph.getNodesByType('actor').length).toBeGreaterThan(0);
        // The stamped identity reflects the pinned reach.
        expect(state.ascendantIdentity?.hungerId).toBe(`hunger.reach.${reach}`);
      }
    }
  });

  it('is deterministic: same (reach, seed) → identical initial state', () => {
    for (const reach of REPORT_ASCENDANT_REACHES) {
      const seed = 42;
      resetRunGlobals();
      const a = buildAscendantReachState(reach, seed, { mapSize: 'small' });
      resetRunGlobals();
      const b = buildAscendantReachState(reach, seed, { mapSize: 'small' });
      expect(fingerprint(a.state)).toBe(fingerprint(b.state));
    }
  });

  it('fails soft with a clear error on an unknown reach', () => {
    expect(() => getAscendantReachIdentity('flesh')).toThrowError(/Unknown ascendant reach "flesh"/);
    expect(() => getAscendantReachIdentity('flesh')).toThrowError(/Valid reaches:/);
    expect(() => buildAscendantReachState('not-a-reach', 42)).toThrowError(/Unknown ascendant reach/);
  });
});
