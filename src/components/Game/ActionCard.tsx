/**
 * ActionCard — Individual action slot card for the action drawer.
 *
 * Supports two sizes:
 * - 'hand': Compact card in the overlapping fan (w-28, 2-line clamp)
 * - 'focused': Enlarged card at screen center (w-80, full description)
 *
 * States:
 * - available: full brightness, clickable, sphere-colored left border
 * - locked-tier: 30% opacity, shows lock reason
 * - locked-cost: 50% opacity
 * - out-of-range: 50% opacity with distance display
 * - playing: pulse animation with spent overlay
 */

import React, { useMemo, useCallback, useState, useRef } from 'react';
import type { WheelSlot } from '../../engine/wheel';
import { getWheelSlotGlyph, getSphereColor } from '../../data/sphereIcons';

// ─── Sizing Constants ──────────────────────────────────────────────────────

const SIZE_CONFIG = {
  hand: {
    width: 'w-28',           // 112px — compact for overlap
    glyphSize: '1.5rem',     // 24px
    nameSize: 'var(--text-xs)',
    descSize: '0.625rem',    // 10px
    descClamp: 'line-clamp-2',
    costSize: '0.625rem',
    padding: 'px-2.5 py-2',
    badgePos: 'top-1.5 right-1.5',
    badgePad: 'px-1 py-0.5',
  },
  focused: {
    width: 'w-80',           // 320px — full readable
    glyphSize: '2.5rem',     // 40px
    nameSize: 'var(--text-base)',
    descSize: 'var(--text-sm)',
    descClamp: '',            // no clamp
    costSize: 'var(--text-sm)',
    padding: 'px-5 py-4',
    badgePos: 'top-3 right-3',
    badgePad: 'px-2 py-1',
  },
} as const;

interface ActionCardProps {
  /** The wheel slot to display */
  slot: WheelSlot;
  /** Callback when card is clicked */
  onClick: (slotId: string) => void;
  /** Whether this card is currently playing (pulsing animation) */
  playing?: boolean;
  /** Card size: 'hand' for fan layout, 'focused' for center screen */
  size?: 'hand' | 'focused';
}

/**
 * ActionCard component — displays a single action slot as a card.
 */
export const ActionCard = React.memo(function ActionCard({
  slot, onClick, playing = false, size = 'hand',
}: ActionCardProps) {
  const glyph = getWheelSlotGlyph(slot.id);
  const sphereColor = slot.sphere ? getSphereColor(slot.sphere) : undefined;
  const cfg = SIZE_CONFIG[size];

  // Determine lock state
  const isAvailable = slot.available && !playing;
  const isLockedTier = slot.lockedReason?.includes('tier') || slot.lockedReason?.includes('Tier');
  const lockedOpacity = isLockedTier ? 'opacity-30' : 'opacity-50';

  // FE-16: Shake state for disabled click feedback
  const [shaking, setShaking] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Container classes
  const hoverClasses = size === 'hand'
    ? 'hover:-translate-y-3 hover:scale-105 shadow-lg hover:shadow-2xl'
    : 'shadow-2xl'; // focused: no hover lift, already elevated
  const containerClasses = [
    'group relative flex flex-col rounded-lg transition-all duration-200',
    cfg.width, cfg.padding,
    playing ? 'card-pulse opacity-70' : (isAvailable ? `border-l-4 cursor-pointer ${hoverClasses}` : ['cursor-not-allowed', lockedOpacity]),
    shaking ? 'anim-shake-no' : '',
  ]
    .flat()
    .filter(Boolean)
    .join(' ');

  // P8: Sphere tint background
  const containerStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = {};
    if ((isAvailable || playing) && sphereColor) {
      style.borderLeftColor = sphereColor;
      style.background = `linear-gradient(135deg, ${sphereColor}0A 0%, transparent 60%), var(--bg-raised)`;
    }
    return style;
  }, [isAvailable, playing, sphereColor]);

  // Click handler — in focused mode, always call onClick (activation)
  // In hand mode, also always call onClick (drawer manages focus state)
  const handleClick = useCallback(() => {
    if (isAvailable && !playing) {
      onClick(slot.id);
    } else if (!isAvailable && !playing) {
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
            0% { box-shadow: 0 0 0 0 ${sphereColor || '#d4a574'}40; }
            50% { box-shadow: 0 0 20px 8px ${sphereColor || '#d4a574'}40; }
            100% { box-shadow: 0 0 0 0 ${sphereColor || '#d4a574'}20; }
          }
          .card-pulse { animation: cardPulse 0.6s ease-out; }
          .card-pulse .glyph-pulse { animation: glyphPulse 0.6s ease-out; }
          @keyframes glyphPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
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
      {/* Cost badge — top-right pill */}
      <div
        className={`absolute ${cfg.badgePos} flex items-center gap-1 ${cfg.badgePad} rounded-full`}
        style={{
          backgroundColor: sphereColor ? `${sphereColor}20` : 'rgba(255,255,255,0.08)',
          border: `1px solid ${sphereColor ? `${sphereColor}50` : 'var(--border-medium)'}`,
          fontSize: cfg.costSize,
          color: sphereColor || 'var(--text-primary)',
          fontWeight: 600,
        }}
      >
        {slot.sphere && (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sphereColor }} />
        )}
        <span data-testid="action-card-cost">
          {slot.essenceCost === 0 ? 'Free' : Math.round(slot.essenceCost)}
        </span>
      </div>

      {/* Glyph */}
      <div
        className={`leading-none flex-shrink-0 mb-1 ${playing ? 'glyph-pulse' : ''}`}
        style={{
          color: sphereColor || '#a1a1a1',
          fontSize: cfg.glyphSize,
          filter: sphereColor ? `drop-shadow(0 0 6px ${sphereColor}60)` : undefined,
        }}
      >
        {glyph}
      </div>

      {/* Name */}
      <h3
        className={`font-semibold tracking-wide mb-1 ${isAvailable ? '' : 'opacity-50'}`}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: cfg.nameSize,
          color: isAvailable ? 'var(--text-primary)' : 'var(--text-tertiary)',
          lineHeight: 1.2,
        }}
      >
        {slot.label}
      </h3>

      {/* Description — clamped in hand, full in focused */}
      <p
        className={`leading-tight mb-2 ${cfg.descClamp}`}
        style={{
          fontSize: cfg.descSize,
          color: 'var(--text-secondary)',
        }}
      >
        {slot.description}
      </p>

      {/* Sustained badge (TB-044) */}
      {slot.durationMode === 'sustained' && (
        <div
          data-testid="action-card-sustained-badge"
          className="flex items-center gap-1.5 mb-1.5 px-1.5 py-0.5 rounded"
          style={{
            fontSize: cfg.descSize,
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
        {slot.detectionRisk > 0 && (
          <span
            data-testid="action-card-risk"
            style={{ fontSize: cfg.descSize, color: 'var(--text-secondary)' }}
          >
            {Math.round(slot.detectionRisk * 100)}% risk
          </span>
        )}
        {slot.rangeStatus !== 'unlimited' && slot.hexDistance !== null && (
          <span
            data-testid="action-card-range"
            style={{ fontSize: cfg.descSize, color: 'var(--text-secondary)' }}
          >
            {slot.hexDistance} hex
          </span>
        )}
      </div>

      {/* Lock reason */}
      {!isAvailable && !playing && slot.lockedReason && (
        <div
          className="italic mt-1 truncate"
          style={{ fontSize: cfg.descSize, color: 'var(--text-tertiary)' }}
        >
          {slot.lockedReason}
        </div>
      )}

      {/* Focused mode: activation hint */}
      {size === 'focused' && isAvailable && !playing && (
        <div
          className="mt-3 text-center py-1.5 rounded border"
          style={{
            fontSize: cfg.descSize,
            color: sphereColor || 'var(--text-secondary)',
            borderColor: sphereColor ? `${sphereColor}40` : 'var(--border-medium)',
            backgroundColor: sphereColor ? `${sphereColor}10` : 'transparent',
          }}
        >
          Click to activate
        </div>
      )}

      {/* Spent overlay */}
      {playing && (
        <div
          data-testid="action-card-spent-overlay"
          className="absolute inset-0 bg-emerald-900/40 rounded-lg flex items-center justify-center"
        >
          <div className="text-4xl text-emerald-400 font-bold">&#x2713;</div>
        </div>
      )}
    </div>
    </>
  );
});

ActionCard.displayName = 'ActionCard';
