import type { SphereName } from '../../types';

const SPHERE_LABELS: Record<SphereName, string> = {
  force: 'Force',
  matter: 'Matter',
  energy: 'Energy',
  life: 'Life',
  mind: 'Mind',
  spirit: 'Spirit',
  time: 'Time',
  entropy: 'Entropy',
};

const SPHERE_ICONS: Record<SphereName, string> = {
  force: '⚡',
  matter: '🪨',
  energy: '🔥',
  life: '🌿',
  mind: '🧠',
  spirit: '👻',
  time: '⏳',
  entropy: '🌀',
};

const SPHERE_COLORS: Record<SphereName, string> = {
  force: '#d4a574',
  matter: '#9d7b5a',
  energy: '#e87534',
  life: '#7cb342',
  mind: '#9c27b0',
  spirit: '#5c6bc0',
  time: '#00bcd4',
  entropy: '#b71c1c',
};

interface SphereSliderProps {
  sphere: SphereName;
  value: number;
  onChange: (sphere: SphereName, value: number) => void;
}

export function SphereSlider({ sphere, value, onChange }: SphereSliderProps) {
  const color = SPHERE_COLORS[sphere];
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-lg w-6 text-center">{SPHERE_ICONS[sphere]}</span>
      <span className="text-sm font-medium w-16 text-amber-100" style={{ color }}>
        {SPHERE_LABELS[sphere]}
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(sphere, parseInt(e.target.value) / 100)}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          accentColor: color,
          background: `linear-gradient(to right, ${color} ${value * 100}%, #5a4a3a ${value * 100}%)`,
        }}
      />
      <span className="text-xs text-amber-200 w-10 text-right font-mono">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}
