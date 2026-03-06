import type { HexTile, TerrainType } from '../../types';
import type { HexVisibilityState } from '../../types/visibility';
import { BIOME_COLORS } from '../../engine/color';
import { hexPolygonPoints } from '../../lib/hexMath';

const TERRAIN_ICONS: Record<TerrainType, string> = {
  ocean: '🌊',
  coastal_shallows: '🐚',
  grassland: '🌾',
  farmland: '🌾',
  deciduous_forest: '🌲',
  dense_forest: '🌳',
  taiga: '🌲',
  jungle: '🌴',
  swamp: '🪷',
  bog: '🪨',
  hills: '⛰️',
  mountains: '🏔️',
  desert: '🏜️',
  tundra: '❄️',
  glacier: '🧊',
  savanna: '🦁',
  steppe: '🐎',
  volcanic: '🌋',
  plateau: '🪨',
  badlands: '🏜️',
  lake: '💧',
  river: '🏞️',
};

interface HexTileProps {
  tile: HexTile;
  cx: number;
  cy: number;
  size: number;
  isHovered?: boolean;
  isSelected?: boolean;
  visibility?: HexVisibilityState;
  isAvatarHex?: boolean;
  sphereColor?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function HexTileComponent({
  tile, cx, cy, size, isHovered = false, isSelected = false,
  visibility = 'visible', isAvatarHex = false, sphereColor,
  onClick, onMouseEnter, onMouseLeave,
}: HexTileProps) {
  const fillColor = BIOME_COLORS[tile.terrain];
  const strokeColor = 'rgba(139, 105, 60, 0.3)';
  const points = hexPolygonPoints(cx, cy, size);
  const icon = TERRAIN_ICONS[tile.terrain] || '·';

  // Unexplored: only render black fill, no content
  if (visibility === 'unexplored') {
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <polygon
          points={points}
          fill="#0a0a0e"
          stroke={strokeColor}
          strokeWidth={0.6}
        />
      </g>
    );
  }

  // Remembered: wrap content in dimmed group
  if (visibility === 'remembered') {
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <g opacity="0.4">
          <polygon
            points={points}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={isSelected ? 2 : isHovered ? 1.2 : 0.6}
            opacity={isHovered ? 0.9 : 1}
          />
          {isSelected && (
            <polygon
              points={hexPolygonPoints(cx, cy, size - 3)}
              fill="none"
              stroke="#5A3A1A"
              strokeWidth={1.5}
              strokeDasharray="4,2"
            />
          )}
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={size * 0.45}
            opacity={0.7}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {icon}
          </text>
        </g>
      </g>
    );
  }

  // Visible: normal rendering
  return (
    <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2 : isHovered ? 1.2 : 0.6}
        opacity={isHovered ? 0.9 : 1}
      />
      {isSelected && (
        <polygon
          points={hexPolygonPoints(cx, cy, size - 3)}
          fill="none"
          stroke="#5A3A1A"
          strokeWidth={1.5}
          strokeDasharray="4,2"
        />
      )}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.45}
        opacity={0.7}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {icon}
      </text>
      {isAvatarHex && sphereColor && (
        <polygon
          points={points}
          fill="none"
          stroke={sphereColor}
          strokeWidth={3}
          className="avatar-pulse"
        />
      )}
    </g>
  );
}
