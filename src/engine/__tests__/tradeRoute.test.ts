import { describe, it, expect } from 'vitest';
import {
  readTradeRouteProps,
  readCargoManifest,
  buildRouteManifest,
  scoreRoutePairBalance,
  isRouteStale,
  TRADE_ROUTE_MAX_VOLUME,
  TRADE_ROUTE_DECAY_RATE,
  TRADE_ROUTE_FRESHNESS_WINDOW,
  ROUTE_FORMATION_BALANCE_BIAS,
  ROUTE_MANIFEST_MAX_GOODS,
} from '../tradeRoute';
import type { ResourceInstance } from '../../types/resource';

/** Build a location props bag with a `resources` map for manifest tests. */
function locProps(resources: Record<string, Partial<ResourceInstance>>): Record<string, unknown> {
  const bag: Record<string, ResourceInstance> = {};
  for (const [id, inst] of Object.entries(resources)) {
    bag[id] = { quantity: 50, renewable: true, renewalRate: 0.1, ...inst };
  }
  return { resources: bag };
}

// ─── Constants contract tests ─────────────────────────────────────────────

describe('tradeRoute constants', () => {
  it('TRADE_ROUTE_MAX_VOLUME is a positive integer', () => {
    expect(TRADE_ROUTE_MAX_VOLUME).toBeGreaterThan(0);
    expect(Number.isInteger(TRADE_ROUTE_MAX_VOLUME)).toBe(true);
  });

  it('TRADE_ROUTE_DECAY_RATE is positive', () => {
    expect(TRADE_ROUTE_DECAY_RATE).toBeGreaterThan(0);
  });

  it('TRADE_ROUTE_FRESHNESS_WINDOW is a positive integer', () => {
    expect(TRADE_ROUTE_FRESHNESS_WINDOW).toBeGreaterThan(0);
    expect(Number.isInteger(TRADE_ROUTE_FRESHNESS_WINDOW)).toBe(true);
  });

  it('decay rate does not exceed max volume (routes should not die instantly)', () => {
    expect(TRADE_ROUTE_DECAY_RATE).toBeLessThan(TRADE_ROUTE_MAX_VOLUME);
  });
});

// ─── readTradeRouteProps ──────────────────────────────────────────────────

describe('readTradeRouteProps', () => {
  it('reads all properties from a fully-populated edge', () => {
    const raw = {
      volume: 5,
      goodsType: 'ore',
      established: 10,
      lastTraded: 12,
      controlledBy: 'faction.guild',
      threatened: true,
    };
    const result = readTradeRouteProps(raw);
    expect(result.volume).toBe(5);
    expect(result.goodsType).toBe('ore');
    expect(result.established).toBe(10);
    expect(result.lastTraded).toBe(12);
    expect(result.controlledBy).toBe('faction.guild');
    expect(result.threatened).toBe(true);
  });

  // THR-1320. `createTradeRoute` — the sole minter of `trades_with` edges — stamps
  // the birth tick as `establishedTick`, so reading only `established` resolved to 0
  // on every route that has ever existed, and the dissolved trace's `totalTicksActive`
  // reported the absolute tick as a lifetime. Pin the spelling writers actually use.
  it('reads the birth tick from `establishedTick`, the spelling every writer stamps', () => {
    const result = readTradeRouteProps({ volume: 1, establishedTick: 42, establishedBy: 'agent.m' });
    expect(result.established).toBe(42);
    expect(result.establishedBy).toBe('agent.m');
  });

  it('still reads a legacy `established` edge, and prefers `establishedTick` when both are present', () => {
    expect(readTradeRouteProps({ established: 7 }).established).toBe(7);
    expect(readTradeRouteProps({ established: 7, establishedTick: 99 }).established).toBe(99);
  });

  it('reads establishedBy as null when the route was not founded by anyone', () => {
    expect(readTradeRouteProps({ volume: 2 }).establishedBy).toBe(null);
  });

  it('returns canonical defaults for a legacy edge with only volume', () => {
    const result = readTradeRouteProps({ volume: 3 });
    expect(result.volume).toBe(3);
    expect(result.goodsType).toBe('unknown');
    expect(result.established).toBe(0);
    expect(result.lastTraded).toBe(0);
    expect(result.controlledBy).toBe(null);
    expect(result.threatened).toBe(false);
  });

  it('returns defaults for a completely empty edge (fail-soft)', () => {
    const result = readTradeRouteProps({});
    expect(result.volume).toBe(1);
    expect(result.goodsType).toBe('unknown');
    expect(result.threatened).toBe(false);
    expect(result.controlledBy).toBe(null);
  });

  it('returns null for controlledBy when the property is null', () => {
    const result = readTradeRouteProps({ controlledBy: null });
    expect(result.controlledBy).toBe(null);
  });
});

// ─── isRouteStale ─────────────────────────────────────────────────────────

describe('isRouteStale', () => {
  it('returns false when route was traded on within freshness window', () => {
    const lastTraded = 10;
    const currentTick = 10 + TRADE_ROUTE_FRESHNESS_WINDOW; // exactly at window edge
    expect(isRouteStale(lastTraded, currentTick)).toBe(false);
  });

  it('returns true when route exceeds freshness window', () => {
    const lastTraded = 10;
    const currentTick = 10 + TRADE_ROUTE_FRESHNESS_WINDOW + 1;
    expect(isRouteStale(lastTraded, currentTick)).toBe(true);
  });

  it('returns false for a freshly traded route', () => {
    expect(isRouteStale(100, 100)).toBe(false);
  });

  it('treats lastTraded=0 (legacy) as established at tick 0', () => {
    // A route that has never been traded on should become stale quickly
    expect(isRouteStale(0, TRADE_ROUTE_FRESHNESS_WINDOW + 1)).toBe(true);
    expect(isRouteStale(0, 1)).toBe(false);
  });
});

// ─── Cargo manifest (Mortal Economy P2, THR-616) ──────────────────────────

describe('cargo manifest constants', () => {
  it('ROUTE_FORMATION_BALANCE_BIAS is a positive fraction', () => {
    expect(ROUTE_FORMATION_BALANCE_BIAS).toBeGreaterThan(0);
    expect(ROUTE_FORMATION_BALANCE_BIAS).toBeLessThanOrEqual(1);
  });
  it('ROUTE_MANIFEST_MAX_GOODS is a positive integer', () => {
    expect(ROUTE_MANIFEST_MAX_GOODS).toBeGreaterThan(0);
    expect(Number.isInteger(ROUTE_MANIFEST_MAX_GOODS)).toBe(true);
  });
});

describe('readCargoManifest', () => {
  it('reads a stored manifest verbatim', () => {
    const m = readCargoManifest({ goods: ['ore', 'grain'], totalValue: 2.1, carriesStaple: true }, 'ore');
    expect(m.goods).toEqual(['ore', 'grain']);
    expect(m.totalValue).toBe(2.1);
    expect(m.carriesStaple).toBe(true);
  });

  it('synthesizes a single-good manifest from a legacy goodsType', () => {
    const m = readCargoManifest(undefined, 'grain');
    expect(m.goods).toEqual(['grain']);
    expect(m.totalValue).toBeGreaterThan(0);
    expect(m.carriesStaple).toBe(true); // grain is a staple
  });

  it('reads empty for a route with neither manifest nor known goodsType', () => {
    const m = readCargoManifest(undefined, 'unknown');
    expect(m.goods).toEqual([]);
    expect(m.totalValue).toBe(0);
    expect(m.carriesStaple).toBe(false);
  });

  it('surfaces the manifest through readTradeRouteProps (legacy synthesis)', () => {
    const props = readTradeRouteProps({ volume: 3, goodsType: 'ore' });
    expect(props.manifest.goods).toEqual(['ore']);
    expect(props.manifest.carriesStaple).toBe(false); // ore is strategic, not staple
  });
});

describe('buildRouteManifest', () => {
  it('carries goods that are in surplus at either endpoint, ranked by value', () => {
    const source = locProps({
      gemstones: { quantity: 90, stockTier: 'surplus' }, // luxury, baseValue 1.4
      grain: { quantity: 20, stockTier: 'scarce' },
    });
    const target = locProps({
      grain: { quantity: 95, stockTier: 'surplus' }, // staple, baseValue 1.0
    });
    const m = buildRouteManifest(source, target);
    // gemstones (surplus at source) + grain (surplus at target); gemstones ranks first (higher value)
    expect(m.goods).toEqual(['gemstones', 'grain']);
    expect(m.carriesStaple).toBe(true);
    expect(m.totalValue).toBeCloseTo(1.4 + 1.0, 3);
  });

  it('returns the empty manifest when neither endpoint has resources', () => {
    const m = buildRouteManifest({}, {});
    expect(m.goods).toEqual([]);
    expect(m.totalValue).toBe(0);
    expect(m.carriesStaple).toBe(false);
  });

  it('falls back to the quantity floor when no stock tier is derived yet', () => {
    const source = locProps({ ore: { quantity: 80 } }); // no stockTier → quantity >= floor (60)
    const target = locProps({ ore: { quantity: 10 } });
    const m = buildRouteManifest(source, target);
    expect(m.goods).toEqual(['ore']);
  });

  it('caps the manifest at ROUTE_MANIFEST_MAX_GOODS, keeping the most valuable', () => {
    const many = locProps({
      arcane_crystal: { stockTier: 'surplus' }, // 1.5
      gemstones: { stockTier: 'surplus' },       // 1.4
      ore: { stockTier: 'surplus' },             // 1.1
      grain: { stockTier: 'surplus' },           // 1.0
      water: { stockTier: 'surplus' },           // 0.7
    });
    const m = buildRouteManifest(many, {}, ROUTE_MANIFEST_MAX_GOODS);
    expect(m.goods).toHaveLength(ROUTE_MANIFEST_MAX_GOODS);
    expect(m.goods).not.toContain('water'); // lowest value dropped
    expect(m.goods[0]).toBe('arcane_crystal');
  });
});

describe('scoreRoutePairBalance', () => {
  it('scores a complementary (surplus↔scarce) pair higher than a matched pair', () => {
    const surplusGrain = locProps({ grain: { stockTier: 'surplus' } });
    const scarceGrain = locProps({ grain: { stockTier: 'scarce' } });
    const complementary = scoreRoutePairBalance(surplusGrain, scarceGrain);

    const bothSurplus = scoreRoutePairBalance(surplusGrain, surplusGrain);
    expect(complementary).toBeGreaterThan(bothSurplus);
    expect(complementary).toBeGreaterThan(0);
  });

  it('treats an absent good at one endpoint as wanted', () => {
    const source = locProps({ gemstones: { stockTier: 'surplus' } });
    const target = locProps({ grain: { stockTier: 'adequate' } }); // no gemstones → wants them
    expect(scoreRoutePairBalance(source, target)).toBeGreaterThan(0);
  });

  it('returns 0 when neither endpoint has resources', () => {
    expect(scoreRoutePairBalance({}, {})).toBe(0);
  });

  it('is clamped to at most 1 for very rich complementary pairs', () => {
    const source = locProps({
      arcane_crystal: { stockTier: 'surplus' },
      star_metal: { stockTier: 'surplus' },
      ancient_relic: { stockTier: 'surplus' },
      sunken_gold: { stockTier: 'surplus' },
    });
    const target = locProps({
      arcane_crystal: { stockTier: 'scarce' },
      star_metal: { stockTier: 'scarce' },
      ancient_relic: { stockTier: 'scarce' },
      sunken_gold: { stockTier: 'scarce' },
    });
    expect(scoreRoutePairBalance(source, target)).toBeLessThanOrEqual(1);
  });
});
