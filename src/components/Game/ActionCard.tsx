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

import React, { useMemo, useCallback, useState, useRef } from 'react';
import type { WheelSlot } from '../../engine/wheel';
import { getWheelSlotGlyph, getSphereColor } from '../../data/sphereIcons';

// ─── Styling Constants ─────────────────────────────────────────────────────

const CARD_STYLES = {
  baseCard: 'relative flex flex-col w-40 rounded-lg px-3 py-2.5 transition-all duration-200',
  availableCard: 'border-l-4 cursor-pointer hover:-translate-y-1 shadow-lg hover:shadow-xl',
  lockedCard: 'cursor-not-allowed',
  unavailableText: 'opacity-50',
  availableText: '',
  nameText: 'font-semibold tracking-wide',
  descriptionText: 'leading-tight',
  costZone: 'flex items-center gap-1.5',
  costDot: 'w-2 h-2 rounded-full',
  riskText: 'tracking-tight',
  rangeText: '',
  lockReasonText: 'italic mt-1 truncate', // IX-018: prevent overflow
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

  // FE-16: Shake state for disabled click feedback
  const [shaking, setShaking] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine container classes
  const containerClasses = [
    CARD_STYLES.baseCard,
    playing ? 'card-pulse opacity-70' : (isAvailable ? CARD_STYLES.availableCard : [CARD_STYLES.lockedCard, lockedOpacity]),
    shaking ? 'anim-shake-no' : '',
  ]
    .flat()
    .filter(Boolean)
    .join(' ');

  // RC-026: Memoize container style to avoid new object on every render
  const containerStyle = useMemo<React.CSSProperties>(
    () => (isAvailable || playing) && sphereColor ? { borderLeftColor: sphereColor } : {},
    [isAvailable, playing, sphereColor]
  );

  // RC-026: Memoize click handler
  // FE-16: Shake feedback when clicking a disabled card
  const handleClick = useCallback(() => {
    if (isAvailable && !playing) {
      onClick(slot.id);
    } else if (!isAvailable && !playing) {
      // Trigger shake animation on disabled card click
      setShaking(true);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShaking(false), 400);
    }
  }, [isAvailable, playing, onClick, slot.id]);

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
        style={{
          backgroundColor: 'var(--bg-raised)',
          borderTop: '1px solid var(--border-medium)',
          borderRight: '1px solid var(--border-medium)',
          borderBottom: '1px solid var(--border-medium)',
          ...containerStyle,
        }}
        onClick={handleClick}
        role="button"
        aria-disabled={!isAvailable && !playing ? true : undefined}
        tabIndex={playing ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
      {/* Glyph + Name header */}
      <div className="flex items-start gap-2 mb-1.5">
        <div
          className={`leading-none flex-shrink-0 ${playing ? 'glyph-pulse' : ''}`}
          style={{ color: sphereColor || '#a1a1a1', fontSize: '1.1875rem' }}
        >
          {glyph}
        </div>
        <h3
          className={`${CARD_STYLES.nameText} ${isAvailable ? CARD_STYLES.availableText : CARD_STYLES.unavailableText}`}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-sm)',
            color: isAvailable ? 'var(--text-primary)' : 'var(--text-tertiary)',
          }}
        >
          {slot.label}
        </h3>
      </div>

      {/* Description */}
      <p
        className={`${CARD_STYLES.descriptionText} mb-2`}
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
        }}
      >
        {slot.description}
      </p>

      {/* Cost + Risk + Range row */}
      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
        {/* Cost zone */}
        <div
          className={CARD_STYLES.costZone}
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)',
          }}
        >
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
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            {Math.round(slot.detectionRisk * 100)}%
          </span>
        )}
      </div>

      {/* Range info */}
      {slot.rangeStatus !== 'unlimited' && slot.hexDistance !== null && (
        <div
          className={CARD_STYLES.rangeText}
          data-testid="action-card-range"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
          }}
        >
          Range: {slot.hexDistance}
        </div>
      )}

      {/* Lock reason (if unavailable) */}
      {!isAvailable && !playing && slot.lockedReason && (
        <div
          className={CARD_STYLES.lockReasonText}
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
          }}
        >
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
