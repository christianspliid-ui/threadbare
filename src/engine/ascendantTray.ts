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
 *   Explicit   : template.trayTier, returned directly (after rare override)
 *   Self tier  : targetCategories is exactly ['actor'] with no targetSubtypes
 *                (template explicitly targets actors only, no other narrowing)
 *   Core tier  : everything else
 *
 * Throws never — pure derivation from template fields.
 */
export function classifyTrayTier(
  template: Pick<UnifiedActionTemplate, 'rarityTier' | 'intrinsicTier' | 'actorAffinities' | 'targetCategories' | 'targetSubtypes' | 'trayTier'>,
  ctx: { ascendantId: string; targetNodeId: string | null },
): AscendantTrayTier {
  // Rare: high rarity or story-beat attention tier
  if (
    template.rarityTier >= TRAY_RARE_RARITY_TIER_MIN ||
    template.intrinsicTier === 'story_beat'
  ) {
    return 'rare';
  }

  // Explicit tier: author intent takes precedence over inference
  if (template.trayTier !== undefined) {
    return template.trayTier;
  }

  // Self: template explicitly targets actors only, with no subtype narrowing.
  // Absence of targetCategories means the template doesn't constrain targeting
  // to actors — those fall through to core.
  const cats = template.targetCategories;
  if (
    cats !== undefined &&
    cats.length === 1 &&
    cats[0] === 'actor' &&
    (template.targetSubtypes === undefined || template.targetSubtypes.length === 0)
  ) {
    return 'self';
  }

  return 'core';
}
