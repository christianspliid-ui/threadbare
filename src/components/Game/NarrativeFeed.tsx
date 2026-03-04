import { useEffect, useRef } from 'react';
import type { TickEvent } from '../../types/gameState';

interface NarrativeFeedProps {
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
};

export function NarrativeFeed({ events }: NarrativeFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

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
      {events.map((evt) => {
        const color = TYPE_COLORS[evt.type] ?? '#78716c';
        const dimmed = evt.significance < 0.5;

        return (
          <div
            key={evt.id}
            className={`flex gap-2 text-xs py-0.5 ${dimmed ? 'opacity-50' : 'opacity-90'}`}
          >
            <span className="text-amber-200/30 font-mono w-8 text-right flex-shrink-0">
              {evt.tick}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-amber-200/80 leading-relaxed">
              {evt.message}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
