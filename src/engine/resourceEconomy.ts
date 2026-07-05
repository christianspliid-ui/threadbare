/**
 * Resource economy — pure derivation of stock tiers and the location resource
 * balance (THR-615).
 *
 * Resources live as a `Record<string, ResourceInstance>` on location node
 * properties (see `resourceSeeding.ts`). This module reads that shape and derives
 * a coarse `scarce | adequate | surplus` tier per resource, plus a single
 * location-level balance scalar that the prosperity equilibrium model reads.
 *
 * Everything here is a pure function of node properties — no PRNG, no graph
 * mutation, no traces. The phase (`phases/resourceStockTiers.ts`) owns side
 * effects. Same inputs → same outputs (NFP #3).
 */

import type { ResourceInstance, StockTier } from '../types/resource';
import {
  getResourceClass,
  STOCK_SCARCE_THRESHOLD,
  STOCK_SURPLUS_THRESHOLD,
  DEMAND_BASE,
  DEMAND_PROSPERITY_WEIGHT,
  DEMAND_SUBLOCATION_WEIGHT,
  DEMAND_SUBLOCATION_CAP,
} from '../data/resource-classes';

/** Clamp helper. */
function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Read a location's `resources` bag from its property record.
 * Fail-soft: returns an empty object when absent or malformed.
 */
export function readResources(
  props: Record<string, unknown>,
): Record<string, ResourceInstance> {
  const r = props.resources;
  if (!r || typeof r !== 'object') return {};
  return r as Record<string, ResourceInstance>;
}

/**
 * Local demand pressure a location exerts on its resources (0..1).
 *
 * Population is not tracked directly; prosperity and sublocation density are the
 * proxies. A dense, prosperous city demands far more of its staples than a sparse
 * wilderness deposit — so the same grain quantity reads as scarce in the city and
 * surplus in the wild.
 */
export function computeLocationDemand(
  props: Record<string, unknown>,
  sublocationCount: number,
): number {
  const prosperity = typeof props.prosperity === 'number' ? props.prosperity : 0;
  const prosperityTerm = clamp(prosperity / 100, 0, 1) * DEMAND_PROSPERITY_WEIGHT;
  const subTerm =
    clamp(sublocationCount / DEMAND_SUBLOCATION_CAP, 0, 1) * DEMAND_SUBLOCATION_WEIGHT;
  return clamp(DEMAND_BASE + prosperityTerm + subTerm, 0, 1);
}

/**
 * Per-resource normalized balance = supply − consumption, clamped to [-1, 1].
 * Consumption scales local demand by the resource's scarcity sensitivity.
 */
export function computeResourceBalance(
  instance: ResourceInstance,
  demand: number,
  resourceId: string,
): number {
  const supply = clamp((instance.quantity ?? 0) / 100, 0, 1);
  const consumption = demand * getResourceClass(resourceId).scarcitySensitivity;
  return clamp(supply - consumption, -1, 1);
}

/** Map a normalized balance to a coarse tier. */
export function tierFromBalance(balance: number): StockTier {
  if (balance <= STOCK_SCARCE_THRESHOLD) return 'scarce';
  if (balance >= STOCK_SURPLUS_THRESHOLD) return 'surplus';
  return 'adequate';
}

/** Result of deriving all tiers at a location. */
export interface LocationStockDerivation {
  /** Per-resource derived tier + balance, keyed by resource id. */
  perResource: Record<string, { tier: StockTier; balance: number }>;
  /**
   * Aggregate location balance ∈ [-1, 1], weighted by resource base value.
   * Feeds the prosperity equilibrium term. 0 when the location has no resources.
   */
  aggregateBalance: number;
}

/**
 * Derive stock tiers for every resource at a location plus the aggregate balance.
 * Pure — does not mutate `props`.
 */
export function deriveLocationStockTiers(
  props: Record<string, unknown>,
  sublocationCount: number,
): LocationStockDerivation {
  const resources = readResources(props);
  const demand = computeLocationDemand(props, sublocationCount);

  const perResource: Record<string, { tier: StockTier; balance: number }> = {};
  let weightedSum = 0;
  let weightTotal = 0;

  for (const [resourceId, instance] of Object.entries(resources)) {
    if (!instance || typeof instance.quantity !== 'number') continue;
    const balance = computeResourceBalance(instance, demand, resourceId);
    perResource[resourceId] = { tier: tierFromBalance(balance), balance };

    const value = getResourceClass(resourceId).baseValue;
    weightedSum += balance * value;
    weightTotal += value;
  }

  const aggregateBalance = weightTotal > 0 ? clamp(weightedSum / weightTotal, -1, 1) : 0;
  return { perResource, aggregateBalance };
}

/**
 * Read the pre-derived aggregate resource balance stored on a location by the
 * stock-tier phase. Fail-soft: 0 when absent (e.g. before the first derivation,
 * or on a resourceless location).
 */
export function readLocationResourceBalance(props: Record<string, unknown>): number {
  const b = props.resourceBalance;
  return typeof b === 'number' ? clamp(b, -1, 1) : 0;
}
