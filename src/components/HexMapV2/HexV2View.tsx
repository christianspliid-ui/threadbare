import { useRef, useState, useCallback, useEffect } from 'react';
import type { HexCoord, HexTile } from '../../types';
import type { RiverPath } from '../../engine/worldGenData';
import type { VisibilityMap } from '../../types/visibility';
import { visKey } from '../../types/visibility';
import type { HexMapV2Handle } from './HexMapV2';
import HexMapV2 from './HexMapV2';
import type { LocationNode } from './scene/LocationIconMesh';
import type { AgentRenderData } from './agents/agentSpriteTypes';
import { computeVisibilityFromSources, FOG_CONSTANTS } from './scene/FogCulling';

// Read ?fog URL param once (stable — URL doesn't change during session)
// NFP #1: fogEnabled is derived from URL, not a magic boolean in the component
const fogEnabled = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).has('fog')
  : false;

interface HexV2ViewProps {
  tiles: HexTile[];
  cols: number;
  rows: number;
  seed: number;
  riverPaths?: RiverPath[];
  lakeIds?: Int16Array;
  /** Location nodes to render as icons and labels (Plan 06-01+) */
  locations?: LocationNode[];
  /** Agent render data for Three.js sprite rendering (Plan 06-04+) */
  agents?: AgentRenderData[];
}

/**
 * Builds an initial VisibilityMap from an agent array.
 *
 * All hexes start as 'unexplored'. Hexes visible from any agent's position are set to
 * 'visible'. In a real game, persistent explored state would be tracked in game state;
 * for Phase 7 testing, we start fresh every render update.
 *
 * NFP #3: computeVisibilityFromSources is deterministic — same agents = same result.
 * NFP #4: Fail-soft — empty agents array returns all-unexplored map.
 */
function buildVisibilityMap(agents: AgentRenderData[], tiles: HexTile[], cols: number, rows: number): VisibilityMap {
  const map: VisibilityMap = new Map();

  // Mark all hexes as unexplored
  for (const tile of tiles) {
    map.set(visKey(tile.coord.col, tile.coord.row), { state: 'unexplored' });
  }

  if (agents.length === 0) return map;

  // Find the retinue agent to use as the primary LOS source
  const retinue = agents.find(a => a.isRetinue);
  const sources = retinue
    ? [{ hexCol: retinue.hexCol, hexRow: retinue.hexRow, range: FOG_CONSTANTS.DEFAULT_SIGHT_RANGE + 2 }]
    : agents.map(a => ({ hexCol: a.hexCol, hexRow: a.hexRow, range: FOG_CONSTANTS.DEFAULT_SIGHT_RANGE }));

  // Compute currently visible hexes
  const visible = computeVisibilityFromSources(sources, cols, rows);

  // Mark visible hexes (previously explored hexes that are no longer visible become 'remembered')
  for (const [key] of visible) {
    map.set(key, { state: 'visible' });
  }

  return map;
}

/**
 * Minimal game chrome for the `?view=hexv2` route.
 *
 * Phase 7: fog of war enabled via ?fog URL param.
 * When fog is active:
 * - Visibility map computed from agent positions
 * - Unexplored hexes render as dark fill
 * - Camera starts on retinue agent at hero-local zoom
 * - Visibility updates when agents prop changes
 *
 * Layout: h-screen flex flex-col overflow-hidden (viewport contract per CLAUDE.md).
 */
export function HexV2View({ tiles, cols, rows, seed, riverPaths, lakeIds, locations, agents }: HexV2ViewProps) {
  const mapRef = useRef<HexMapV2Handle>(null);
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);
  const [hoveredHex, setHoveredHex]   = useState<HexCoord | null>(null);

  // Visibility map — only computed and maintained when fog is enabled
  const [visibilityMap, setVisibilityMap] = useState<VisibilityMap | undefined>(() => {
    if (!fogEnabled || !agents || agents.length === 0) return undefined;
    return buildVisibilityMap(agents, tiles, cols, rows);
  });

  // Recompute visibility when agents move (fog mode only)
  useEffect(() => {
    if (!fogEnabled) return;
    if (!agents || agents.length === 0) {
      setVisibilityMap(undefined);
      return;
    }
    setVisibilityMap(buildVisibilityMap(agents, tiles, cols, rows));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents, tiles, cols, rows]);

  const handleHexClick = useCallback((coord: HexCoord) => {
    setSelectedHex(prev =>
      prev?.col === coord.col && prev?.row === coord.row ? null : coord,
    );
  }, []);

  const handleHexHover = useCallback((coord: HexCoord | null) => {
    setHoveredHex(coord);
  }, []);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden grain"
      style={{ backgroundColor: 'var(--bg-abyss)', color: 'var(--text-primary)' }}
    >
      {/* ── Topbar (game chrome) ── */}
      <div
        className="w-full flex items-center flex-shrink-0 z-30"
        style={{
          background:   'linear-gradient(180deg, rgba(17,17,20,0.98), rgba(10,10,14,0.95))',
          borderBottom: '1px solid rgba(212,160,64,0.3)',
          height:       'var(--topbar-height)',
          minHeight:    'var(--topbar-height)',
          paddingLeft:  'var(--topbar-padding-x, 16px)',
          paddingRight: 'var(--topbar-padding-x, 16px)',
          gap:          '12px',
        }}
      >
        <span
          style={{
            fontFamily:    'var(--font-display)',
            fontSize:      'var(--text-lg)',
            color:         'var(--accent-gold)',
            letterSpacing: '0.08em',
            fontWeight:    600,
          }}
        >
          Renderer V2
        </span>

        <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />

        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
          {tiles.length.toLocaleString()} hexes · seed {seed}
        </span>

        {fogEnabled && (
          <>
            <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-gold)', opacity: 0.7 }}>
              Fog active
            </span>
          </>
        )}

        {selectedHex && (
          <>
            <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Selected: ({selectedHex.col}, {selectedHex.row})
            </span>
          </>
        )}

        {hoveredHex && (
          <>
            <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              Hover: ({hoveredHex.col}, {hoveredHex.row})
            </span>
          </>
        )}
      </div>

      {/* ── Map canvas (fills remaining space) ── */}
      <div className="flex-1 overflow-hidden">
        <HexMapV2
          ref={mapRef}
          tiles={tiles}
          cols={cols}
          rows={rows}
          seed={seed}
          hoveredHex={hoveredHex}
          selectedHex={selectedHex}
          onHexClick={handleHexClick}
          onHexHover={handleHexHover}
          riverPaths={riverPaths}
          lakeIds={lakeIds}
          locations={locations}
          agents={agents}
          fogEnabled={fogEnabled}
          visibilityMap={visibilityMap}
        />
      </div>
    </div>
  );
}
