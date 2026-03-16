import { Tooltip } from '../shared/Tooltip';

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
    return (
      <Tooltip label={`Tick ${tick}`} desc="Current simulation tick">
        <div className="flex items-center gap-2.5">
          {/* Season + year */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{SEASON_ICONS[season] ?? '🌍'}</span>
            <div className="flex items-center gap-1">
              <span className="capitalize font-semibold" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                {season}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Yr {year}
              </span>
            </div>
          </div>

          {/* Play/Pause */}
          <Tooltip id="ui.sim_play_pause">
            <button
              onClick={onToggle}
              className="px-2 py-0.5 rounded font-semibold transition-all duration-200"
              style={{
                fontSize: 'var(--text-sm)',
                background: running ? 'var(--accent-gold)' : 'var(--bg-raised)',
                color: running ? 'var(--bg-abyss)' : 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                boxShadow: running ? '0 0 8px var(--accent-gold-dim)' : 'none',
              }}
            >
              {running ? '⏸' : '⏵'}
            </button>
          </Tooltip>

          {/* Speed ◀ N× ▶ */}
          <Tooltip id="ui.sim_speed">
            <div className="flex items-center gap-1">
              <button
                onClick={speedDown}
                disabled={speed === SPEED_STEPS[0]}
                className="px-1.5 py-0.5 rounded transition-colors disabled:opacity-30"
                style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              >
                ◀
              </button>
              <span
                className="font-mono text-center"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: speed > 1 ? 'var(--accent-gold)' : 'var(--text-primary)',
                  minWidth: '2rem',
                }}
              >
                {speed}×
              </span>
              <button
                onClick={speedUp}
                disabled={speed === SPEED_STEPS[SPEED_STEPS.length - 1]}
                className="px-1.5 py-0.5 rounded transition-colors disabled:opacity-30"
                style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
              >
                ▶
              </button>
            </div>
          </Tooltip>
        </div>
      </Tooltip>
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
          <button
            onClick={onToggle}
            className="flex-1 py-2 rounded-lg font-semibold transition-colors"
            style={{
              fontSize: 'var(--text-sm)',
              background: running ? 'var(--accent-gold)' : 'var(--bg-raised)',
              color: running ? 'var(--bg-abyss)' : 'var(--text-primary)',
            }}
          >
            {running ? '⏸ Pause' : '▶ Play'}
          </button>
        </Tooltip>
        <button
          onClick={onStep}
          disabled={running}
          className="px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-30"
          style={{ fontSize: 'var(--text-sm)', background: 'var(--bg-raised)', color: 'var(--text-primary)' }}
        >
          ⏭ Step
        </button>
      </div>

      {/* Speed */}
      <Tooltip id="ui.sim_speed">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Speed</span>
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={speedDown}
              disabled={speed === SPEED_STEPS[0]}
              className="px-2 py-1 rounded transition-colors disabled:opacity-30"
              style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
            >
              ◀
            </button>
            <span className="flex-1 text-center font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{speed}×</span>
            <button
              onClick={speedUp}
              disabled={speed === SPEED_STEPS[SPEED_STEPS.length - 1]}
              className="px-2 py-1 rounded transition-colors disabled:opacity-30"
              style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
            >
              ▶
            </button>
          </div>
        </div>
      </Tooltip>
    </div>
  );
}
