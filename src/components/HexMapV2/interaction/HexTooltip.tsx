import type { HexCoord, GeoParams } from '../../../types';
import type { LocationActivitySummary, AgentActivityThread } from '../../../types/locationActivity';
import { INTERACTION_CONSTANTS } from './HexRaycaster';
import { LOCATION_ACTIVITY_CONSTANTS } from '../../../engine/deriveLocationActivities';

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
  /** Geo parameters for dev debug display */
  geoParams?: GeoParams;
  /** Whether the hex has a river */
  hasRiver?: boolean;
  /**
   * Location activity summary for the primary location on this hex.
   * When provided, replaces the terrain name with location name + murmur prose
   * and adds familiarity-gated agent thread list below.
   */
  locationActivity?: LocationActivitySummary;
}

/** Format a 0-1 float as a percentage string */
function pct(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

/** Format a float to 2 decimal places */
function f2(v: number): string {
  return v.toFixed(2);
}

/** Movement phase badge for agent thread entries */
function MovementBadge({ phase }: { phase: AgentActivityThread['movementPhase'] }) {
  if (!phase || phase === 'present') return null;
  const label = phase === 'arriving' ? '→' : '←';
  return (
    <span style={{ color: 'var(--text-tertiary)', marginLeft: 4, fontSize: 'var(--text-xs)' }}>
      {label}
    </span>
  );
}

/**
 * HTML tooltip overlay for the hex map canvas.
 *
 * Positioned absolutely above the hovered hex's screen position.
 * Clamps to canvas bounds so it never overflows the map panel.
 * No animation on show/hide — tooltip is a data readout, not a dramatic element.
 *
 * When locationActivity is provided, shows:
 *   1. Location name (replaces terrain name)
 *   2. Murmur prose in italic (1-3 lines)
 *   3. Familiarity-gated agent thread list (max TOOLTIP_MAX_NAMED_AGENTS + "(N others)")
 * When not provided, falls back to terrain name + coordinates.
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
  geoParams,
  hasRiver,
  locationActivity,
}: HexTooltipProps) {
  const hasLocationData = locationActivity && locationActivity.agentThreads.length > 0 || locationActivity?.murmurs.length;

  // Estimated tooltip dimensions for clamping
  const murmurLineCount = locationActivity?.murmurs.length ?? 0;
  const threadCount = Math.min(
    locationActivity?.agentThreads.length ?? 0,
    LOCATION_ACTIVITY_CONSTANTS.TOOLTIP_MAX_NAMED_AGENTS,
  );
  const hasOverflow = (locationActivity?.agentThreads.length ?? 0) > LOCATION_ACTIVITY_CONSTANTS.TOOLTIP_MAX_NAMED_AGENTS;

  const estimatedWidth  = hasLocationData ? 240 : 180;
  const estimatedHeight = geoParams ? 100
    : hasLocationData
      ? 46 + murmurLineCount * 18 + threadCount * 16 + (hasOverflow ? 14 : 0) + 8
      : 46;
  const offsetY = INTERACTION_CONSTANTS.TOOLTIP_OFFSET_Y;

  let left = screenX - estimatedWidth / 2;
  let top  = screenY - offsetY - estimatedHeight;

  if (left < 4) left = 4;
  if (left + estimatedWidth > canvasWidth - 4) left = canvasWidth - estimatedWidth - 4;
  if (top < 4) top = screenY + offsetY;

  // Resolve terrain display name
  const displayTerrainName = terrainKey && WATER_DISPLAY_LABELS[terrainKey]
    ? WATER_DISPLAY_LABELS[terrainKey]
    : terrainName;

  const dimStyle = {
    color:      'var(--text-tertiary)',
    fontSize: 'var(--text-xs)',
    fontWeight:  400 as const,
    fontFamily: 'monospace',
    lineHeight: 1.5,
  };

  // Familiarity-gated agent threads (max named + overflow line)
  const namedThreads = locationActivity?.agentThreads.slice(0, LOCATION_ACTIVITY_CONSTANTS.TOOLTIP_MAX_NAMED_AGENTS) ?? [];
  const overflowCount = Math.max(0, (locationActivity?.agentThreads.length ?? 0) - LOCATION_ACTIVITY_CONSTANTS.TOOLTIP_MAX_NAMED_AGENTS);

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
        padding:       '6px 10px',
        whiteSpace:    'nowrap',
        userSelect:    'none',
        maxWidth:      `${estimatedWidth}px`,
      }}
    >
      {/* Primary line: location name (when available) or terrain name */}
      <div
        style={{
          color:       'var(--accent-gold)',
          fontSize:    'var(--text-sm)',
          fontWeight:  600,
          fontFamily: 'var(--font-body)',
          lineHeight:  1.3,
        }}
      >
        {locationActivity ? locationActivity.locationName : displayTerrainName}
        {hasRiver && !locationActivity && (
          <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> 🌊</span>
        )}
      </div>

      {/* Secondary line: coordinates (always shown) */}
      <div
        style={{
          color:      'var(--text-secondary)',
          fontSize:   'var(--text-xs)',
          fontWeight: 400,
          fontFamily: 'var(--font-body)',
          lineHeight: 1.4,
          marginBottom: locationActivity ? 4 : 0,
        }}
      >
        ({coord.col}, {coord.row})
        {!locationActivity && terrainKey && terrainKey !== displayTerrainName.toLowerCase() && (
          <span style={{ color: 'var(--text-tertiary)', marginLeft: 4 }}>{terrainKey}</span>
        )}
      </div>

      {/* Location murmur prose — italic, atmospheric */}
      {locationActivity?.murmurs && locationActivity.murmurs.length > 0 && (
        <>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }} />
          {locationActivity.murmurs.map((murmur, i) => (
            <div
              key={i}
              style={{
                fontStyle:  'italic',
                color:      'var(--text-secondary)',
                fontSize:   'var(--text-xs)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.5,
                whiteSpace: 'normal',
                maxWidth:   `${estimatedWidth - 20}px`,
              }}
            >
              {murmur}
            </div>
          ))}
        </>
      )}

      {/* Agent thread list — familiarity-gated */}
      {namedThreads.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {namedThreads.map((thread) => (
            <div
              key={thread.agentId}
              style={{
                color:      'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.4,
                display:    'flex',
                alignItems: 'center',
                gap:        4,
              }}
            >
              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>●</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {thread.visibleActivity}
              </span>
              <MovementBadge phase={thread.movementPhase} />
            </div>
          ))}
          {overflowCount > 0 && (
            <div
              style={{
                color:      'var(--text-tertiary)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>○</span>
              {' '}({overflowCount} {overflowCount === 1 ? 'other' : 'others'})
            </div>
          )}
        </div>
      )}

      {/* Dev debug: geo parameters */}
      {geoParams && (
        <div style={{ marginTop: 2, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 2 }}>
          <div style={dimStyle}>elev {f2(geoParams.elevation)} · temp {f2(geoParams.temperature)}</div>
          <div style={dimStyle}>moist {pct(geoParams.moisture)}</div>
        </div>
      )}
    </div>
  );
}
