import type { DoomClockState, DoomClockDefinition } from '../../types/doomClock';

interface DoomBarProps {
  definition: DoomClockDefinition;
  state: DoomClockState;
}

const ARCHETYPE_COLORS: Record<string, string> = {
  breach: '#dc2626',
  convergence: '#7c3aed',
  changing: '#059669',
  sundering: '#ea580c',
  failing: '#6b7280',
  ascension: '#eab308',
  reckoning: '#1d4ed8',
};

export function DoomBar({ definition, state }: DoomBarProps) {
  const color = ARCHETYPE_COLORS[definition.archetype] ?? '#dc2626';
  const pct = Math.round(state.progress * 100);
  // currentStage is 1-5, so index into stages array with currentStage - 1
  const currentStageDef = definition.stages[state.currentStage - 1] ?? definition.stages[0];
  const stageName = currentStageDef?.name ?? 'Unknown';

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color, fontFamily: 'Cinzel, serif' }}
          >
            {definition.archetype}
          </span>
          <span className="text-amber-200/60 text-xs">
            Stage {state.currentStage}: {stageName}
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color }}>
          {state.expired ? 'THE UNMAKING' : `${pct}%`}
        </span>
      </div>
      <div className="w-full h-2 bg-stone-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>
    </div>
  );
}
