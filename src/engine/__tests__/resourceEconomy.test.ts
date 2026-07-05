/**
 * Unit tests for the mortal economy derivation (THR-615).
 *
 * Pure functions → deterministic assertions, no graph/PRNG needed.
 */

import { describe, it, expect } from 'vitest';
import {
  computeLocationDemand,
  computeResourceBalance,
  tierFromBalance,
  deriveLocationStockTiers,
  readLocationResourceBalance,
} from '../resourceEconomy';
import {
  RESOURCE_CLASSES,
  getResourceClass,
  STOCK_SCARCE_THRESHOLD,
  STOCK_SURPLUS_THRESHOLD,
} from '../../data/resource-classes';
import { RESOURCE_DEFINITIONS } from '../../data/resource-content';
import type { ResourceInstance } from '../../types/resource';

function res(quantity: number): ResourceInstance {
  return { quantity, renewable: true, renewalRate: 0.5 };
}

describe('tierFromBalance', () => {
  it('maps balances to tiers at the named thresholds', () => {
    expect(tierFromBalance(STOCK_SCARCE_THRESHOLD - 0.01)).toBe('scarce');
    expect(tierFromBalance(STOCK_SCARCE_THRESHOLD)).toBe('scarce');
    expect(tierFromBalance(0)).toBe('adequate');
    expect(tierFromBalance(STOCK_SURPLUS_THRESHOLD)).toBe('surplus');
    expect(tierFromBalance(STOCK_SURPLUS_THRESHOLD + 0.01)).toBe('surplus');
  });
});

describe('computeLocationDemand', () => {
  it('is higher for prosperous, dense locations than sparse ones', () => {
    const sparse = computeLocationDemand({ prosperity: 0 }, 0);
    const dense = computeLocationDemand({ prosperity: 90 }, 6);
    expect(dense).toBeGreaterThan(sparse);
    // Bounded to [0,1]
    expect(sparse).toBeGreaterThanOrEqual(0);
    expect(dense).toBeLessThanOrEqual(1);
  });

  it('is deterministic', () => {
    const a = computeLocationDemand({ prosperity: 55 }, 3);
    const b = computeLocationDemand({ prosperity: 55 }, 3);
    expect(a).toBe(b);
  });
});

describe('computeResourceBalance', () => {
  it('a full staple in a low-demand location is a surplus', () => {
    const demand = computeLocationDemand({ prosperity: 0 }, 0);
    const balance = computeResourceBalance(res(90), demand, 'grain');
    expect(balance).toBeGreaterThan(STOCK_SURPLUS_THRESHOLD);
  });

  it('a thin staple in a dense city is scarce', () => {
    const demand = computeLocationDemand({ prosperity: 95 }, 6);
    const balance = computeResourceBalance(res(20), demand, 'grain');
    expect(balance).toBeLessThanOrEqual(STOCK_SCARCE_THRESHOLD);
  });
});

describe('deriveLocationStockTiers', () => {
  it('produces a tier per resource and a weighted aggregate balance', () => {
    const props = {
      prosperity: 50,
      resources: { grain: res(70), ore: res(30) },
    };
    const { perResource, aggregateBalance } = deriveLocationStockTiers(props, 2);
    expect(perResource.grain).toBeDefined();
    expect(perResource.ore).toBeDefined();
    expect(['scarce', 'adequate', 'surplus']).toContain(perResource.grain.tier);
    expect(aggregateBalance).toBeGreaterThanOrEqual(-1);
    expect(aggregateBalance).toBeLessThanOrEqual(1);
  });

  it('is deterministic and pure (does not mutate props)', () => {
    const props = { prosperity: 40, resources: { grain: res(60) } };
    const before = JSON.stringify(props);
    const a = deriveLocationStockTiers(props, 1);
    const b = deriveLocationStockTiers(props, 1);
    expect(a).toEqual(b);
    expect(JSON.stringify(props)).toBe(before);
  });

  it('returns zero balance for a resourceless location', () => {
    const { perResource, aggregateBalance } = deriveLocationStockTiers({ prosperity: 50 }, 0);
    expect(Object.keys(perResource)).toHaveLength(0);
    expect(aggregateBalance).toBe(0);
  });
});

describe('readLocationResourceBalance', () => {
  it('reads a stored balance, clamped, and fail-softs to 0', () => {
    expect(readLocationResourceBalance({ resourceBalance: 0.4 })).toBe(0.4);
    expect(readLocationResourceBalance({ resourceBalance: 5 })).toBe(1);
    expect(readLocationResourceBalance({})).toBe(0);
  });
});

describe('RESOURCE_CLASSES consistency', () => {
  it('every class id has a matching resource definition', () => {
    for (const id of Object.keys(RESOURCE_CLASSES)) {
      expect(RESOURCE_DEFINITIONS[id], `class ${id} missing definition`).toBeDefined();
    }
  });

  it('primarySphere matches the resource definition primary affinity', () => {
    for (const [id, cls] of Object.entries(RESOURCE_CLASSES)) {
      const def = RESOURCE_DEFINITIONS[id];
      expect(def.sphereAffinities[0], `class ${id} primarySphere drift`).toBe(cls.primarySphere);
    }
  });

  it('getResourceClass fail-softs for unknown ids', () => {
    const c = getResourceClass('not_a_resource');
    expect(c.category).toBe('strategic');
    expect(c.baseValue).toBeGreaterThan(0);
  });
});
