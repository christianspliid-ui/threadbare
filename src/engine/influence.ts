/**
 * Influence Essence economy engine.
 *
 * Manages the divine economy: essence pools, generation from graph state,
 * spending, and pool limits.
 */

import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import type { EssencePool, EssenceGeneration, SphereAlignment, InfluenceTier } from '../types/influence';
import {
  BASE_ESSENCE_PER_TICK,
  ESSENCE_PER_THREAD,
  ESSENCE_PER_PLACE_OF_POWER,
  ESSENCE_PER_SEAT,
  BASE_MAX_ESSENCE,
  MAX_ESSENCE_PER_THREAD,
  TIER_MAINTENANCE,
  TIER_PROMOTION_THRESHOLDS,
} from '../types/influence';
import type { WorldGraph } from './graph';
import type { ControlEffect } from '../types/controlEffect';
import { assignTrait } from './traits';
import { ASPECT_ESSENCE_PER_TICK } from '../data/aspect-content';

// ─── Pool Operations ─────────────────────────────────────────────────

/** Starting essence per sphere for new ascendants. */
export const INITIAL_ESSENCE_PER_SPHERE = 50;

/** Create an empty essence pool (all spheres at 0). */
export function createEmptyEssencePool(): EssencePool {
  const pool = {} as EssencePool;
  for (const sphere of SPHERE_NAMES) {
    pool[sphere] = 0;
  }
  return pool;
}

/** Create a starting essence pool (all spheres at INITIAL_ESSENCE_PER_SPHERE). */
export function createStartingEssencePool(): EssencePool {
  const pool = {} as EssencePool;
  for (const sphere of SPHERE_NAMES) {
    pool[sphere] = INITIAL_ESSENCE_PER_SPHERE;
  }
  return pool;
}

/** Check if a pool can afford a given cost in a specific sphere. */
export function canAfford(pool: EssencePool, sphere: SphereName, cost: number): boolean {
  if (cost < 0) throw new Error(`Essence cost must be non-negative: ${cost}`);
  return pool[sphere] >= cost;
}

/**
 * Spend essence from a pool. Returns true if successful, false if insufficient.
 * Mutates pool in place.
 */
export function spendEssence(pool: EssencePool, sphere: SphereName, cost: number): boolean {
  if (cost < 0) throw new Error(`Essence cost must be non-negative: ${cost}`);
  if (pool[sphere] < cost) return false;
  pool[sphere] -= cost;
  return true;
}

/**
 * Add generated essence to pool, capping each sphere at maxEssence.
 * Mutates pool in place.
 */
export function generateEssence(pool: EssencePool, generation: EssenceGeneration, maxEssence: number): void {
  for (const sphere of SPHERE_NAMES) {
    pool[sphere] = Math.min(pool[sphere] + generation[sphere], maxEssence);
  }
}

// ─── Generation Computation ──────────────────────────────────────────

/**
 * Distribute a total essence amount across spheres based on alignment.
 * Primary sphere: 35%, Secondary: 25%, remaining 6 split the rest (≈6.67% each).
 */
function distributeByAlignment(total: number, alignment: SphereAlignment): EssenceGeneration {
  const gen = createEmptyEssencePool();
  const primaryShare = total * 0.35;
  const secondaryShare = total * 0.25;
  const remainingShare = total * 0.40;
  const otherSpheres = SPHERE_NAMES.filter(
    (s) => s !== alignment.primary && s !== alignment.secondary
  );
  const perOther = remainingShare / otherSpheres.length;

  gen[alignment.primary] = primaryShare;
  gen[alignment.secondary] = secondaryShare;
  for (const s of otherSpheres) {
    gen[s] = perOther;
  }
  return gen;
}

/**
 * Compute per-tick essence generation for an Ascendant based on graph state.
 *
 * Sources:
 * 1. Base generation: 1.0 essence/tick distributed by sphere alignment
 * 2. Threaded mortals: +0.1 per thread (thread edges from ascendant)
 * 3. Places of power: +0.5 per controlled place of power
 * 4. Control effect income: sum of perTickIncome from active ControlEffects
 */
export function computeEssenceGeneration(
  graph: WorldGraph,
  ascendantId: string,
  controlEffects?: readonly ControlEffect[],
): EssenceGeneration {
  const node = graph.getNode(ascendantId);
  if (!node) throw new Error(`Ascendant node not found: ${ascendantId}`);

  const alignment = node.properties.sphereAlignment as SphereAlignment;
  if (!alignment) throw new Error(`Ascendant missing sphereAlignment: ${ascendantId}`);

  // 1. Base generation
  let totalRate = BASE_ESSENCE_PER_TICK;

  // 2. Thread bonus (one per threaded mortal)
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  totalRate += threadEdges.length * ESSENCE_PER_THREAD;

  // 3. Places of power bonus. The home seat (see step 3a below) is a named
  //    higher-yield place of power, so it is excluded here to avoid stacking —
  //    it contributes ESSENCE_PER_SEAT instead of ESSENCE_PER_PLACE_OF_POWER.
  const homeSeatLocationId = node.properties.homeSeatLocationId as string | undefined;
  const controlEdges = graph.getOutgoingEdges(ascendantId, 'controls');
  for (const edge of controlEdges) {
    if (edge.target === homeSeatLocationId) continue;
    const loc = graph.getNode(edge.target);
    if (loc && loc.properties.isPlaceOfPower) {
      totalRate += ESSENCE_PER_PLACE_OF_POWER;
    }
  }

  // 3a. Home seat (throne) bonus (THR-502). One ESSENCE_PER_SEAT term for the
  //     location identified by homeSeatLocationId. Fail-soft (§3.8): a seat
  //     pointing at a destroyed location contributes 0.
  if (homeSeatLocationId && graph.getNode(homeSeatLocationId)) {
    totalRate += ESSENCE_PER_SEAT;
  }

  // 3b. Aspect conduit bonus (THR-479) — each LIVING aspect channels a trickle.
  // Mythic echoes (dead aspects) no longer channel.
  const aspectEdges = graph.getOutgoingEdges(ascendantId, 'aspect_of');
  for (const edge of aspectEdges) {
    if (edge.properties.mythicEcho !== true) {
      totalRate += ASPECT_ESSENCE_PER_TICK;
    }
  }

  const gen = distributeByAlignment(totalRate, alignment);

  // 4. Control effect income (per-sphere, not distributed by alignment)
  if (controlEffects) {
    for (const effect of controlEffects) {
      if (!effect.active || !effect.perTickIncome) continue;
      for (const [sphere, income] of Object.entries(effect.perTickIncome)) {
        const s = sphere as SphereName;
        if (SPHERE_NAMES.includes(s)) {
          gen[s] = (gen[s] ?? 0) + (income as number);
        }
      }
    }
  }

  return gen;
}

/**
 * Compute maximum essence pool size for an Ascendant.
 * BASE_MAX_ESSENCE + MAX_ESSENCE_PER_THREAD per threaded mortal.
 */
export function computeMaxEssence(graph: WorldGraph, ascendantId: string): number {
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  return BASE_MAX_ESSENCE + threadEdges.length * MAX_ESSENCE_PER_THREAD;
}

// ─── Tier Queries ────────────────────────────────────────────────────

/** Get the current influence tier of an actor relative to an ascendant. Returns 0 if no relationship. */
export function getInfluenceTier(
  graph: WorldGraph,
  ascendantId: string,
  actorId: string
): InfluenceTier {
  const edges = graph.getIncomingEdges(actorId, 'thread');
  const threadEdge = edges.find((e) => e.source === ascendantId);
  if (!threadEdge) return 0;
  return (threadEdge.properties.tier as InfluenceTier) ?? 0;
}

// ─── Maintenance ─────────────────────────────────────────────────────

export interface MaintenanceResult {
  maintenancePaid: string[];
  maintenanceFailed: string[];
  totalEssenceSpent: number;
}

/**
 * Process maintenance for all of an ascendant's influenced actors.
 * Deducts essence from the ascendant's primary sphere for each agent.
 * Mutates graph edge properties and ascendant's essencePool.
 */
export function processInfluenceMaintenance(
  graph: WorldGraph,
  ascendantId: string,
  _currentTick: number
): MaintenanceResult {
  const ascendant = graph.getNode(ascendantId);
  if (!ascendant) throw new Error(`Ascendant not found: ${ascendantId}`);

  const pool = ascendant.properties.essencePool as EssencePool;
  const alignment = ascendant.properties.sphereAlignment as SphereAlignment;
  const primarySphere = alignment.primary;

  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  const result: MaintenanceResult = {
    maintenancePaid: [],
    maintenanceFailed: [],
    totalEssenceSpent: 0,
  };

  for (const edge of threadEdges) {
    const tier = edge.properties.tier as InfluenceTier;
    const cost = TIER_MAINTENANCE[tier];

    if (cost === 0 || canAfford(pool, primarySphere, cost)) {
      if (cost > 0) {
        spendEssence(pool, primarySphere, cost);
        result.totalEssenceSpent += cost;
      }

      graph.updateEdge(edge.id, {
        properties: {
          ...edge.properties,
          ticksAtCurrentTier: (edge.properties.ticksAtCurrentTier as number) + 1,
          totalEssenceSpent: (edge.properties.totalEssenceSpent as number) + cost,
          maintenanceCurrent: true,
        },
      });
      result.maintenancePaid.push(edge.target);
    } else {
      graph.updateEdge(edge.id, {
        properties: {
          ...edge.properties,
          maintenanceCurrent: false,
        },
      });
      result.maintenanceFailed.push(edge.target);
    }
  }

  // Write updated pool back
  graph.updateNode(ascendantId, {
    properties: { ...ascendant.properties, essencePool: pool },
  });

  return result;
}

// ─── Tier Promotion ──────────────────────────────────────────────────

/**
 * Check all influenced actors for tier promotion.
 * Promotes actors whose ticksAtCurrentTier meets the threshold for the next tier.
 * Returns list of promoted actor IDs.
 */
export function checkTierPromotion(graph: WorldGraph, ascendantId: string): string[] {
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  const promoted: string[] = [];

  for (const edge of threadEdges) {
    const tier = edge.properties.tier as InfluenceTier;
    const ticks = edge.properties.ticksAtCurrentTier as number;
    const maintenanceCurrent = edge.properties.maintenanceCurrent as boolean;

    if (tier >= 4) continue; // can't promote past 4
    if (!maintenanceCurrent) continue; // must be current on maintenance

    const nextTier = (tier + 1) as InfluenceTier;
    const threshold = TIER_PROMOTION_THRESHOLDS[nextTier];

    if (ticks >= threshold) {
      graph.updateEdge(edge.id, {
        properties: {
          ...edge.properties,
          tier: nextTier,
          ticksAtCurrentTier: 0, // reset counter
        },
      });
      promoted.push(edge.target);
    }
  }

  return promoted;
}

// ─── Drop Agent ──────────────────────────────────────────────────────

export interface DropResult {
  agentId: string;
  tierWhenDropped: InfluenceTier;
  narrativeConsequence: 'minimal' | 'crisis_of_faith' | 'wild_card' | 'catastrophic_severance';
  scarTraitAssigned: boolean;
}

const DROP_CONSEQUENCES: Record<InfluenceTier, DropResult['narrativeConsequence']> = {
  0: 'minimal',
  1: 'minimal',
  2: 'crisis_of_faith',
  3: 'wild_card',
  4: 'catastrophic_severance',
};

/**
 * Drop an agent — remove the thread edge and apply consequences.
 * Higher-tier drops produce more dramatic narrative consequences.
 */
export function dropAgent(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
  currentTick: number
): DropResult {
  const edges = graph.getOutgoingEdges(ascendantId, 'thread');
  const threadEdge = edges.find((e) => e.target === agentId);

  if (!threadEdge) {
    return { agentId, tierWhenDropped: 0, narrativeConsequence: 'minimal', scarTraitAssigned: false };
  }

  const tier = threadEdge.properties.tier as InfluenceTier;
  const consequence = DROP_CONSEQUENCES[tier];

  // Remove the relationship
  graph.removeEdge(threadEdge.id);

  // Assign scar trait for tier 2+
  let scarAssigned = false;
  if (tier >= 2) {
    const scarTraitId = 'trait.abandoned_by_divine';
    const scarNode = graph.getNode(scarTraitId);
    if (scarNode) {
      assignTrait(graph, agentId, scarTraitId, { tick: currentTick, source: ascendantId });
      scarAssigned = true;
    }
  }

  return {
    agentId,
    tierWhenDropped: tier,
    narrativeConsequence: consequence,
    scarTraitAssigned: scarAssigned,
  };
}

// ─── Home Seat (throne) ──────────────────────────────────────────────

export interface SetHomeSeatResult {
  success: boolean;
  locationId: string | null;
  locationName: string | null;
  message: string;
}

/**
 * Designate a location as the ascendant's home seat (throne) — THR-502.
 *
 * Sets `homeSeatLocationId` on the ascendant node and ensures a `controls`
 * edge (ascendant → location) exists so the seat reads as owned. The seat then
 * contributes one ESSENCE_PER_SEAT term to essence generation and renders a
 * seat signifier on the hex map.
 *
 * `locationRef` resolves against location nodes by exact id, then id prefix,
 * then case-insensitive name. When omitted, the highest-importance settlement
 * (capital → city → first location) is chosen deterministically.
 *
 * Until the scripted spine beat (#5) sets the seat in normal play, this is the
 * canonical way to establish a seat (debug bridge / CLI). It does NOT add a
 * `thread` edge to the location: thread edges are actor-targeting and rippling
 * them onto location nodes is deferred to the spine-beat work (#5).
 */
export function setHomeSeat(
  graph: WorldGraph,
  ascendantId: string,
  locationRef?: string,
): SetHomeSeatResult {
  const ascendant = graph.getNode(ascendantId);
  if (!ascendant) {
    return { success: false, locationId: null, locationName: null, message: `Ascendant not found: ${ascendantId}` };
  }

  const locations = graph.getNodesByType('location');
  if (locations.length === 0) {
    return { success: false, locationId: null, locationName: null, message: 'No location nodes exist to seat the ascendant.' };
  }

  let target;
  if (locationRef) {
    const ref = locationRef.toLowerCase();
    target =
      graph.getNode(locationRef) ??
      locations.find((l) => l.id.toLowerCase().startsWith(ref)) ??
      locations.find((l) => l.name.toLowerCase() === ref) ??
      locations.find((l) => l.name.toLowerCase().includes(ref));
    if (!target) {
      return { success: false, locationId: null, locationName: null, message: `No location matching '${locationRef}'.` };
    }
  } else {
    // Deterministic default: prefer a capital, then a city, then the first location.
    const isType = (l: typeof locations[number], t: string) =>
      l.properties.locationType === t || l.properties.locationSubtype === t;
    target =
      locations.find((l) => isType(l, 'capital')) ??
      locations.find((l) => isType(l, 'city')) ??
      locations[0];
  }

  // Set the seat property.
  graph.updateNode(ascendantId, {
    properties: { ...ascendant.properties, homeSeatLocationId: target.id },
  });

  // Ensure a controls edge exists (ascendant → seat location).
  const hasControl = graph.getOutgoingEdges(ascendantId, 'controls').some((e) => e.target === target.id);
  if (!hasControl) {
    graph.addEdge({
      id: `edge.seat.controls.${ascendantId}.${target.id}`,
      source: ascendantId,
      target: target.id,
      type: 'controls',
      properties: { homeSeat: true },
    });
  }

  return {
    success: true,
    locationId: target.id,
    locationName: target.name,
    message: `Home seat set to "${target.name}" (${target.id}); +${ESSENCE_PER_SEAT} essence/tick.`,
  };
}
