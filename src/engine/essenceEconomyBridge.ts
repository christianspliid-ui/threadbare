/**
 * The essence bridge — mortal economy → divine economy (THR-618, Mortal Economy P4).
 *
 * The last coupling the mortal-economy plan promised and the divine-economy plan
 * left open: a typed essence source is **sustained by the land it stands on**.
 * The resource web (THR-615) already derives a coarse `scarce | adequate | surplus`
 * stock tier per resource per location; a source typed to a sphere reads the tiers
 * of the goods that share that sphere — a Spirit shrine lives off the pearls of its
 * valley, a Matter ley-nexus off its ore and stone. Surplus nurtures sanctity,
 * scarcity withers it.
 *
 * Deliberately a **drift on the existing private scalar**, not a second income
 * channel: everything downstream (tier derivation, typed per-sphere income, the
 * portfolio read) is untouched, so this is additive in the strict sense (NFP #6).
 * The whole coupling is one signed number per source per tick.
 *
 * Two rules give the bridge its shape, and both are asymmetric on purpose:
 *   - the land can nurture a source only up to `ECON_SANCTITY_NURTURE_CEILING`,
 *     which sits **below** the flowering threshold — a rich valley readies a source,
 *     but only the god's hand (Build / Sanctify) makes it flower;
 *   - withering has no floor above zero — a starving land can drain a source all
 *     the way down. The world takes away more than it gives, which is what keeps
 *     Build and Defend worth casting.
 *
 * Pure over graph state — no mutation, no PRNG, no traces (NFP #3). The caller
 * (`recomputeControlledSourceTiers`) owns the write and the aggregate trace.
 */

import type { SphereName } from '../types';
import type { EssenceSource } from '../types/essenceSource';
import type { ResourceInstance, StockTier } from '../types/resource';
import type { WorldGraph } from './graph';
import { readResources } from './resourceEconomy';
import { getResourceClass } from '../data/resource-classes';
import {
  ECON_SANCTITY_DRIFT_PER_TICK,
  ECON_SANCTITY_NURTURE_CEILING,
  ECON_STOCK_TIER_SCORE,
  type SustenancePolarity,
} from '../data/essence-sources';

/** Why a source drew no sustenance this tick (fail-soft, all neutral outcomes). */
export type SustenanceBlockReason =
  /** Source has no `sphereAffinity` — legacy / migrated-but-unbuilt. Income-neutral. */
  | 'untyped'
  /** Host node resolves to no economic location (e.g. a carried relic). */
  | 'no-host'
  /** The host location grows nothing sharing the source's sphere. */
  | 'no-matching-goods'
  /** Sanctity already at or above the nurture ceiling; the land can add no more. */
  | 'ceiling';

export interface SanctitySustenance {
  /** Signed sanctity delta to apply this tick. Zero whenever `reason` is set. */
  drift: number;
  /** Weighted stock-tier score across sphere-matched goods, in [-1, 1]. */
  affinityScore: number;
  /** Coarse read of `affinityScore` — the polarity the prose renders. */
  polarity: SustenancePolarity;
  /** The location whose stocks were read, when one resolved. */
  economicHostId?: string;
  /** Resource ids that shared the source's sphere and were counted. */
  matchedResourceIds: string[];
  /** Set when drift is zero for a structural reason rather than a neutral larder. */
  reason?: SustenanceBlockReason;
}

/** A neutral result — no drift, nothing to say. */
function inert(reason: SustenanceBlockReason, economicHostId?: string): SanctitySustenance {
  return {
    drift: 0,
    affinityScore: 0,
    polarity: 'steady',
    economicHostId,
    matchedResourceIds: [],
    reason,
  };
}

/**
 * Coarse read of a signed affinity score. The neutral band is exact zero: a larder
 * of nothing but `adequate` goods scores 0 and reads as steady, while any single
 * scarce or surplus good tips the sentence.
 */
export function sustenancePolarity(affinityScore: number): SustenancePolarity {
  if (!Number.isFinite(affinityScore) || affinityScore === 0) return 'steady';
  return affinityScore > 0 ? 'nurturing' : 'withering';
}

/**
 * Resolve a source host to the location whose resource stocks feed it.
 *
 * Locations answer for themselves; sublocations resolve up one `parentLocationId`
 * hop (the three-tier position model — stocks live at the location tier). Any host
 * that resolves to no location with a resources bag draws no sustenance.
 */
export function resolveEconomicHost(
  graph: WorldGraph,
  hostId: string,
): { locationId: string; resources: Record<string, ResourceInstance> } | undefined {
  const host = graph.getNode(hostId);
  if (!host) return undefined;

  const own = readResources(host.properties);
  if (Object.keys(own).length > 0) return { locationId: host.id, resources: own };

  const parentId = host.properties.parentLocationId as string | undefined;
  if (!parentId) return undefined;
  const parent = graph.getNode(parentId);
  if (!parent) return undefined;

  const parentResources = readResources(parent.properties);
  if (Object.keys(parentResources).length === 0) return undefined;
  return { locationId: parent.id, resources: parentResources };
}

/**
 * Weighted stock-tier score across the goods at a location that share `sphere`.
 *
 * Each matching resource contributes `ECON_STOCK_TIER_SCORE[tier]` weighted by its
 * class `baseValue`, so a scarce staple speaks louder than a scarce curiosity. A
 * resource whose tier has not been derived yet is read as `adequate` — the same
 * absent-means-adequate convention the Livelihood line uses.
 */
export function scoreSphereAffinity(
  resources: Record<string, ResourceInstance>,
  sphere: SphereName,
): { affinityScore: number; matchedResourceIds: string[] } {
  let weightedSum = 0;
  let weightTotal = 0;
  const matchedResourceIds: string[] = [];

  for (const [resourceId, instance] of Object.entries(resources)) {
    if (!instance || typeof instance.quantity !== 'number') continue;
    const cls = getResourceClass(resourceId);
    if (cls.primarySphere !== sphere) continue;

    const tier: StockTier = instance.stockTier ?? 'adequate';
    weightedSum += (ECON_STOCK_TIER_SCORE[tier] ?? 0) * cls.baseValue;
    weightTotal += cls.baseValue;
    matchedResourceIds.push(resourceId);
  }

  if (weightTotal <= 0) return { affinityScore: 0, matchedResourceIds };
  const raw = weightedSum / weightTotal;
  const affinityScore = raw < -1 ? -1 : raw > 1 ? 1 : raw;
  return { affinityScore, matchedResourceIds };
}

/**
 * Compute this tick's sanctity sustenance for one source.
 *
 * Returns a zero-drift result (with a `reason`) for every structural miss, so the
 * caller never needs to branch on shape — it just adds `drift`. Untyped sources are
 * excluded by design: they are still on the legacy alignment-distributed income
 * path, and moving their sanctity would change income for a save that has done
 * nothing (NFP #6).
 */
export function computeSanctitySustenance(
  graph: WorldGraph,
  hostId: string,
  src: EssenceSource,
): SanctitySustenance {
  const sphere = src.sphereAffinity;
  if (!sphere) return inert('untyped');

  const host = resolveEconomicHost(graph, hostId);
  if (!host) return inert('no-host');

  const { affinityScore, matchedResourceIds } = scoreSphereAffinity(host.resources, sphere);
  if (matchedResourceIds.length === 0) return inert('no-matching-goods', host.locationId);

  const polarity = sustenancePolarity(affinityScore);

  // The land readies a source but never flowers it: positive drift stops at the
  // ceiling, negative drift always applies.
  const sanctity = Number.isFinite(src.sanctity) ? src.sanctity : 0;
  if (affinityScore > 0 && sanctity >= ECON_SANCTITY_NURTURE_CEILING) {
    return {
      drift: 0,
      affinityScore,
      polarity,
      economicHostId: host.locationId,
      matchedResourceIds,
      reason: 'ceiling',
    };
  }

  let drift = affinityScore * ECON_SANCTITY_DRIFT_PER_TICK;
  // Never let a single nurturing tick vault the ceiling it is bounded by.
  if (drift > 0) drift = Math.min(drift, ECON_SANCTITY_NURTURE_CEILING - sanctity);

  return {
    drift,
    affinityScore,
    polarity,
    economicHostId: host.locationId,
    matchedResourceIds,
  };
}
