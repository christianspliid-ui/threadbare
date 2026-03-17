import { describe, it, expect } from 'vitest';
import {
  readTradeRouteProps,
  isRouteStale,
  TRADE_ROUTE_MAX_VOLUME,
  TRADE_ROUTE_DECAY_RATE,
  TRADE_ROUTE_FRESHNESS_WINDOW,
} from '../tradeRoute';

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
