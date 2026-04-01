import React from 'react';
import type { AttachmentTier } from '../../types/attachments';
import { ATTACHMENT_TIER_COLORS, ATTACHMENT_TIER_NAMES } from '../../types/attachments';
import { ProgressBar } from '../shared/ProgressBar';
import { RarityBadge } from '../shared/RarityBadge';
import { RARITY_LEGENDARY_PULSE_ANIMATION } from '../../data/rarity-constants';
import { getAttachmentGlyph } from './attachmentGlyphs';

export interface AttachmentRowProps {
  name: string;
  subcategory: string;
  tier: AttachmentTier;
  mechanicalSummary: string;
  ticksRemaining?: number | null;
  totalTicks?: number;
  durationLabel?: string;
  onClick?: () => void;
}

export const AttachmentRow = React.memo(function AttachmentRow({
  name,
  subcategory,
  tier,
  mechanicalSummary,
  ticksRemaining,
  totalTicks,
  durationLabel,
  onClick,
}: AttachmentRowProps) {
  const tierColor = ATTACHMENT_TIER_COLORS[tier];
  const tierName = ATTACHMENT_TIER_NAMES[tier];
  const glyph = getAttachmentGlyph(subcategory);
  const isLegendary = tier === 4;

  const hasProgressBar =
    ticksRemaining != null && totalTicks != null && totalTicks > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`${name}, ${tierName} ${subcategory}`}
      className={`transition-colors cursor-pointer${isLegendary ? ` ${RARITY_LEGENDARY_PULSE_ANIMATION}` : ''}`}
      data-testid="attachment-row"
      style={{
        backgroundColor: 'var(--bg-raised)',
        border: '1px solid var(--border-gold)',
        borderLeft: `3px solid ${tierColor}`,
        borderRadius: '4px',
        padding: '0.5rem 0.75rem',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-gold-dim)';
        e.currentTarget.style.borderLeftColor = tierColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-gold)';
        e.currentTarget.style.borderLeftColor = tierColor;
      }}
    >
      {/* Top row: glyph + name + tier */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 'var(--text-xs)', lineHeight: 1 }}>{glyph}</span>
        <span
          className="flex-1 text-xs font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {name}
        </span>
        <RarityBadge tier={tier} opacity={0.6} className="text-xs flex-shrink-0" />
      </div>

      {/* Mechanical summary */}
      <div
        className="text-xs italic mt-0.5 truncate"
        style={{ color: 'var(--text-secondary)', paddingLeft: '1.25rem' }}
      >
        {mechanicalSummary}
      </div>

      {/* Duration indicator */}
      {hasProgressBar && (
        <div className="mt-1" style={{ paddingLeft: '1.25rem' }}>
          <ProgressBar
            progress={ticksRemaining! / totalTicks!}
            color={tierColor}
            className="h-1.5"
            glow={false}
          />
        </div>
      )}

      {durationLabel && !hasProgressBar && (
        <div
          className="text-xs italic mt-0.5"
          style={{ color: 'var(--text-tertiary)', paddingLeft: '1.25rem' }}
        >
          {durationLabel}
        </div>
      )}
    </div>
  );
});
