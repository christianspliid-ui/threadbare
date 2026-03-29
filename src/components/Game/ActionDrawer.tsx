import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ActionCard } from './ActionCard';
import type { WheelSlot } from '../../engine/wheel';
import { Tooltip } from '../shared/Tooltip';
import { IconButton } from '../shared/IconButton';
import { Button } from '../shared/Button';
import { renderProseWithIPK } from '../ProseKeyword';

// ─── Constants ─────────────────────────────────────────────────────────────

const DRAWER_CONFIG = {
  HEIGHT_PERCENT: 35,
  TRANSITION_MS: 200,
  /** P3: Max rotation angle for outermost cards in the fan (degrees) */
  FAN_MAX_ROTATION_DEG: 2,
  /** P3: Vertical offset for outermost cards in the fan (px) */
  FAN_MAX_TRANSLATE_Y: 8,
} as const;

/** P3: Compute fan transform for a card at position `index` in a hand of `total` cards. */
function cardFanStyle(index: number, total: number): React.CSSProperties {
  if (total <= 1) return {};
  // Normalized position: -1 (leftmost) to +1 (rightmost)
  const t = total === 1 ? 0 : (2 * index / (total - 1)) - 1;
  const rotation = t * DRAWER_CONFIG.FAN_MAX_ROTATION_DEG;
  const yOffset = Math.abs(t) * DRAWER_CONFIG.FAN_MAX_TRANSLATE_Y;
  return {
    transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
    transformOrigin: 'bottom center',
  };
}

// ─── Sphere Action Prose ────────────────────────────────────────────────────

/**
 * Narrative consequence descriptions for sphere-aligned actions.
 * Player-facing: describes the spiritual consequence of acting through this sphere.
 * Numbers are NEVER shown here — only prose.
 */
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
  /** Whether the drawer is open */
  open: boolean;
  /** Wheel slots to display */
  slots: WheelSlot[];
  /** Target display name (agent name, location name, hex label, etc.) */
  targetName: string;
  /** Target label (tier name, location subtype, item tier, etc.) */
  targetLabel: string;
  /** Called when a slot is clicked */
  onSlotClick: (slotId: string) => void;
  /** Called when the drawer closes */
  onClose: () => void;
  /** ID of the card currently playing (pulsing animation) */
  playingCardId?: string | null;
}

// ─── Component ─────────────────────────────────────────────────────────────

/**
 * ActionDrawer — Bottom drawer sliding up from the center column.
 *
 * Shows a header bar (agent name + tier + close button) and a horizontal
 * scrollable row of ActionCard components. Cards are sorted: available first,
 * locked last. Filters out center slot.
 */
export const ActionDrawer: React.FC<ActionDrawerProps> = React.memo(
  ({ open, slots, targetName: _targetName, targetLabel: _targetLabel, onSlotClick, onClose, playingCardId }) => {
    // IA-003: Progressive disclosure — locked actions collapsed by default
    const [showLocked, setShowLocked] = useState(false);

    // Sphere consequence preview — track which card is hovered
    const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);

    const hoveredSlot = useMemo(
      () => slots.find(s => s.id === hoveredSlotId) ?? null,
      [slots, hoveredSlotId],
    );

    const spherePreviewProse = useMemo(() => {
      if (!hoveredSlot?.sphere) return null;
      return SPHERE_ACTION_PROSE[hoveredSlot.sphere] ?? null;
    }, [hoveredSlot]);

    // P5: Scroll overflow detection for edge gradients
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
      // Check scroll state on mount and when slots change
      updateScrollState();
    }, [slots, showLocked, updateScrollState]);

    // Handle Escape key
    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    // Don't render anything if not open
    if (!open) {
      return null;
    }

    // RC-028: Memoize slot filtering and sorting
    // P4: Split into observation / intervention groups for visual divider
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const { observationSlots, interventionSlots, lockedSlots } = useMemo(() => {
      const filtered = slots
        .filter(slot => slot.type !== 'info'); // Exclude center slot
      const available = filtered.filter(s => s.available);
      return {
        observationSlots: available.filter(s => s.type === 'observation'),
        interventionSlots: available.filter(s => s.type !== 'observation'),
        lockedSlots: filtered.filter(s => !s.available),
      };
    }, [slots]);

    return (
      <div
        data-testid="action-drawer"
        className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
        style={{
          transition: `all ${DRAWER_CONFIG.TRANSITION_MS}ms ease-out`,
          transform: open ? 'translateY(0)' : `translateY(100%)`,
          zIndex: 40,
          paddingBottom: '1.5rem',
        }}
      >
        {/* Close button — floating above cards */}
        <IconButton
          icon={<span>×</span>}
          variant="close"
          size="sm"
          data-testid="action-drawer-close"
          onClick={onClose}
          className="absolute top-0 right-4 pointer-events-auto"
          aria-label="Close action drawer"
        />

        {/* P5: Scrollable card hand with edge fade gradients */}
        <div className="relative pointer-events-auto" style={{ maxWidth: '90vw' }}>
          {/* P5: Left scroll fade */}
          {canScrollLeft && (
            <div
              className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)' }}
            />
          )}
          {/* P5: Right scroll fade */}
          {canScrollRight && (
            <div
              className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)' }}
            />
          )}

          <div
            ref={scrollRef}
            className="flex items-end gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none' }}
            onScroll={updateScrollState}
            onTouchMove={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* P3: Observation cards with fan rotation */}
            {observationSlots.map((slot, i) => {
              const totalAvail = observationSlots.length + interventionSlots.length;
              return (
                <div
                  key={slot.id}
                  className="flex-shrink-0 transition-transform duration-150 hover:!transform-none"
                  style={cardFanStyle(i, totalAvail)}
                  onMouseEnter={() => setHoveredSlotId(slot.id)}
                  onMouseLeave={() => setHoveredSlotId(null)}
                >
                  <ActionCard
                    slot={slot}
                    onClick={onSlotClick}
                    playing={slot.id === playingCardId}
                  />
                </div>
              );
            })}

            {/* P4: Type divider */}
            {observationSlots.length > 0 && interventionSlots.length > 0 && (
              <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-1 self-stretch">
                <div className="flex-1 w-px" style={{ background: 'linear-gradient(to bottom, transparent, var(--border-medium), transparent)' }} />
                <span style={{ fontSize: '0.5625rem', color: 'var(--text-tertiary)', letterSpacing: '0.1em', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>ACT</span>
                <div className="flex-1 w-px" style={{ background: 'linear-gradient(to bottom, transparent, var(--border-medium), transparent)' }} />
              </div>
            )}

            {/* P3: Intervention cards with fan rotation */}
            {interventionSlots.map((slot, i) => {
              const totalAvail = observationSlots.length + interventionSlots.length;
              return (
                <div
                  key={slot.id}
                  className="flex-shrink-0 transition-transform duration-150 hover:!transform-none"
                  style={cardFanStyle(observationSlots.length + i, totalAvail)}
                  onMouseEnter={() => setHoveredSlotId(slot.id)}
                  onMouseLeave={() => setHoveredSlotId(null)}
                >
                  <ActionCard
                    slot={slot}
                    onClick={onSlotClick}
                    playing={slot.id === playingCardId}
                  />
                </div>
              );
            })}

            {/* IA-003: Locked actions collapsible section */}
            {lockedSlots.length > 0 && (
              <>
                <div className="flex-shrink-0 flex items-center">
                  <Tooltip id="ui.action_locked">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLocked(!showLocked)}
                      aria-expanded={showLocked}
                      aria-label={`${showLocked ? 'Hide' : 'Show'} ${lockedSlots.length} locked actions`}
                      style={{ backdropFilter: 'blur(4px)', whiteSpace: 'nowrap' }}
                    >
                      {showLocked ? '◂ Hide' : `${lockedSlots.length} locked ▸`}
                    </Button>
                  </Tooltip>
                </div>
                {showLocked && lockedSlots.map(slot => (
                  <div
                    key={slot.id}
                    className="flex-shrink-0"
                    onMouseEnter={() => setHoveredSlotId(slot.id)}
                    onMouseLeave={() => setHoveredSlotId(null)}
                  >
                    <ActionCard
                      slot={slot}
                      onClick={onSlotClick}
                      playing={slot.id === playingCardId}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Sphere consequence preview — appears on card hover */}
        {spherePreviewProse && (
          <p
            data-testid="action-sphere-preview"
            className="pointer-events-none"
            style={{
              fontFamily: 'var(--font-prose, serif)',
              fontSize: '12px',
              color: 'var(--text-secondary, #a09880)',
              fontStyle: 'italic',
              textAlign: 'center',
              margin: '6px 0 0 0',
              lineHeight: 1.5,
            }}
          >
            {renderProseWithIPK(spherePreviewProse)}
          </p>
        )}
      </div>
    );
  }
);

ActionDrawer.displayName = 'ActionDrawer';
