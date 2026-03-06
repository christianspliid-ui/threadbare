import { useMemo } from 'react';
import type { GraphNode, GraphEdge } from '../../types/graph';
import type { LineOfSight } from '../../engine/hexZoom';
import { getPolygonVertices, type Point } from '../../lib/polygonLayout';
import { hexPolygonPoints } from '../../lib/hexMath';

interface HexZoomViewProps {
  locations: GraphNode[];
  agentsByLocation: Record<string, GraphNode[]>;
  connections: GraphEdge[];
  lineOfSight: LineOfSight;
  onLocationClick: (locationId: string) => void;
  onLocationDoubleClick: (locationId: string) => void;
}

// Layout constants
const HEX_RADIUS = 260;
const LOCATION_RADIUS = 40;
const AGENT_SIZE = 28;
const POLYGON_FRACTION = 0.65; // inscribed polygon radius as fraction of hex radius
const VIEW_SIZE = 600; // SVG viewBox size
const CENTER = VIEW_SIZE / 2;

// Agent colors by initial (simple hash for variety)
function agentColor(name: string): string {
  const colors = ['#cc3333', '#33cc66', '#6699ff', '#cc99ff', '#ff9933', '#ffcc00', '#8b7355', '#666666'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

export function HexZoomView({
  locations,
  agentsByLocation,
  connections,
  lineOfSight,
  onLocationClick,
  onLocationDoubleClick,
}: HexZoomViewProps) {
  const polygonRadius = HEX_RADIUS * POLYGON_FRACTION;
  const vertices = useMemo(
    () => getPolygonVertices(locations.length, CENTER, CENTER, polygonRadius),
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

  const hexPoints = hexPolygonPoints(CENTER, CENTER, HEX_RADIUS);
  const isHidden = lineOfSight === 'none';
  const isDimmed = lineOfSight === 'partial';

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      className="w-full h-full max-w-[600px] max-h-[600px]"
    >
      {/* Glow filter for travel lines */}
      <defs>
        <filter id="glow-line" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Hex outline */}
      <polygon
        points={hexPoints}
        fill="#2a2a2e"
        stroke="#d4af37"
        strokeWidth="1.5"
        strokeOpacity={0.3}
      />

      {/* Travel lines between connected locations */}
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
            stroke="#d4af37"
            strokeWidth="1"
            strokeOpacity={0.4}
            filter="url(#glow-line)"
          />
        );
      })}

      {/* Location circles */}
      {locations.map((loc, i) => {
        const pos = vertices[i];
        if (!pos) return null;
        const agents = agentsByLocation[loc.id] ?? [];

        return (
          <g key={loc.id}>
            {/* Location circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={LOCATION_RADIUS}
              fill={isHidden ? '#1a1a1e' : '#3a3a3e'}
              stroke="#d4af37"
              strokeWidth="1.5"
              strokeOpacity={isHidden ? 0.2 : 0.6}
              opacity={isDimmed ? 0.6 : 1}
              style={{ cursor: 'pointer' }}
              onClick={() => onLocationClick(loc.id)}
              onDoubleClick={() => onLocationDoubleClick(loc.id)}
            />

            {/* Location name */}
            <text
              x={pos.x}
              y={pos.y + LOCATION_RADIUS + 16}
              textAnchor="middle"
              fill={isHidden ? '#666' : '#d4af37'}
              fontSize="12"
              fontFamily="Cinzel, serif"
              style={{ cursor: 'pointer' }}
              onClick={() => onLocationClick(loc.id)}
              onDoubleClick={() => onLocationDoubleClick(loc.id)}
            >
              {isHidden ? '?' : loc.name}
            </text>

            {/* Agent squares */}
            {!isHidden && agents.map((agent, ai) => {
              // Position agents in a small arc above the location circle
              const angleOffset = ((ai - (agents.length - 1) / 2) * 35) * (Math.PI / 180);
              const agentDist = LOCATION_RADIUS + AGENT_SIZE * 0.8;
              const ax = pos.x + agentDist * Math.sin(angleOffset);
              const ay = pos.y - agentDist * Math.cos(angleOffset);

              return (
                <g key={agent.id}>
                  <rect
                    x={ax - AGENT_SIZE / 2}
                    y={ay - AGENT_SIZE / 2}
                    width={AGENT_SIZE}
                    height={AGENT_SIZE}
                    rx="3"
                    fill={agentColor(agent.name)}
                    opacity={isDimmed ? 0.4 : 0.85}
                  />
                  <text
                    x={ax}
                    y={ay + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {agent.name.charAt(0)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
