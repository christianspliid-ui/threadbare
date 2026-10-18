import type { HexCoord, GeoParams } from '../../../types';
import type { LocationActivitySummary, AgentActivityThread } from '../../../types/locationActivity';
import { INTERACTION_CONSTANTS } from './HexRaycaster';
import { LOCATION_ACTIVITY_CONSTANTS } from '../../../engine/deriveLocationActivities';
import type { RouteTooltipEntry } from '../../../engine/tradeRouteMarkers';
import { geoWord, ELEVATION_WORDS, TEMPERATURE_WORDS, MOISTURE_WORDS } from '../../../data/geo-word-bands';
import { MAP_OVERLAY_Z } from '../overlay/mapOverlayZ';
import { terrainDisplayName } from '../palette/terrainPalette';
import type { BattleHexLine } from './battleHexLine';
import type { LensLine } from '../../../engine/views/lenses/lensTypes';
import { useSyncExternalStore } from 'react';
import {
  isNudgeDesignerViewEnabled,
  subscribeNudgeDesignerView,
} from '../../Game/encounter-stage/designerView';

/** Max trade routes listed per tooltip before the "(N more)" overflow line. */
const TOOLTIP_MAX_ROUTES = 3;

/**
 * THR-1848 — the title line wraps inside the box instead of spilling past it
 * (Law 33). For the height estimate, a title is counted as this many px per
 * character at `--text-sm` weight 600, and each wrapped line adds this height.
 * Both are sized for the largest type step (2560, root 112.5%: ~9 px a glyph,
 * 1.3 × ~20 px a line) — over-estimating only lifts the box a little higher,
 * under-estimating drops it onto the hovered hex.
 */
export const TOOLTIP_TITLE_CHAR_PX = 9;
export const TOOLTIP_TITLE_LINE_PX = 27;
/** Horizontal padding inside the box (6px 10px), subtracted from the width cap. */
const TOOLTIP_PADDING_X = 20;

/**
 * THR-1818 — the river feature reads as a word, the same "River" the hex detail
 * panel's Feature row shows. No icon vocabulary owns map features, and an emoji
 * is outside every one (Law 9), so the word is the honest glyph.
 */
export const HEX_TOOLTIP_RIVER_LABEL = 'River';

interface HexTooltipProps {
  /**
   * Terrain name fallback when no `terrainKey` is given. Always passed through
   * `terrainDisplayName`, so a raw engine key here still renders Title Case.
   */
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
  /** Raw terrain key — resolved to its display name via `terrainDisplayName` (THR-1818). */
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
  /**
   * Trade routes touching this hex (THR-670). Each entry renders as one line:
   * counterpart name + cargo manifest, red-tinted when the route is threatened.
   */
  tradeRoutes?: RouteTooltipEntry[];
  /**
   * THR-1609: "You walk here as {name}." when the player's avatar stands on this
   * hex — the line that tells the player this figure is their own shape.
   */
  avatarLine?: string;
  /** Sphere tint for the avatar line's marker dot. */
  avatarColor?: string;
  /**
   * THR-1750 — while the Dominion lens is on: "Held ground, by Hesk Crossing".
   * The band word in its colour; the place's page explains the same band.
   */
  dominionLine?: { prefix: string; placeName: string | null; word: string; color: string; pressure?: string | null };
  /** THR-1750 — a band-drop badge on this hex: the `ui.dominion.drop` words + the chronicle line. */
  dominionDrop?: { lead: string; line: string };
  /**
   * THR-1847 — a siege or battle on this hex, in words: the `ui.siege` / `ui.battle`
   * label in the marker's colour, then who is fighting. Built by `battleHexLines`.
   */
  battleLines?: BattleHexLine[];
  /**
   * THR-1878 — the hex lens's lines for this hex while a lens is on ("Maren Ashfold,
   * your First, is here."). Name segments render in the name colour; the hover tier
   * is pointer-events: none, so the names route from the land page, not from here.
   */
  lensLines?: LensLine[];
}

// THR-1451 (Class C): `pct()` drew `73%` on the geo row. The reading exists —
// `HexDetailView` bands the same three parameters to words — so this row takes
// that ladder rather than the numeral. `f2` goes with it: a two-decimal float is
// the same Law 13 violation wearing a different format.

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
 * Z-index MAP_OVERLAY_Z.HEX_TOOLTIP: top of the map-overlay band, above every
 * label overlay (THR-1665, Law 35) and below the HUD.
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
  tradeRoutes,
  avatarLine,
  avatarColor,
  dominionLine,
  dominionDrop,
  lensLines,
  battleLines,
}: HexTooltipProps) {
  // THR-1804 — grid coordinates and the raw terrain key are map plumbing; cold
  // playtest round 3 read "Wilderness (18, 11)" as debug info. Designer view only.
  const designerView = useSyncExternalStore(
    subscribeNudgeDesignerView,
    isNudgeDesignerViewEnabled,
    isNudgeDesignerViewEnabled,
  );
  const hasLocationData = locationActivity && locationActivity.agentThreads.length > 0 || locationActivity?.murmurs.length;

  // Estimated tooltip dimensions for clamping
  const murmurLineCount = locationActivity?.murmurs.length ?? 0;
  const threadCount = Math.min(
    locationActivity?.agentThreads.length ?? 0,
    LOCATION_ACTIVITY_CONSTANTS.TOOLTIP_MAX_NAMED_AGENTS,
  );
  const hasOverflow = (locationActivity?.agentThreads.length ?? 0) > LOCATION_ACTIVITY_CONSTANTS.TOOLTIP_MAX_NAMED_AGENTS;

  const namedRouteCount = Math.min(tradeRoutes?.length ?? 0, TOOLTIP_MAX_ROUTES);
  const routeOverflow = Math.max(0, (tradeRoutes?.length ?? 0) - TOOLTIP_MAX_ROUTES);
  const routeSectionHeight = namedRouteCount > 0 ? 8 + namedRouteCount * 16 + (routeOverflow > 0 ? 14 : 0) : 0;

  const estimatedWidth  = hasLocationData || namedRouteCount > 0 || avatarLine || battleLines?.length ? 240 : 180;
  const estimatedHeight = geoParams ? 100
    : hasLocationData
      ? 46 + murmurLineCount * 18 + threadCount * 16 + (hasOverflow ? 14 : 0) + 8 + routeSectionHeight
      : 46 + routeSectionHeight;
  const avatarLineHeight = avatarLine ? 20 : 0;
  const battleLineHeight = (battleLines?.length ?? 0) * 18;
  const offsetY = INTERACTION_CONSTANTS.TOOLTIP_OFFSET_Y;

  // Resolve terrain display name through the one display-name map (THR-1818)
  const displayTerrainName = terrainDisplayName(terrainKey || terrainName);
  const titleText = locationActivity ? locationActivity.locationName : displayTerrainName;
  const showRiverSuffix = !!hasRiver && !locationActivity && displayTerrainName !== HEX_TOOLTIP_RIVER_LABEL;
  // The river suffix sits on the title line and wraps with it, so it is measured too.
  const titleRenderedLength = titleText.length + (showRiverSuffix ? ` · ${HEX_TOOLTIP_RIVER_LABEL}`.length : 0);
  const titleCharsPerLine = Math.max(1, Math.floor((estimatedWidth - TOOLTIP_PADDING_X) / TOOLTIP_TITLE_CHAR_PX));
  const titleExtraLines = Math.max(0, Math.ceil(titleRenderedLength / titleCharsPerLine) - 1);
  const titleExtraHeight = titleExtraLines * TOOLTIP_TITLE_LINE_PX;

  let left = screenX - estimatedWidth / 2;
  let top  = screenY - offsetY - estimatedHeight - avatarLineHeight - battleLineHeight - titleExtraHeight;

  if (left < 4) left = 4;
  if (left + estimatedWidth > canvasWidth - 4) left = canvasWidth - estimatedWidth - 4;
  if (top < 4) top = screenY + offsetY;

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
        zIndex:        MAP_OVERLAY_Z.HEX_TOOLTIP,
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
        data-testid="hex-tooltip-title"
        style={{
          color:       'var(--accent-gold)',
          fontSize:    'var(--text-sm)',
          fontWeight:  600,
          fontFamily: 'var(--font-body)',
          lineHeight:  1.3,
          // THR-1848 — the box is `nowrap`; the title must not inherit it, or a
          // long name ("The Shattered Sanctum–Hawkgate Road") runs past the border.
          whiteSpace:  'normal',
          overflowWrap: 'anywhere',
        }}
      >
        {titleText}
        {showRiverSuffix && (
          <span
            data-testid="hex-tooltip-river"
            style={{ color: 'var(--text-secondary)', fontWeight: 400 }}
          >
            {' · '}{HEX_TOOLTIP_RIVER_LABEL}
          </span>
        )}
      </div>

      {/* THR-1847 — the siege ring / crossed swords on this hex, in words */}
      {battleLines?.map(line => (
        <div
          key={line.id}
          data-testid={line.isSiege ? 'hex-tooltip-siege' : 'hex-tooltip-battle'}
          style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)', lineHeight: 1.5, whiteSpace: 'normal' }}
        >
          <span style={{ color: line.color, fontWeight: 600 }}>{line.word}</span>
          {line.rest}
        </div>
      ))}

      {/* THR-1750 — the Dominion band of this ground, while the lens is on */}
      {dominionLine && (
        <div
          data-testid="hex-tooltip-dominion"
          style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
        >
          <span style={{ color: dominionLine.color, fontWeight: 600 }}>{dominionLine.word}</span>
          {dominionLine.prefix.slice(dominionLine.word.length)}
          {dominionLine.placeName && <span style={{ color: 'var(--text-primary)' }}>{dominionLine.placeName}</span>}
          {dominionLine.pressure && (
            <div data-testid="hex-tooltip-dominion-pressure" style={{ whiteSpace: 'normal' }}>{dominionLine.pressure}</div>
          )}
        </div>
      )}
      {/* THR-1878 — the lens's own lines for this hex, while a hex lens is on */}
      {lensLines && lensLines.length > 0 && lensLines.map((line, i) => (
        <div
          key={i}
          data-testid="hex-tooltip-lens-line"
          style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)', lineHeight: 1.5, whiteSpace: 'normal' }}
        >
          {line.segments.map((seg, j) => seg.ref
            ? <span key={j} data-ref-kind={seg.ref.kind} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{seg.text}</span>
            : <span key={j}>{seg.text}</span>)}
        </div>
      ))}
      {/* THR-1750 — a band drop: news, never an interrupt */}
      {dominionDrop && (
        <div
          data-testid="hex-tooltip-dominion-drop"
          style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)', fontStyle: 'italic', lineHeight: 1.5, whiteSpace: 'normal' }}
        >
          {dominionDrop.lead} {dominionDrop.line}
        </div>
      )}

      {/* Secondary line: coordinates — designer view only (THR-1804) */}
      {designerView && (
        <div
          data-testid="hex-tooltip-coords"
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
      )}

      {/* The player's own shape on this hex (THR-1609) */}
      {avatarLine && (
        <div
          data-testid="hex-tooltip-avatar-line"
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        6,
            color:      'var(--text-primary)',
            fontSize:   'var(--text-xs)',
            fontFamily: 'var(--font-body)',
            fontStyle:  'italic',
            lineHeight: 1.5,
            whiteSpace: 'normal',
            marginBottom: 4,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${avatarColor ?? 'var(--accent-gold)'}`,
            }}
          />
          {avatarLine}
        </div>
      )}

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

      {/* Trade routes touching this hex — cargo manifests (THR-670) */}
      {namedRouteCount > 0 && tradeRoutes && (
        <div style={{ marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 4 }}>
          {tradeRoutes.slice(0, TOOLTIP_MAX_ROUTES).map((route, i) => (
            <div
              key={i}
              style={{
                color:      route.threatened ? 'var(--color-danger, #dc2626)' : 'var(--text-secondary)',
                fontSize:   'var(--text-xs)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.4,
                display:    'flex',
                alignItems: 'center',
                gap:        4,
              }}
            >
              <span style={{ color: route.threatened ? 'var(--color-danger, #dc2626)' : 'var(--accent-gold-dim, #c9a227)' }}>⇄</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {route.otherName}
                {route.goods.length > 0
                  ? ` — ${route.goods.join(', ')}`
                  : ' — light trade'}
                {route.carriesStaple ? ' ·staple' : ''}
                {route.threatened ? ' ·threatened' : ''}
                {route.traffic === 'suspended' ? ' ·blockaded' : route.traffic === 'idle' ? ' ·fading' : ''}
              </span>
            </div>
          ))}
          {routeOverflow > 0 && (
            <div style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
              ({routeOverflow} more {routeOverflow === 1 ? 'route' : 'routes'})
            </div>
          )}
        </div>
      )}

      {/* Geography, in the words the hex detail view already uses (THR-1451). This
          block was labelled "dev debug" but is not gated on anything — it renders to
          every player who hovers a hex, which is exactly the case Law 13 binds. */}
      {geoParams && (
        <div style={{ marginTop: 2, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 2 }}>
          <div style={dimStyle}>
            {geoWord(geoParams.elevation, ELEVATION_WORDS)} · {geoWord(geoParams.temperature, TEMPERATURE_WORDS)}
          </div>
          <div style={dimStyle}>{geoWord(geoParams.moisture, MOISTURE_WORDS)}</div>
        </div>
      )}
    </div>
  );
}
