import type { HexTile } from '../../types';
import type { HexVisibilityState } from '../../types/visibility';
import { BIOME_COLORS } from '../../engine/color';
import { hexPolygonPoints } from '../../lib/hexMath';
import { getHexTileUrl } from '../../data/hex-tile-assets';

// Hex tile display constants
const UNEXPLORED_HEX_COLOR = '#1e1b2e'; // Dark world surface, ~12% brightness matching HEX_MAP_BACKGROUND

interface HexTileProps {
  tile: HexTile;
  cx: number;
  cy: number;
  size: number;
  hexClipId: string;
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
  tile, cx, cy, size, hexClipId,
  isHovered = false, isSelected = false,
  visibility = 'visible', isAvatarHex = false, sphereColor,
  onClick, onMouseEnter, onMouseLeave,
}: HexTileProps) {
  const fillColor = BIOME_COLORS[tile.terrain];
  const strokeColor = 'rgba(139, 105, 60, 0.3)';
  const points = hexPolygonPoints(cx, cy, size);
  const tileUrl = getHexTileUrl(tile.terrain);
  const imgSize = size * 2;

  // Unexplored: only render dark fill, no content
  if (visibility === 'unexplored') {
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <polygon
          points={points}
          fill={UNEXPLORED_HEX_COLOR}
          stroke={strokeColor}
          strokeWidth={0.6}
        />
      </g>
    );
  }

  // Shared tile content: fallback polygon + clipped image + selection ring
  const tileContent = (
    <>
      {/* Fallback biome color — shows while image loads or if it fails */}
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2 : isHovered ? 1.2 : 0.6}
        opacity={isHovered ? 0.9 : 1}
      />
      {/* Hex-clipped terrain image */}
      <g clipPath={`url(#${hexClipId})`} transform={`translate(${cx}, ${cy})`}>
        <image
          href={tileUrl}
          x={-size}
          y={-size}
          width={imgSize}
          height={imgSize}
          preserveAspectRatio="xMidYMid slice"
        />
      </g>
      {/* Selection ring */}
      {isSelected && (
        <polygon
          points={hexPolygonPoints(cx, cy, size - 3)}
          fill="none"
          stroke="#5A3A1A"
          strokeWidth={1.5}
          strokeDasharray="4,2"
        />
      )}
    </>
  );

  // Remembered: wrap in dimmed group
  if (visibility === 'remembered') {
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <g opacity="0.4">
          {tileContent}
        </g>
      </g>
    );
  }

  // Visible: normal rendering
  return (
    <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
      {tileContent}
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
