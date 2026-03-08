import React, { useEffect } from 'react';
import { ActionCard } from './ActionCard';
import type { WheelSlot } from '../../engine/wheel';

// ─── Constants ─────────────────────────────────────────────────────────────

const DRAWER_CONFIG = {
  HEIGHT_PERCENT: 35,
  TRANSITION_MS: 200,
} as const;

// ─── Props ────────────────────────────────────────────────────────────────

export interface ActionDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Wheel slots to display */
  slots: WheelSlot[];
  /** Agent name to display in header */
  agentName: string;
  /** Agent tier to display in header */
  agentTier: string;
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
  ({ open, slots, agentName, agentTier, onSlotClick, onClose, playingCardId }) => {
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

    // Filter out center slot and sort: available first, then locked
    const displaySlots = slots
      .filter(slot => slot.type !== 'info') // Exclude center slot
      .sort((a, b) => {
        // Available slots first
        if (a.available !== b.available) {
          return a.available ? -1 : 1;
        }
        // Then sort observations before interventions
        if (a.type !== b.type) {
          return a.type === 'observation' ? -1 : 1;
        }
        return 0;
      });

    return (
      <div
        data-testid="action-drawer"
        className="fixed bottom-0 left-0 right-0 bg-stone-900/98 border-t border-amber-800/50 shadow-2xl backdrop-blur-sm"
        style={{
          height: `${DRAWER_CONFIG.HEIGHT_PERCENT}%`,
          transition: `all ${DRAWER_CONFIG.TRANSITION_MS}ms ease-out`,
          transform: open ? 'translateY(0)' : `translateY(100%)`,
          zIndex: 40,
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/20 bg-stone-900/50">
          {/* Agent name and tier */}
          <div className="flex flex-col">
            <div className="text-lg font-serif text-amber-100">{agentName}</div>
            <div className="text-xs text-amber-700">{agentTier}</div>
          </div>

          {/* Close button */}
          <button
            data-testid="action-drawer-close"
            onClick={onClose}
            className="text-2xl text-amber-700 hover:text-amber-400 transition-colors"
            aria-label="Close action drawer"
          >
            ×
          </button>
        </div>

        {/* Card area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-3">
          <div className="flex gap-3">
            {displaySlots.map(slot => (
              <div
                key={slot.id}
                onClick={() => onSlotClick(slot.id)}
                className="flex-shrink-0"
              >
                <ActionCard
                  slot={slot}
                  onClick={onSlotClick}
                  playing={slot.id === playingCardId}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

ActionDrawer.displayName = 'ActionDrawer';
