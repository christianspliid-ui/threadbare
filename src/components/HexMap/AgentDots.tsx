import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { MovementState } from '../../types/movement';
import { Tooltip } from '../shared/Tooltip';
import { hexToPixel } from '../../lib/hexMath';
import {
  ZOOM_TOKEN_THRESHOLD,
  MAX_RING_AGENTS,
  AGENT_DOT_RADIUS,
  AGENT_TOKEN_RADIUS,
  DOMAIN_COLORS,
  DEFAULT_AGENT_COLOR,
  AGENT_RING_RADIUS,
  AGENT_ARRIVE_FLASH_MS,
} from '../../data/agent-visual-content';

interface AgentDotsProps {
  graph: WorldGraph;
  /** Array of { locationId, x, y } positions where agents may be */
  locationPositions: Array<{ locationId: string; x: number; y: number }>;
  zoomScale: number;
  /** Hex tile size in pixels — needed for interpolating positions toward next hex */
  hexSize: number;
  /** Current tick — used to bust memo cache since graph is a mutable class */
  currentTick?: number;
  /** Avatar actor node ID — renders with sphere color + breathing pulse */
  avatarId?: string;
  /** Sphere color for the avatar dot */
  sphereColor?: string;
  onAgentClick?: (agentId: string) => void;
  onAgentDoubleClick?: (agentId: string) => void;
  onAgentHover?: (agentId: string | null) => void;
}

/** Deterministic hash for consistent wobble per agent+segment — matches MovementTrails */
function wobbleHash(agentId: string, index: number): number {
  let h = index * 2654435761;
  for (let i = 0; i < agentId.length; i++) {
    h = ((h << 5) - h + agentId.charCodeAt(i)) | 0;
  }
  return h;
}

/** Wobble magnitude as fraction of hex size (matches MovementTrails.WOBBLE_FACTOR) */
const WOBBLE_FACTOR = 0.5;

/** Evaluate quadratic bezier B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2 */
function evalQuadBezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/** Map domain key to human-friendly label */
const DOMAIN_LABELS: Record<string, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil',
  heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star', flesh: 'Flesh',
};

function getAgentColor(domainCapabilities: Record<string, number> | undefined): string {
  if (!domainCapabilities) return DEFAULT_AGENT_COLOR;
  let bestDomain = '';
  let bestValue = -1;
  for (const [domain, value] of Object.entries(domainCapabilities)) {
    if (value > bestValue) {
      bestValue = value;
      bestDomain = domain;
    }
  }
  return DOMAIN_COLORS[bestDomain] ?? DEFAULT_AGENT_COLOR;
}

/** Get human-friendly primary domain name */
function getPrimaryDomain(domainCapabilities: Record<string, number> | undefined): string {
  if (!domainCapabilities) return 'Unknown';
  let bestDomain = '';
  let bestValue = -1;
  for (const [domain, value] of Object.entries(domainCapabilities)) {
    if (value > bestValue) {
      bestValue = value;
      bestDomain = domain;
    }
  }
  return DOMAIN_LABELS[bestDomain] ?? bestDomain;
}

/** Collect all individual agents at a location via both `contains` and `located_at` edges. */
function getAgentsAtLocation(graph: WorldGraph, locationId: string) {
  const seen = new Set<string>();
  const agents: ReturnType<WorldGraph['getNode']>[] = [];

  for (const edgeType of ['contains', 'located_at'] as const) {
    const edges = graph.getIncomingEdges(locationId, edgeType);
    for (const e of edges) {
      if (seen.has(e.source)) continue;
      const node = graph.getNode(e.source);
      if (node && node.properties?.actorType === 'individual') {
        seen.add(e.source);
        agents.push(node);
      }
    }
  }

  return agents;
}

/** Build tooltip label + desc for an agent dot */
function buildAgentTooltip(
  agent: NonNullable<ReturnType<WorldGraph['getNode']>>,
  isAvatar: boolean,
): { label: string; desc: string } {
  const name = agent.name ?? 'Unknown';
  const domain = getPrimaryDomain(agent.properties?.domainCapabilities as Record<string, number>);
  const archetype = agent.properties?.narrativeArchetype as string | undefined;
  const label = isAvatar ? `${name} (Avatar)` : name;
  const parts: string[] = [`Domain: ${domain}`];
  if (archetype) parts.push(`Archetype: ${archetype}`);
  return { label, desc: parts.join('\n') };
}

interface FlatAgent {
  agent: NonNullable<ReturnType<WorldGraph['getNode']>>;
  locationId: string;
  x: number;
  y: number;
}

interface OverflowEntry {
  locationId: string;
  cx: number;
  cy: number;
  count: number;
}

export const AgentDots: React.FC<AgentDotsProps> = ({
  graph,
  locationPositions,
  zoomScale,
  hexSize,
  currentTick,
  avatarId,
  sphereColor,
  onAgentClick,
  onAgentDoubleClick,
  onAgentHover,
}) => {
  const isTokenZoom = zoomScale >= ZOOM_TOKEN_THRESHOLD;
  const radius = isTokenZoom ? AGENT_TOKEN_RADIUS : AGENT_DOT_RADIUS;

  // Step 1: Collect ALL agents with absolute pixel positions (flat list)
  // Agents with active movement interpolate between current and next hex.
  const { allAgents, overflows } = useMemo(() => {
    const agents: FlatAgent[] = [];
    const ovf: OverflowEntry[] = [];
    const seen = new Set<string>(); // prevent duplicate entries for interpolated agents

    for (const { locationId, x: cx, y: cy } of locationPositions) {
      const locAgents = getAgentsAtLocation(graph, locationId);
      if (locAgents.length === 0) continue;

      const visible = locAgents.slice(0, MAX_RING_AGENTS);
      const overflow = locAgents.length - MAX_RING_AGENTS;

      for (let i = 0; i < visible.length; i++) {
        const agent = visible[i];
        if (!agent || seen.has(agent.id)) continue;
        seen.add(agent.id);

        const angle = (2 * Math.PI * i) / Math.max(visible.length, 1) - Math.PI / 2;
        const dx = Math.cos(angle) * AGENT_RING_RADIUS;
        const dy = Math.sin(angle) * AGENT_RING_RADIUS;
        let ax = cx + dx;
        let ay = cy + dy;

        // Interpolate along a wobbled bezier toward next hex (matches trail style)
        const ms = agent.properties?.movementState as MovementState | undefined;
        if (ms && ms.movementQueue.length > 0 && ms.currentEdgeCost > 0) {
          const nextLocId = ms.movementQueue[0];
          const nextLocNode = graph.getNode(nextLocId);
          const nextCol = nextLocNode?.properties?.hexCol as number | undefined;
          const nextRow = nextLocNode?.properties?.hexRow as number | undefined;
          if (nextCol != null && nextRow != null) {
            const nextPixel = hexToPixel({ col: nextCol, row: nextRow }, hexSize);
            const t = ms.ticksAccumulated / ms.currentEdgeCost;

            // Compute perpendicular wobble for bezier control point (same as trail)
            const segDx = nextPixel.x - cx;
            const segDy = nextPixel.y - cy;
            const segLen = Math.sqrt(segDx * segDx + segDy * segDy) || 1;
            const perpX = -segDy / segLen;
            const perpY = segDx / segLen;
            const hash = wobbleHash(agent.id, ms.movementHistory?.length ?? 0);
            const wobbleMag = hexSize * WOBBLE_FACTOR * (((hash & 0xff) / 255) * 2 - 1);

            const p0 = { x: cx, y: cy };
            const p1 = { x: (cx + nextPixel.x) / 2 + perpX * wobbleMag,
                         y: (cy + nextPixel.y) / 2 + perpY * wobbleMag };
            const p2 = { x: nextPixel.x, y: nextPixel.y };

            const bezierPos = evalQuadBezier(p0, p1, p2, t);
            ax = bezierPos.x + dx;
            ay = bezierPos.y + dy;
          }
        }

        agents.push({ agent, locationId, x: ax, y: ay });
      }

      if (overflow > 0) {
        ovf.push({ locationId, cx, cy, count: overflow });
      }
    }

    return { allAgents: agents, overflows: ovf };
    // currentTick busts the cache — graph is mutable, reference never changes
  }, [graph, locationPositions, currentTick, hexSize]);

  // Step 2: Track previous locations for arrival flash detection
  const prevLocations = useRef<Map<string, string>>(new Map());
  const [arrivingAgents, setArrivingAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const arriving = new Set<string>();
    const newMap = new Map<string, string>();

    for (const { agent, locationId } of allAgents) {
      const prev = prevLocations.current.get(agent.id);
      // Agent moved if we had a previous location and it differs
      if (prev && prev !== locationId) {
        arriving.add(agent.id);
      }
      newMap.set(agent.id, locationId);
    }

    prevLocations.current = newMap;

    if (arriving.size > 0) {
      setArrivingAgents(arriving);
      const timer = setTimeout(() => setArrivingAgents(new Set()), AGENT_ARRIVE_FLASH_MS);
      return () => clearTimeout(timer);
    }
  }, [allAgents]);

  // Step 3: Render flat list — stable keys enable CSS transitions
  return (
    <g className="agent-dots-layer" style={{ pointerEvents: 'auto' }}>
      {allAgents.map(({ agent, x, y }) => {
        const isAvatar = agent.id === avatarId;
        const color = isAvatar && sphereColor
          ? sphereColor
          : getAgentColor(agent.properties?.domainCapabilities as Record<string, number>);
        const tooltip = buildAgentTooltip(agent, isAvatar);
        const isArriving = arrivingAgents.has(agent.id);

        return (
          <Tooltip
            key={agent.id}
            as="g"
            label={tooltip.label}
            desc={tooltip.desc}
            id={`agent.${agent.id}`}
          >
            <g
              className="agent-dot-group"
              style={{ transform: `translate(${x}px, ${y}px)` }}
              onClick={() => onAgentClick?.(agent.id)}
              onDoubleClick={() => onAgentDoubleClick?.(agent.id)}
              onMouseEnter={() => onAgentHover?.(agent.id)}
              onMouseLeave={() => onAgentHover?.(null)}
              cursor="pointer"
            >
              <circle
                r={radius}
                fill={color}
                stroke={isAvatar ? sphereColor ?? '#000' : '#000'}
                strokeWidth={isAvatar ? 1.5 : 0.5}
                className={[
                  isAvatar ? 'avatar-pulse' : undefined,
                  isArriving ? 'agent-arriving' : undefined,
                ].filter(Boolean).join(' ') || undefined}
              />
            </g>
          </Tooltip>
        );
      })}
      {/* Overflow badges — still keyed by location */}
      {overflows.map(({ locationId, cx, cy, count }) => (
        <text
          key={`overflow-${locationId}`}
          x={cx}
          y={cy + AGENT_RING_RADIUS + 8}
          textAnchor="middle"
          fontSize={6}
          fill="#333"
        >
          +{count}
        </text>
      ))}
    </g>
  );
};
