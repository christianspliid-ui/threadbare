import { useMemo, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { HexTile, HexCoord, OverlayMode } from '../../types';
import type { VisibilityMap } from '../../types/visibility';
import { hexToPixel } from '../../lib/hexMath';
import { visKey } from '../../types/visibility';
import { HexTileComponent } from './HexTile';
import { HexDefs } from './HexDefs';

const DEFAULT_ZOOM_SCALE = 3.0;
const MIN_ZOOM_SCALE = 1.0;
const MAX_ZOOM_SCALE = 4.0;

interface HexMapProps {
  tiles: HexTile[];
  cols: number;
  rows: number;
  hexSize?: number;
  hoveredHex: HexCoord | null;
  selectedHex: HexCoord | null;
  overlayMode: OverlayMode;
  visibilityMap?: VisibilityMap;
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
  tiles, cols, rows, hexSize = 30,
  hoveredHex, selectedHex, overlayMode,
  visibilityMap, avatarHex, sphereColor,
  initialCenter, initialScale,
  onZoomChange,
  onHexClick, onHexHover,
}, ref) => {
  const { width, height } = useMemo(() => {
    const w = cols * Math.sqrt(3) * hexSize + Math.sqrt(3) * hexSize * 0.5;
    const h = rows * hexSize * 1.5 + hexSize * 0.5;
    return { width: w + hexSize, height: h + hexSize };
  }, [cols, rows, hexSize]);

  const padding = hexSize;
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

  // Set up d3-zoom behavior
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([MIN_ZOOM_SCALE, MAX_ZOOM_SCALE])
      .on('zoom', (event) => {
        if (gRef.current) {
          gRef.current.setAttribute('transform', event.transform.toString());
        }
        onZoomChange?.(event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Apply initial transform if provided
    if (initialCenter && initialScale) {
      const svgEl = svgRef.current;
      const viewWidth = svgEl.clientWidth || svgEl.viewBox.baseVal.width;
      const viewHeight = svgEl.clientHeight || svgEl.viewBox.baseVal.height;
      const t = d3.zoomIdentity
        .translate(
          viewWidth / 2 - initialCenter.x * initialScale,
          viewHeight / 2 - initialCenter.y * initialScale
        )
        .scale(initialScale);
      svg.call(zoom.transform, t);
    }
  }, [onZoomChange, initialCenter, initialScale]);

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
        style={{ background: '#0a0a0e' }}
      >
        <HexDefs size={hexSize} />
        <g ref={gRef} className="zoom-group" transform={tileBaseTransform}>
          {tiles.map((tile) => {
            const { x, y } = hexToPixel(tile.coord, hexSize);
            const isHovered = hoveredHex?.col === tile.coord.col && hoveredHex?.row === tile.coord.row;
            const isSelected = selectedHex?.col === tile.coord.col && selectedHex?.row === tile.coord.row;
            const isAvatar = avatarHex?.col === tile.coord.col && avatarHex?.row === tile.coord.row;
            const visibility = visibilityMap?.get(visKey(tile.coord.col, tile.coord.row))?.state ?? 'visible';
            return (
              <HexTileComponent
                key={`${tile.coord.col}-${tile.coord.row}`}
                tile={tile} cx={x} cy={y} size={hexSize} hexClipId={hexClipId}
                isHovered={isHovered} isSelected={isSelected}
                visibility={visibility}
                isAvatarHex={isAvatar}
                sphereColor={sphereColor}
                onClick={() => onHexClick(tile.coord)}
                onMouseEnter={() => onHexHover(tile.coord)}
                onMouseLeave={() => onHexHover(null)}
              />
            );
          })}
        </g>
      </svg>
    </>
  );
});

HexMapComponent.displayName = 'HexMap';

export const HexMap = HexMapComponent;
