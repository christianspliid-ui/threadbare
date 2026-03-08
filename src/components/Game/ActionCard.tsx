/**
 * ActionCard — Individual action slot card for the action drawer.
 *
 * Displays a wheel slot as a card with sphere-colored glyph, action name,
 * effect description, essence cost, detection risk, and range information.
 *
 * States:
 * - available: full brightness, clickable, sphere-colored left border, hover lift
 * - locked-tier: 30% opacity, shows lock reason
 * - locked-cost: 50% opacity
 * - out-of-range: 50% opacity with distance display
 */

import React from 'react';
import type { WheelSlot } from '../../engine/wheel';
import { getWheelSlotGlyph, getSphereColor } from '../../data/sphereIcons';

// ─── Styling Constants ─────────────────────────────────────────────────────

const CARD_STYLES = {
  baseCard: 'relative flex flex-col w-40 bg-stone-800/95 border border-stone-700 rounded-lg px-3 py-2.5 transition-all duration-200',
  availableCard: 'border-l-4 cursor-pointer hover:-translate-y-1 shadow-lg hover:shadow-xl',
  lockedCard: 'cursor-not-allowed',
  unavailableText: 'text-amber-300/50',
  availableText: 'text-amber-100',
  nameText: 'text-sm font-semibold tracking-wide text-amber-50',
  descriptionText: 'text-xs text-amber-200/80 leading-tight',
  costZone: 'flex items-center gap-1.5 text-xs text-amber-100/90',
  costDot: 'w-2 h-2 rounded-full',
  riskText: 'text-xs text-amber-200/70 tracking-tight',
  rangeText: 'text-xs text-amber-200/70',
  lockReasonText: 'text-xs text-amber-400/80 italic mt-1',
};

interface ActionCardProps {
  /** The wheel slot to display */
  slot: WheelSlot;
  /** Callback when card is clicked (only if available) */
  onClick: (slotId: string) => void;
  /** Whether this card is currently playing (pulsing animation) */
  playing?: boolean;
}

/**
 * ActionCard component — displays a single action slot as a card.
 */
export const ActionCard = React.memo(function ActionCard({ slot, onClick, playing = false }: ActionCardProps) {
  const glyph = getWheelSlotGlyph(slot.id);
  const sphereColor = slot.sphere ? getSphereColor(slot.sphere) : undefined;

  // Determine lock state
  const isAvailable = slot.available && !playing;
  const isLockedTier = slot.lockedReason?.includes('tier') || slot.lockedReason?.includes('Tier');
  const lockedOpacity = isLockedTier ? 'opacity-30' : 'opacity-50';

  // Determine container classes
  const containerClasses = [
    CARD_STYLES.baseCard,
    playing ? 'card-pulse opacity-70' : (isAvailable ? CARD_STYLES.availableCard : [CARD_STYLES.lockedCard, lockedOpacity]),
  ]
    .flat()
    .join(' ');

  // Container style for left border color when available
  const containerStyle: React.CSSProperties = (isAvailable || playing) && sphereColor ? { borderLeftColor: sphereColor } : {};

  // Handle click
  const handleClick = () => {
    if (isAvailable && !playing) {
      onClick(slot.id);
    }
  };

  return (
    <>
      {playing && (
        <style>{`
          @keyframes cardPulse {
            0% {
              box-shadow: 0 0 0 0 ${sphereColor || '#d4a574'}40;
            }
            50% {
              box-shadow: 0 0 20px 8px ${sphereColor || '#d4a574'}40;
            }
            100% {
              box-shadow: 0 0 0 0 ${sphereColor || '#d4a574'}20;
            }
          }
          .card-pulse {
            animation: cardPulse 0.6s ease-out;
          }
          .card-pulse .glyph-pulse {
            animation: glyphPulse 0.6s ease-out;
          }
          @keyframes glyphPulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.2);
            }
          }
        `}</style>
      )}
      <div
        data-testid={`action-card-${slot.id}`}
        className={containerClasses}
        style={containerStyle}
        onClick={handleClick}
        role="button"
        tabIndex={isAvailable && !playing ? 0 : -1}
        onKeyDown={(e) => {
          if (isAvailable && !playing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(slot.id);
          }
        }}
      >
      {/* Glyph + Name header */}
      <div className="flex items-start gap-2 mb-1.5">
        <div
          className={`text-lg leading-none flex-shrink-0 ${playing ? 'glyph-pulse' : ''}`}
          style={{ color: sphereColor || '#a1a1a1' }}
        >
          {glyph}
        </div>
        <h3
          className={`${CARD_STYLES.nameText} ${isAvailable ? CARD_STYLES.availableText : CARD_STYLES.unavailableText}`}
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          {slot.label}
        </h3>
      </div>

      {/* Description */}
      <p className={`${CARD_STYLES.descriptionText} mb-2`}>
        {slot.description}
      </p>

      {/* Cost + Risk + Range row */}
      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        {/* Cost zone */}
        <div className={CARD_STYLES.costZone}>
          {slot.sphere && (
            <div
              className={CARD_STYLES.costDot}
              style={{ backgroundColor: sphereColor }}
            />
          )}
          <span data-testid="action-card-cost">
            {slot.essenceCost === 0 ? 'Free' : slot.essenceCost}
          </span>
        </div>

        {/* Risk */}
        {slot.detectionRisk > 0 && (
          <span
            className={CARD_STYLES.riskText}
            data-testid="action-card-risk"
          >
            {Math.round(slot.detectionRisk * 100)}%
          </span>
        )}
      </div>

      {/* Range info */}
      {slot.rangeStatus !== 'unlimited' && slot.hexDistance !== null && (
        <div className={CARD_STYLES.rangeText} data-testid="action-card-range">
          Range: {slot.hexDistance}
        </div>
      )}

      {/* Lock reason (if unavailable) */}
      {!isAvailable && !playing && slot.lockedReason && (
        <div className={CARD_STYLES.lockReasonText}>
          {slot.lockedReason}
        </div>
      )}

      {/* Spent overlay */}
      {playing && (
        <div
          data-testid="action-card-spent-overlay"
          className="absolute inset-0 bg-emerald-900/40 rounded-lg flex items-center justify-center"
        >
          <div className="text-4xl text-emerald-400 font-bold">✓</div>
        </div>
      )}
    </div>
    </>
  );
});

ActionCard.displayName = 'ActionCard';
