import React, { useEffect, useMemo, useState } from 'react';
import { ActionCard } from './ActionCard';
import type { WheelSlot } from '../../engine/wheel';
import { Tooltip } from '../shared/Tooltip';

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
        <button
          data-testid="action-drawer-close"
          onClick={onClose}
          className="absolute top-0 right-4 transition-colors text-lg rounded-full pointer-events-auto"
          style={{
            color: 'var(--text-tertiary)',
            backgroundColor: 'rgba(10, 10, 14, 0.6)',
            width: '28px',
            height: '28px',
            lineHeight: '28px',
            textAlign: 'center',
          }}
          aria-label="Close action drawer"
        >
          ×
        </button>

        {/* Card hand — centered, no background */}
        <div
          className="flex items-end gap-3 pointer-events-auto"
          onTouchMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {availableSlots.map(slot => (
            <div key={slot.id} className="flex-shrink-0">
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
                  <button
                    onClick={() => setShowLocked(!showLocked)}
                    className="px-3 py-2 rounded transition-colors whitespace-nowrap"
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'rgba(10, 10, 14, 0.6)',
                      backdropFilter: 'blur(4px)',
                    }}
                    aria-expanded={showLocked}
                    aria-label={`${showLocked ? 'Hide' : 'Show'} ${lockedSlots.length} locked actions`}
                  >
                    {showLocked ? '◂ Hide' : `${lockedSlots.length} locked ▸`}
                  </button>
                </Tooltip>
              </div>
              {showLocked && lockedSlots.map(slot => (
                <div key={slot.id} className="flex-shrink-0">
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
    );
  }
);

ActionDrawer.displayName = 'ActionDrawer';
