interface SimulationControlsProps {
  tick: number;
  season: string;
  year: number;
  running: boolean;
  speed: number;
  onToggle: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
}

const SEASON_ICONS: Record<string, string> = {
  spring: '🌱', summer: '☀️', autumn: '🍂', winter: '❄️',
};

export function SimulationControls({
  tick, season, year, running, speed,
  onToggle, onStep, onSpeedChange,
}: SimulationControlsProps) {
  return (
    <div className="bg-stone-700/80 border border-amber-700/30 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2
          className="text-sm font-bold text-amber-100 uppercase tracking-widest"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          Time
        </h2>
        <span className="text-xs text-amber-400/60 font-mono">
          Tick {tick}
        </span>
      </div>

      {/* Season & year display */}
      <div className="flex items-center justify-center gap-3 py-2">
        <span className="text-2xl">{SEASON_ICONS[season] ?? '🌍'}</span>
        <div className="text-center">
          <p className="text-amber-100 text-sm font-semibold capitalize">{season}</p>
          <p className="text-amber-400/50 text-xs">Year {year}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: running ? '#7c2d12' : '#78350f',
            color: '#fef3c7',
          }}
        >
          {running ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={onStep}
          disabled={running}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-30"
          style={{ background: '#44403c', color: '#d6d3d1' }}
        >
          ⏭ Step
        </button>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-amber-400/60">Speed</span>
        <input
          type="range"
          min={1}
          max={20}
          value={speed}
          onChange={(e) => onSpeedChange(parseInt(e.target.value))}
          className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
          style={{
            accentColor: '#b8860b',
            background: `linear-gradient(to right, #b8860b ${(speed / 20) * 100}%, #3a3020 ${(speed / 20) * 100}%)`,
          }}
        />
        <span className="text-xs text-amber-200 font-mono w-8 text-right">{speed}×</span>
      </div>
    </div>
  );
}
