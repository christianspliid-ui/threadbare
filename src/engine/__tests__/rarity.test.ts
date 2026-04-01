import { describe, it, expect, vi } from 'vitest';
import { clampRarityTier } from '../../types/rarity';
import {
  RARITY_DISTRIBUTION_ACTORS,
  RARITY_DISTRIBUTION_LOCATIONS,
  RARITY_DISTRIBUTION_SUBLOCATIONS,
  IMPORTANCE_PLAYER_ACTION,
  IMPORTANCE_ENCOUNTER,
  IMPORTANCE_CHRONICLE,
  IMPORTANCE_DIVINE_PROXIMITY,
  IMPORTANCE_SPHERE_EVENT,
} from '../../data/rarity-constants';
import {
  getRarityTier,
  seedRarityTier,
  graduateRarity,
  accumulateImportance,
  checkGraduationThreshold,
  getImportanceDelta,
  type ImportanceSource,
} from '../rarity';
import type { GraphNode } from '../../types/graph';

// ─── Test Helpers ────────────────────────────────────────────────

function makeNode(overrides: Partial<GraphNode['properties']> = {}): GraphNode {
  return {
    id: 'test-node',
    type: 'actor',
    name: 'Test Node',
    properties: { ...overrides },
  };
}

// ─── getRarityTier ───────────────────────────────────────────────

describe('getRarityTier', () => {
  it('returns 1 (Mundane) when rarityTier property is absent', () => {
    const node = makeNode();
    expect(getRarityTier(node)).toBe(1);
  });

  it('returns 1 when rarityTier is a non-number', () => {
    const node = makeNode({ rarityTier: 'Legendary' });
    expect(getRarityTier(node)).toBe(1);
  });

  it('returns 1 for tier 1', () => {
    expect(getRarityTier(makeNode({ rarityTier: 1 }))).toBe(1);
  });

  it('returns 2 for tier 2', () => {
    expect(getRarityTier(makeNode({ rarityTier: 2 }))).toBe(2);
  });

  it('returns 3 for tier 3', () => {
    expect(getRarityTier(makeNode({ rarityTier: 3 }))).toBe(3);
  });

  it('returns 4 for tier 4', () => {
    expect(getRarityTier(makeNode({ rarityTier: 4 }))).toBe(4);
  });

  it('clamps out-of-range values', () => {
    expect(getRarityTier(makeNode({ rarityTier: 0 }))).toBe(1);
    expect(getRarityTier(makeNode({ rarityTier: 5 }))).toBe(4);
  });
});

// ─── clampRarityTier ─────────────────────────────────────────────

describe('clampRarityTier', () => {
  it('clamps 0 to 1', () => {
    expect(clampRarityTier(0)).toBe(1);
  });

  it('clamps negative numbers to 1', () => {
    expect(clampRarityTier(-10)).toBe(1);
  });

  it('clamps 5 to 4', () => {
    expect(clampRarityTier(5)).toBe(4);
  });

  it('clamps large numbers to 4', () => {
    expect(clampRarityTier(100)).toBe(4);
  });

  it('passes 1 through unchanged', () => {
    expect(clampRarityTier(1)).toBe(1);
  });

  it('passes 2 through unchanged', () => {
    expect(clampRarityTier(2)).toBe(2);
  });

  it('passes 3 through unchanged', () => {
    expect(clampRarityTier(3)).toBe(3);
  });

  it('passes 4 through unchanged', () => {
    expect(clampRarityTier(4)).toBe(4);
  });
});

// ─── seedRarityTier ──────────────────────────────────────────────

describe('seedRarityTier', () => {
  it('returns tier 1 when prngValue is 0.0', () => {
    expect(seedRarityTier(RARITY_DISTRIBUTION_ACTORS, 0.0)).toBe(1);
  });

  it('returns tier 4 when prngValue is 0.999', () => {
    expect(seedRarityTier(RARITY_DISTRIBUTION_ACTORS, 0.999)).toBe(4);
  });

  it('returns tier 1 for actor distribution with prngValue just below tier 1 boundary (0.69)', () => {
    // ACTORS: {1:0.70, 2:0.22, 3:0.07, 4:0.01} — tier 1 covers [0, 0.70)
    expect(seedRarityTier(RARITY_DISTRIBUTION_ACTORS, 0.69)).toBe(1);
  });

  it('returns tier 2 for actor distribution just above tier 1 boundary (0.71)', () => {
    // tier 2 covers [0.70, 0.92)
    expect(seedRarityTier(RARITY_DISTRIBUTION_ACTORS, 0.71)).toBe(2);
  });

  it('returns tier 3 for actor distribution at 0.93', () => {
    // tier 3 covers [0.92, 0.99)
    expect(seedRarityTier(RARITY_DISTRIBUTION_ACTORS, 0.93)).toBe(3);
  });

  it('returns tier 2 for location distribution at 0.65', () => {
    // LOCATIONS: {1:0.60, 2:0.28, 3:0.10, 4:0.02} — tier 2 covers [0.60, 0.88)
    expect(seedRarityTier(RARITY_DISTRIBUTION_LOCATIONS, 0.65)).toBe(2);
  });

  it('returns tier 1 for sublocation distribution at 0.5', () => {
    // SUBLOCATIONS: {1:0.65, ...} — tier 1 covers [0, 0.65)
    expect(seedRarityTier(RARITY_DISTRIBUTION_SUBLOCATIONS, 0.5)).toBe(1);
  });

  it('returns tier 3 for sublocation distribution at 0.92', () => {
    // SUBLOCATIONS: {1:0.65, 2:0.25, 3:0.08, 4:0.02} — tier 3 covers [0.90, 0.98)
    expect(seedRarityTier(RARITY_DISTRIBUTION_SUBLOCATIONS, 0.92)).toBe(3);
  });

  it('uses cumulative weights correctly for a uniform distribution', () => {
    const uniform = { 1: 0.25, 2: 0.25, 3: 0.25, 4: 0.25 };
    expect(seedRarityTier(uniform, 0.0)).toBe(1);
    expect(seedRarityTier(uniform, 0.25)).toBe(2);
    expect(seedRarityTier(uniform, 0.50)).toBe(3);
    expect(seedRarityTier(uniform, 0.75)).toBe(4);
  });

  it('falls back to tier 4 and warns when distribution sums to less than 1.0', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Distribution that only sums to 0.5 — prngValue 0.8 exceeds the sum
    const badDist: Record<RarityTier, number> = { 1: 0.3, 2: 0.1, 3: 0.05, 4: 0.05 };
    const result = seedRarityTier(badDist, 0.8);
    expect(result).toBe(4);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('misconfigured'));
    warnSpy.mockRestore();
  });
});

// ─── graduateRarity ──────────────────────────────────────────────

describe('graduateRarity', () => {
  it('promotes a Mundane node to Storied', () => {
    const node = makeNode({ rarityTier: 1 });
    const changed = graduateRarity(node, 2);
    expect(changed).toBe(true);
    expect(node.properties['rarityTier']).toBe(2);
  });

  it('promotes a Mundane node to Legendary', () => {
    const node = makeNode({ rarityTier: 1 });
    const changed = graduateRarity(node, 4);
    expect(changed).toBe(true);
    expect(node.properties['rarityTier']).toBe(4);
  });

  it('does not demote a higher-tier node', () => {
    const node = makeNode({ rarityTier: 3 });
    const changed = graduateRarity(node, 2);
    expect(changed).toBe(false);
    expect(node.properties['rarityTier']).toBe(3);
  });

  it('returns false when tier is already at minTier', () => {
    const node = makeNode({ rarityTier: 2 });
    const changed = graduateRarity(node, 2);
    expect(changed).toBe(false);
    expect(node.properties['rarityTier']).toBe(2);
  });

  it('handles node without rarityTier property (defaults to 1)', () => {
    const node = makeNode();
    const changed = graduateRarity(node, 3);
    expect(changed).toBe(true);
    expect(node.properties['rarityTier']).toBe(3);
  });

  it('returns false when trying to graduate Legendary to Legendary', () => {
    const node = makeNode({ rarityTier: 4 });
    const changed = graduateRarity(node, 4);
    expect(changed).toBe(false);
  });
});

// ─── accumulateImportance ────────────────────────────────────────

describe('accumulateImportance', () => {
  it('adds delta with rate multiplier for tier 1 (rate=1.0)', () => {
    const node = makeNode({ rarityTier: 1 });
    const result = accumulateImportance(node, 10);
    expect(result).toBe(10); // 10 * 1.0
    expect(node.properties['importance']).toBe(10);
  });

  it('adds delta with rate multiplier for tier 2 (rate=1.5)', () => {
    const node = makeNode({ rarityTier: 2 });
    const result = accumulateImportance(node, 10);
    expect(result).toBe(15); // 10 * 1.5
  });

  it('adds delta with rate multiplier for tier 3 (rate=2.0)', () => {
    const node = makeNode({ rarityTier: 3 });
    const result = accumulateImportance(node, 10);
    expect(result).toBe(20); // 10 * 2.0
  });

  it('adds 0 for Legendary tier (rate=0)', () => {
    const node = makeNode({ rarityTier: 4, importance: 100 });
    const result = accumulateImportance(node, 10);
    expect(result).toBe(100); // 100 + 10 * 0
  });

  it('accumulates monotonically across multiple calls', () => {
    const node = makeNode({ rarityTier: 1 });
    const r1 = accumulateImportance(node, 5);
    const r2 = accumulateImportance(node, 5);
    const r3 = accumulateImportance(node, 5);
    expect(r1).toBe(5);
    expect(r2).toBe(10);
    expect(r3).toBe(15);
    expect(r3).toBeGreaterThan(r2);
    expect(r2).toBeGreaterThan(r1);
  });

  it('starts from 0 when importance property is absent', () => {
    const node = makeNode({ rarityTier: 2 });
    const result = accumulateImportance(node, 4);
    expect(result).toBe(6); // 0 + 4 * 1.5
  });
});

// ─── checkGraduationThreshold ────────────────────────────────────

describe('checkGraduationThreshold', () => {
  it('returns null below threshold for tier 1→2 (threshold=50)', () => {
    const node = makeNode({ rarityTier: 1, importance: 49 });
    expect(checkGraduationThreshold(node)).toBeNull();
  });

  it('returns tier 2 when importance meets threshold (50)', () => {
    const node = makeNode({ rarityTier: 1, importance: 50 });
    expect(checkGraduationThreshold(node)).toBe(2);
  });

  it('returns tier 2 when importance exceeds threshold', () => {
    const node = makeNode({ rarityTier: 1, importance: 75 });
    expect(checkGraduationThreshold(node)).toBe(2);
  });

  it('returns tier 3 when importance meets tier 3 threshold (150) from tier 2', () => {
    const node = makeNode({ rarityTier: 2, importance: 150 });
    expect(checkGraduationThreshold(node)).toBe(3);
  });

  it('returns null below tier 3 threshold from tier 2', () => {
    const node = makeNode({ rarityTier: 2, importance: 149 });
    expect(checkGraduationThreshold(node)).toBeNull();
  });

  it('returns null for Legendary tier (already at cap)', () => {
    const node = makeNode({ rarityTier: 4, importance: 9999 });
    expect(checkGraduationThreshold(node)).toBeNull();
  });

  it('returns null for tier 3 even at high importance (no organic path to Legendary)', () => {
    const node = makeNode({ rarityTier: 3, importance: 9999 });
    expect(checkGraduationThreshold(node)).toBeNull();
  });

  it('returns null when importance is 0', () => {
    const node = makeNode({ rarityTier: 1 });
    expect(checkGraduationThreshold(node)).toBeNull();
  });

  it('returns the lowest eligible tier even when multiple thresholds are crossed', () => {
    const node = makeNode({ rarityTier: 1, importance: 200 }); // crosses both 50 and 150
    const result = checkGraduationThreshold(node);
    expect(result).toBe(2); // lowest eligible tier, not 3
  });
});

// ─── getImportanceDelta ──────────────────────────────────────────

describe('getImportanceDelta', () => {
  const cases: Array<[ImportanceSource, number]> = [
    ['player_action',       IMPORTANCE_PLAYER_ACTION],
    ['encounter_resolved',  IMPORTANCE_ENCOUNTER],
    ['chronicle_reference', IMPORTANCE_CHRONICLE],
    ['divine_proximity',    IMPORTANCE_DIVINE_PROXIMITY],
    ['sphere_event',        IMPORTANCE_SPHERE_EVENT],
  ];

  for (const [source, expected] of cases) {
    it(`returns ${expected} for source '${source}'`, () => {
      expect(getImportanceDelta(source)).toBe(expected);
    });
  }

  it('player_action delta (10) is greater than encounter delta (3)', () => {
    expect(getImportanceDelta('player_action')).toBeGreaterThan(getImportanceDelta('encounter_resolved'));
  });

  it('sphere_event delta (8) is less than player_action delta (10)', () => {
    expect(getImportanceDelta('sphere_event')).toBeLessThan(getImportanceDelta('player_action'));
  });
});
