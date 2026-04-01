import { memo } from 'react';
import type { RarityTier } from '../../../types/rarity';
import { RARITY_TIER_COLORS } from '../../../types/rarity';

/** Format an NPC role for display: 'guard_captain' → 'Guard Captain' */
function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface SoulCardProps {
  name: string;
  role?: string;            // npcRole (e.g., 'guard_captain')
  rarityTier?: RarityTier;  // 1-4, drives border color
  locationName: string;
  parentLocationName?: string; // if in a sublocation, the parent location name
  sphereColor: string; // hex color from getSphereColor
  archetypeName?: string;
  flavorText: string;
  onClick: () => void;
}

export const SoulCard = memo(function SoulCard({
  name,
  role,
  rarityTier = 1,
  locationName,
  parentLocationName,
  sphereColor,
  archetypeName,
  flavorText,
  onClick,
}: SoulCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const borderColor = RARITY_TIER_COLORS[rarityTier] ?? RARITY_TIER_COLORS[1];

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Soul: ${name}`}
      style={{
        background: 'var(--bg-raised)',
        border: `1px solid ${borderColor}`,
        borderLeft: `3px solid ${sphereColor}`,
        borderRadius: '6px',
        padding: '8px 12px',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease',
        margin: '8px 0',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = borderColor;
        (e.currentTarget as HTMLDivElement).style.borderLeftColor = sphereColor;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = borderColor;
        (e.currentTarget as HTMLDivElement).style.borderLeftColor = sphereColor;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'underline',
            textDecorationColor: 'var(--border-subtle)',
            textUnderlineOffset: '3px',
          }}
        >
          {name}{role ? ` the ${formatRole(role)}` : ''}
        </span>
        {archetypeName && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginLeft: 'auto',
            }}
          >
            {archetypeName}
          </span>
        )}
      </div>
      {flavorText && (
        <p
          style={{
            fontFamily: 'var(--font-prose)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)',
            fontStyle: 'italic',
            lineHeight: 1.6,
            margin: '3px 0 0 0',
          }}
        >
          {flavorText}
        </p>
      )}
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '3px',
        }}
      >
        {parentLocationName
          ? `In ${locationName} in ${parentLocationName}`
          : `In ${locationName}`}
      </div>
    </div>
  );
});
