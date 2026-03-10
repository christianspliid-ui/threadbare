import type { HexTile } from '../../types';

const TERRAIN_DISPLAY: Record<string, string> = {
  ocean: 'Ocean',
  coastal_shallows: 'Coastal Shallows',
  lake: 'Lake',
  river: 'River',
  grassland: 'Grassland',
  farmland: 'Farmland',
  savanna: 'Savanna',
  steppe: 'Steppe',
  temperate_forest: 'Temperate Forest',
  dense_forest: 'Dense Forest',
  boreal_forest: 'Boreal Forest',
  jungle: 'Jungle',
  swamp: 'Swamp',
  marsh: 'Marsh',
  hills: 'Hills',
  mountains: 'Mountains',
  plateau: 'Plateau',
  badlands: 'Badlands',
  desert: 'Desert',
  tundra: 'Tundra',
  glacier: 'Glacier',
  volcano: 'Volcano',
};

function getTerrainDescription(
  terrain: string,
  elevation: number,
  temperature: number,
  moisture: number
): string {
  const elevLabel =
    elevation < 0.25
      ? 'very low'
      : elevation < 0.4
      ? 'low'
      : elevation < 0.6
      ? 'moderate'
      : elevation < 0.8
      ? 'high'
      : 'very high';

  const tempLabel =
    temperature < 0.15 ? 'frozen' : temperature < 0.3 ? 'cold' : temperature < 0.5 ? 'cool' : temperature < 0.7 ? 'warm' : 'hot';

  const moistLabel =
    moisture < 0.2 ? 'arid' : moisture < 0.4 ? 'dry' : moisture < 0.6 ? 'moderate' : moisture < 0.8 ? 'wet' : 'saturated';

  return `${tempLabel.charAt(0).toUpperCase() + tempLabel.slice(1)} ${TERRAIN_DISPLAY[terrain] || terrain}, ${elevLabel} elevation, ${moistLabel} moisture`;
}

interface InfoPanelProps {
  tile: HexTile | null;
}

export function InfoPanel({ tile }: InfoPanelProps) {
  if (!tile) {
    return (
      <div className="bg-stone-700 border border-amber-700 rounded-xl p-5 text-amber-300 text-sm italic">
        Hover over a hex to see details
      </div>
    );
  }

  const desc = getTerrainDescription(
    tile.terrain,
    tile.geoParams.elevation,
    tile.geoParams.temperature,
    tile.geoParams.moisture
  );

  return (
    <div className="bg-stone-700 border border-amber-700 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-xs text-amber-200 uppercase tracking-widest">Terrain</p>
        <p className="text-base font-bold text-amber-100">{TERRAIN_DISPLAY[tile.terrain] || tile.terrain}</p>
        <p className="text-xs text-amber-300 font-mono">Hex ({tile.coord.col}, {tile.coord.row})</p>
      </div>
      <div>
        <p className="text-xs text-amber-200 uppercase tracking-widest mb-2">Geography</p>
        <p className="text-xs text-amber-300 leading-relaxed">{desc}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Elevation', value: tile.geoParams.elevation },
          { label: 'Temperature', value: tile.geoParams.temperature },
          { label: 'Moisture', value: tile.geoParams.moisture },
        ].map(({ label, value }) => (
          <div key={label} className="bg-stone-600 rounded-lg p-2">
            <p className="text-xs text-amber-300">{label}</p>
            <p className="text-sm font-bold text-amber-100">{(value * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
