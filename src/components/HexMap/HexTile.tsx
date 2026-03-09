import type { ReactElement } from 'react';
import type { HexTile, LocationSubtype } from '../../types';
import type { HexVisibilityState } from '../../types/visibility';
import { BIOME_COLORS } from '../../engine/color';
import { hexPolygonPoints, HEX_IMG_SCALE } from '../../lib/hexMath';
import { getHexTileUrl, getOverlayIconUrl, isFullSizeOverlay } from '../../data/hex-tile-assets';
import { isWaterTerrain } from '../../engine/coastline';
import { Tooltip } from '../shared/Tooltip';

// Hex tile display constants
const UNEXPLORED_HEX_COLOR = '#1e1b2e'; // Dark world surface, ~12% brightness matching HEX_MAP_BACKGROUND
const HEX_BORDER_COLOR = 'rgba(139, 105, 60, 0.3)'; // VS-105: Tan/brown border at 30% opacity
const SELECTION_RING_COLOR = '#5A3A1A'; // VS-105: Dark brown dashed ring for selected hex
const OVERLAY_OPACITY = 0.85; // Location overlay icon opacity

// Overlay sizing: full-size settlements fill the hex, structures render at half size
const OVERLAY_FULL_SCALE = 0.85;  // Settlement overlays (hamlet, town, city, capital) — nearly fill hex
const OVERLAY_HALF_SCALE = 0.45;  // Structure/marker overlays (shrine, fort, ruins, etc.) — half hex size

/** RC-046: Extracted helper — renders hex-clipped location overlay icon */
function renderLocationOverlay(
  subtype: LocationSubtype,
  size: number,
  cx: number,
  cy: number,
  hexClipId: string,
): ReactElement | null {
  const overlayUrl = getOverlayIconUrl(subtype);
  if (!overlayUrl) return null;
  const scale = isFullSizeOverlay(subtype) ? OVERLAY_FULL_SCALE : OVERLAY_HALF_SCALE;
  const overlaySize = size * 2 * scale;
  return (
    <g clipPath={`url(#${hexClipId})`} transform={`translate(${cx}, ${cy})`}>
      <image
        href={overlayUrl}
        x={-overlaySize / 2}
        y={-overlaySize / 2}
        width={overlaySize}
        height={overlaySize}
        preserveAspectRatio="xMidYMid meet"
        opacity={OVERLAY_OPACITY}
      />
    </g>
  );
}

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
  locationSubtype?: LocationSubtype;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function HexTileComponent({
  tile, cx, cy, size, hexClipId,
  isHovered = false, isSelected = false,
  visibility = 'visible', isAvatarHex = false, sphereColor,
  locationSubtype,
  onClick, onMouseEnter, onMouseLeave,
}: HexTileProps) {
  const fillColor = BIOME_COLORS[tile.terrain];
  const points = hexPolygonPoints(cx, cy, size);
  const tileUrl = getHexTileUrl(tile.terrain);
  const imgSize = size * HEX_IMG_SCALE;

  // Unexplored: only render dark fill, no content
  if (visibility === 'unexplored') {
    return (
      <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
        <polygon
          points={points}
          fill={UNEXPLORED_HEX_COLOR}
          stroke={HEX_BORDER_COLOR}
          strokeWidth={0.6}
        />
      </g>
    );
  }

  // Check if water terrain — visible water hexes render transparent to show CoastlineOverlay beneath
  const isWater = isWaterTerrain(tile.terrain);

  // Visible water hex: render transparent — let CoastlineOverlay show through
  if (visibility === 'visible' && isWater) {
    return (
      <Tooltip as="g" label={tile.terrain} id={`terrain.${tile.terrain}`}>
        <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
          {/* Transparent hit area for click/hover events */}
          <polygon points={points} fill="transparent" stroke="none" />
          {isSelected && (
            <polygon
              points={hexPolygonPoints(cx, cy, size - 3)}
              fill="none"
              stroke={SELECTION_RING_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4,2"
            />
          )}
          {isAvatarHex && sphereColor && (
            <polygon points={points} fill="none" stroke={sphereColor} strokeWidth={3} className="avatar-pulse" />
          )}
        </g>
      </Tooltip>
    );
  }

  // Remembered water hex: transparent with dimmed border
  if (visibility === 'remembered' && isWater) {
    return (
      <Tooltip as="g" label={tile.terrain} id={`terrain.${tile.terrain}`}>
        <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
          <g opacity="0.4">
            <polygon points={points} fill="transparent" stroke={HEX_BORDER_COLOR} strokeWidth={0.6} />
          </g>
          {isAvatarHex && sphereColor && (
            <polygon points={points} fill="none" stroke={sphereColor} strokeWidth={3} className="avatar-pulse" />
          )}
        </g>
      </Tooltip>
    );
  }

  // Shared tile content: fallback polygon + clipped image + selection ring
  const tileContent = (
    <>
      {/* Fallback biome color — shows while image loads or if it fails */}
      <polygon
        points={points}
        fill={fillColor}
        stroke={HEX_BORDER_COLOR}
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
      {/* RC-046: Location overlay icon (settlement/structure) — extracted from inline IIFE */}
      {locationSubtype && renderLocationOverlay(locationSubtype, size, cx, cy, hexClipId)}
      {/* Selection ring */}
      {isSelected && (
        <polygon
          points={hexPolygonPoints(cx, cy, size - 3)}
          fill="none"
          stroke={SELECTION_RING_COLOR}
          strokeWidth={1.5}
          strokeDasharray="4,2"
        />
      )}
    </>
  );

  // Remembered: wrap in dimmed group with tooltip
  if (visibility === 'remembered') {
    return (
      <Tooltip
        as="g"
        label={tile.terrain}
        id={`terrain.${tile.terrain}`}
      >
        <g onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
          <g opacity="0.4">
            {tileContent}
          </g>
        </g>
      </Tooltip>
    );
  }

  // Visible: normal rendering with tooltip
  return (
    <Tooltip
      as="g"
      label={tile.terrain}
      id={`terrain.${tile.terrain}`}
    >
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
    </Tooltip>
  );
}
