import React, { useState, useRef, useEffect } from 'react';
import type { TickEvent } from '../../types/gameState';
import { getSphereColor } from '../../data/sphereIcons';
import { TICK_EVENT_COLORS } from '../../data/uiColorPalette';

interface NarrativeLogProps {
  events: TickEvent[];
  onSelectAgent?: (agentId: string) => void;
}

const TYPE_COLORS = TICK_EVENT_COLORS;

export function NarrativeLog({ events, onSelectAgent }: NarrativeLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const lastSeenCountRef = useRef(0);
  const prevCountRef = useRef(events.length);

  // Track new entries for animation
  const newEntryCount = events.length - prevCountRef.current;

  useEffect(() => {
    prevCountRef.current = events.length;
  }, [events.length]);

  // Update lastSeenCount when panel opens
  useEffect(() => {
    if (isOpen) {
      lastSeenCountRef.current = events.length;
    }
  }, [isOpen, events.length]);

  // Auto-open when a new intervention beat arrives
  useEffect(() => {
    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      if (lastEvent.isInterventionBeat === true) {
        setIsOpen(true);
      }
    }
  }, [events]);

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
        className={`fixed bottom-4 left-4 z-50 px-3 py-2 rounded-full font-medium transition-all duration-200 flex items-center gap-2 backdrop-blur-sm ${
          isOpen
            ? 'text-primary'
            : 'text-secondary hover:text-primary'
        } border transition-colors`}
        style={{
          fontSize: 'var(--text-xs)',
          backgroundColor: isOpen ? 'var(--accent-gold-dim)' : 'var(--bg-raised)',
          color: isOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
          borderColor: 'var(--border-gold)',
        }}
      >
        <span className="text-lg">☰</span>
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
          className="fixed bottom-20 left-4 z-50 w-80 max-h-96 rounded-lg shadow-2xl backdrop-blur-sm overflow-hidden flex flex-col border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-medium)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h3
              className="font-semibold"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
              }}
            >
              Chronicle
            </h3>
            <button
              onClick={togglePanel}
              className="transition-colors"
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--text-tertiary)',
              }}
              aria-label="Close narrative log"
            >
              ✕
            </button>
          </div>

          {/* Events list */}
          <div className="flex-1 overflow-y-auto space-y-1 px-3 py-3 pr-2" aria-live="polite" aria-label="Narrative event log">
            {events.length === 0 ? (
              <div
                className="italic text-center py-8 animate-breathe"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}
              >
                Awaiting the first whispers of fate...
              </div>
            ) : (
              events.map((evt, i) => {
                const color = TYPE_COLORS[evt.type] ?? '#78716c';
                const dimmed = evt.significance < 0.5;
                const isInterventionBeat = evt.isInterventionBeat === true;
                const sphereColor = isInterventionBeat ? getSphereColor(evt.sphere ?? 'mind') : undefined;
                const isNew = newEntryCount > 0 && i >= events.length - newEntryCount;
                const isClickable = Boolean(evt.actorId && onSelectAgent);

                const witnessCount = evt.witnessAgentIds?.length ?? 0;
                const rowContent = (
                  <>
                    <span
                      className="font-mono w-8 text-right flex-shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {evt.tick}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span
                      className="flex-1 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {evt.message}
                      {witnessCount > 0 && (
                        <span
                          className="block"
                          style={{ fontSize: 'var(--text-2xs, 10px)', color: 'var(--text-muted)', marginTop: '2px' }}
                          title={evt.witnessAgentIds?.join(', ')}
                        >
                          Witnessed by {witnessCount}
                        </span>
                      )}
                    </span>
                  </>
                );

                const sharedClasses = `flex gap-2 py-1 ${isNew ? 'anim-fade-up-enter' : ''} ${
                  isInterventionBeat
                    ? 'opacity-100 pl-2 border-l-[3px]'
                    : `${dimmed ? 'opacity-50' : 'opacity-90'}`
                } ${isClickable ? 'cursor-pointer hover:bg-white/5 rounded' : ''}`;

                const sharedStyle: React.CSSProperties = {
                  fontSize: isInterventionBeat ? 'var(--text-sm)' : 'var(--text-xs)',
                  ...(isInterventionBeat ? { borderLeftColor: sphereColor } : {}),
                };

                return isClickable ? (
                  <button
                    key={evt.id}
                    data-testid={isInterventionBeat ? 'intervention-beat' : undefined}
                    className={`w-full text-left ${sharedClasses}`}
                    style={sharedStyle}
                    onClick={() => onSelectAgent!(evt.actorId!)}
                    title="Click to view agent"
                  >
                    {rowContent}
                  </button>
                ) : (
                  <div
                    key={evt.id}
                    data-testid={isInterventionBeat ? 'intervention-beat' : undefined}
                    className={sharedClasses}
                    style={sharedStyle}
                  >
                    {rowContent}
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
