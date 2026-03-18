import { useEffect, useRef, useMemo } from 'react';
import type { TickEvent } from '../../types/gameState';
import { TICK_EVENT_COLORS } from '../../data/uiColorPalette';

interface NarrativeFeedProps {
  events: TickEvent[];
}

const TYPE_COLORS = TICK_EVENT_COLORS;

interface AggregatedEvent {
  event: TickEvent;
  count: number;
  firstTick: number;
  lastTick: number;
}

export function NarrativeFeed({ events }: NarrativeFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Aggregate consecutive events with identical messages
  const aggregatedEvents = useMemo(() => {
    if (events.length === 0) return [];

    const result: AggregatedEvent[] = [];
    let currentEvent = events[0];
    let count = 1;
    let firstTick = events[0].tick;

    for (let i = 1; i < events.length; i++) {
      if (events[i].message === currentEvent.message) {
        count++;
      } else {
        result.push({
          event: currentEvent,
          count,
          firstTick,
          lastTick: events[i - 1].tick,
        });
        currentEvent = events[i];
        count = 1;
        firstTick = events[i].tick;
      }
    }

    // Push the last group
    result.push({
      event: currentEvent,
      count,
      firstTick,
      lastTick: events[events.length - 1].tick,
    });

    return result;
  }, [events]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="text-amber-200/30 text-xs italic text-center py-4">
        Awaiting the first whispers of fate...
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
      {aggregatedEvents.map((group, idx) => {
        const evt = group.event;
        const color = TYPE_COLORS[evt.type] ?? '#78716c';
        const dimmed = evt.significance < 0.5;
        const showTickRange = group.count > 1;

        return (
          <div
            key={`${evt.id}_${idx}`}
            className={`flex gap-2 text-xs py-0.5 ${dimmed ? 'opacity-50' : 'opacity-90'}`}
          >
            <span className="text-amber-200/30 font-mono w-8 text-right flex-shrink-0">
              {showTickRange ? `${group.firstTick}-${group.lastTick}` : evt.tick}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1 flex items-center justify-between gap-2 leading-relaxed">
              <span className="text-amber-200/80">
                {evt.message}
              </span>
              {group.count > 1 && (
                <span className="text-amber-900/60 font-mono whitespace-nowrap flex-shrink-0">
                  ×{group.count}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
