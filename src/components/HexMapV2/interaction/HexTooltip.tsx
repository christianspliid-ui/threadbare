import type { HexCoord } from '../../../types';
import { INTERACTION_CONSTANTS } from './HexRaycaster';

/**
 * Water terrain types and their display labels.
 * Matches the tooltip copywriting contract in 01-UI-SPEC.md.
 */
const WATER_DISPLAY_LABELS: Record<string, string> = {
  ocean:            'Ocean',
  tropical_ocean:   'Ocean',
  deep_ocean:       'Deep Ocean',
  lake:             'Lake',
  river:            'River',
  shallows:         'Shallow Waters',
  coastal_shallows: 'Shallow Waters',
  coast:            'Shallow Waters',
  reef:             'Shallow Waters',
};

interface HexTooltipProps {
  /** Display name for the terrain type (Title Case) */
  terrainName: string;
  /** Hex coordinate for "(col, row)" display */
  coord: HexCoord;
  /** Screen X position from worldToScreen */
  screenX: number;
  /** Screen Y position from worldToScreen */
  screenY: number;
  /** Canvas width — used for horizontal clamping */
  canvasWidth: number;
  /** Canvas height — used for vertical clamping */
  canvasHeight: number;
  /** Raw terrain key — if this is a water terrain, override terrainName with water label */
  terrainKey?: string;
}

/**
 * HTML tooltip overlay for the hex map canvas.
 *
 * Positioned absolutely above the hovered hex's screen position.
 * Clamps to canvas bounds so it never overflows the map panel.
 * No animation on show/hide — tooltip is a data readout, not a dramatic element.
 *
 * Z-index 10: above canvas, below modal overlays.
 * pointer-events: none so it never intercepts mouse events.
 */
export function HexTooltip({
  terrainName,
  coord,
  screenX,
  screenY,
  canvasWidth,
  canvasHeight,
  terrainKey,
}: HexTooltipProps) {
  // Resolve display name: water terrains use their own labels per copywriting contract
  const displayName = terrainKey && WATER_DISPLAY_LABELS[terrainKey]
    ? WATER_DISPLAY_LABELS[terrainKey]
    : terrainName;

  // Estimated tooltip dimensions for clamping (actual size unknown pre-render)
  const estimatedWidth  = 140;
  const estimatedHeight = 46;
  const offsetY = INTERACTION_CONSTANTS.TOOLTIP_OFFSET_Y;

  // Position tooltip above the hex center
  let left = screenX - estimatedWidth / 2;
  let top  = screenY - offsetY - estimatedHeight;

  // Clamp horizontally
  if (left < 4) left = 4;
  if (left + estimatedWidth > canvasWidth - 4) left = canvasWidth - estimatedWidth - 4;

  // If tooltip would go above canvas, flip it below the hex
  if (top < 4) top = screenY + offsetY;

  return (
    <div
      style={{
        position:      'absolute',
        left:          `${left}px`,
        top:           `${top}px`,
        pointerEvents: 'none',
        zIndex:        10,
        background:    'var(--bg-surface)',
        border:        '1px solid rgba(255,255,255,0.08)',
        borderRadius:  '4px',
        padding:       '4px 8px',
        whiteSpace:    'nowrap',
        userSelect:    'none',
      }}
    >
      {/* Primary line: terrain name in gold */}
      <div
        style={{
          color:       'var(--accent-gold)',
          fontSize:    'var(--text-sm)',
          fontWeight:  600,
          fontFamily:  'Alegreya Sans, sans-serif',
          lineHeight:  1.3,
        }}
      >
        {displayName}
      </div>
      {/* Secondary line: coordinates */}
      <div
        style={{
          color:      'var(--text-secondary)',
          fontSize:   'var(--text-xs)',
          fontWeight: 400,
          fontFamily: 'Alegreya Sans, sans-serif',
          lineHeight: 1.4,
        }}
      >
        ({coord.col}, {coord.row})
      </div>
    </div>
  );
}
