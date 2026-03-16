import { useState, useMemo, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { HexTile, HexCoord, OverlayMode, LocationSubtype } from '../../types';
import type { VisibilityMap } from '../../types/visibility';
import type { WorldGraph } from '../../engine/graph';
import { hexToPixel, hexPolygonPoints, HEX_SCALE_X, HEX_SCALE_Y } from '../../lib/hexMath';
import { visKey } from '../../types/visibility';
import { HexTileComponent } from './HexTile';
import { HexDefs } from './HexDefs';
import { CoastlineOverlay } from './CoastlineOverlay';
import { RiverOverlay } from './RiverOverlay';
import { AgentDots } from './AgentDots';
import { MovementTrails } from './MovementTrails';
import { RegionLabels } from './RegionLabels';
import { GhostDots } from './GhostDots';
import type { GhostDotEntry } from '../../engine/ghostDots';
import { useCoastline } from './useCoastline';
import { useRivers } from './useRivers';
import { COASTLINE_DEFAULTS } from '../../types/coastline';
import { combineLoopPaths, isWaterTerrain } from '../../engine/coastline';

// Hex map display constants
const DEFAULT_ZOOM_SCALE = 3.0;
const MIN_ZOOM_SCALE = 1.0;
const MAX_ZOOM_SCALE = 4.0;
const HEX_MAP_BACKGROUND = '#0a0a0c'; // Neutral near-black for fog/background — no purple tint
const FOG_OPACITY_REMEMBERED = 0.6; // Remembered hexes: semi-transparent fog (rivers/coastline dim to ~40%)
const DEFAULT_COASTLINE_SEED = 42; // Fallback seed when HexMap seed prop is not provided

interface HexMapProps {
  tiles: HexTile[];
  cols: number;
  rows: number;
  hexSize?: number;
  seed?: number;
  hoveredHex: HexCoord | null;
  selectedHex: HexCoord | null;
  overlayMode: OverlayMode;
  visibilityMap?: VisibilityMap;
  locationOverlays?: Map<string, LocationSubtype>;
  avatarHex?: HexCoord;
  sphereColor?: string;
  initialCenter?: { x: number; y: number };
  initialScale?: number;
  graph?: WorldGraph;
  currentTick?: number;
  avatarRoute?: { col: number; row: number }[];
  avatarTargetHex?: { col: number; row: number };
  ghostDots?: GhostDotEntry[];
  onZoomChange?: (transform: d3.ZoomTransform) => void;
  onHexClick: (coord: HexCoord) => void;
  onHexHover: (coord: HexCoord | null) => void;
}

export interface HexMapHandle {
  centerOn: (x: number, y: number, scale?: number) => void;
}

const HexMapComponent = forwardRef<HexMapHandle, HexMapProps>(({
  tiles, cols, rows, hexSize = 30, seed,
  hoveredHex, selectedHex, overlayMode,
  visibilityMap, locationOverlays, avatarHex, sphereColor,
  initialCenter, initialScale,
  graph,
  currentTick,
  avatarRoute,
  avatarTargetHex,
  ghostDots: ghostDotsProp,
  onZoomChange,
  onHexClick, onHexHover,
}, ref) => {
  const [currentZoomScale, setCurrentZoomScale] = useState(DEFAULT_ZOOM_SCALE);

  const { width, height } = useMemo(() => {
    // Flat-top hex layout: horizontal spacing = HEX_SCALE_X * size, vertical spacing = HEX_SCALE_Y * size
    const w = cols * hexSize * HEX_SCALE_X + hexSize * 0.5;
    const h = rows * HEX_SCALE_Y * hexSize + HEX_SCALE_Y * hexSize * 0.5;
    return { width: w + hexSize, height: h + hexSize };
  }, [cols, rows, hexSize]);

  const coastlineData = useCoastline(tiles, hexSize, cols, rows, seed ?? DEFAULT_COASTLINE_SEED);
  const riverPaths = useRivers(cols, rows, seed ?? DEFAULT_COASTLINE_SEED);

  const padding = hexSize;
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

  // Store callbacks and initial values in refs to avoid re-running the zoom setup effect
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;
  const initialCenterRef = useRef(initialCenter);
  const initialScaleRef = useRef(initialScale);

  // Set up d3-zoom behavior — runs ONCE on mount
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM_SCALE, MAX_ZOOM_SCALE])
      .on('zoom', (event) => {
        if (gRef.current) {
          gRef.current.setAttribute('transform', event.transform.toString());
        }
        setCurrentZoomScale(event.transform.k);
        onZoomChangeRef.current?.(event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Apply initial transform if provided (one-time on mount)
    const center = initialCenterRef.current;
    const scale = initialScaleRef.current;
    if (center && scale) {
      const svgEl = svgRef.current;
      const viewWidth = svgEl.clientWidth || svgEl.viewBox.baseVal.width;
      const viewHeight = svgEl.clientHeight || svgEl.viewBox.baseVal.height;
      const t = d3.zoomIdentity
        .translate(
          viewWidth / 2 - center.x * scale,
          viewHeight / 2 - center.y * scale
        )
        .scale(scale);
      svg.call(zoom.transform, t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose centerOn method via ref
  useImperativeHandle(ref, () => ({
    centerOn(x: number, y: number, scale: number = DEFAULT_ZOOM_SCALE) {
      if (!svgRef.current || !zoomRef.current) return;
      const svg = d3.select(svgRef.current);
      const svgEl = svgRef.current;
      const viewWidth = svgEl.clientWidth || svgEl.viewBox.baseVal.width;
      const viewHeight = svgEl.clientHeight || svgEl.viewBox.baseVal.height;
      const t = d3.zoomIdentity
        .translate(viewWidth / 2 - x * scale, viewHeight / 2 - y * scale)
        .scale(scale);
      svg.transition().duration(500).call(zoomRef.current.transform, t);
    },
  }), []);

  // Land contour clip path — clips land hex tiles to the organic coastline shape
  // so hex edges don't extend past the smooth contour boundary.
  const landClipId = `land-contour-clip-${hexSize}`;
  const landPathD = useMemo(() => combineLoopPaths(coastlineData.loops), [coastlineData.loops]);

  const tileBaseTransform = `translate(${padding + hexSize}, ${padding + hexSize * 0.8})`;
  const hexClipId = `hex-clip-${hexSize}`;

  // RC-210: Memoize fog recover polygons — only recompute when visibility changes, not on hover
  const landFogPolygons = useMemo(() => {
    if (!visibilityMap) return [];
    const result: { key: string; points: string; opacity: number }[] = [];
    for (const tile of tiles) {
      if (isWaterTerrain(tile.terrain)) continue;
      const vis = visibilityMap.get(visKey(tile.coord.col, tile.coord.row))?.state ?? 'visible';
      if (vis === 'visible') continue;
      const { x, y } = hexToPixel(tile.coord, hexSize);
      result.push({
        key: `fog-${tile.coord.col}-${tile.coord.row}`,
        points: hexPolygonPoints(x, y, hexSize),
        opacity: vis === 'unexplored' ? 1.0 : FOG_OPACITY_REMEMBERED,
      });
    }
    return result;
  }, [tiles, visibilityMap, hexSize]);

  const waterFogPolygons = useMemo(() => {
    if (!visibilityMap) return [];
    const result: { key: string; points: string; opacity: number }[] = [];
    for (const tile of tiles) {
      if (!isWaterTerrain(tile.terrain)) continue;
      const vis = visibilityMap.get(visKey(tile.coord.col, tile.coord.row))?.state ?? 'visible';
      if (vis === 'visible') continue;
      const { x, y } = hexToPixel(tile.coord, hexSize);
      result.push({
        key: `wfog-${tile.coord.col}-${tile.coord.row}`,
        points: hexPolygonPoints(x, y, hexSize),
        opacity: vis === 'unexplored' ? 1.0 : FOG_OPACITY_REMEMBERED,
      });
    }
    return result;
  }, [tiles, visibilityMap, hexSize]);

  // Compute location positions for agent rendering
  const locationPositions = useMemo(() => {
    if (!graph) return [];
    const positions: Array<{ locationId: string; x: number; y: number }> = [];
    const locationNodes = graph.getNodesByType('location');
    for (const loc of locationNodes) {
      const col = loc.properties?.hexCol as number | undefined;
      const row = loc.properties?.hexRow as number | undefined;
      if (col == null || row == null) continue;
      const { x, y } = hexToPixel({ col, row }, hexSize);
      positions.push({ locationId: loc.id, x, y });
    }
    return positions;
  }, [graph, hexSize]);

  return (
    <>
      <style>{`
        @keyframes avatar-breathe {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .avatar-pulse {
          animation: avatar-breathe 3s ease-in-out infinite;
        }
        @keyframes target-march {
          to { stroke-dashoffset: -16; }
        }
        @keyframes route-march {
          to { stroke-dashoffset: -12; }
        }
        .target-dash {
          animation: target-march 1.5s linear infinite;
        }
        .route-dots {
          animation: route-march 0.8s linear infinite;
        }
      `}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width + padding * 2} ${height + padding * 2}`}
        className="w-full h-full"
        style={{ background: HEX_MAP_BACKGROUND }}
      >
        <HexDefs size={hexSize} />
        <defs>
          <filter id="region-label-halo" x="-10%" y="-10%" width="120%" height="120%">
            <feFlood floodColor="rgba(255,250,240,0.6)" result="bg" />
            <feComposite in="bg" in2="SourceGraphic" operator="in" result="mask" />
            <feGaussianBlur in="mask" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g ref={gRef} className="zoom-group">
          <g transform={tileBaseTransform}>
            {/* Land contour clip path definition */}
            {landPathD && (
              <defs>
                <clipPath id={landClipId}>
                  <path d={landPathD} clipRule="evenodd" />
                </clipPath>
              </defs>
            )}
            {/* Layer 1: Coastline fills (deep water → shallows → coastEdge land contour) */}
            <CoastlineOverlay data={coastlineData} svgWidth={width} svgHeight={height} colors={COASTLINE_DEFAULTS.colors} />
            {/* Layer 2: Land hex tiles — clipped to the organic contour shape */}
            <g clipPath={landPathD ? `url(#${landClipId})` : undefined}>
              {tiles.map((tile) => {
                if (isWaterTerrain(tile.terrain)) return null;
                const { x, y } = hexToPixel(tile.coord, hexSize);
                const isHovered = hoveredHex?.col === tile.coord.col && hoveredHex?.row === tile.coord.row;
                const isSelected = selectedHex?.col === tile.coord.col && selectedHex?.row === tile.coord.row;
                const isAvatar = avatarHex?.col === tile.coord.col && avatarHex?.row === tile.coord.row;
                const hexVis = visibilityMap?.get(visKey(tile.coord.col, tile.coord.row));
                const visibility = hexVis?.state ?? 'visible';
                const coordKey = `${tile.coord.col},${tile.coord.row}`;
                const locSubtype = locationOverlays?.get(coordKey);
                const isTarget = avatarTargetHex?.col === tile.coord.col && avatarTargetHex?.row === tile.coord.row;
                return (
                  <HexTileComponent
                    key={`${tile.coord.col}-${tile.coord.row}`}
                    tile={tile} cx={x} cy={y} size={hexSize} hexClipId={hexClipId}
                    isHovered={isHovered} isSelected={isSelected}
                    visibility={visibility}
                    isAvatarHex={isAvatar}
                    isTargetHex={isTarget}
                    sphereColor={sphereColor}
                    locationSubtype={locSubtype}
                    snapshot={hexVis?.snapshot}
                    onHexClick={onHexClick}
                    onHexHover={onHexHover}
                  />
                );
              })}
            </g>
            {/* Layer 2.5: River paths — rendered on top of land, clipped to coastline */}
            <g clipPath={landPathD ? `url(#${landClipId})` : undefined}>
              <RiverOverlay riverPaths={riverPaths} hexSize={hexSize} seed={seed ?? DEFAULT_COASTLINE_SEED} />
            </g>
            {/* Layer 2.75: Fog-of-war re-cover — stamps fog back over rivers for non-visible hexes.
                Without this, rivers (Layer 2.5) bleed through unexplored/remembered fog because
                they're drawn after the hex tile layer where per-tile visibility lives. */}
            {landFogPolygons.length > 0 && (
              <g clipPath={landPathD ? `url(#${landClipId})` : undefined} className="fog-recover">
                {landFogPolygons.map((p) => (
                  <polygon key={p.key} points={p.points} fill={HEX_MAP_BACKGROUND} opacity={p.opacity} style={{ pointerEvents: 'none' }} />
                ))}
              </g>
            )}
            {/* Layer 3: Water hex tiles — unclipped (transparent hit areas for interaction).
                Only rendered for visible water; non-visible water is fully fogged below. */}
            {tiles.map((tile) => {
              if (!isWaterTerrain(tile.terrain)) return null;
              const hexVis = visibilityMap?.get(visKey(tile.coord.col, tile.coord.row));
              const visibility = hexVis?.state ?? 'visible';
              // Skip non-visible water entirely — fog covers the coastline colors beneath
              if (visibility !== 'visible') return null;
              const { x, y } = hexToPixel(tile.coord, hexSize);
              const isHovered = hoveredHex?.col === tile.coord.col && hoveredHex?.row === tile.coord.row;
              const isSelected = selectedHex?.col === tile.coord.col && selectedHex?.row === tile.coord.row;
              const isAvatar = avatarHex?.col === tile.coord.col && avatarHex?.row === tile.coord.row;
              const coordKey = `${tile.coord.col},${tile.coord.row}`;
              const locSubtype = locationOverlays?.get(coordKey);
              const isTarget = avatarTargetHex?.col === tile.coord.col && avatarTargetHex?.row === tile.coord.row;
              return (
                <HexTileComponent
                  key={`${tile.coord.col}-${tile.coord.row}`}
                  tile={tile} cx={x} cy={y} size={hexSize} hexClipId={hexClipId}
                  isHovered={isHovered} isSelected={isSelected}
                  visibility={visibility}
                  isAvatarHex={isAvatar}
                  isTargetHex={isTarget}
                  sphereColor={sphereColor}
                  locationSubtype={locSubtype}
                  snapshot={hexVis?.snapshot}
                  onHexClick={onHexClick}
                  onHexHover={onHexHover}
                />
              );
            })}
            {/* Layer 3.5: Water fog-of-war — stamps dark hexes over non-visible water tiles
                to hide the CoastlineOverlay shallows/deep-water colors beneath. Not clipped
                to land contour since water lives outside it. */}
            {waterFogPolygons.length > 0 && (
              <g className="fog-recover-water">
                {waterFogPolygons.map((p) => (
                  <polygon key={p.key} points={p.points} fill={HEX_MAP_BACKGROUND} opacity={p.opacity} style={{ pointerEvents: 'none' }} />
                ))}
              </g>
            )}
            {/* Layer 3.7: Region name labels — visible when zoomed out, fade on zoom in */}
            {graph && (
              <RegionLabels
                graph={graph}
                hexSize={hexSize}
                zoomScale={currentZoomScale}
                visibilityMap={visibilityMap}
              />
            )}
            {/* Layer 3.8: Movement trails — under agents but over fog */}
            {graph && currentTick != null && (
              <MovementTrails graph={graph} hexSize={hexSize} currentTick={currentTick} />
            )}
            {/* Layer 4: Agent dots — on top of all map layers */}
            {graph && locationPositions.length > 0 && (
              <AgentDots
                graph={graph}
                locationPositions={locationPositions}
                zoomScale={currentZoomScale}
              />
            )}
            {/* Layer 4.5: Ghost dots — fading agents that left LOS */}
            {ghostDotsProp && ghostDotsProp.length > 0 && currentTick != null && (
              <GhostDots ghosts={ghostDotsProp} hexSize={hexSize} currentTick={currentTick} />
            )}
            {/* Layer 5: Route polyline — marching dots from avatar to target hex */}
            {avatarRoute && avatarRoute.length > 1 && avatarHex && sphereColor && (
              <polyline
                points={[avatarHex, ...avatarRoute.slice(0, -1)]
                  .map(h => {
                    const p = hexToPixel(h, hexSize);
                    return `${p.x},${p.y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={sphereColor}
                strokeWidth={2}
                strokeDasharray="4,6"
                strokeLinecap="round"
                className="route-dots"
                opacity={0.5}
                style={{ pointerEvents: 'none' }}
              />
            )}
          </g>
        </g>
      </svg>
    </>
  );
});

HexMapComponent.displayName = 'HexMap';

export const HexMap = HexMapComponent;
