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
  baseCard: 'group relative flex flex-col w-40 rounded-lg px-3 py-2.5 transition-all duration-200',
  availableCard: 'border-l-4 cursor-pointer hover:-translate-y-3 hover:scale-105 shadow-lg hover:shadow-2xl',
  lockedCard: 'cursor-not-allowed',
  unavailableText: 'opacity-50',
  availableText: '',
  nameText: 'font-semibold tracking-wide',
  descriptionText: 'leading-tight',
  costBadge: 'absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full',
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

  // P8: Sphere tint background + border color
  const containerStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = {};
    if ((isAvailable || playing) && sphereColor) {
      style.borderLeftColor = sphereColor;
      // P8: Subtle sphere-color gradient on background
      style.background = `linear-gradient(135deg, ${sphereColor}0A 0%, transparent 60%), var(--bg-raised)`;
    }
    return style;
  }, [isAvailable, playing, sphereColor]);

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
      {/* P2: Cost badge — top-right pill */}
      <div
        className={CARD_STYLES.costBadge}
        style={{
          backgroundColor: sphereColor ? `${sphereColor}20` : 'rgba(255,255,255,0.08)',
          border: `1px solid ${sphereColor ? `${sphereColor}50` : 'var(--border-medium)'}`,
          fontSize: 'var(--text-xs)',
          color: sphereColor || 'var(--text-primary)',
          fontWeight: 600,
        }}
      >
        {slot.sphere && (
          <div
            className={CARD_STYLES.costDot}
            style={{ backgroundColor: sphereColor }}
          />
        )}
        <span data-testid="action-card-cost">
          {slot.essenceCost === 0 ? 'Free' : Math.round(slot.essenceCost)}
        </span>
      </div>

      {/* P1: Large glyph as card identity */}
      <div
        className={`leading-none flex-shrink-0 mb-1 ${playing ? 'glyph-pulse' : ''}`}
        style={{
          color: sphereColor || '#a1a1a1',
          fontSize: '1.75rem',
          filter: sphereColor ? `drop-shadow(0 0 6px ${sphereColor}60)` : undefined,
        }}
      >
        {glyph}
      </div>

      {/* Name */}
      <h3
        className={`${CARD_STYLES.nameText} mb-1 ${isAvailable ? CARD_STYLES.availableText : CARD_STYLES.unavailableText}`}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-sm)',
          color: isAvailable ? 'var(--text-primary)' : 'var(--text-tertiary)',
          lineHeight: 1.2,
        }}
      >
        {slot.label}
      </h3>

      {/* P6: Description — clamped to 2 lines, expands on hover */}
      <p
        className={`${CARD_STYLES.descriptionText} mb-2 line-clamp-2 group-hover:line-clamp-none transition-all duration-150`}
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
        }}
      >
        {slot.description}
      </p>

      {/* Sustained action badge (TB-044) */}
      {slot.durationMode === 'sustained' && (
        <div
          data-testid="action-card-sustained-badge"
          className="flex items-center gap-1.5 mb-1.5 px-1.5 py-0.5 rounded"
          style={{
            fontSize: 'var(--text-xs)',
            backgroundColor: sphereColor ? `${sphereColor}15` : 'var(--bg-raised)',
            border: `1px solid ${sphereColor ? `${sphereColor}40` : 'var(--border-medium)'}`,
            color: sphereColor || 'var(--text-secondary)',
          }}
        >
          <span style={{ fontSize: '0.625rem' }}>&#x21BB;</span>
          <span>{slot.perTickCostLabel || 'Sustained'}</span>
        </div>
      )}

      {/* Risk + Range row */}
      <div className="flex items-center justify-between gap-2 mt-auto">
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
            {Math.round(slot.detectionRisk * 100)}% risk
          </span>
        )}

        {/* Range info */}
        {slot.rangeStatus !== 'unlimited' && slot.hexDistance !== null && (
          <span
            className={CARD_STYLES.rangeText}
            data-testid="action-card-range"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            {slot.hexDistance} hex
          </span>
        )}
      </div>

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
