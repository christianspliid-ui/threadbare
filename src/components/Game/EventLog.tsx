interface LogEntry {
  tick: number;
  message: string;
  type: 'essence' | 'influence' | 'narrative' | 'system';
}

interface EventLogProps {
  entries: LogEntry[];
}

import { EVENT_CATEGORY_COLORS } from '../../data/uiColorPalette';

const TYPE_COLORS = EVENT_CATEGORY_COLORS;

export type { LogEntry };

export function EventLog({ entries }: EventLogProps) {
  return (
    <div className="bg-stone-800/80 border border-amber-700/30 rounded-xl p-4 flex flex-col" style={{ maxHeight: '280px' }}>
      <h3
        className="text-sm font-bold text-amber-100 uppercase tracking-widest mb-3"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Chronicle
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin" aria-live="polite" aria-label="Game event log">
        {entries.length === 0 && (
          <p className="text-xs text-amber-600/40 italic">The world awaits...</p>
        )}
        {[...entries].reverse().map((entry, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="text-amber-600/40 font-mono w-8 shrink-0 text-right">
              {entry.tick}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
              style={{ background: TYPE_COLORS[entry.type] ?? '#78716c' }}
            />
            <span className="text-amber-200/70 leading-relaxed">
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
