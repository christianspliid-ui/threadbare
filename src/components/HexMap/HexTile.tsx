import type { HexTile } from '../../types';
import { blendForceColors, darkenColor } from '../../engine/color';
import { hexPolygonPoints } from '../../lib/hexMath';

interface HexTileProps {
  tile: HexTile;
  cx: number;
  cy: number;
  size: number;
  isHovered?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function HexTileComponent({
  tile, cx, cy, size, isHovered = false, isSelected = false,
  onClick, onMouseEnter, onMouseLeave,
}: HexTileProps) {
  const fillColor = blendForceColors(tile.forces);
  const strokeColor = darkenColor(fillColor, 0.7);
  const points = hexPolygonPoints(cx, cy, size);

  return (
    <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2.5 : isHovered ? 1.5 : 0.8}
        opacity={isHovered ? 0.9 : 1}
      />
      {isSelected && (
        <polygon
          points={hexPolygonPoints(cx, cy, size - 3)}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.5}
          strokeDasharray="4,2"
        />
      )}
    </g>
  );
}
