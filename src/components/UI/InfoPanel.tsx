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
      <div
        className="italic text-center animate-breathe"
        style={{
          padding: 'var(--panel-padding)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-tertiary)',
          background: 'linear-gradient(145deg, rgba(34, 34, 40, 0.95), rgba(26, 26, 31, 0.98))',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--panel-radius)',
        }}
      >
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
    <div style={{
      padding: 'var(--panel-padding)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
      background: 'linear-gradient(145deg, rgba(34, 34, 40, 0.95), rgba(26, 26, 31, 0.98))',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--panel-radius)',
    }}>
      <div>
        <p className="section-heading">Terrain</p>
        <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          {TERRAIN_DISPLAY[tile.terrain] || tile.terrain}
        </p>
        <p className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          Hex ({tile.coord.col}, {tile.coord.row})
        </p>
      </div>
      <div>
        <p className="section-heading" style={{ marginBottom: 'var(--space-2)' }}>Geography</p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Elevation', value: tile.geoParams.elevation },
          { label: 'Temperature', value: tile.geoParams.temperature },
          { label: 'Moisture', value: tile.geoParams.moisture },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg" style={{ padding: 'var(--space-2)', backgroundColor: 'var(--bg-raised)' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{label}</p>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>{(value * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
