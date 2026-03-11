import { memo, useCallback } from 'react';
import type { ReactElement } from 'react';
import type { HexTile, HexCoord, LocationSubtype } from '../../types';
import type { HexVisibilityState } from '../../types/visibility';
import { BIOME_COLORS } from '../../engine/color';
import { hexPolygonPoints, HEX_IMG_SCALE } from '../../lib/hexMath';
import { getHexTileUrl, getOverlayIconUrl, isFullSizeOverlay } from '../../data/hex-tile-assets';
import { isWaterTerrain } from '../../engine/coastline';
import { Tooltip } from '../shared/Tooltip';

// Hex tile display constants
const UNEXPLORED_HEX_COLOR = '#0a0a0c'; // Neutral near-black for unexplored fog — no purple tint
const HEX_BORDER_COLOR = 'rgba(139, 105, 60, 0.3)'; // VS-105: Tan/brown border at 30% opacity
const SELECTION_RING_COLOR = '#5A3A1A'; // VS-105: Dark brown dashed ring for selected hex
const SELECTION_RING_INSET = 3; // Pixels to shrink selection ring inside hex boundary
const SELECTION_RING_WIDTH = 1.5; // Stroke width for selection ring
const SELECTION_RING_DASH = '4,2'; // Dash pattern for selection ring
const AVATAR_PULSE_WIDTH = 3; // Stroke width for avatar hex pulse ring
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

// IX-202: Concise geo description for hex tooltips
function geoDesc(elev: number, temp: number, moist: number): string {
  const e = elev < 0.25 ? 'Low' : elev < 0.6 ? 'Mid' : 'High';
  const t = temp < 0.3 ? 'Cold' : temp < 0.7 ? 'Temperate' : 'Hot';
  const m = moist < 0.3 ? 'Arid' : moist < 0.7 ? 'Moderate' : 'Wet';
  return `${e} elevation · ${t} · ${m} moisture`;
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
  /** RC-201: Stable callback refs — HexTile binds its own coord internally */
  onHexClick?: (coord: HexCoord) => void;
  onHexHover?: (coord: HexCoord | null) => void;
}

export const HexTileComponent = memo(function HexTileComponent({
  tile, cx, cy, size, hexClipId,
  isHovered = false, isSelected = false,
  visibility = 'visible', isAvatarHex = false, sphereColor,
  locationSubtype,
  onHexClick, onHexHover,
}: HexTileProps) {
  // RC-201: Stable handlers — only re-create when callback ref or coord changes, not on hover
  const onClick = useCallback(() => onHexClick?.(tile.coord), [onHexClick, tile.coord]);
  const onMouseEnter = useCallback(() => onHexHover?.(tile.coord), [onHexHover, tile.coord]);
  const onMouseLeave = useCallback(() => onHexHover?.(null), [onHexHover]);
  const fillColor = BIOME_COLORS[tile.terrain];
  const points = hexPolygonPoints(cx, cy, size);
  const tileUrl = getHexTileUrl(tile.terrain);
  const imgSize = size * HEX_IMG_SCALE;

  // IX-205: Data attributes for test selectors and accessibility
  const dataAttrs = {
    'data-terrain': tile.terrain,
    'data-col': tile.coord.col,
    'data-row': tile.coord.row,
  };

  // IX-202: Geo description for tooltip
  const geoDescText = geoDesc(tile.geoParams.elevation, tile.geoParams.temperature, tile.geoParams.moisture);

  // Unexplored: only render dark fill, no content
  if (visibility === 'unexplored') {
    return (
      <g {...dataAttrs} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
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
      <Tooltip as="g" label={tile.terrain} desc={geoDescText} id={`terrain.${tile.terrain}`}>
        <g {...dataAttrs} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
          {/* Transparent hit area for click/hover events */}
          <polygon points={points} fill="transparent" stroke="none" />
          {isSelected && (
            <polygon
              points={hexPolygonPoints(cx, cy, size - SELECTION_RING_INSET)}
              fill="none"
              stroke={SELECTION_RING_COLOR}
              strokeWidth={SELECTION_RING_WIDTH}
              strokeDasharray={SELECTION_RING_DASH}
            />
          )}
          {isAvatarHex && sphereColor && (
            <polygon points={points} fill="none" stroke={sphereColor} strokeWidth={AVATAR_PULSE_WIDTH} className="avatar-pulse" />
          )}
        </g>
      </Tooltip>
    );
  }

  // Remembered water hex: transparent with dimmed border
  if (visibility === 'remembered' && isWater) {
    return (
      <Tooltip as="g" label={tile.terrain} desc={geoDescText} id={`terrain.${tile.terrain}`}>
        <g {...dataAttrs} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
          <g opacity="0.4">
            <polygon points={points} fill="transparent" stroke={HEX_BORDER_COLOR} strokeWidth={0.6} />
          </g>
          {isAvatarHex && sphereColor && (
            <polygon points={points} fill="none" stroke={sphereColor} strokeWidth={AVATAR_PULSE_WIDTH} className="avatar-pulse" />
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
          points={hexPolygonPoints(cx, cy, size - SELECTION_RING_INSET)}
          fill="none"
          stroke={SELECTION_RING_COLOR}
          strokeWidth={SELECTION_RING_WIDTH}
          strokeDasharray={SELECTION_RING_DASH}
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
        desc={geoDescText}
        id={`terrain.${tile.terrain}`}
      >
        <g {...dataAttrs} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
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
      desc={geoDescText}
      id={`terrain.${tile.terrain}`}
    >
      <g {...dataAttrs} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{ cursor: 'pointer' }}>
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
});
