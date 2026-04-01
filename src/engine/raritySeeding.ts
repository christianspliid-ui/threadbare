/**
 * Rarity Seeding — assign rarityTier and importance to nodes at world-gen.
 *
 * Called from gameInit.ts after monster lair seeding.
 * Uses seeded PRNG — same seed → same rarity assignments (deterministic).
 *
 * Design doc: Docs/plans/2026-04-01-unified-rarity-model-design.md § 8
 *
 * NFP #1 Tunability: all bias thresholds reference named constants from rarity-constants.ts.
 * NFP #2 Inspectability: each seeded node records rarityTier and importance = 0.
 * NFP #3 Determinism: accepts rng as a parameter — caller creates mulberry32(seed + OFFSET).
 * NFP #4 Fail-soft: missing properties → skip bias (no throw), no lair = location bias not applied.
 */

import type { GraphNode } from '../types/graph';
import type { RarityTier } from '../types/rarity';
import { clampRarityTier } from '../types/rarity';
import type { WorldGraph } from './graph';
import { seedRarityTier } from './rarity';
import {
  RARITY_DISTRIBUTION_ACTORS,
  RARITY_DISTRIBUTION_LOCATIONS,
} from '../data/rarity-constants';

// ─── Bias Thresholds ────────────────────────────────────────────────
// NFP #1: Every tunable threshold is a named constant here.

/** Location subtypes that receive a +1 rarity tier bias at seeding time. */
const BIASED_LOCATION_SUBTYPES = new Set([
  'temple',
  'ruin',
  'lair',
  'dungeon',
  'ancient_site',
]);

/** Magical saturation threshold above which a location receives +1 rarity tier bias. */
const MAGICAL_SATURATION_BIAS_THRESHOLD = 0.7;

/** Minimum sphere alignment score for entropy/time spheres to trigger actor bias. */
const SPHERE_ALIGNMENT_BIAS_THRESHOLD = 0.3;

/** Minimum number of has_trait edges for an actor to receive a trait count bias. */
const TRAIT_COUNT_BIAS_MIN = 3;

/** Minimum rarityTier on a location for co-located actor to receive a location rarity bias. */
const LOCATION_RARITY_BIAS_MIN_TIER: RarityTier = 3;

/**
 * Maximum rarity tier assignable by seeding biases alone.
 * Tier 4 (Legendary) is reserved for player-driven graduation — never awarded at spawn.
 */
const SEEDING_TIER_CAP: RarityTier = 3;

// ─── Location Seeding ───────────────────────────────────────────────

/**
 * Seed rarity on a single location node with contextual biases.
 *
 * Biases (additive, capped at SEEDING_TIER_CAP):
 *   - Biased subtypes (temple, ruin, lair, dungeon, ancient_site): +1
 *   - High magical saturation (> 0.7): +1
 *   - Historical culture present: +1
 */
function seedLocationRarity(
  graph: WorldGraph,
  node: GraphNode,
  rng: () => number,
): void {
  const prngValue = rng();
  const baseTier = seedRarityTier(RARITY_DISTRIBUTION_LOCATIONS, prngValue);

  let tierBonus = 0;

  // Subtype bias
  const locationType = node.properties['locationType'];
  if (typeof locationType === 'string' && BIASED_LOCATION_SUBTYPES.has(locationType)) {
    tierBonus += 1;
  }

  // Magical saturation bias
  const magicalSaturation = node.properties['magicalSaturation'];
  if (typeof magicalSaturation === 'number' && magicalSaturation > MAGICAL_SATURATION_BIAS_THRESHOLD) {
    tierBonus += 1;
  }

  // Historical culture bias
  const historicalCultureId = node.properties['historicalCultureId'];
  if (typeof historicalCultureId === 'string' && historicalCultureId.length > 0) {
    tierBonus += 1;
  }

  const finalTier: RarityTier = tierBonus > 0
    ? clampRarityTier(Math.min(baseTier + tierBonus, SEEDING_TIER_CAP))
    : baseTier;

  graph.updateNode(node.id, {
    properties: { rarityTier: finalTier, importance: 0 },
  });
}

// ─── Actor Seeding ──────────────────────────────────────────────────

/**
 * Seed rarity on a single individual actor node with contextual biases.
 *
 * IMPORTANT: Location rarity must be seeded before actor rarity so that
 * the location-rarity bias can read the location's rarityTier.
 *
 * Biases (additive, capped at SEEDING_TIER_CAP):
 *   - 3+ has_trait edges: +1
 *   - Entropy or time sphere alignment > 0.3: +1
 *   - Located at a Mythic+ (tier ≥ 3) location: +1
 */
function seedActorRarity(
  graph: WorldGraph,
  node: GraphNode,
  rng: () => number,
): void {
  const prngValue = rng();
  const baseTier = seedRarityTier(RARITY_DISTRIBUTION_ACTORS, prngValue);

  let tierBonus = 0;

  // Trait count bias
  const traitEdges = graph.getOutgoingEdges(node.id, 'has_trait');
  if (traitEdges.length >= TRAIT_COUNT_BIAS_MIN) {
    tierBonus += 1;
  }

  // Sphere alignment bias (entropy or time > threshold)
  const sphereAlignment = node.properties['sphereAlignment'] as Record<string, number> | undefined;
  if (sphereAlignment) {
    const entropyScore = sphereAlignment['entropy'] ?? 0;
    const timeScore = sphereAlignment['time'] ?? 0;
    if (entropyScore > SPHERE_ALIGNMENT_BIAS_THRESHOLD || timeScore > SPHERE_ALIGNMENT_BIAS_THRESHOLD) {
      tierBonus += 1;
    }
  }

  // Location rarity bias — requires locations to already be seeded
  const locatedAtEdges = graph.getOutgoingEdges(node.id, 'located_at');
  if (locatedAtEdges.length > 0) {
    const locationId = locatedAtEdges[0].target;
    const locationNode = graph.getNode(locationId);
    if (locationNode) {
      const locationRarityTier = locationNode.properties['rarityTier'];
      if (typeof locationRarityTier === 'number' && locationRarityTier >= LOCATION_RARITY_BIAS_MIN_TIER) {
        tierBonus += 1;
      }
    }
  }

  const finalTier: RarityTier = tierBonus > 0
    ? clampRarityTier(Math.min(baseTier + tierBonus, SEEDING_TIER_CAP))
    : baseTier;

  graph.updateNode(node.id, {
    properties: { rarityTier: finalTier, importance: 0 },
  });
}

// ─── Batch Seeding ──────────────────────────────────────────────────

/**
 * Seed rarityTier on all actor, location, and sublocation nodes in the graph.
 * Uses seeded PRNG. Applies contextual biases per node type.
 * Called once at world-gen after all nodes are seeded (after monster lair seeding).
 *
 * Order matters:
 *   1. Locations seeded first — actor location-rarity bias reads location tier.
 *   2. Individual actors seeded second.
 *   3. Non-individual actors (factions, cultures, groups, ascendants, gods) are skipped.
 */
export function seedAllRarityTiers(
  graph: WorldGraph,
  rng: () => number,
): void {
  // 1. Seed all location nodes (including sublocations — all are type 'location')
  const locationNodes = graph.getNodesByType('location');
  for (const node of locationNodes) {
    seedLocationRarity(graph, node, rng);
  }

  // 2. Seed individual actor nodes only
  const actorNodes = graph.getNodesByType('actor');
  for (const node of actorNodes) {
    const actorType = node.properties['actorType'];
    if (actorType !== 'individual') continue;
    seedActorRarity(graph, node, rng);
  }
}
