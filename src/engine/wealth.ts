/**
 * Wealth — constants, tier labels, and delta helpers for the Gold Reach economic system.
 *
 * Wealth is a 0–100 property on actor nodes (individuals and factions).
 * It is the Gold Reach's equivalent of reputation: a score of accumulated
 * economic power — assets, influence, debts owed, trade position.
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 * System 4 Constants
 */

// ─── Constants (System 4) ─────────────────────────────────────────────────

/** Minimum wealth gain on a successful trade action (scaled by route volume) */
export const WEALTH_TRADE_SUCCESS_MIN = 2;

/** Maximum wealth gain on a successful trade action (scaled by route volume) */
export const WEALTH_TRADE_SUCCESS_MAX = 5;

/** Passive wealth per controlled trade route per tick */
export const WEALTH_ROUTE_CONTROL_INCOME = 1;

/** Passive wealth per productive sublocation (warehouse/counting house) per tick */
export const WEALTH_SUBLOCATION_INCOME = 1;

/** Passive wealth when home settlement prosperity ≥ PROSPERITY_TIER_PROSPEROUS per tick */
export const WEALTH_PROSPEROUS_HOME_INCOME = 1;

/** Minimum wealth loss on a failed trade action */
export const WEALTH_TRADE_FAILURE_MIN = 1;

/** Maximum wealth loss on a failed trade action */
export const WEALTH_TRADE_FAILURE_MAX = 3;

/** Wealth loss per disrupted route */
export const WEALTH_ROUTE_DISRUPTED_PENALTY = 2;

/** Minimum wealth loss when an agreement is broken against you */
export const WEALTH_AGREEMENT_BROKEN_MIN = 3;

/** Maximum wealth loss when an agreement is broken against you */
export const WEALTH_AGREEMENT_BROKEN_MAX = 5;

/** Cost (wealth) to hire mercenaries */
export const WEALTH_MERCENARY_COST = 10;

/** Cost (wealth) to commission an assassination */
export const WEALTH_ASSASSINATION_COST = 15;

/** Cost (wealth) to buy influence with a faction or agent */
export const WEALTH_INFLUENCE_COST = 8;

/** Cost (wealth) to fund construction of a sublocation */
export const WEALTH_CONSTRUCTION_COST = 12;

/** Cost (wealth) to establish a monopoly over a resource type */
export const WEALTH_MONOPOLY_COST = 25;

/** Wealth threshold for "Magnate" tier */
export const WEALTH_TIER_MAGNATE = 80;

/** Wealth threshold for "Wealthy" tier */
export const WEALTH_TIER_WEALTHY = 60;

/** Wealth threshold for "Comfortable" tier */
export const WEALTH_TIER_COMFORTABLE = 40;

/** Wealth threshold for "Getting by" tier */
export const WEALTH_TIER_GETTING_BY = 20;

// ─── Types ────────────────────────────────────────────────────────────────

/** Wealth tier label — used for prose hooks and player-facing descriptions */
export type WealthTier = 'Magnate' | 'Wealthy' | 'Comfortable' | 'Getting by' | 'Destitute';

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Map a numeric wealth value (0–100) to its tier label.
 * Exported for use in prose resolvers and agent detail panels.
 */
export function getWealthTier(wealth: number): WealthTier {
  if (wealth >= WEALTH_TIER_MAGNATE) return 'Magnate';
  if (wealth >= WEALTH_TIER_WEALTHY) return 'Wealthy';
  if (wealth >= WEALTH_TIER_COMFORTABLE) return 'Comfortable';
  if (wealth >= WEALTH_TIER_GETTING_BY) return 'Getting by';
  return 'Destitute';
}

/**
 * Apply a wealth delta to an actor's current wealth.
 * Clamps to 0–100. Fail-soft: negative clamps to 0 ("spent your last coin"),
 * not an error.
 *
 * @returns new wealth value (clamped)
 */
export function applyWealthDelta(currentWealth: number, delta: number): number {
  return Math.max(0, Math.min(100, currentWealth + delta));
}

/**
 * Read an actor's current wealth from its properties.
 * Fail-soft: returns 0 if the property is missing or not a number.
 */
export function readWealth(properties: Record<string, unknown>): number {
  const w = properties.wealth;
  return typeof w === 'number' ? w : 0;
}
