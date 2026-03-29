import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActionCard } from './ActionCard';
import type { WheelSlot } from '../../engine/wheel';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { renderProseWithIPK } from '../ProseKeyword';

// ─── Constants ─────────────────────────────────────────────────────────────

const HAND_CONFIG = {
  /** Card width in hand (px) — must match ActionCard w-28 = 112px */
  CARD_WIDTH_PX: 112,
  /** Minimum visible portion of each card when overlapping (px) */
  MIN_OVERLAP_SPACING_PX: 40,
  /** Max available width for the hand (px) */
  MAX_HAND_WIDTH_PX: 1000,
  /** Max fan rotation for outermost cards (degrees) */
  FAN_MAX_ROTATION_DEG: 3,
  /** Max vertical arc for outermost cards (px) */
  FAN_MAX_ARC_PX: 12,
  /** Drawer slide transition (ms) */
  TRANSITION_MS: 200,
} as const;

/**
 * Compute overlap spacing so all N cards fit within maxWidth.
 * Each card is CARD_WIDTH_PX wide; the visible portion per-card is `spacing`.
 * Total width = CARD_WIDTH_PX + (N-1) * spacing.
 */
function computeSpacing(n: number): number {
  if (n <= 1) return 0;
  const ideal = (HAND_CONFIG.MAX_HAND_WIDTH_PX - HAND_CONFIG.CARD_WIDTH_PX) / (n - 1);
  return Math.max(HAND_CONFIG.MIN_OVERLAP_SPACING_PX, Math.min(ideal, HAND_CONFIG.CARD_WIDTH_PX));
}

/** Compute fan transform for card at `index` of `total`. */
function cardFanTransform(index: number, total: number): React.CSSProperties {
  if (total <= 1) return {};
  const t = (2 * index / (total - 1)) - 1; // -1 to +1
  const rotation = t * HAND_CONFIG.FAN_MAX_ROTATION_DEG;
  const yOffset = Math.abs(t) * HAND_CONFIG.FAN_MAX_ARC_PX;
  return {
    transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
    transformOrigin: 'bottom center',
  };
}

// ─── Sphere Action Prose ────────────────────────────────────────────────────

const SPHERE_ACTION_PROSE: Record<string, string> = {
  force: 'This act channels **Force** — raw, direct, and unambiguous. Conflict follows.',
  matter: 'This act channels **Matter** — grounded and enduring. What is built will hold.',
  energy: 'This act channels **Energy** — restless, radiant, and hard to contain.',
  life: 'This act channels **Life** — growth, healing, and the patient insistence of living things.',
  mind: 'This act channels **Mind** — sharp, deliberate, and impossible to un-know.',
  spirit: 'This act channels **Spirit** — the unseen responds, and the veil shifts.',
  time: 'This act channels **Time** — patient, inevitable, and weighted with consequence.',
  entropy: 'This act channels **Entropy** — the old gives way. What comes next is not guaranteed.',
};

// ─── Props ────────────────────────────────────────────────────────────────

export interface ActionDrawerProps {
  open: boolean;
  slots: WheelSlot[];
  targetName: string;
  targetLabel: string;
  onSlotClick: (slotId: string) => void;
  onClose: () => void;
  playingCardId?: string | null;
}

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * ActionDrawer — Slay the Spire-style overlapping card hand.
 *
 * Cards fan out at the bottom of the screen with overlap.
 * Click a card → it flies to center screen (focused).
 * Click focused card → activates it (onSlotClick).
 * Click backdrop or Escape → card returns to hand.
 */
export const ActionDrawer: React.FC<ActionDrawerProps> = React.memo(
  ({ open, slots, targetName: _targetName, targetLabel: _targetLabel, onSlotClick, onClose, playingCardId }) => {
    // IA-003: Progressive disclosure — locked actions collapsed by default
    const [showLocked, setShowLocked] = useState(false);

    // StS focus state: which card is centered on screen
    const [focusedSlotId, setFocusedSlotId] = useState<string | null>(null);

    // Clear focus when drawer closes or slots change
    useEffect(() => {
      if (!open) setFocusedSlotId(null);
    }, [open]);

    // Handle Escape key — dismiss focus first, then close drawer
    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (focusedSlotId) {
            setFocusedSlotId(null);
          } else {
            onClose();
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose, focusedSlotId]);

    // Slot filtering
    const { observationSlots, interventionSlots, lockedSlots } = useMemo(() => {
      const filtered = slots.filter(slot => slot.type !== 'info');
      const available = filtered.filter(s => s.available);
      return {
        observationSlots: available.filter(s => s.type === 'observation'),
        interventionSlots: available.filter(s => s.type !== 'observation'),
        lockedSlots: filtered.filter(s => !s.available),
      };
    }, [slots]);

    // All visible cards in order (for hand layout)
    const handCards = useMemo(() => {
      const cards = [...observationSlots, ...interventionSlots];
      if (showLocked) cards.push(...lockedSlots);
      return cards;
    }, [observationSlots, interventionSlots, lockedSlots, showLocked]);

    const totalCards = handCards.length;
    const spacing = useMemo(() => computeSpacing(totalCards), [totalCards]);
    const handWidth = totalCards <= 1 ? HAND_CONFIG.CARD_WIDTH_PX : HAND_CONFIG.CARD_WIDTH_PX + (totalCards - 1) * spacing;

    // Focused slot data
    const focusedSlot = useMemo(
      () => (focusedSlotId ? handCards.find(s => s.id === focusedSlotId) ?? null : null),
      [focusedSlotId, handCards],
    );

    const focusedProse = useMemo(() => {
      if (!focusedSlot?.sphere) return null;
      return SPHERE_ACTION_PROSE[focusedSlot.sphere] ?? null;
    }, [focusedSlot]);

    // Hand card click → focus it (don't activate yet)
    const handleHandCardClick = useCallback((slotId: string) => {
      // If already playing, ignore
      if (playingCardId) return;
      setFocusedSlotId(slotId);
    }, [playingCardId]);

    // Focused card click → activate it
    const handleFocusedCardClick = useCallback((slotId: string) => {
      setFocusedSlotId(null);
      onSlotClick(slotId);
    }, [onSlotClick]);

    // Backdrop click → dismiss focus
    const handleBackdropClick = useCallback(() => {
      setFocusedSlotId(null);
    }, []);

    // Index where observations end (for divider positioning)
    const dividerIndex = observationSlots.length;
    const hasDivider = observationSlots.length > 0 && interventionSlots.length > 0;

    if (!open) return null;

    return (
      <>
        {/* ── Focused card overlay ── */}
        {focusedSlot && !playingCardId && (
          <>
            {/* Backdrop */}
            <div
              data-testid="action-drawer-backdrop"
              className="fixed inset-0 anim-backdrop-fade pointer-events-auto"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50 }}
              onClick={handleBackdropClick}
            />
            {/* Centered card */}
            <div
              className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ zIndex: 51 }}
            >
              <div className="anim-card-fly-up pointer-events-auto">
                <ActionCard
                  slot={focusedSlot}
                  size="focused"
                  onClick={handleFocusedCardClick}
                  playing={false}
                />
              </div>
              {/* Sphere prose below focused card */}
              {focusedProse && (
                <p
                  data-testid="action-sphere-preview"
                  className="anim-card-fly-up mt-3 pointer-events-none"
                  style={{
                    fontFamily: 'var(--font-prose, serif)',
                    fontSize: '13px',
                    color: 'var(--text-secondary, #a09880)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    maxWidth: '360px',
                    lineHeight: 1.5,
                  }}
                >
                  {renderProseWithIPK(focusedProse)}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Card hand at bottom ── */}
        <div
          data-testid="action-drawer"
          className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
          style={{
            transition: `transform ${HAND_CONFIG.TRANSITION_MS}ms ease-out`,
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            zIndex: 40,
            paddingBottom: '0.75rem',
          }}
        >
          {/* Hand container — relative positioned, cards absolutely placed */}
          <div
            className="relative pointer-events-auto"
            style={{ width: `${handWidth}px`, height: '180px' }}
          >
            {handCards.map((slot, i) => {
              const isFocused = slot.id === focusedSlotId;
              const isPlaying = slot.id === playingCardId;
              const isLocked = !slot.available;
              // Position: left offset based on spacing
              const left = i * spacing;
              const fan = cardFanTransform(i, totalCards);

              return (
                <div
                  key={slot.id}
                  className="absolute bottom-0 transition-all duration-200"
                  style={{
                    left: `${left}px`,
                    zIndex: isFocused ? 0 : (isPlaying ? totalCards + 2 : i + 1),
                    opacity: isFocused ? 0 : 1, // hide in hand when focused at center
                    ...fan,
                  }}
                  // Hover: boost z-index above siblings
                  onMouseEnter={(e) => {
                    if (!isFocused) (e.currentTarget as HTMLElement).style.zIndex = `${totalCards + 1}`;
                  }}
                  onMouseLeave={(e) => {
                    if (!isFocused) (e.currentTarget as HTMLElement).style.zIndex = `${i + 1}`;
                  }}
                >
                  <ActionCard
                    slot={slot}
                    size="hand"
                    onClick={isLocked ? handleHandCardClick : handleHandCardClick}
                    playing={isPlaying}
                  />
                </div>
              );
            })}

            {/* Locked cards toggle — positioned at right end */}
            {lockedSlots.length > 0 && !showLocked && (
              <div
                className="absolute bottom-0 flex items-end"
                style={{
                  left: `${handWidth + 8}px`,
                  zIndex: totalCards + 3,
                }}
              >
                <Tooltip id="ui.action_locked">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLocked(true)}
                    aria-expanded={false}
                    aria-label={`Show ${lockedSlots.length} locked actions`}
                    style={{ backdropFilter: 'blur(4px)', whiteSpace: 'nowrap' }}
                  >
                    {`${lockedSlots.length} locked \u25B8`}
                  </Button>
                </Tooltip>
              </div>
            )}
            {lockedSlots.length > 0 && showLocked && (
              <div
                className="absolute bottom-0 flex items-end"
                style={{
                  left: `${handWidth + 8}px`,
                  zIndex: totalCards + 3,
                }}
              >
                <Tooltip id="ui.action_locked">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLocked(false)}
                    aria-expanded={true}
                    aria-label={`Hide ${lockedSlots.length} locked actions`}
                    style={{ backdropFilter: 'blur(4px)', whiteSpace: 'nowrap' }}
                  >
                    {'\u25C2 Hide'}
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
);

ActionDrawer.displayName = 'ActionDrawer';
