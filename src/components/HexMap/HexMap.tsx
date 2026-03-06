import { useMemo } from 'react';
import type { HexTile, HexCoord, OverlayMode } from '../../types';
import type { VisibilityMap } from '../../types/visibility';
import { hexToPixel } from '../../lib/hexMath';
import { visKey } from '../../types/visibility';
import { HexTileComponent } from './HexTile';

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
  onHexClick: (coord: HexCoord) => void;
  onHexHover: (coord: HexCoord | null) => void;
}

export function HexMap({
  tiles, cols, rows, hexSize = 30,
  hoveredHex, selectedHex, overlayMode,
  visibilityMap, avatarHex, sphereColor,
  onHexClick, onHexHover,
}: HexMapProps) {
  const { width, height } = useMemo(() => {
    const w = cols * Math.sqrt(3) * hexSize + Math.sqrt(3) * hexSize * 0.5;
    const h = rows * hexSize * 1.5 + hexSize * 0.5;
    return { width: w + hexSize, height: h + hexSize };
  }, [cols, rows, hexSize]);

  const padding = hexSize;

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
        viewBox={`0 0 ${width + padding * 2} ${height + padding * 2}`}
        className="w-full h-full"
        style={{ background: '#f4e8c1' }}
      >
        <g transform={`translate(${padding + hexSize}, ${padding + hexSize * 0.8})`}>
          {tiles.map((tile) => {
            const { x, y } = hexToPixel(tile.coord, hexSize);
            const isHovered = hoveredHex?.col === tile.coord.col && hoveredHex?.row === tile.coord.row;
            const isSelected = selectedHex?.col === tile.coord.col && selectedHex?.row === tile.coord.row;
            const isAvatar = avatarHex?.col === tile.coord.col && avatarHex?.row === tile.coord.row;
            const visibility = visibilityMap?.get(visKey(tile.coord.col, tile.coord.row))?.state ?? 'visible';
            return (
              <HexTileComponent
                key={`${tile.coord.col}-${tile.coord.row}`}
                tile={tile} cx={x} cy={y} size={hexSize}
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
}
