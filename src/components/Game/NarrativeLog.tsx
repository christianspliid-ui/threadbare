import { useState, useRef, useEffect } from 'react';
import type { TickEvent } from '../../types/gameState';

interface NarrativeLogProps {
  events: TickEvent[];
}

const TYPE_COLORS: Record<TickEvent['type'], string> = {
  agent_action: '#d4a574',
  agent_action_resolved: '#c4956a',
  doom_escalation: '#dc2626',
  rival_action: '#7c3aed',
  essence_gain: '#b8860b',
  mandate_progress: '#059669',
  narrative: '#9c27b0',
  phase_change: '#eab308',
  stealth_alert: '#6b7280',
  dilemma_resolved: '#44aaff',
};

export function NarrativeLog({ events }: NarrativeLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const lastSeenCountRef = useRef(0);

  // Update lastSeenCount when panel opens
  useEffect(() => {
    if (isOpen) {
      lastSeenCountRef.current = events.length;
    }
  }, [isOpen, events.length]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const unreadCount = events.length - lastSeenCountRef.current;

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Pill button */}
      <button
        data-testid="narrative-log-toggle"
        onClick={togglePanel}
        className={`fixed bottom-4 left-4 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-2 ${
          isOpen
            ? 'bg-amber-900/40 text-amber-200/90'
            : 'bg-stone-800/90 hover:bg-stone-700/90 text-amber-200/70 hover:text-amber-200'
        } backdrop-blur-sm border border-amber-900/30`}
      >
        <span className="text-lg">📜</span>
        {!isOpen && unreadCount > 0 && (
          <span
            data-testid="narrative-log-badge"
            className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-amber-600/60 text-stone-900 font-bold text-xs"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div
          data-testid="narrative-log-panel"
          className="fixed bottom-20 left-4 w-80 max-h-96 bg-stone-900/95 border border-amber-900/40 rounded-lg shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="border-b border-amber-900/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <h3 className="text-sm font-semibold text-amber-200/90">Chronicle</h3>
            <button
              onClick={togglePanel}
              className="text-amber-200/50 hover:text-amber-200/80 transition-colors"
              aria-label="Close narrative log"
            >
              ✕
            </button>
          </div>

          {/* Events list */}
          <div className="flex-1 overflow-y-auto space-y-1 px-3 py-3 pr-2">
            {events.length === 0 ? (
              <div className="text-amber-200/30 text-xs italic text-center py-8">
                Awaiting the first whispers of fate...
              </div>
            ) : (
              events.map((evt) => {
                const color = TYPE_COLORS[evt.type] ?? '#78716c';
                const dimmed = evt.significance < 0.5;

                return (
                  <div
                    key={evt.id}
                    className={`flex gap-2 text-xs py-1 ${dimmed ? 'opacity-50' : 'opacity-90'}`}
                  >
                    <span className="text-amber-200/30 font-mono w-8 text-right flex-shrink-0">
                      {evt.tick}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-amber-200/80 flex-1 leading-relaxed">
                      {evt.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}
