import type { ForceName } from '../../types';
import { FORCE_COLORS } from '../../engine/color';

const FORCE_LABELS: Record<ForceName, string> = {
  aether: 'Aether', verdance: 'Verdance', ignis: 'Ignis', umbra: 'Umbra', terra: 'Terra',
};
const FORCE_ICONS: Record<ForceName, string> = {
  aether: '✦', verdance: '🌿', ignis: '🔥', umbra: '🌑', terra: '⛰',
};

interface ForceSliderProps {
  force: ForceName;
  value: number;
  onChange: (force: ForceName, value: number) => void;
}

export function ForceSlider({ force, value, onChange }: ForceSliderProps) {
  const color = FORCE_COLORS[force].primary;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-lg w-6 text-center">{FORCE_ICONS[force]}</span>
      <span className="text-sm font-medium w-20" style={{ color }}>{FORCE_LABELS[force]}</span>
      <input
        type="range" min={0} max={100} value={Math.round(value * 100)}
        onChange={(e) => onChange(force, parseInt(e.target.value) / 100)}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: color, background: `linear-gradient(to right, ${color} ${value * 100}%, #333 ${value * 100}%)` }}
      />
      <span className="text-xs text-gray-400 w-10 text-right font-mono">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}
