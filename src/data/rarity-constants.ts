/**
 * Rarity System — Tunable Constants
 *
 * All magic numbers for the Unified Rarity Model live here.
 * Changing game feel = changing a number here, not rewriting logic.
 *
 * | Name                                  | Default                      | Purpose                                               |
 * |---------------------------------------|------------------------------|-------------------------------------------------------|
 * | MAX_RARITY_TIER                       | 4                            | Hard cap — Legendary                                  |
 * | RARITY_DISTRIBUTION_ACTORS            | {1:0.70,2:0.22,3:0.07,4:0.01}| Spawn weights for actor rarity                       |
 * | RARITY_DISTRIBUTION_LOCATIONS         | {1:0.60,2:0.28,3:0.10,4:0.02}| Spawn weights for location rarity                    |
 * | RARITY_DISTRIBUTION_SUBLOCATIONS      | {1:0.65,2:0.25,3:0.08,4:0.02}| Spawn weights for sublocation rarity                 |
 * | RARITY_ENCOUNTER_SCORE_MULTIPLIER     | {1:1.0,2:1.3,3:1.7,4:2.5}   | Encounter scoring multiplier by tier                  |
 * | RARITY_GRADUATION_THRESHOLDS          | {2:50,3:150,4:null}          | Importance score required to graduate to each tier    |
 * | RARITY_GRADUATION_IMPORTANCE_RATE     | {1:1.0,2:1.5,3:2.0,4:0}     | Importance accumulation rate multiplier per tier      |
 * | RARITY_NOTIFICATION_THRESHOLD         | 3                            | Minimum tier triggering discovery toast               |
 * | RARITY_LEGENDARY_PULSE_ANIMATION      | 'pulse-gold'                 | CSS animation class for Legendary entities            |
 * | RARITY_PLAYER_UPGRADE_COST            | {1:4,2:8,3:14}               | Player-initiated upgrade essence cost                 |
 * | RARITY_PLAYER_UPGRADE_DIFFICULTY      | {1:0.20,2:0.35,3:0.50}       | Player-initiated upgrade step difficulty              |
 * | IMPORTANCE_PLAYER_ACTION              | 10                           | Importance delta for player actions                   |
 * | IMPORTANCE_ENCOUNTER                  | 3                            | Importance delta for resolved encounters              |
 * | IMPORTANCE_CHRONICLE                  | 5                            | Importance delta for chronicle references             |
 * | IMPORTANCE_DIVINE_PROXIMITY           | 1                            | Importance delta per tick of divine proximity         |
 * | IMPORTANCE_SPHERE_EVENT               | 8                            | Importance delta for sphere-triggered events          |
 */

import type { RarityTier } from '../types/rarity';
import type { NarrativeTier } from '../types/narrative';

// ─── Tier Cap ────────────────────────────────────────────────────

/** Maximum rarity tier. Legendary (4) is the hard cap. */
export const MAX_RARITY_TIER: RarityTier = 4;

// ─── Distribution Curves ─────────────────────────────────────────
// Weights must sum to 1.0 — validated at module load below.

/** Weighted spawn distribution for actor rarity. Mundane-heavy.
 * @range each weight 0.0–1.0; all must sum to 1.0 */
export const RARITY_DISTRIBUTION_ACTORS: Record<RarityTier, number> = {
  1: 0.70,
  2: 0.22,
  3: 0.07,
  4: 0.01,
};

/** Weighted spawn distribution for location rarity. Slightly more variety than actors.
 * @range each weight 0.0–1.0; all must sum to 1.0 */
export const RARITY_DISTRIBUTION_LOCATIONS: Record<RarityTier, number> = {
  1: 0.60,
  2: 0.28,
  3: 0.10,
  4: 0.02,
};

/** Weighted spawn distribution for sublocation rarity.
 * @range each weight 0.0–1.0; all must sum to 1.0 */
export const RARITY_DISTRIBUTION_SUBLOCATIONS: Record<RarityTier, number> = {
  1: 0.65,
  2: 0.25,
  3: 0.08,
  4: 0.02,
};

// ─── Encounter Scoring ───────────────────────────────────────────

/** Encounter score multiplier by rarity tier. Higher tiers are more narratively significant.
 * @range 1.0–5.0 per tier */
export const RARITY_ENCOUNTER_SCORE_MULTIPLIER: Record<RarityTier, number> = {
  1: 1.0,
  2: 1.3,
  3: 1.7,
  4: 2.5,
};

// ─── Organic Graduation ──────────────────────────────────────────

/** Importance score threshold required to organically graduate to each tier.
 * null = no organic path to that tier (Legendary requires player action). */
export const RARITY_GRADUATION_THRESHOLDS: Record<2 | 3 | 4, number | null> = {
  2: 50,
  3: 150,
  4: null,
};

/** Importance accumulation rate multiplier per tier.
 * Higher-tier entities accumulate importance faster (they're already significant).
 * Tier 4 (Legendary) accumulates 0 — already at cap.
 * @range 0.0–5.0 per tier */
export const RARITY_GRADUATION_IMPORTANCE_RATE: Record<RarityTier, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.0,
  4: 0,
};

// ─── Player Notifications ────────────────────────────────────────

/** Minimum tier that triggers a discovery notification toast to the player. */
export const RARITY_NOTIFICATION_THRESHOLD: RarityTier = 3;

/** CSS animation class applied to Legendary-tier entity UI elements. */
export const RARITY_LEGENDARY_PULSE_ANIMATION = 'pulse-gold';

// ─── Player-Initiated Upgrades ───────────────────────────────────

/** Essence cost to upgrade from each tier (mirrors attachment advancement pattern).
 * @range 1–20 per tier */
export const RARITY_PLAYER_UPGRADE_COST: Record<1 | 2 | 3, number> = {
  1: 4,   // Mundane → Storied
  2: 8,   // Storied → Mythic
  3: 14,  // Mythic → Legendary
};

/** Step difficulty for player-initiated upgrade from each tier.
 * @range 0.0–1.0 */
export const RARITY_PLAYER_UPGRADE_DIFFICULTY: Record<1 | 2 | 3, number> = {
  1: 0.20,  // Mundane → Storied: easy
  2: 0.35,  // Storied → Mythic: moderate
  3: 0.50,  // Mythic → Legendary: hard
};

// ─── Importance Deltas ───────────────────────────────────────────

/** Importance gained when the player directly acts on or through an entity. */
export const IMPORTANCE_PLAYER_ACTION = 10;

/** Importance gained when an entity participates in a resolved encounter. */
export const IMPORTANCE_ENCOUNTER = 3;

/** Importance gained when an entity is referenced in the chronicle. */
export const IMPORTANCE_CHRONICLE = 5;

/** Importance gained per tick while an entity is in divine proximity. */
export const IMPORTANCE_DIVINE_PROXIMITY = 1;

/** Importance gained when a sphere event directly involves an entity. */
export const IMPORTANCE_SPHERE_EVENT = 8;

/** Minimum prose tier floor by rarity tier (0 = undefined/unknown rarity). */
export const PROSE_TIER_FLOOR_BY_RARITY: Readonly<Record<0 | RarityTier, NarrativeTier | null>> = {
  0: null,
  1: null,
  2: 'notable',
  3: 'notable',
  4: 'chronicle',
};

// ─── Runtime Validation ──────────────────────────────────────────
// Fail-soft: never throw — log a warning if distributions are misconfigured.

function validateDistribution(name: string, dist: Record<RarityTier, number>): void {
  const sum = dist[1] + dist[2] + dist[3] + dist[4];
  if (Math.abs(sum - 1.0) > 0.001) {
    console.warn(
      `[rarity-constants] ${name} weights sum to ${sum.toFixed(4)}, expected 1.0. ` +
      `Distribution curves must sum to 1.0 within ±0.001.`,
    );
  }
}

validateDistribution('RARITY_DISTRIBUTION_ACTORS', RARITY_DISTRIBUTION_ACTORS);
validateDistribution('RARITY_DISTRIBUTION_LOCATIONS', RARITY_DISTRIBUTION_LOCATIONS);
validateDistribution('RARITY_DISTRIBUTION_SUBLOCATIONS', RARITY_DISTRIBUTION_SUBLOCATIONS);
