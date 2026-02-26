import { useMemo } from 'react';
import type { HexTile, HexCoord, ForceName, OverlayMode } from '../../types';
import { hexToPixel, hexPolygonPoints } from '../../lib/hexMath';
import { HexTileComponent } from './HexTile';
import { forceOverlayColor } from '../../engine/color';

interface HexMapProps {
  tiles: HexTile[];
  cols: number;
  rows: number;
  hexSize?: number;
  hoveredHex: HexCoord | null;
  selectedHex: HexCoord | null;
  overlayMode: OverlayMode;
  selectedForce: ForceName | null;
  onHexClick: (coord: HexCoord) => void;
  onHexHover: (coord: HexCoord | null) => void;
}

export function HexMap({
  tiles, cols, rows, hexSize = 30,
  hoveredHex, selectedHex, overlayMode, selectedForce,
  onHexClick, onHexHover,
}: HexMapProps) {
  const { width, height } = useMemo(() => {
    const w = cols * hexSize * 1.5 + hexSize * 0.5;
    const h = rows * Math.sqrt(3) * hexSize + Math.sqrt(3) * hexSize * 0.5;
    return { width: w + hexSize, height: h + hexSize };
  }, [cols, rows, hexSize]);

  const padding = hexSize;

  return (
    <svg
      viewBox={`0 0 ${width + padding * 2} ${height + padding * 2}`}
      className="w-full h-full"
      style={{ background: '#0a0a1a' }}
    >
      <g transform={`translate(${padding + hexSize}, ${padding + hexSize * 0.8})`}>
        {tiles.map((tile) => {
          const { x, y } = hexToPixel(tile.coord, hexSize);
          const isHovered = hoveredHex?.col === tile.coord.col && hoveredHex?.row === tile.coord.row;
          const isSelected = selectedHex?.col === tile.coord.col && selectedHex?.row === tile.coord.row;
          return (
            <HexTileComponent
              key={`${tile.coord.col}-${tile.coord.row}`}
              tile={tile} cx={x} cy={y} size={hexSize}
              isHovered={isHovered} isSelected={isSelected}
              onClick={() => onHexClick(tile.coord)}
              onMouseEnter={() => onHexHover(tile.coord)}
              onMouseLeave={() => onHexHover(null)}
            />
          );
        })}
        {overlayMode === 'single' && selectedForce && tiles.map((tile) => {
          const { x, y } = hexToPixel(tile.coord, hexSize);
          const intensity = tile.forces[selectedForce];
          return (
            <polygon
              key={`overlay-${tile.coord.col}-${tile.coord.row}`}
              points={hexPolygonPoints(x, y, hexSize)}
              fill={forceOverlayColor(selectedForce, intensity)}
              pointerEvents="none"
            />
          );
        })}
      </g>
    </svg>
  );
}
