import React from 'react';
import type { RarityTier } from '../../types/rarity';
import { RARITY_TIER_NAMES, RARITY_TIER_COLORS } from '../../types/rarity';

interface RarityBadgeProps {
  tier: RarityTier;
  /** Optional opacity for the color (0–1). Default: 0.8 */
  opacity?: number;
  className?: string;
}

/**
 * Small inline badge showing the rarity tier name in the tier color.
 * Used to annotate agents, locations, and other entities with their narrative significance.
 */
export const RarityBadge = React.memo(function RarityBadge({
  tier,
  opacity = 0.8,
  className,
}: RarityBadgeProps) {
  const color = RARITY_TIER_COLORS[tier];
  const name = RARITY_TIER_NAMES[tier];

  // Build rgba from hex — handles 6-char hex codes (#rrggbb)
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const colorWithOpacity = `rgba(${r}, ${g}, ${b}, ${opacity})`;

  return (
    <span className={className} style={{ color: colorWithOpacity }}>
      {name}
    </span>
  );
});
