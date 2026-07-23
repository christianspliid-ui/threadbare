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
import { OUTCOME_BAND_CARD_FLAVOR } from '../../data/narrative-content';
import { getActionArt } from './actionArt';

// ─── Sizing Constants ──────────────────────────────────────────────────────

const SIZE_CONFIG = {
  hand: {
    widthPx: 160,            // 160px wide × 110px tall (16:11 landscape — showcases 16:9 art)
    aspect: 11 / 16,         // landscape: height = width × 0.6875
    glyphSize: '1.75rem',    // 28px
    nameSize: 'var(--text-sm)',
    descSize: 'var(--text-xs)',
    descClamp: 'line-clamp-2',
    costSize: 'var(--text-xs)',
    padding: 'px-2 py-2',
    badgePos: 'top-2 right-2',
    badgePad: 'px-1.5 py-0.5',
  },
  focused: {
    widthPx: 400,            // 400px wide × 560px tall (5:7 portrait, 25% up from 320)
    aspect: 7 / 5,           // portrait: height = width × 1.4
    glyphSize: '2.5rem',     // 40px
    nameSize: '1.25rem',     // 20px (25% up from 16px)
    descSize: 'var(--text-xs)',
    descClamp: '',            // no clamp
    costSize: 'var(--text-xs)',
    padding: 'px-6 py-5',
    badgePos: 'top-4 right-4',
    badgePad: 'px-2.5 py-1.5',
  },
} as const;

/** Band-keyed overlay colours for the outcome face. */
const OUTCOME_BAND_STYLE: Record<string, { bg: string; text: string; icon: string }> = {
  surge:       { bg: 'rgba(74,222,128,0.15)', text: '#4ade80',                  icon: '✦' },
  fortunate:   { bg: 'rgba(201,161,74,0.15)', text: 'var(--accent-near-miss)',  icon: '~' },
  neutral:     { bg: 'rgba(168,152,128,0.12)', text: 'var(--text-tertiary)',    icon: '·' },
  strained:    { bg: 'rgba(251,191,36,0.12)', text: 'var(--warning)',           icon: '!' },
  setback:     { bg: 'rgba(248,113,113,0.15)', text: 'var(--negative)',         icon: '✕' },
  catastrophe: { bg: 'rgba(185,28,28,0.20)',   text: '#b91c1c',                 icon: '☠' },
};

interface ActionCardProps {
  /** The wheel slot to display */
  slot: WheelSlot;
  /** Callback when card is clicked */
  onClick: (slotId: string) => void;
  /** Whether this card is currently playing (animation + spent overlay) */
  playing?: boolean;
  /** Card size: 'hand' for fan layout, 'focused' for center screen */
  size?: 'hand' | 'focused';
  /** Outcome band to display on the spent overlay (e.g. 'fortunate'). Absent → default success overlay. */
  outcomeBand?: string;
  /**
   * Whether the card is a live play affordance. Default true (all existing call sites).
   * Set false for pure display — e.g. the Ascendant Beat unlock reveal (THR-639): the
   * card stays full-brightness but drops the click handler and the "Click to activate"
   * hint so it reads as a shown card, not a playable one. Additive (NFP #6).
   */
  interactive?: boolean;
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
  slot, onClick, playing = false, size = 'hand', outcomeBand, interactive = true,
}: ActionCardProps) {
  const glyph = getWheelSlotGlyph(slot.id);
  const sphereColor = slot.sphere ? getSphereColor(slot.sphere) : undefined;
  const cfg = SIZE_CONFIG[size];
  const artPath = getActionArt(slot.id);

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
    if (!interactive) return; // display-only card (THR-639 unlock reveal) — no play affordance
    if (isAvailable && !playing) {
      onClick(slot.id);
    } else if (!isAvailable && !playing) {
      setShaking(true);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShaking(false), 400);
    }
  }, [interactive, isAvailable, playing, onClick, slot.id]);

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
            height: `${Math.round(cfg.widthPx * cfg.aspect)}px`,
            // Art background: use art image if available, else sphere gradient
            background: artPath
              ? '#111114'
              : (isAvailable || playing) && sphereColor
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

          {/* Art image or centered sphere icon fallback */}
          {artPath ? (
            <img
              src={artPath}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isAvailable || playing ? 1 : 0.4,
                pointerEvents: 'none',
              }}
            />
          ) : (
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
          )}

          {/* Name overlay — bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: artPath
                ? 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 100%)'
                : 'rgba(10,10,15,0.8)',
              padding: '6px 10px',
              fontFamily: 'var(--font-display)',
              fontSize: cfg.nameSize,
              fontWeight: 600,
              color: 'var(--text-primary)',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
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
          {playing && (() => {
            const bandStyle = outcomeBand ? OUTCOME_BAND_STYLE[outcomeBand] : undefined;
            return (
              <div
                data-testid="action-card-spent-overlay"
                data-outcome-band={outcomeBand}
                className="absolute inset-0 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: bandStyle?.bg ?? 'rgba(6,78,59,0.4)' }}
              >
                <div style={{ fontSize: '2.25rem', color: bandStyle?.text ?? '#4ade80', fontWeight: 700 }}>
                  {bandStyle?.icon ?? '✓'}
                </div>
              </div>
            );
          })()}
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
          height: `${Math.round(cfg.widthPx * cfg.aspect)}px`,
          backgroundColor: 'var(--bg-raised)',
          borderTop: '1px solid var(--border-medium)',
          borderRight: '1px solid var(--border-medium)',
          borderBottom: '1px solid var(--border-medium)',
          ...containerStyle,
          ...(interactive ? {} : { cursor: 'default' }),
        }}
        onClick={handleClick}
        role={interactive ? 'button' : undefined}
        aria-disabled={interactive && !isAvailable && !playing ? true : undefined}
        tabIndex={interactive && !playing ? 0 : -1}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick();
          }
        }}
      >

        {/* ── 1. Spell name zone ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', height: '44px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: cfg.nameSize,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
              margin: 0,
              flexShrink: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '280px',
            }}
          >
            {displayName}
          </h3>
          {/* Cost badge with sphere icon */}
          <div
            className={`flex items-center gap-2 ${cfg.badgePad} rounded-full flex-shrink-0`}
            style={{
              backgroundColor: sphereColor ? `${sphereColor}20` : 'rgba(255,255,255,0.08)',
              border: `1px solid ${sphereColor ? `${sphereColor}50` : 'var(--border-medium)'}`,
              fontSize: cfg.costSize,
              color: sphereColor || 'var(--text-primary)',
              fontWeight: 600,
            }}
          >
            {slot.sphere
              ? <SphereIcon sphere={slot.sphere as SphereName} size={20} />
              : <span style={{ fontSize: 'var(--text-xs)' }}>{glyph}</span>
            }
            <span data-testid="action-card-cost">
              {slot.essenceCost === 0 ? 'Free' : Math.round(slot.essenceCost)}
            </span>
          </div>
        </div>

        {/* ── 2. Art frame ────────────────────────────────────────────── */}
        <div
          style={{
            height: artPath ? '200px' : '120px',
            background: artPath ? 'none' : `linear-gradient(145deg, ${sphereColor ?? '#333'}20 0%, #111114 100%)`,
            border: `1px solid ${sphereColor ?? '#333'}30`,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {artPath ? (
            <img
              src={artPath}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <span
              className={playing ? 'glyph-pulse' : ''}
              style={{ opacity: 0.45 }}
            >
              {slot.sphere
                ? <SphereIcon sphere={slot.sphere as SphereName} size={40} />
                : <span style={{ fontSize: cfg.glyphSize, color: `${sphereColor ?? '#333'}60` }}>{glyph}</span>
              }
            </span>
          )}
        </div>

        {/* ── 3. Type line ────────────────────────────────────────────── */}
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--border-gold, #d4a040)',
              marginBottom: '5px',
            }}
          />
          <div
            style={{
              fontFamily: 'var(--font-body, "Alegreya Sans", sans-serif)',
              fontSize: cfg.descSize,
              fontWeight: 400,
              color: 'var(--text-tertiary)',
              letterSpacing: '0.08em',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              {slot.sphere && (
                <SphereIcon sphere={slot.sphere as SphereName} size={18} />
              )}
              {[reach, crud].filter(Boolean).join(' \u00B7 ') || slot.type.toUpperCase()}
            </span>
            {/* Rarity badge — only for Storied (2) and above */}
            {slot.rarityTier != null && slot.rarityTier >= 2 && (
              <span data-testid="action-card-rarity-badge">
                <RarityBadge
                  tier={slot.rarityTier}
                  opacity={0.9}
                  className="text-sm font-semibold uppercase tracking-wide"
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
              fontSize: cfg.descSize,
              fontWeight: 400,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '8px',
              overflow: 'hidden',
              flexShrink: 1,
            }}
          >
            {slot.technicalDescription}
          </div>
        )}

        {/* ── 4b. Effects line (THR-639) — plain-prose "what it does" ──── */}
        {slot.effectsLine && (
          <div
            data-testid="action-card-effects-line"
            style={{
              fontFamily: 'var(--font-body, "Alegreya Sans", sans-serif)',
              fontSize: cfg.descSize,
              fontWeight: 400,
              color: 'var(--text-tertiary)',
              lineHeight: 1.5,
              marginBottom: '8px',
              flexShrink: 1,
            }}
          >
            {slot.effectsLine}
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
            <span style={{ fontSize: 'var(--text-xs)' }}>&#x21BB;</span>
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
        {isAvailable && !playing && interactive && (
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

        {/* Spent overlay — band-keyed styling when outcomeBand is provided */}
        {playing && (() => {
          const bandStyle = outcomeBand ? OUTCOME_BAND_STYLE[outcomeBand] : undefined;
          const flavor = outcomeBand ? OUTCOME_BAND_CARD_FLAVOR[outcomeBand] : undefined;
          return (
            <div
              data-testid="action-card-spent-overlay"
              data-outcome-band={outcomeBand}
              className="absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: bandStyle?.bg ?? 'rgba(6,78,59,0.4)' }}
            >
              <div style={{ fontSize: '2.25rem', color: bandStyle?.text ?? '#4ade80', fontWeight: 700 }}>
                {bandStyle?.icon ?? '✓'}
              </div>
              {flavor && (
                <div
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: bandStyle?.text ?? '#4ade80',
                    fontStyle: 'italic',
                    fontFamily: 'var(--font-body)',
                    textAlign: 'center',
                    padding: '0 16px',
                    opacity: 0.85,
                  }}
                >
                  {flavor}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </>
  );
});

ActionCard.displayName = 'ActionCard';
