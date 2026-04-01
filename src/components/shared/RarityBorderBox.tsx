import React from 'react';
import type { RarityTier } from '../../types/rarity';
import { RARITY_TIER_COLORS } from '../../types/rarity';
import { RARITY_LEGENDARY_PULSE_ANIMATION, MAX_RARITY_TIER } from '../../data/rarity-constants';

interface RarityBorderBoxProps {
  tier: RarityTier;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wrapper div that applies the rarity left-border treatment and Legendary pulse animation.
 * Use as the outer container for any entity row or card that should display its rarity tier.
 */
export const RarityBorderBox = React.memo(function RarityBorderBox({
  tier,
  children,
  className,
  style,
}: RarityBorderBoxProps) {
  const tierColor = RARITY_TIER_COLORS[tier];
  const isLegendary = tier === MAX_RARITY_TIER;

  return (
    <div
      className={`${isLegendary ? RARITY_LEGENDARY_PULSE_ANIMATION : ''}${className ? ` ${className}` : ''}`}
      style={{
        borderLeft: `3px solid ${tierColor}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
});
