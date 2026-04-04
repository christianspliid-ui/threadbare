/**
 * ActionCard — Individual action slot card for the action drawer.
 *
 * Supports two sizes:
 * - 'hand': Art-only background with name overlay and cost badge. Compact card in the fan.
 * - 'focused': MTG-classic frame layout (spell name, art placeholder, type line,
 *               description, flavor text, stats). Enlarged card at screen center.
 *
 * States:
 * - available: full brightness, clickable, sphere-colored left border
 * - locked-tier: 30% opacity, shows lock reason
 * - locked-cost: 50% opacity
 * - out-of-range: 50% opacity with distance display
 * - playing: pulse/glow burst animation with spent overlay
 */

import React, { useMemo, useCallback, useState, useRef } from 'react';
import type { WheelSlot } from '../../engine/wheel';
import { getWheelSlotGlyph, getSphereColor } from '../../data/sphereIcons';
import { SphereIcon } from '../icons';
import { RarityBadge } from '../shared/RarityBadge';
import type { RarityTier } from '../../types/rarity';
import type { SphereName } from '../../types/index';

// ─── Sizing Constants ──────────────────────────────────────────────────────

/** Standard 5:7 card ratio (poker/tarot-style). Height = width × 1.4 */
const CARD_ASPECT = 7 / 5; // 1.4

const SIZE_CONFIG = {
  hand: {
    widthPx: 100,            // 100px wide × 140px tall (5:7)
    glyphSize: '1.5rem',     // 24px
    nameSize: 'var(--text-xs)',
    descSize: '0.625rem',    // 10px
    descClamp: 'line-clamp-2',
    costSize: '0.625rem',
    padding: 'px-2 py-2',
    badgePos: 'top-1.5 right-1.5',
    badgePad: 'px-1 py-0.5',
  },
  focused: {
    widthPx: 320,            // 320px wide × 448px tall (5:7)
    glyphSize: '2rem',       // 32px
    nameSize: 'var(--text-base)',
    descSize: '0.75rem',     // 12px — fits more text in the card
    descClamp: '',            // no clamp
    costSize: '0.75rem',     // 12px
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
  /** Whether this card is currently playing (animation + spent overlay) */
  playing?: boolean;
  /** Card size: 'hand' for fan layout, 'focused' for center screen */
  size?: 'hand' | 'focused';
}

// ─── Type-line parser ──────────────────────────────────────────────────────

/**
 * Extract reach name and CRUD type from a target_action slot id.
 * Expected pattern: target_action_action.<reach>.<crud>
 * e.g., "target_action_action.iron.create" → { reach: "IRON", crud: "CREATE" }
 */
function parseTypeLine(slotId: string): { reach: string; crud: string } {
  // Strip the leading prefix to get the template id portion
  const stripped = slotId.replace(/^target_action_/, '');
  const parts = stripped.split('.');
  // parts[0] = "action" (or "divine" etc), parts[1] = reach, parts[2] = crud
  const reach = parts[1]?.toUpperCase() ?? '';
  const crud = parts[2]?.toUpperCase() ?? '';
  return { reach, crud };
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

  // Use cardGlowBurst for target_action, cardPulse for interventions
  const animClass = (playing && slot.type === 'target_action') ? 'card-glow-burst' : 'card-pulse';

  // FE-16: Shake state for disabled click feedback
  const [shaking, setShaking] = useState(false);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Container classes
  const hoverClasses = size === 'hand'
    ? 'hover:-translate-y-3 hover:scale-105 shadow-lg hover:shadow-2xl'
    : 'shadow-2xl'; // focused: no hover lift, already elevated
  const containerClasses = [
    'group relative flex flex-col rounded-lg transition-all duration-200 overflow-hidden',
    cfg.padding,
    playing ? `${animClass} opacity-70` : (isAvailable ? `border-l-4 cursor-pointer ${hoverClasses}` : ['cursor-not-allowed', lockedOpacity]),
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

  // ── Hand layout ─────────────────────────────────────────────────
  if (size === 'hand') {
    const displayName = slot.spellName ?? slot.label;
    return (
      <>
        {playing && (
          <style>{`
            @keyframes cardPulse {
              0% { box-shadow: 0 0 0 0 ${sphereColor || '#d4a574'}40; }
              50% { box-shadow: 0 0 20px 8px ${sphereColor || '#d4a574'}40; }
              100% { box-shadow: 0 0 0 0 ${sphereColor || '#d4a574'}20; }
            }
            @keyframes cardGlowBurst {
              0%   { box-shadow: 0 0 0 0px ${sphereColor || '#d4a574'}40; transform: scale(1); }
              40%  { box-shadow: 0 0 24px 12px ${sphereColor || '#d4a574'}60; transform: scale(1.02); }
              100% { box-shadow: 0 0 0 0px ${sphereColor || '#d4a574'}00; transform: scale(1); opacity: 0.7; }
            }
            .card-pulse { animation: cardPulse 0.6s ease-out; }
            .card-glow-burst { animation: cardGlowBurst 600ms ease-out forwards; }
          `}</style>
        )}
        <div
          data-testid={`action-card-${slot.id}`}
          className={containerClasses}
          style={{
            width: `${cfg.widthPx}px`,
            height: `${Math.round(cfg.widthPx * CARD_ASPECT)}px`,
            // Art background: sphere gradient fills the card
            background: (isAvailable || playing) && sphereColor
              ? `linear-gradient(145deg, ${sphereColor}30 0%, #111114 100%)`
              : `linear-gradient(145deg, #2a2a3a 0%, #111114 100%)`,
            borderTop: '1px solid var(--border-medium)',
            borderRight: '1px solid var(--border-medium)',
            borderBottom: '1px solid var(--border-medium)',
            ...(playing ? { borderLeftColor: sphereColor } : {}),
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
          {/* Cost badge — top-right */}
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

          {/* Centered sphere icon — subtle background element */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity: 0.35,
              pointerEvents: 'none',
            }}
          >
            {slot.sphere
              ? <SphereIcon sphere={slot.sphere as SphereName} size={32} />
              : <span style={{ fontSize: '2rem', color: '#ffffff26' }}>{glyph}</span>
            }
          </div>

          {/* Name overlay — bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(10,10,15,0.7)',
              padding: '4px 8px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              lineHeight: 1.2,
            }}
          >
            {displayName}
          </div>

          {/* Rarity badge — bottom-left corner, only for Storied (2) and above */}
          {slot.rarityTier != null && slot.rarityTier >= 2 && (
            <span data-testid="action-card-rarity-badge" className="absolute bottom-0 left-0 px-1 pb-0.5">
              <RarityBadge
                tier={slot.rarityTier}
                opacity={0.9}
                className="text-[0.5rem] font-bold uppercase tracking-wide"
              />
            </span>
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
  }

  // ── Focused layout (MTG frame) ────────────────────────────────────────────
  const displayName = slot.spellName ?? slot.label;
  const { reach, crud } = parseTypeLine(slot.id);

  return (
    <>
      {playing && (
        <style>{`
          @keyframes cardPulse {
            0% { box-shadow: 0 0 0 0 ${sphereColor || '#d4a574'}40; }
            50% { box-shadow: 0 0 20px 8px ${sphereColor || '#d4a574'}40; }
            100% { box-shadow: 0 0 0 0 ${sphereColor || '#d4a574'}20; }
          }
          @keyframes cardGlowBurst {
            0%   { box-shadow: 0 0 0 0px ${sphereColor || '#d4a574'}40; transform: scale(1); }
            40%  { box-shadow: 0 0 24px 12px ${sphereColor || '#d4a574'}60; transform: scale(1.02); }
            100% { box-shadow: 0 0 0 0px ${sphereColor || '#d4a574'}00; transform: scale(1); opacity: 0.7; }
          }
          .card-pulse { animation: cardPulse 0.6s ease-out; }
          .card-pulse .glyph-pulse { animation: glyphPulse 0.6s ease-out; }
          .card-glow-burst { animation: cardGlowBurst 600ms ease-out forwards; }
          .card-glow-burst .glyph-pulse { animation: glyphPulse 0.6s ease-out; }
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
          width: `${cfg.widthPx}px`,
          height: `${Math.round(cfg.widthPx * CARD_ASPECT)}px`,
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

        {/* ── 1. Spell name zone ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', height: '36px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              margin: 0,
              flexShrink: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '220px',
            }}
          >
            {displayName}
          </h3>
          {/* Cost badge */}
          <div
            className={`flex items-center gap-1 ${cfg.badgePad} rounded-full flex-shrink-0`}
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
        </div>

        {/* ── 2. Art frame placeholder ────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            height: '96px',
            background: `linear-gradient(145deg, ${sphereColor ?? '#333'}20 0%, #111114 100%)`,
            border: `1px solid ${sphereColor ?? '#333'}30`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
          }}
        >
          <span
            className={playing ? 'glyph-pulse' : ''}
            style={{ opacity: 0.45 }}
          >
            {slot.sphere
              ? <SphereIcon sphere={slot.sphere as SphereName} size={32} />
              : <span style={{ fontSize: '2rem', color: `${sphereColor ?? '#333'}60` }}>{glyph}</span>
            }
          </span>
        </div>

        {/* ── 3. Type line ────────────────────────────────────────────── */}
        <div style={{ marginBottom: '6px' }}>
          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--border-gold, #d4a040)',
              marginBottom: '4px',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-body, "Alegreya Sans", sans-serif)',
              fontSize: '0.75rem',
              fontWeight: 400,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.08em',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {slot.sphere && (
                <SphereIcon sphere={slot.sphere as SphereName} size={14} />
              )}
              {[reach, crud].filter(Boolean).join(' \u00B7 ') || slot.type.toUpperCase()}
            </span>
            {/* Rarity badge — only for Storied (2) and above */}
            {slot.rarityTier != null && slot.rarityTier >= 2 && (
              <span data-testid="action-card-rarity-badge">
                <RarityBadge
                  tier={slot.rarityTier}
                  opacity={0.9}
                  className="text-xs font-semibold uppercase tracking-wide"
                />
              </span>
            )}
          </div>
        </div>

        {/* ── 4. Description text box (technical / mechanical) ────────── */}
        {slot.technicalDescription && (
          <div
            style={{
              fontFamily: 'var(--font-body, "Alegreya Sans", sans-serif)',
              fontSize: '0.75rem',
              fontWeight: 400,
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              marginBottom: '6px',
              overflow: 'hidden',
              flexShrink: 1,
            }}
          >
            {slot.technicalDescription}
          </div>
        )}

        {/* ── 5. Spacer to push stats to bottom ─────────────────────── */}
        <div style={{ marginTop: 'auto' }} />

        {/* ── 6. Stats row (risk + range) ─────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 mt-2">
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

        {/* Sustained badge */}
        {slot.durationMode === 'sustained' && (
          <div
            data-testid="action-card-sustained-badge"
            className="flex items-center gap-1.5 mt-1 px-1.5 py-0.5 rounded"
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
        {isAvailable && !playing && (
          <div
            className="mt-2 text-center py-1.5 rounded border"
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
