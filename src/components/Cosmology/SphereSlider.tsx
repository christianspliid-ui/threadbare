import type { SphereName } from '../../types';
import { getSphereSymbol, getSphereColor } from '../../data/sphereIcons';

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

interface SphereSliderProps {
  sphere: SphereName;
  value: number;
  onChange: (sphere: SphereName, value: number) => void;
}

export function SphereSlider({ sphere, value, onChange }: SphereSliderProps) {
  const color = getSphereColor(sphere);
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-lg w-6 text-center" style={{ color }}>{getSphereSymbol(sphere)}</span>
      <span className="font-medium w-16" style={{ fontSize: 'var(--text-xs)', color }}>
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
      <span className="w-10 text-right font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{(value * 100).toFixed(0)}%</span>
    </div>
  );
}
