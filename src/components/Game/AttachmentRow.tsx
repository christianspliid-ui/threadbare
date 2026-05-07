import React from 'react';
import type { AttachmentTier } from '../../types/attachments';
import { ATTACHMENT_TIER_COLORS, ATTACHMENT_TIER_NAMES } from '../../types/attachments';
import { ProgressBar } from '../shared/ProgressBar';
import { RarityBadge } from '../shared/RarityBadge';
import { RARITY_LEGENDARY_PULSE_ANIMATION, MAX_RARITY_TIER } from '../../data/rarity-constants';
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
  /** Encounter ID that applied this condition via aftermath effect. Shown as a tooltip. */
  sourceEncounterId?: string;
  /**
   * Active-vow visual treatment: panel-gold border + sphere-tinted background wash.
   * Per v7 §Hero panel — used to mark binding commitments active in the current scene.
   */
  activeVow?: boolean;
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
  sourceEncounterId,
  activeVow = false,
}: AttachmentRowProps) {
  const tierColor = ATTACHMENT_TIER_COLORS[tier];
  const tierName = ATTACHMENT_TIER_NAMES[tier];
  const glyph = getAttachmentGlyph(subcategory);
  const isLegendary = tier === MAX_RARITY_TIER;

  const hasProgressBar =
    ticksRemaining != null && totalTicks != null && totalTicks > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  const baseBorder = activeVow ? 'var(--sphere-spirit)' : 'var(--border-gold)';
  const baseBackground = activeVow
    ? 'linear-gradient(90deg, rgba(170, 68, 221, 0.12), rgba(34, 34, 40, 0.95))'
    : 'var(--bg-raised)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`${name}, ${tierName} ${subcategory}${activeVow ? ', active vow' : ''}`}
      title={sourceEncounterId ? `from: ${sourceEncounterId}` : undefined}
      className={`transition-colors cursor-pointer${isLegendary ? ` ${RARITY_LEGENDARY_PULSE_ANIMATION}` : ''}`}
      data-testid="attachment-row"
      data-active-vow={activeVow ? 'true' : undefined}
      style={{
        background: baseBackground,
        border: `1px solid ${baseBorder}`,
        borderLeft: `3px solid ${tierColor}`,
        borderRadius: '4px',
        padding: '0.5rem 0.75rem',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = activeVow
          ? 'var(--sphere-spirit-bright)'
          : 'var(--accent-gold-dim)';
        e.currentTarget.style.borderLeftColor = tierColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = baseBorder;
        e.currentTarget.style.borderLeftColor = tierColor;
      }}
    >
      {activeVow && (
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--sphere-spirit-bright)',
            marginBottom: '2px',
          }}
        >
          Vow · Active Now
        </div>
      )}
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
