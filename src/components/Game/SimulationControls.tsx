import { Tooltip } from '../shared/Tooltip';
import { Button } from '../shared/Button';
import { IconButton } from '../shared/IconButton';

interface SimulationControlsProps {
  tick: number;
  season: string;
  year: number;
  running: boolean;
  speed: number;
  onToggle: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  compact?: boolean;
}

export const SPEED_STEPS = [1, 2, 3, 5, 10, 20];

const SEASON_ICONS: Record<string, string> = {
  spring: '∿', summer: '☼', autumn: '◇', winter: '❋',
};

export function SimulationControls({
  tick, season, year, running, speed,
  onToggle, onStep, onSpeedChange, compact,
}: SimulationControlsProps) {
  function speedDown() {
    const idx = SPEED_STEPS.indexOf(speed);
    const prev = SPEED_STEPS[Math.max(idx - 1, 0)];
    if (prev !== undefined && prev !== speed) onSpeedChange(prev);
  }

  function speedUp() {
    const idx = SPEED_STEPS.indexOf(speed);
    const next = SPEED_STEPS[Math.min(idx + 1, SPEED_STEPS.length - 1)];
    if (next !== undefined && next !== speed) onSpeedChange(next);
  }

  if (compact) {
    const statusText = running ? `running ×${speed}` : 'paused';
    return (
      <div className="topbar-tier">
        <span className="topbar-section-label">Time</span>
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <Tooltip label={`Tick ${tick}`} desc="Current simulation tick">
            <IconButton
              icon={<span>{running ? '⏸' : '⏵'}</span>}
              size="sm"
              active={running}
              onClick={onToggle}
              aria-label={running ? 'Pause simulation' : 'Play simulation'}
            />
          </Tooltip>
          <span
            style={{
              font: 'var(--type-body-small)',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            tick {tick} · {season} · year {year}
          </span>
        </div>
        <span
          style={{
            font: 'var(--type-body-small)',
            color: 'var(--text-tertiary)',
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
          }}
        >
          {statusText}
        </span>
      </div>
    );
  }

  return (
    <div className="panel-glass space-y-3" style={{ padding: 'var(--panel-padding)' }}>
      <div className="flex items-center justify-between">
        <h2
          className="font-bold uppercase tracking-widest"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
        >
          Time
        </h2>
        <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          Tick {tick}
        </span>
      </div>

      {/* Season & year display */}
      <div className="flex items-center justify-center gap-3 py-2">
        <span className="text-2xl">{SEASON_ICONS[season] ?? '🌍'}</span>
        <div className="text-center">
          <p className="font-semibold capitalize" style={{ color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{season}</p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Year {year}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Tooltip id="ui.sim_play_pause">
          <Button
            variant={running ? 'primary' : 'secondary'}
            fullWidth
            onClick={onToggle}
          >
            {running ? '⏸ Pause' : '▶ Play'}
          </Button>
        </Tooltip>
        <Button
          variant="secondary"
          onClick={onStep}
          disabled={running}
        >
          ⏭ Step
        </Button>
      </div>

      {/* Speed */}
      <Tooltip id="ui.sim_speed">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Speed</span>
          <div className="flex items-center gap-2 flex-1">
            <IconButton
              icon={<span>◀</span>}
              size="sm"
              onClick={speedDown}
              disabled={speed === SPEED_STEPS[0]}
              aria-label="Decrease speed"
            />
            <span className="flex-1 text-center font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{speed}×</span>
            <IconButton
              icon={<span>▶</span>}
              size="sm"
              onClick={speedUp}
              disabled={speed === SPEED_STEPS[SPEED_STEPS.length - 1]}
              aria-label="Increase speed"
            />
          </div>
        </div>
      </Tooltip>
    </div>
  );
}
