import type { SphereName } from '../../types';
import type { SphereInfluence, LineOfSight, HexCultureSummary, HexFactionSummary } from '../../engine/hexZoom';
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

// Terrain display colors — all capped at ~40%L per STYLE.md brightness ceiling
const TERRAIN_COLORS: Record<string, string> = {
  ocean: '#1e3a5f',
  coastal_shallows: '#2e4a60',
  deep_ocean: '#142840',
  tropical_ocean: '#1e3858',
  reef: '#2a4a55',
  lake: '#2a4a68',
  river: '#2a4568',
  grassland: '#3a5518',
  farmland: '#3e5520',
  savanna: '#4a4a1a',
  steppe: '#3e3e1a',
  temperate_forest: '#2a4a24',
  dense_forest: '#1d3a1d',
  boreal_forest: '#2e3a20',
  forested_hills: '#2a4020',
  great_home_trees: '#1a3018',
  jungle: '#1d3d1d',
  swamp: '#3a3a22',
  marsh: '#3a3a28',
  hills: '#4a4028',
  mountains: '#3a3228',
  plateau: '#4a4028',
  badlands: '#4a3820',
  broken_lands: '#3a3020',
  desert: '#5a4020',
  tundra: '#484848',
  glacier: '#4a5058',
  volcano: '#3a2a1a',
};

interface HexBreadcrumbProps {
  hexCol: number;
  hexRow: number;
  terrain: TerrainType;
  locationCount: number;
  agentCount: number;
  lineOfSight: LineOfSight;
  sphereInfluence: SphereInfluence;
  cultures: HexCultureSummary[];
  factions: HexFactionSummary[];
  regionName?: string;
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
  cultures,
  factions,
  regionName,
  onBack,
}: HexBreadcrumbProps) {
  const isHidden = lineOfSight === 'none';

  const terrainLabel = isHidden
    ? 'Unknown'
    : terrain.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const activeSpheres = isHidden
    ? []
    : (Object.entries(sphereInfluence) as [SphereName, number][]).filter(([, v]) => v > 0);

  const terrainColor = isHidden ? '#333333' : (TERRAIN_COLORS[terrain] || '#3a5518');
  const dominantCulture = isHidden ? null : (cultures.length > 0 ? cultures[0] : null);
  const dominantFaction = isHidden ? null : (factions.length > 0 ? factions[0] : null);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 border-b"
      style={{
        backgroundColor: 'var(--bg-deep)',
        borderColor: 'var(--border-gold)',
      }}
    >
      {/* Terrain dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: terrainColor }}
        title={terrainLabel}
      />

      {/* Hex title + culture subtitle */}
      <div className="flex flex-col min-w-0">
        <h2
          className="font-semibold tracking-wide truncate"
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
          }}
        >
          {regionName || `${terrainLabel} (${hexCol}, ${hexRow})`}
        </h2>
        {/* Terrain + culture subtitle */}
        <span
          className="truncate"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
          }}
        >
          {regionName ? `${terrainLabel} at ${hexCol}, ${hexRow}` : ''}
          {dominantCulture && (regionName ? ' · ' : '') + dominantCulture.cultureName}
          {dominantFaction && ' · ' + dominantFaction.factionName}
        </span>
      </div>

      {/* Sphere influence dots */}
      {activeSpheres.length > 0 && (
        <div className="flex gap-1 ml-1">
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
      <span
        className="whitespace-nowrap"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}
      >
        {locationCount} loc · {agentCount} agents
      </span>

      {/* Line of sight */}
      <span
        className="font-medium px-2 py-0.5 rounded whitespace-nowrap border"
        style={{
          fontSize: 'var(--text-xs)',
          color: SIGHT_COLORS[lineOfSight],
          borderColor: SIGHT_COLORS[lineOfSight],
        }}
      >
        {SIGHT_LABELS[lineOfSight]}
      </span>

      <button
        onClick={onBack}
        aria-label="close"
        className="transition-colors text-lg px-2 ml-2"
        style={{ color: 'var(--accent-gold)' }}
      >
        ✕
      </button>
    </div>
  );
}
