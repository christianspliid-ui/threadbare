/**
 * Trade Route — constants and helpers for the enriched trades_with edge system.
 *
 * Phase 1 adds these properties to trades_with edges (additive — existing volume stays):
 *   goodsType:    ResourceType   — primary resource being traded
 *   established:  number         — tick when the route was created
 *   lastTraded:   number         — tick of most recent trade action (freshness)
 *   controlledBy: string | null  — nodeId of faction/agent taxing this route
 *   threatened:   boolean        — true when bandits, war, etc. are active
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 * System 2 Constants
 */

// ─── Constants (System 2) ─────────────────────────────────────────────────

/** Maximum volume a single trades_with edge can reach */
export const TRADE_ROUTE_MAX_VOLUME = 10;

/** Volume lost per tick when a route has not been traded on recently */
export const TRADE_ROUTE_DECAY_RATE = 1;

/**
 * Ticks of inactivity (no Trade action) before volume decay begins.
 * A route that hasn't been refreshed in this many ticks starts losing volume.
 */
export const TRADE_ROUTE_FRESHNESS_WINDOW = 5;

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * Enriched properties for a trades_with edge.
 * All fields are optional to remain backward-compatible with pre-Phase-1 edges.
 */
export interface TradeRouteProperties {
  /** Volume scale 1–TRADE_ROUTE_MAX_VOLUME; how much flows through this route */
  volume?: number;
  /** Primary resource type being traded along this route */
  goodsType?: string;
  /** Tick when this route was established */
  established?: number;
  /** Tick of the most recent Trade action on this route */
  lastTraded?: number;
  /** NodeId of the faction/agent controlling (taxing) this route; null if uncontrolled */
  controlledBy?: string | null;
  /** Whether this route is currently threatened (bandits, war, etc.) */
  threatened?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Read trade route properties from a raw edge properties object.
 * Fail-soft: any missing field gets its canonical default.
 */
export function readTradeRouteProps(raw: Record<string, unknown>): Required<TradeRouteProperties> {
  return {
    volume: typeof raw.volume === 'number' ? raw.volume : 1,
    goodsType: typeof raw.goodsType === 'string' ? raw.goodsType : 'unknown',
    established: typeof raw.established === 'number' ? raw.established : 0,
    lastTraded: typeof raw.lastTraded === 'number' ? raw.lastTraded : 0,
    controlledBy: raw.controlledBy != null ? (raw.controlledBy as string) : null,
    threatened: typeof raw.threatened === 'boolean' ? raw.threatened : false,
  };
}

/**
 * Determine whether a trade route should start decaying.
 * Returns true when the current tick exceeds lastTraded + TRADE_ROUTE_FRESHNESS_WINDOW.
 * Fail-soft: if lastTraded is 0 (legacy or unset), treat as established tick.
 */
export function isRouteStale(lastTraded: number, currentTick: number): boolean {
  return currentTick - lastTraded > TRADE_ROUTE_FRESHNESS_WINDOW;
}
