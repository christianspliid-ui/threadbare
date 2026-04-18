/**
 * Ascendant action tray — tier classification for the left-bar action tray.
 *
 * Pure module: no state, no traces, no tick phase, no graph mutation.
 * Callers memoize on (ascendantId, target.nodeId, template pool version).
 *
 * THR-184: Ascendant Bar
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';

export type AscendantTrayTier = 'core' | 'self' | 'rare';

// ─── Tunable constants (NFP #1) ──────────────────────────────────────────────

/** Minimum rarityTier to be classified as Rare (Mythic = 3, Legendary = 4) */
export const TRAY_RARE_RARITY_TIER_MIN = 3;

/**
 * Target categories that classify as "Self" when the template's actor
 * affinities are exclusively ascendant-targeted.
 */
export const TRAY_SELF_TARGET_CATEGORIES = ['actor'] as const;

// ─── Classification ──────────────────────────────────────────────────────────

/**
 * Classify a template for the ascendant bar's action tray.
 *
 * Rules (tunable — NFP #1):
 *   Rare tier  : rarityTier >= TRAY_RARE_RARITY_TIER_MIN
 *                OR intrinsicTier === 'story_beat'
 *   Self tier  : the template's actorAffinities are exclusively ['ascendant']
 *                OR the resolved target node is the ascendant themselves
 *   Core tier  : everything else
 *
 * Throws never — pure derivation from existing template fields.
 */
export function classifyTrayTier(
  template: Pick<UnifiedActionTemplate, 'rarityTier' | 'intrinsicTier' | 'actorAffinities' | 'targetCategories'>,
  ctx: { ascendantId: string; targetNodeId: string | null },
): AscendantTrayTier {
  // Rare: high rarity or story-beat attention tier
  if (
    template.rarityTier >= TRAY_RARE_RARITY_TIER_MIN ||
    template.intrinsicTier === 'story_beat'
  ) {
    return 'rare';
  }

  // Self: ascendant-only affinity or the target is the ascendant themselves
  const affinities = template.actorAffinities ?? [];
  const isAscendantOnly =
    affinities.length > 0 && affinities.every((a) => a === 'ascendant');
  const targetsSelf = ctx.targetNodeId !== null && ctx.targetNodeId === ctx.ascendantId;

  if (isAscendantOnly || targetsSelf) {
    return 'self';
  }

  return 'core';
}
