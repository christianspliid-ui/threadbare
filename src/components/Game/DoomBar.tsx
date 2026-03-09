import type { DoomClockState, DoomClockDefinition } from '../../types/doomClock';
import { ProgressBar } from '../shared/ProgressBar';
import { Tooltip } from '../shared/Tooltip';
import { DOOM_ARCHETYPE_COLORS } from '../../data/uiColorPalette';

interface DoomBarProps {
  definition: DoomClockDefinition;
  state: DoomClockState;
}

export function DoomBar({ definition, state }: DoomBarProps) {
  const color = DOOM_ARCHETYPE_COLORS[definition.archetype] ?? DOOM_ARCHETYPE_COLORS.breach;
  const pct = Math.round(state.progress * 100);
  // currentStage is 1-5, so index into stages array with currentStage - 1
  const currentStageDef = definition.stages[state.currentStage - 1] ?? definition.stages[0];
  const stageName = currentStageDef?.name ?? 'Unknown';

  return (
    <Tooltip id="ui.doom_bar">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span
              className="font-bold uppercase tracking-wider"
              style={{ fontSize: 'var(--text-xs)', color, fontFamily: 'var(--font-display)' }}
            >
              {definition.archetype}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              Stage {state.currentStage}: {stageName}
            </span>
          </div>
          <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color }}>
            {state.expired ? 'THE UNMAKING' : `${pct}%`}
          </span>
        </div>
        <ProgressBar progress={state.progress} color={color} glow={true} />
      </div>
    </Tooltip>
  );
}
