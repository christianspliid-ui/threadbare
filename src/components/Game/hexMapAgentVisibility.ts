import type { SpotlightTier } from '../../types/npc';

const HEXMAP_VISIBLE_NPC_TIERS: ReadonlySet<SpotlightTier> = new Set(['notable', 'spotlight']);

/**
 * HexMap icons are reserved for agents important enough to visually track,
 * while commanders piggyback on their army signifier instead of duplicating it.
 */
export function shouldRenderIndividualOnHexMap(
  spotlightTier: SpotlightTier | undefined,
  commandedByEdgeCount: number,
): boolean {
  if (commandedByEdgeCount > 0) return false;
  if (spotlightTier == null) return true; // Legacy seeded agents remain visible.
  return HEXMAP_VISIBLE_NPC_TIERS.has(spotlightTier);
}
