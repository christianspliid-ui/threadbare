import React, { useMemo, useState } from 'react';
import type { TickEvent } from '../../../types/gameState';
import { getSphereColor } from '../../../data/sphereIcons';
import { TICK_EVENT_COLORS } from '../../../data/uiColorPalette';
import { EMPTY_STATE_STYLE } from './debugPanelStyles';

interface RecentEventsViewProps {
  getRecentEvents?: () => readonly TickEvent[];
}

const TYPE_COLORS = TICK_EVENT_COLORS;
const EMPTY_EVENTS: readonly TickEvent[] = [];

export function RecentEventsView({ getRecentEvents }: RecentEventsViewProps) {
  const [streamEnabled, setStreamEnabled] = useState(false);

  const events = useMemo(() => {
    if (!streamEnabled || !getRecentEvents) return EMPTY_EVENTS;
    return getRecentEvents();
  }, [streamEnabled, getRecentEvents]);

  return (
    <div style={{ padding: '8px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
        <input
          type="checkbox"
          checked={streamEnabled}
          onChange={(event) => setStreamEnabled(event.target.checked)}
          aria-label="Stream recent events"
        />
        Stream recent events
      </label>

      {streamEnabled && events.length === 0 ? (
        <div style={EMPTY_STATE_STYLE}>No recent events yet.</div>
      ) : streamEnabled ? (
        <div className="space-y-1">
          {events.map((evt) => {
            const color = TYPE_COLORS[evt.type] ?? '#78716c';
            const dimmed = evt.significance < 0.5;
            const isInterventionBeat = evt.isInterventionBeat === true;
            const sphereColor = isInterventionBeat ? getSphereColor(evt.sphere ?? 'mind') : undefined;
            const witnessCount = evt.witnessAgentIds?.length ?? 0;

            return (
              <div
                key={evt.id}
                data-testid={isInterventionBeat ? 'intervention-beat' : 'recent-event-row'}
                className={`flex gap-2 py-1 ${
                  isInterventionBeat
                    ? 'opacity-100 pl-2 border-l-[3px]'
                    : `${dimmed ? 'opacity-50' : 'opacity-90'}`
                }`}
                style={{
                  fontSize: isInterventionBeat ? 'var(--text-sm)' : 'var(--text-xs)',
                  ...(isInterventionBeat ? { borderLeftColor: sphereColor } : {}),
                }}
              >
                <span className="font-mono w-8 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {evt.tick}
                </span>
                <span className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="flex-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
