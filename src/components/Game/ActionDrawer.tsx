import React, { useEffect, useMemo, useState } from 'react';
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
} as const;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const { availableSlots, lockedSlots } = useMemo(() => {
      const filtered = slots
        .filter(slot => slot.type !== 'info') // Exclude center slot
        .sort((a, b) => {
          // Sort observations before interventions
          if (a.type !== b.type) {
            return a.type === 'observation' ? -1 : 1;
          }
          return 0;
        });
      return {
        availableSlots: filtered.filter(s => s.available),
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

        {/* Card hand — centered, no background */}
        <div
          className="flex items-end gap-3 pointer-events-auto"
          onTouchMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {availableSlots.map(slot => (
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
