import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActionCard } from './ActionCard';
import type { WheelSlot } from '../../engine/wheel';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { renderProseWithIPK } from '../ProseKeyword';

// ─── Layer Filter Types ───────────────────────────────────────────────────

type NarrativeLayer = 'land' | 'soul' | 'people' | 'ruins';

const LAYER_CONFIG: { key: NarrativeLayer; label: string; icon: string }[] = [
  { key: 'land', label: 'Land', icon: '\u26F0' },  // ⛰
  { key: 'soul', label: 'Soul', icon: '\u2728' },  // ✨
  { key: 'people', label: 'People', icon: '\uD83D\uDC64' },  // 👤
  { key: 'ruins', label: 'Ruins', icon: '\uD83C\uDFDB' },  // 🏛
];

// ─── Constants ─────────────────────────────────────────────────────────────

const HAND_CONFIG = {
  /** Card width in hand (px) — must match ActionCard SIZE_CONFIG.hand.widthPx */
  CARD_WIDTH_PX: 160,
  /** Minimum visible portion of each card when overlapping (px) */
  MIN_OVERLAP_SPACING_PX: 50,
  /** Max available width for the hand (px) */
  MAX_HAND_WIDTH_PX: 1200,
  /** Max fan rotation for outermost cards (degrees) */
  FAN_MAX_ROTATION_DEG: 3,
  /** Max vertical arc for outermost cards (px) */
  FAN_MAX_ARC_PX: 10,
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
  /** Hex revelation state — used to show lock badges on unrevealed layers. */
  hexRevelation?: import('../../types/unifiedAction').HexRevelation;
  /** Count of gated actions per unrevealed layer (pre-computed by caller). */
  gatedActionCounts?: Partial<Record<import('../../types/unifiedAction').NarrativeLayer, number>>;
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
  ({ open, slots, targetName: _targetName, targetLabel: _targetLabel, onSlotClick, onClose, playingCardId, hexRevelation, gatedActionCounts }) => {
    // IA-003: Progressive disclosure — locked actions collapsed by default
    const [showLocked, setShowLocked] = useState(false);

    // StS focus state: which card is centered on screen
    const [focusedSlotId, setFocusedSlotId] = useState<string | null>(null);

    // ── Narrative layer filter ─────────────────────────────────────────────
    // Detect if this drawer contains hex-targeting cards with narrative layers
    const layerCounts = useMemo(() => {
      const counts: Record<NarrativeLayer, number> = { land: 0, soul: 0, people: 0, ruins: 0 };
      for (const slot of slots) {
        if (slot.narrativeLayer) counts[slot.narrativeLayer]++;
      }
      return counts;
    }, [slots]);

    const hasLayerCards = useMemo(
      () => LAYER_CONFIG.some(l => layerCounts[l.key] > 0),
      [layerCounts],
    );

    const [selectedLayer, setSelectedLayer] = useState<NarrativeLayer | null>(null);

    // Auto-select first layer with cards when layer cards appear; reset when they vanish
    useEffect(() => {
      if (!hasLayerCards) {
        setSelectedLayer(null);
        return;
      }
      // If current selection is valid and has cards, keep it
      if (selectedLayer && layerCounts[selectedLayer] > 0) return;
      // Otherwise pick first non-empty layer
      const first = LAYER_CONFIG.find(l => layerCounts[l.key] > 0);
      setSelectedLayer(first?.key ?? null);
    }, [hasLayerCards, layerCounts]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Slot filtering — apply layer filter for hex-targeting cards
    const { observationSlots, interventionSlots, lockedSlots } = useMemo(() => {
      let filtered = slots.filter(slot => slot.type !== 'info');
      // When layer tabs are active (hex-zoom), only show cards matching the selected layer.
      // target_action cards without a narrativeLayer are location/sublocation templates —
      // hide them here; they show in location view where layer tabs aren't active.
      // Non-target_action cards (e.g. "Meet The First" intervention) pass through.
      if (hasLayerCards && selectedLayer) {
        filtered = filtered.filter(s => {
          if (s.type === 'target_action') return s.narrativeLayer === selectedLayer;
          return true; // non-target_action slots (observations, interventions) always pass
        });
      }
      const available = filtered.filter(s => s.available);
      return {
        observationSlots: available.filter(s => s.type === 'observation'),
        interventionSlots: available.filter(s => s.type !== 'observation'),
        lockedSlots: filtered.filter(s => !s.available),
      };
    }, [slots, hasLayerCards, selectedLayer]);

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
                    fontSize: 'var(--text-xs)',
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
          className="fixed bottom-0 left-0 right-0 flex flex-col items-center pointer-events-none"
          style={{
            transition: `transform ${HAND_CONFIG.TRANSITION_MS}ms ease-out`,
            transform: open ? 'translateY(0)' : 'translateY(100%)',
            zIndex: 40,
            paddingBottom: '0.75rem',
          }}
        >
          {/* ── Layer filter tabs (hex-targeting only) ── */}
          {hasLayerCards && (
            <div
              data-testid="layer-filter-tabs"
              className="flex gap-1 pointer-events-auto"
              style={{
                marginBottom: '6px',
                padding: '3px 6px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(160, 152, 128, 0.2)',
              }}
            >
              {LAYER_CONFIG.map(({ key, label, icon }) => {
                const count = layerCounts[key];
                const gatedCount = gatedActionCounts?.[key] ?? 0;
                const isRevealed = hexRevelation?.[key] ?? false;
                const isLocked = !isRevealed && gatedCount > 0;
                if (count === 0 && !isLocked) return null;
                const isActive = selectedLayer === key;
                return (
                  <button
                    key={key}
                    data-testid={`layer-tab-${key}`}
                    onClick={() => !isLocked && setSelectedLayer(key)}
                    title={isLocked ? `${gatedCount} action${gatedCount !== 1 ? 's' : ''} locked — reveal this layer first` : undefined}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-ui, sans-serif)',
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: '0.03em',
                      color: isLocked ? 'var(--text-muted, #666)' : isActive ? 'var(--text-gold, #d4af37)' : 'var(--text-secondary, #a09880)',
                      background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                      opacity: isLocked ? 0.5 : 1,
                      transition: 'all 150ms ease',
                    }}
                  >
                    <span style={{ marginRight: '4px' }}>{isLocked ? '🔒' : icon}</span>
                    {label}
                    <span style={{
                      marginLeft: '4px',
                      fontSize: 'var(--text-xs)',
                      opacity: 0.7,
                    }}>
                      {isLocked ? gatedCount : count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Hand container — relative positioned, cards absolutely placed */}
          <div
            className="relative pointer-events-auto"
            style={{ width: `${handWidth}px`, height: '130px' }}
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
