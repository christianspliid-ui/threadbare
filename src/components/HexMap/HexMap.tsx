import { useMemo, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { HexTile, HexCoord, OverlayMode, LocationSubtype } from '../../types';
import type { VisibilityMap } from '../../types/visibility';
import { hexToPixel, HEX_SCALE_X, HEX_SCALE_Y } from '../../lib/hexMath';
import { visKey } from '../../types/visibility';
import { HexTileComponent } from './HexTile';
import { HexDefs } from './HexDefs';
import { CoastlineOverlay } from './CoastlineOverlay';
import { useCoastline } from './useCoastline';
import { COASTLINE_DEFAULTS } from '../../types/coastline';

// Hex map display constants
const DEFAULT_ZOOM_SCALE = 3.0;
const MIN_ZOOM_SCALE = 1.0;
const MAX_ZOOM_SCALE = 4.0;
const HEX_MAP_BACKGROUND = '#1e1b2e'; // Dark world surface, ~12% brightness with cool purple cast matching Threadbare aesthetic
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
  onZoomChange,
  onHexClick, onHexHover,
}, ref) => {
  const { width, height } = useMemo(() => {
    // Flat-top hex layout: horizontal spacing = HEX_SCALE_X * size, vertical spacing = HEX_SCALE_Y * size
    const w = cols * hexSize * HEX_SCALE_X + hexSize * 0.5;
    const h = rows * HEX_SCALE_Y * hexSize + HEX_SCALE_Y * hexSize * 0.5;
    return { width: w + hexSize, height: h + hexSize };
  }, [cols, rows, hexSize]);

  const coastlineData = useCoastline(tiles, hexSize, cols, rows, seed ?? DEFAULT_COASTLINE_SEED);

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

  const tileBaseTransform = `translate(${padding + hexSize}, ${padding + hexSize * 0.8})`;
  const hexClipId = `hex-clip-${hexSize}`;

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
      `}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width + padding * 2} ${height + padding * 2}`}
        className="w-full h-full"
        style={{ background: HEX_MAP_BACKGROUND }}
      >
        <HexDefs size={hexSize} />
        <g ref={gRef} className="zoom-group">
          <g transform={tileBaseTransform}>
            <CoastlineOverlay data={coastlineData} svgWidth={width} svgHeight={height} colors={COASTLINE_DEFAULTS.colors} />
            {tiles.map((tile) => {
              const { x, y } = hexToPixel(tile.coord, hexSize);
              const isHovered = hoveredHex?.col === tile.coord.col && hoveredHex?.row === tile.coord.row;
              const isSelected = selectedHex?.col === tile.coord.col && selectedHex?.row === tile.coord.row;
              const isAvatar = avatarHex?.col === tile.coord.col && avatarHex?.row === tile.coord.row;
              const visibility = visibilityMap?.get(visKey(tile.coord.col, tile.coord.row))?.state ?? 'visible';
              const coordKey = `${tile.coord.col},${tile.coord.row}`;
              const locSubtype = locationOverlays?.get(coordKey);
              return (
                <HexTileComponent
                  key={`${tile.coord.col}-${tile.coord.row}`}
                  tile={tile} cx={x} cy={y} size={hexSize} hexClipId={hexClipId}
                  isHovered={isHovered} isSelected={isSelected}
                  visibility={visibility}
                  isAvatarHex={isAvatar}
                  sphereColor={sphereColor}
                  locationSubtype={locSubtype}
                  onClick={() => onHexClick(tile.coord)}
                  onMouseEnter={() => onHexHover(tile.coord)}
                  onMouseLeave={() => onHexHover(null)}
                />
              );
            })}
          </g>
        </g>
      </svg>
    </>
  );
});

HexMapComponent.displayName = 'HexMap';

export const HexMap = HexMapComponent;
