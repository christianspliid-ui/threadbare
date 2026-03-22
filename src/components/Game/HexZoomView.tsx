import { useMemo, memo } from 'react';
import type { GraphNode, GraphEdge } from '../../types/graph';
import type { TerrainType, LocationSubtype } from '../../types';
import type { LineOfSight, HexCultureSummary, HexFactionSummary } from '../../engine/hexZoom';
import { getPolygonVertices, type Point } from '../../lib/polygonLayout';
import { hexPolygonPoints } from '../../lib/hexMath';
import { Tooltip } from '../shared/Tooltip';
import { getAgentColor } from '../../data/sphereIcons';
import { getHexTileUrl, getOverlayIconUrl } from '../../data/hex-tile-assets';

// ── Layout constants ──────────────────────────────────────────────────
const LAYOUT = {
  VIEW_W: 800,                  // SVG viewBox width
  VIEW_H: 700,                  // SVG viewBox height
  HEX_RADIUS: 320,             // Large hex — fills the view
  LOCATION_RADIUS: 44,         // Location circle radius (compact to leave room for labels below)
  AGENT_SIZE: 22,              // Agent indicator size (compact)
  POLYGON_FRACTION: 0.65,     // inscribed polygon radius — pushed outward so top location sits near hex border
  AGENT_ANGLE_OFFSET: 28,     // degrees per agent in arc positioning
  AGENT_ORBIT_GAP: 6,         // gap between location circle and agent orbit
  LABEL_GAP: 8,               // gap between circle edge and label text below
  MAX_NAME_CHARS: 20,         // wrap location names beyond this (wider to allow more text)
  AGENT_COUNT_BADGE_OFFSET: -6, // agent count badge Y offset from top of circle
} as const;

// ── Visual constants ──────────────────────────────────────────────────
import { HEX_ZOOM_COLORS } from '../../data/uiColorPalette';
const COLORS = HEX_ZOOM_COLORS;

const OPACITY = {
  HEX_BORDER: 0.35,
  LOCATION_BORDER_VISIBLE: 0.7,
  LOCATION_BORDER_HIDDEN: 0.15,
  LOCATION_DIMMED: 0.55,
  TERRAIN_VISIBLE: 0.85,
  TERRAIN_DIMMED: 0.4,
  TERRAIN_HIDDEN: 0.08,
  OVERLAY_ICON: 0.92,
  OVERLAY_ICON_DIMMED: 0.45,
  AGENT_VISIBLE: 0.9,
  AGENT_DIMMED: 0.35,
} as const;

const FONT = {
  LOCATION_NAME_SIZE: 15,              // +1pt bump
  SUBTYPE_SIZE: 14,                    // +1pt bump
  AGENT_INITIAL_SIZE: 14,              // +1pt bump
  AGENT_COUNT_SIZE: 14,                // +1pt bump
} as const;

const TERRAIN_IMAGE_SCALE = 2.4;
const OVERLAY_ICON_SCALE = 0.8;
const HEX_BORDER_WIDTH = 2;
const TRAVEL_LINE_WIDTH = 1.5;

const CENTER_X = LAYOUT.VIEW_W / 2;
const CENTER_Y = LAYOUT.VIEW_H / 2;

// RC-009: Pre-compute hex outline points — all inputs are module-level constants
const HEX_OUTLINE_POINTS = hexPolygonPoints(CENTER_X, CENTER_Y, LAYOUT.HEX_RADIUS);

// ── Helpers ───────────────────────────────────────────────────────────

/** Format location subtype as human-readable label */
function formatSubtype(subtype: string): string {
  return subtype
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Split a name into wrapped lines that fit within a max character width */
function wrapName(name: string, maxChars: number): string[] {
  if (name.length <= maxChars) return [name];
  const words = name.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

/** Extract LocationSubtype from a GraphNode's properties */
function getLocationSubtype(loc: GraphNode): LocationSubtype | undefined {
  const props = (loc.properties ?? {}) as Record<string, unknown>;
  const sub = props.locationSubtype;
  return typeof sub === 'string' ? (sub as LocationSubtype) : undefined;
}

/** Build a descriptive tooltip string for a location */
function buildLocationDesc(
  subtype: LocationSubtype | undefined,
  agentCount: number,
): string {
  const parts: string[] = [];
  if (subtype && subtype !== 'wilderness') {
    parts.push(formatSubtype(subtype));
  } else {
    parts.push('Wilderness');
  }
  if (agentCount > 0) {
    parts.push(`${agentCount} agent${agentCount !== 1 ? 's' : ''}`);
  }
  parts.push('Click to enter');
  return parts.join(' · ');
}

/** Line height for wrapped name lines in SVG */
const NAME_LINE_HEIGHT = 16;

// ── Props ─────────────────────────────────────────────────────────────

interface HexZoomViewProps {
  locations: GraphNode[];
  agentsByLocation: Record<string, GraphNode[]>;
  connections: GraphEdge[];
  lineOfSight: LineOfSight;
  terrain: TerrainType;
  cultures: HexCultureSummary[];
  factions: HexFactionSummary[];
  onLocationClick: (locationId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────

export const HexZoomView = memo(function HexZoomView({
  locations,
  agentsByLocation,
  connections,
  lineOfSight,
  terrain,
  cultures,
  factions,
  onLocationClick,
}: HexZoomViewProps) {
  const polygonRadius = LAYOUT.HEX_RADIUS * LAYOUT.POLYGON_FRACTION;
  const vertices = useMemo(
    () => getPolygonVertices(locations.length, CENTER_X, CENTER_Y, polygonRadius),
    [locations.length, polygonRadius],
  );

  // Map location IDs to their SVG positions
  const locationPositions = useMemo(() => {
    const map = new Map<string, Point>();
    locations.forEach((loc, i) => {
      if (vertices[i]) {
        map.set(loc.id, vertices[i]);
      }
    });
    return map;
  }, [locations, vertices]);

  const hexPoints = HEX_OUTLINE_POINTS;
  const isHidden = lineOfSight === 'none';
  const isDimmed = lineOfSight === 'partial';

  // Terrain art
  const terrainUrl = getHexTileUrl(terrain);
  const terrainImgSize = LAYOUT.HEX_RADIUS * TERRAIN_IMAGE_SCALE;

  // Keyboard handler
  const handleLocationKeyDown = (e: React.KeyboardEvent, locationId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLocationClick(locationId);
    }
  };

  // Terrain opacity based on line of sight
  const terrainOpacity = isHidden
    ? OPACITY.TERRAIN_HIDDEN
    : isDimmed
      ? OPACITY.TERRAIN_DIMMED
      : OPACITY.TERRAIN_VISIBLE;

  return (
    <svg
      viewBox={`0 0 ${LAYOUT.VIEW_W} ${LAYOUT.VIEW_H}`}
      className="w-full h-full"
      style={{ maxHeight: '100%' }}
    >
      <defs>
        {/* Hex clip path for terrain image */}
        <clipPath id="hex-zoom-clip">
          <polygon points={hexPoints} />
        </clipPath>
        {/* Glow filter for travel lines */}
        <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Subtle glow for location circles */}
        <filter id="loc-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Per-location circular clip paths */}
        {locations.map((loc, i) => {
          const pos = vertices[i];
          if (!pos) return null;
          return (
            <clipPath key={`loc-clip-${loc.id}`} id={`loc-clip-${loc.id}`}>
              <circle cx={pos.x} cy={pos.y} r={LAYOUT.LOCATION_RADIUS} />
            </clipPath>
          );
        })}
      </defs>

      {/* ── Hex background: terrain image ──────────────────────────── */}
      <polygon
        points={hexPoints}
        fill={COLORS.HEX_FILL}
        stroke={COLORS.HEX_BORDER}
        strokeWidth={HEX_BORDER_WIDTH}
        strokeOpacity={OPACITY.HEX_BORDER}
      />
      <g clipPath="url(#hex-zoom-clip)">
        <image
          href={terrainUrl}
          x={CENTER_X - terrainImgSize / 2}
          y={CENTER_Y - terrainImgSize / 2}
          width={terrainImgSize}
          height={terrainImgSize}
          preserveAspectRatio="xMidYMid slice"
          opacity={terrainOpacity}
        />
      </g>
      {/* Re-stroke hex outline over the terrain image */}
      <polygon
        points={hexPoints}
        fill="none"
        stroke={COLORS.HEX_BORDER}
        strokeWidth={HEX_BORDER_WIDTH}
        strokeOpacity={OPACITY.HEX_BORDER}
      />

      {/* Culture / Faction info is shown in HexBreadcrumb — no duplicate SVG label needed */}

      {/* ── Travel lines between connected locations ───────────────── */}
      {connections.map(edge => {
        const from = locationPositions.get(edge.source);
        const to = locationPositions.get(edge.target);
        if (!from || !to) return null;
        return (
          <line
            key={edge.id}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={COLORS.TRAVEL_LINE}
            strokeWidth={TRAVEL_LINE_WIDTH}
            strokeDasharray="6 4"
            filter="url(#glow-line)"
          />
        );
      })}

      {/* ── Location nodes ─────────────────────────────────────────── */}
      {locations.map((loc, i) => {
        const pos = vertices[i];
        if (!pos) return null;
        const agents = agentsByLocation[loc.id] ?? [];
        const subtype = getLocationSubtype(loc);
        const overlayUrl = subtype ? getOverlayIconUrl(subtype) : null;
        const overlaySize = LAYOUT.LOCATION_RADIUS * 2 * OVERLAY_ICON_SCALE;

        const tooltipLabel = isHidden ? 'Unknown' : loc.name;
        const tooltipDesc = isHidden
          ? 'Unexplored location'
          : buildLocationDesc(subtype, agents.length);

        // Labels always below circle, agents always orbit above
        const labelY = pos.y + LAYOUT.LOCATION_RADIUS + LAYOUT.LABEL_GAP;
        const nameLines = isHidden ? ['?'] : wrapName(loc.name, LAYOUT.MAX_NAME_CHARS);
        const subtypeY = labelY + nameLines.length * NAME_LINE_HEIGHT;
        const agentOrbitSide = -1; // agents above

        return (
          <Tooltip
            key={loc.id}
            as="g"
            label={tooltipLabel}
            desc={tooltipDesc}
          >
            <g
              role="button"
              aria-label={isHidden ? 'Unknown location' : `Location: ${loc.name}${agents.length > 0 ? `, ${agents.length} agent${agents.length !== 1 ? 's' : ''}` : ''}`}
              tabIndex={0}
              onKeyDown={(e) => handleLocationKeyDown(e as unknown as React.KeyboardEvent, loc.id)}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              {/* Location circle — outer glow ring */}
              {!isHidden && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={LAYOUT.LOCATION_RADIUS + 3}
                  fill="none"
                  stroke={COLORS.HEX_BORDER}
                  strokeWidth="1"
                  strokeOpacity={0.15}
                  filter="url(#loc-glow)"
                />
              )}

              {/* Location circle — main */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={LAYOUT.LOCATION_RADIUS}
                fill={isHidden ? COLORS.LOCATION_FILL_HIDDEN : COLORS.LOCATION_FILL}
                stroke={COLORS.LOCATION_BORDER}
                strokeWidth="2"
                strokeOpacity={isHidden ? OPACITY.LOCATION_BORDER_HIDDEN : OPACITY.LOCATION_BORDER_VISIBLE}
                opacity={isDimmed ? OPACITY.LOCATION_DIMMED : 1}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                onClick={() => onLocationClick(loc.id)}
              />

              {/* Location overlay icon (clipped to circle) */}
              {!isHidden && overlayUrl && (
                <g clipPath={`url(#loc-clip-${loc.id})`}>
                  <image
                    href={overlayUrl}
                    x={pos.x - overlaySize / 2}
                    y={pos.y - overlaySize / 2}
                    width={overlaySize}
                    height={overlaySize}
                    preserveAspectRatio="xMidYMid meet"
                    opacity={isDimmed ? OPACITY.OVERLAY_ICON_DIMMED : OPACITY.OVERLAY_ICON}
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              )}

              {/* Hidden state: question mark */}
              {isHidden && (
                <text
                  x={pos.x}
                  y={pos.y + 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={COLORS.LOCATION_NAME_HIDDEN}
                  fontSize="24"
                  fontFamily="Cinzel, serif"
                  aria-hidden="true"
                  style={{ pointerEvents: 'none' }}
                >
                  ?
                </text>
              )}

              {/* Location name — always below circle, word-wrapped (hidden names use ? inside circle instead) */}
              {!isHidden && (
                <text
                  x={pos.x}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  fill={COLORS.LOCATION_NAME}
                  fontSize={FONT.LOCATION_NAME_SIZE}
                  fontFamily="Cinzel, serif"
                  fontWeight="600"
                  style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  onClick={() => onLocationClick(loc.id)}
                  >
                  {nameLines.map((line, li) => (
                    <tspan
                      key={li}
                      x={pos.x}
                      dy={li === 0 ? 0 : NAME_LINE_HEIGHT}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              )}

              {/* RC-010: Subtype label — decorative, hidden from screen readers */}
              {!isHidden && subtype && subtype !== 'wilderness' && (
                <text
                  x={pos.x}
                  y={subtypeY}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  fill={COLORS.SUBTYPE_TEXT}
                  fontSize={FONT.SUBTYPE_SIZE}
                  fontFamily="Cinzel, serif"
                  opacity={0.65}
                  aria-hidden="true"
                  style={{ pointerEvents: 'none' }}
                >
                  {formatSubtype(subtype)}
                </text>
              )}

              {/* RC-010: Agent count badge — decorative (count conveyed via aria-label on parent g) */}
              {!isHidden && agents.length > 0 && (
                <g aria-hidden="true">
                  <circle
                    cx={pos.x + LAYOUT.LOCATION_RADIUS * 0.7}
                    cy={pos.y + LAYOUT.AGENT_COUNT_BADGE_OFFSET}
                    r={9}
                    fill={COLORS.AGENT_COUNT_BG}
                    opacity={0.9}
                  />
                  <text
                    x={pos.x + LAYOUT.LOCATION_RADIUS * 0.7}
                    y={pos.y + LAYOUT.AGENT_COUNT_BADGE_OFFSET + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={COLORS.AGENT_COUNT_TEXT}
                    fontSize={FONT.AGENT_COUNT_SIZE}
                    fontWeight="bold"
                  >
                    {agents.length}
                  </text>
                </g>
              )}

              {/* Agent indicators — orbit on opposite side from label */}
              {!isHidden && agents.map((agent, ai) => {
                const totalAngle = Math.min(agents.length * LAYOUT.AGENT_ANGLE_OFFSET, 140);
                const startAngle = -totalAngle / 2;
                const angleStep = agents.length > 1 ? totalAngle / (agents.length - 1) : 0;
                // Base angle: 0° = above location (agents always orbit above)
                const baseAngleDeg = 0;
                const angleDeg = baseAngleDeg + startAngle + ai * angleStep;
                const angle = angleDeg * (Math.PI / 180);
                const orbitR = LAYOUT.LOCATION_RADIUS + LAYOUT.AGENT_ORBIT_GAP + LAYOUT.AGENT_SIZE / 2;
                const ax = pos.x + orbitR * Math.sin(angle);
                const ay = pos.y - orbitR * Math.cos(angle);
                const agentColor = getAgentColor(agent.name);

                return (
                  <Tooltip
                    key={agent.id}
                    as="g"
                    label={agent.name}
                    desc="Agent"
                  >
                    <g>
                      <rect
                        x={ax - LAYOUT.AGENT_SIZE / 2}
                        y={ay - LAYOUT.AGENT_SIZE / 2}
                        width={LAYOUT.AGENT_SIZE}
                        height={LAYOUT.AGENT_SIZE}
                        rx="3"
                        fill={agentColor}
                        opacity={isDimmed ? OPACITY.AGENT_DIMMED : OPACITY.AGENT_VISIBLE}
                        stroke="#000"
                        strokeWidth="1"
                        strokeOpacity={0.4}
                      />
                      <text
                        x={ax}
                        y={ay + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={FONT.AGENT_INITIAL_SIZE}
                        fontWeight="bold"
                        aria-hidden="true"
                        style={{ pointerEvents: 'none' }}
                      >
                        {agent.name.charAt(0)}
                      </text>
                    </g>
                  </Tooltip>
                );
              })}
            </g>
          </Tooltip>
        );
      })}
    </svg>
  );
});
