import { FORCE_NAMES, type HexTile, type ForceName } from '../../types';
import { FORCE_COLORS } from '../../engine/color';

const TERRAIN_DISPLAY: Record<string, string> = {
  crystal_wastes: 'Crystal Wastes', enchanted_grove: 'Enchanted Grove', runed_mountains: 'Runed Mountains',
  deep_forest: 'Deep Forest', haunted_wood: 'Haunted Wood', volcanic_jungle: 'Volcanic Jungle',
  scorched_plains: 'Scorched Plains', lightning_fields: 'Lightning Fields', forge_mountains: 'Forge Mountains',
  shadow_marsh: 'Shadow Marsh', fungal_forest: 'Fungal Forest', void_rift: 'Void Rift',
  stone_highlands: 'Stone Highlands', obsidian_peaks: 'Obsidian Peaks', buried_ruins: 'Buried Ruins',
  contested_ground: 'Contested Ground',
};

interface InfoPanelProps { tile: HexTile | null; }

export function InfoPanel({ tile }: InfoPanelProps) {
  if (!tile) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 text-gray-500 text-sm italic">
        Hover over a hex to see details
      </div>
    );
  }
  const sortedForces = [...FORCE_NAMES].sort((a, b) => tile.forces[b] - tile.forces[a]);
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest">Terrain</p>
        <p className="text-base font-bold text-gray-100">{TERRAIN_DISPLAY[tile.terrain] || tile.terrain}</p>
        <p className="text-xs text-gray-500 font-mono">Hex ({tile.coord.col}, {tile.coord.row})</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1.5">Forces</p>
        <div className="space-y-1">
          {sortedForces.map(force => {
            const color = FORCE_COLORS[force].primary;
            const pct = Math.round(tile.forces[force] * 100);
            return (
              <div key={force} className="flex items-center gap-2">
                <span className="text-xs w-16 capitalize" style={{ color }}>{force}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right font-mono">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Elevation', value: tile.elevation },
          { label: 'Moisture', value: tile.moisture },
          { label: 'Magic', value: tile.magicDensity },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-800 rounded-lg p-2">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm font-bold text-gray-200">{(value * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
