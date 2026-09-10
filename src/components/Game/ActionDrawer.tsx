/**
 * ActionDrawer — the god's hand (THR-1002).
 *
 * A row of cards along the bottom of the screen. Click a card to **arm** it;
 * the footer's one **Cast** button **fires** it (Law 48, the nudge stage's
 * *Let fate decide* shape). Escape clears the armed card, then closes the drawer.
 *
 * ─── What this replaced, and why ──────────────────────────────────
 *
 * The drawer was a Slay-the-Spire fan: overlapping 160px tiles, rotated and
 * arced, where clicking a card flew it to screen centre as a 400×560 frame and
 * clicking *that* cast it. Three things were wrong with it, and only the third is
 * about taste:
 *
 * 1. **Two clicks meant two different cards.** The hand tile and the focused
 *    frame shared no zones — the tile was art plus a name, the frame was an MTG
 *    layout — so the card you chose from was never the card you read.
 * 2. **The card was incomplete on purpose.** Everything that told you what the
 *    action *did* lived in the overlay: the Effect block, the cast-risk line, the
 *    sphere prose. A hand you cannot read is a hand you play by name alone.
 * 3. **It was not the game's card.** The nudge hand had already established the
 *    face (THR-775 WS2, THR-890, THR-972), and Christian's directive was that all
 *    cards share one grammar.
 *
 * The face is now complete, so nothing expands: arming a card presses it, and the
 * whole reading is already on it. The Effect block, its wiring badge, the nested
 * cast line and the eight hardcoded sphere sentences are gone with the overlay —
 * `description` and `technicalEffect` are the codex page's job.
 *
 * Spec: `Docs/plans/2026-09-09-thr-1002-card-grammar.md` § UI pillar.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActionCard } from './ActionCard';
import type { WheelSlot } from '../../engine/wheel';
import type { OutcomeBand } from '../../engine/outcomeConsequences';
import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { HAND_MAX_HEIGHT_PX } from '../shared/CardFace';
import {
  NARRATIVE_LAYER_ICONS,
  NARRATIVE_LAYER_LOCKED_ICON,
} from '../../data/action-card-display';

// ─── Layer Filter Types ───────────────────────────────────────────────────

type NarrativeLayer = 'land' | 'soul' | 'people' | 'ruins';

const LAYER_CONFIG: { key: NarrativeLayer; label: string; icon: string }[] = [
  { key: 'land', label: 'Land', icon: NARRATIVE_LAYER_ICONS.land },
  { key: 'soul', label: 'Soul', icon: NARRATIVE_LAYER_ICONS.soul },
  { key: 'people', label: 'People', icon: NARRATIVE_LAYER_ICONS.people },
  { key: 'ruins', label: 'Ruins', icon: NARRATIVE_LAYER_ICONS.ruins },
];

// ─── Constants ─────────────────────────────────────────────────────────────

/** Drawer slide transition (ms). */
const DRAWER_TRANSITION_MS = 200;

/**
 * Gap between cards in the row. Matches the nudge hand's own gap, so the two
 * hands are the same hand at different moments rather than two layouts.
 */
const HAND_GAP_PX = 12;

/**
 * Widest the row may grow before it scrolls its own axis.
 *
 * The viewport contract forbids the *page* scrolling; a row that scrolls
 * sideways under a capped height satisfies it while keeping every card whole and
 * at full width. The fan's answer was to overlap cards until they fit, which made
 * every card but the last unreadable at exactly the moment the hand got
 * interesting.
 */
const HAND_MAX_WIDTH_PX = 1400;

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
  /**
   * The band each action last resolved to, keyed by template id (THR-1002).
   *
   * Law 37: the ending wears the chrome of the card that started it. `GameView`
   * derives this from `playerActionReceipts`, which is the authority on what a
   * cast came to — the drawer never infers a band of its own.
   */
  resolvedBands?: Readonly<Record<string, OutcomeBand>>;
  /** Open an action's codex entry (Law 21). Absent ⇒ card names render as text. */
  onOpenCodexEntry?: (templateId: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────

export const ActionDrawer: React.FC<ActionDrawerProps> = React.memo(
  ({
    open, slots, targetName: _targetName, targetLabel: _targetLabel, onSlotClick, onClose,
    playingCardId, hexRevelation, gatedActionCounts, resolvedBands, onOpenCodexEntry,
  }) => {
    // IA-003: Progressive disclosure — locked actions collapsed by default
    const [showLocked, setShowLocked] = useState(false);

    /** The armed card. Law 48: arming and firing are two acts. */
    const [armedSlotId, setArmedSlotId] = useState<string | null>(null);

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

    // Disarm when the drawer closes.
    useEffect(() => {
      if (!open) setArmedSlotId(null);
    }, [open]);

    // Handle Escape key — disarm first, then close the drawer
    useEffect(() => {
      if (!open) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (armedSlotId) {
            setArmedSlotId(null);
          } else {
            onClose();
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose, armedSlotId]);

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

    // All visible cards in order
    const handCards = useMemo(() => {
      const cards = [...observationSlots, ...interventionSlots];
      if (showLocked) cards.push(...lockedSlots);
      return cards;
    }, [observationSlots, interventionSlots, lockedSlots, showLocked]);

    /**
     * The armed slot, re-resolved against the live hand every render.
     *
     * Reading it back out of `handCards` rather than trusting the id alone is
     * what stops a stale arm surviving a layer switch or a card falling out of
     * range: if the armed card is no longer in the hand, nothing is armed, and
     * the Cast button says so.
     */
    const armedSlot = useMemo(
      () => (armedSlotId ? handCards.find(s => s.id === armedSlotId) ?? null : null),
      [armedSlotId, handCards],
    );

    /** Arm a card (or disarm it, if it was already the armed one). */
    const handleCardClick = useCallback((slotId: string) => {
      if (playingCardId) return;
      setArmedSlotId(prev => (prev === slotId ? null : slotId));
    }, [playingCardId]);

    /** Fire the armed card. */
    const handleCast = useCallback(() => {
      if (!armedSlot || !armedSlot.available || playingCardId) return;
      setArmedSlotId(null);
      onSlotClick(armedSlot.id);
    }, [armedSlot, playingCardId, onSlotClick]);

    if (!open) return null;

    const castable = !!armedSlot && armedSlot.available && !playingCardId;

    return (
      <div
        data-testid="action-drawer"
        className="fixed bottom-0 left-0 right-0 flex flex-col items-center pointer-events-none"
        style={{
          transition: `transform ${DRAWER_TRANSITION_MS}ms ease-out`,
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
                  <span style={{ marginRight: '4px' }} aria-hidden="true">
                    {isLocked ? NARRATIVE_LAYER_LOCKED_ICON : icon}
                  </span>
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

        {/* ── The hand ──────────────────────────────────────────
            One line, scrolled sideways — a *row*, not a fan and not a grid, and
            the same row the nudge hand draws. Cards stretch to the tallest in the
            row so their footers line up across it. */}
        <div
          data-testid="action-card-row"
          className="pointer-events-auto"
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
            gap: HAND_GAP_PX,
            maxWidth: HAND_MAX_WIDTH_PX,
            maxHeight: HAND_MAX_HEIGHT_PX,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '0 12px 6px',
          }}
        >
          {handCards.map((slot) => (
            <ActionCard
              key={slot.id}
              slot={slot}
              onClick={handleCardClick}
              selected={slot.id === armedSlotId}
              playing={slot.id === playingCardId}
              {...(slot.templateId && resolvedBands?.[slot.templateId]
                ? { resolvedBand: resolvedBands[slot.templateId] }
                : {})}
              {...(onOpenCodexEntry ? { onOpenCodexEntry } : {})}
            />
          ))}
        </div>

        {/* ── Footer: cast, and the locked-cards toggle ── */}
        <div
          data-testid="action-drawer-footer"
          className="flex items-center gap-3 pointer-events-auto"
          style={{ marginTop: 8 }}
        >
          <Button
            variant="primary"
            size="md"
            data-testid="action-cast-button"
            onClick={handleCast}
            disabled={!castable}
            aria-label={armedSlot ? `Cast ${armedSlot.spellName ?? armedSlot.label}` : 'Cast'}
          >
            Cast
          </Button>
          {/* Law 25: a control that cannot fire says why, rather than sitting
              inert. The armed-but-blocked case is already spoken by the card's
              own blocked reason, so this line only has to name the empty case. */}
          {!armedSlot && (
            <span
              data-testid="action-cast-hint"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
            >
              Choose a card.
            </span>
          )}
          {lockedSlots.length > 0 && (
            <Tooltip id="ui.action_locked">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLocked(v => !v)}
                aria-expanded={showLocked}
                aria-label={
                  showLocked
                    ? `Hide ${lockedSlots.length} locked actions`
                    : `Show ${lockedSlots.length} locked actions`
                }
                style={{ backdropFilter: 'blur(4px)', whiteSpace: 'nowrap' }}
              >
                {showLocked ? '◂ Hide' : `${lockedSlots.length} locked ▸`}
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    );
  }
);

ActionDrawer.displayName = 'ActionDrawer';
