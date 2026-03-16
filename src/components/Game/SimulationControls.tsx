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

const SEASON_ICONS: Record<string, string> = {
  spring: '∿', summer: '☼', autumn: '◇', winter: '❋',
};

export function SimulationControls({
  tick, season, year, running, speed,
  onToggle, onStep, onSpeedChange, compact,
}: SimulationControlsProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        {/* Season + date */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span style={{ fontSize: '1rem', lineHeight: 1 }}>{SEASON_ICONS[season] ?? '🌍'}</span>
          <div className="flex items-center gap-1">
            <span className="capitalize font-semibold" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
              {season}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Yr {year}
            </span>
            <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              · T{tick}
            </span>
          </div>
        </div>

        {/* Play / Step */}
        <div className="flex items-center gap-1">
          <Tooltip id="ui.sim_play_pause">
            <button
              onClick={onToggle}
              className="px-2 py-0.5 rounded font-semibold transition-colors"
              style={{
                fontSize: 'var(--text-xs)',
                background: running ? 'var(--accent-gold)' : 'var(--bg-raised)',
                color: running ? 'var(--bg-abyss)' : 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {running ? '⏸' : '▶'}
            </button>
          </Tooltip>
          <button
            onClick={onStep}
            disabled={running}
            className="px-2 py-0.5 rounded font-semibold transition-colors disabled:opacity-30"
            style={{ fontSize: 'var(--text-xs)', background: 'var(--bg-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
          >
            ⏭
          </button>
        </div>

        {/* Speed */}
        <Tooltip id="ui.sim_speed">
          <div className="flex items-center gap-1.5">
            <input
              type="range"
              min={1}
              max={20}
              value={speed}
              onChange={(e) => onSpeedChange(parseInt(e.target.value))}
              className="w-20 h-1 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: 'var(--accent-gold)',
                background: `linear-gradient(to right, var(--accent-gold) ${(speed / 20) * 100}%, var(--bg-raised) ${(speed / 20) * 100}%)`,
              }}
            />
            <span className="font-mono w-5 text-right" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{speed}×</span>
          </div>
        </Tooltip>
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
          <input
            type="range"
            min={1}
            max={20}
            value={speed}
            onChange={(e) => onSpeedChange(parseInt(e.target.value))}
            className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: 'var(--accent-gold)',
              background: `linear-gradient(to right, var(--accent-gold) ${(speed / 20) * 100}%, var(--bg-raised) ${(speed / 20) * 100}%)`,
            }}
          />
          <span className="font-mono w-8 text-right" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>{speed}×</span>
        </div>
      </Tooltip>
    </div>
  );
}
