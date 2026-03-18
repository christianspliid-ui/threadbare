import React, { useMemo, useRef, useState, useEffect } from 'react';
import type { WorldGraph } from '../../engine/graph';
import { Tooltip } from '../shared/Tooltip';
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
  /** Avatar actor node ID — renders with sphere color + breathing pulse */
  avatarId?: string;
  /** Sphere color for the avatar dot */
  sphereColor?: string;
  onAgentClick?: (agentId: string) => void;
  onAgentDoubleClick?: (agentId: string) => void;
  onAgentHover?: (agentId: string | null) => void;
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
  avatarId,
  sphereColor,
  onAgentClick,
  onAgentDoubleClick,
  onAgentHover,
}) => {
  const isTokenZoom = zoomScale >= ZOOM_TOKEN_THRESHOLD;
  const radius = isTokenZoom ? AGENT_TOKEN_RADIUS : AGENT_DOT_RADIUS;

  // Step 1: Collect ALL agents with absolute pixel positions (flat list)
  const { allAgents, overflows } = useMemo(() => {
    const agents: FlatAgent[] = [];
    const ovf: OverflowEntry[] = [];

    for (const { locationId, x: cx, y: cy } of locationPositions) {
      const locAgents = getAgentsAtLocation(graph, locationId);
      if (locAgents.length === 0) continue;

      const visible = locAgents.slice(0, MAX_RING_AGENTS);
      const overflow = locAgents.length - MAX_RING_AGENTS;

      for (let i = 0; i < visible.length; i++) {
        const agent = visible[i];
        if (!agent) continue;
        const angle = (2 * Math.PI * i) / Math.max(visible.length, 1) - Math.PI / 2;
        const dx = Math.cos(angle) * AGENT_RING_RADIUS;
        const dy = Math.sin(angle) * AGENT_RING_RADIUS;
        agents.push({ agent, locationId, x: cx + dx, y: cy + dy });
      }

      if (overflow > 0) {
        ovf.push({ locationId, cx, cy, count: overflow });
      }
    }

    return { allAgents: agents, overflows: ovf };
  }, [graph, locationPositions]);

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
