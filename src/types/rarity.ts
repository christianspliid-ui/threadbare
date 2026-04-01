/**
 * Rarity Tier — shared type definitions.
 *
 * RarityTier is the canonical representation of narrative significance
 * across all entity types: actors, locations, attachments, actions.
 *
 * | Tier | Name       | Color     | Description                       |
 * |------|------------|-----------|-----------------------------------|
 * | 1    | Mundane    | #b0b0b0   | Ordinary — no special treatment   |
 * | 2    | Storied    | #c87533   | Notable — has a history           |
 * | 3    | Mythic     | #4b0082   | Remarkable — legend-tier          |
 * | 4    | Legendary  | #d4a017   | One of a kind — world-shaping     |
 */

// ─── Rarity Tier Type ───────────────────────────────────────────

export type RarityTier = 1 | 2 | 3 | 4;

// ─── Display Data ───────────────────────────────────────────────

export const RARITY_TIER_NAMES: Record<RarityTier, string> = {
  1: 'Mundane',
  2: 'Storied',
  3: 'Mythic',
  4: 'Legendary',
};

export const RARITY_TIER_COLORS: Record<RarityTier, string> = {
  1: '#b0b0b0',  // Pale silver
  2: '#c87533',  // Copper/warm bronze
  3: '#4b0082',  // Deep violet/indigo
  4: '#d4a017',  // Gold/ember glow
};

// ─── Utility Functions ──────────────────────────────────────────

export function getRarityName(tier: RarityTier): string {
  return RARITY_TIER_NAMES[tier];
}

export function getRarityColor(tier: RarityTier): string {
  return RARITY_TIER_COLORS[tier];
}

/** Clamp an arbitrary number to the valid RarityTier range [1, 4]. */
export function clampRarityTier(n: number): RarityTier {
  if (n <= 1) return 1;
  if (n >= 4) return 4;
  return Math.round(n) as RarityTier;
}
