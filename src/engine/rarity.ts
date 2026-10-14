/**
 * Rarity Engine Utilities
 *
 * Pure functions for rarity tier operations: seeding, graduating, and
 * accumulating importance on graph nodes.
 *
 * All mutations are in-place on node.properties, consistent with the
 * WorldGraph mutation model. Callers are responsible for calling
 * touchWorld() / touchStructure() after mutations that affect UI or
 * structural caches.
 */

import type { GraphNode } from '../types/graph';
import type { RarityTier } from '../types/rarity';
import { clampRarityTier } from '../types/rarity';
import {
  RARITY_GRADUATION_THRESHOLDS,
  RARITY_GRADUATION_IMPORTANCE_RATE,
  IMPORTANCE_PLAYER_ACTION,
  IMPORTANCE_ENCOUNTER,
  IMPORTANCE_CHRONICLE,
  IMPORTANCE_DIVINE_PROXIMITY,
  IMPORTANCE_SPHERE_EVENT,
} from '../data/rarity-constants';

// ─── Node Property Access ────────────────────────────────────────

/** Get the rarity tier from a graph node's properties. Defaults to 1 (Mundane). */
export function getRarityTier(node: GraphNode): RarityTier {
  const raw = node.properties['rarityTier'];
  if (typeof raw !== 'number') return 1;
  return clampRarityTier(raw);
}

// ─── Seeding ────────────────────────────────────────────────────

/**
 * Seed a rarity tier from a weighted distribution using a pre-drawn seeded random value.
 *
 * The prngValue parameter is a single float (0..1) already drawn from the seeded PRNG —
 * this is a pure function with no randomness of its own.
 *
 * Uses weighted selection: iterate tiers 1..4, accumulate weights,
 * return the first tier whose cumulative weight exceeds prngValue.
 *
 * The roll is scaled by the distribution's own total, so each tier's chance is its
 * share of the distribution. A distribution that does not sum to 1 therefore keeps
 * its proportions — it never hands its missing weight to Legendary, which is what
 * the old "exceeded the sum → tier 4" fallback did (Game Design Law 3: the rarest
 * tier is never fed by leftover weight). `rarity-constants.ts` still warns at load
 * when a distribution's sum drifts from 1.
 */
export function seedRarityTier(
  distribution: Record<RarityTier, number>,
  prngValue: number,
): RarityTier {
  let total = 0;
  let lastPositive: RarityTier = 1;
  for (let tier = 1; tier <= 4; tier++) {
    const w = Math.max(0, distribution[tier as RarityTier] ?? 0);
    total += w;
    if (w > 0) lastPositive = tier as RarityTier;
  }
  // Fail-soft (NFP #4): an all-zero distribution seeds the common tier.
  if (total <= 0) return 1;

  const target = prngValue * total;
  let cumulative = 0;
  for (let tier = 1; tier <= 4; tier++) {
    cumulative += Math.max(0, distribution[tier as RarityTier] ?? 0);
    if (target < cumulative) {
      return tier as RarityTier;
    }
  }
  // Float edge: prngValue at the very top of [0, 1) lands in the last tier with weight.
  return lastPositive;
}

// ─── Graduation ─────────────────────────────────────────────────

/**
 * Graduate a node's rarity tier to at least minTier.
 * Never demotes. Mutates node.properties in place.
 * Returns true if graduation happened (tier changed), false otherwise.
 */
export function graduateRarity(
  node: GraphNode,
  minTier: RarityTier,
): boolean {
  const current = getRarityTier(node);
  if (minTier <= current) return false;
  node.properties['rarityTier'] = minTier;
  return true;
}

// ─── Importance Accumulation ─────────────────────────────────────

/**
 * Accumulate importance on a node.
 * Applies the RARITY_GRADUATION_IMPORTANCE_RATE multiplier for the node's current tier.
 * Mutates node.properties in place.
 * Returns the new importance total.
 */
export function accumulateImportance(
  node: GraphNode,
  delta: number,
): number {
  const currentTier = getRarityTier(node);
  const rate = RARITY_GRADUATION_IMPORTANCE_RATE[currentTier];
  const current = typeof node.properties['importance'] === 'number'
    ? (node.properties['importance'] as number)
    : 0;
  const next = current + delta * rate;
  node.properties['importance'] = next;
  return next;
}

/**
 * Check if a node's importance has crossed a graduation threshold.
 * Returns the tier to graduate to, or null if no graduation is needed.
 * Does not mutate — call graduateRarity separately if graduation should occur.
 *
 * Returns the *lowest* new tier the node is eligible to graduate to, or null.
 * If importance crosses multiple thresholds simultaneously (a multi-tier jump),
 * only the lowest eligible tier is returned per call. To handle multi-tier jumps,
 * loop: call checkGraduationThreshold → graduateRarity → repeat until null.
 * In practice, single-tick importance deltas are small enough that multi-tier
 * jumps are extremely rare — most callers need not loop.
 */
export function checkGraduationThreshold(
  node: GraphNode,
): RarityTier | null {
  const currentTier = getRarityTier(node);
  if (currentTier >= 4) return null;

  const importance = typeof node.properties['importance'] === 'number'
    ? (node.properties['importance'] as number)
    : 0;

  // Walk from current+1 up to 4, checking for crossed thresholds
  for (let tier = currentTier + 1; tier <= 4; tier++) {
    const threshold = RARITY_GRADUATION_THRESHOLDS[tier as 2 | 3 | 4];
    if (threshold === null) continue;
    if (importance >= threshold) {
      return tier as RarityTier;
    }
  }

  return null;
}

// ─── Importance Source Types ─────────────────────────────────────

/** Standard importance sources as a type for tracing */
export type ImportanceSource =
  | 'player_action'
  | 'encounter_resolved'
  | 'chronicle_reference'
  | 'divine_proximity'
  | 'sphere_event';

/** Get the base importance delta for a given source. */
export function getImportanceDelta(source: ImportanceSource): number {
  switch (source) {
    case 'player_action':       return IMPORTANCE_PLAYER_ACTION;
    case 'encounter_resolved':  return IMPORTANCE_ENCOUNTER;
    case 'chronicle_reference': return IMPORTANCE_CHRONICLE;
    case 'divine_proximity':    return IMPORTANCE_DIVINE_PROXIMITY;
    case 'sphere_event':        return IMPORTANCE_SPHERE_EVENT;
  }
}
