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
 */
export function seedRarityTier(
  distribution: Record<RarityTier, number>,
  prngValue: number,
): RarityTier {
  let cumulative = 0;
  for (let tier = 1; tier <= 4; tier++) {
    cumulative += distribution[tier as RarityTier];
    if (prngValue < cumulative) {
      return tier as RarityTier;
    }
  }
  // Fallback for floating point edge cases (prngValue very close to 1.0)
  return 4;
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
