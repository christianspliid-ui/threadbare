import type { SphereName } from '../../types';
import type { SphereInfluence, LineOfSight } from '../../engine/hexZoom';
import type { TerrainType } from '../../types';
import { getSphereColor } from '../../data/sphereIcons';

const SIGHT_LABELS: Record<LineOfSight, string> = {
  full: 'Full Sight',
  partial: 'Partial Sight',
  none: 'No Sight',
};

const SIGHT_COLORS: Record<LineOfSight, string> = {
  full: '#d4af37',
  partial: '#d4af3780',
  none: '#666666',
};

// Terrain display colors
const TERRAIN_COLORS: Record<string, string> = {
  ocean: '#1e3a5f',
  coastal_shallows: '#2e5a7f',
  lake: '#3a6fa8',
  river: '#4a7fb8',
  grassland: '#6b8e23',
  farmland: '#7a9d32',
  savanna: '#9a9933',
  steppe: '#8a8933',
  deciduous_forest: '#4a7c3e',
  dense_forest: '#2d5a2d',
  taiga: '#5a6e3f',
  jungle: '#1d4d1d',
  swamp: '#5a5a3a',
  bog: '#6a6a4a',
  hills: '#9a8a6a',
  mountains: '#8a7a5a',
  plateau: '#a89a7a',
  badlands: '#b8956a',
  desert: '#d4a574',
  tundra: '#c0c0c0',
  glacier: '#e8f0f8',
  volcanic: '#4a3a2a',
};

interface HexBreadcrumbProps {
  hexCol: number;
  hexRow: number;
  terrain: TerrainType;
  locationCount: number;
  agentCount: number;
  lineOfSight: LineOfSight;
  sphereInfluence: SphereInfluence;
  onBack: () => void;
}

export function HexBreadcrumb({
  hexCol,
  hexRow,
  terrain,
  locationCount,
  agentCount,
  lineOfSight,
  sphereInfluence,
  onBack,
}: HexBreadcrumbProps) {
  const terrainLabel = terrain
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const activeSpheres = (Object.entries(sphereInfluence) as [SphereName, number][])
    .filter(([, v]) => v > 0);

  const terrainColor = TERRAIN_COLORS[terrain] || '#6b8e23';

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-stone-800/90 border-b border-amber-900/30">
      <button
        onClick={onBack}
        aria-label="back"
        className="text-amber-400 hover:text-amber-200 transition-colors text-lg px-2"
      >
        ←
      </button>

      {/* Terrain dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: terrainColor }}
        title={terrainLabel}
      />

      <h2
        className="text-amber-100 text-sm font-semibold tracking-wide"
        style={{ fontFamily: 'Cinzel, serif' }}
      >
        {terrainLabel} Hex ({hexCol}, {hexRow})
      </h2>

      {/* Sphere influence dots */}
      {activeSpheres.length > 0 && (
        <div className="flex gap-1 ml-2">
          {activeSpheres.map(([sphere]) => (
            <div
              key={sphere}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getSphereColor(sphere) }}
              title={sphere}
            />
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Stats */}
      <span className="text-amber-400/60 text-xs">
        {locationCount} locations · {agentCount} agents
      </span>

      {/* Line of sight */}
      <span
        className="text-xs font-medium px-2 py-0.5 rounded"
        style={{ color: SIGHT_COLORS[lineOfSight], borderColor: SIGHT_COLORS[lineOfSight], borderWidth: 1 }}
      >
        {SIGHT_LABELS[lineOfSight]}
      </span>
    </div>
  );
}
