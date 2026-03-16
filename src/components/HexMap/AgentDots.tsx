import React from 'react';
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

  return (
    <g className="agent-dots-layer" style={{ pointerEvents: 'auto' }}>
      {locationPositions.map(({ locationId, x: cx, y: cy }) => {
        const agents = getAgentsAtLocation(graph, locationId);

        if (agents.length === 0) return null;

        const visibleAgents = agents.slice(0, MAX_RING_AGENTS);
        const overflow = agents.length - MAX_RING_AGENTS;

        return (
          <g key={locationId}>
            {visibleAgents.map((agent, i) => {
              if (!agent) return null;
              const isAvatar = agent.id === avatarId;
              // DES-009 §1.2: Ring arrangement — agents always position in ring slots
              const angle = (2 * Math.PI * i) / Math.max(visibleAgents.length, 1) - Math.PI / 2;
              const dx = Math.cos(angle) * AGENT_RING_RADIUS;
              const dy = Math.sin(angle) * AGENT_RING_RADIUS;
              const color = isAvatar && sphereColor
                ? sphereColor
                : getAgentColor(agent.properties?.domainCapabilities as Record<string, number>);
              const tooltip = buildAgentTooltip(agent, isAvatar);

              return (
                <Tooltip
                  key={agent.id}
                  as="g"
                  label={tooltip.label}
                  desc={tooltip.desc}
                  id={`agent.${agent.id}`}
                >
                  <g
                    transform={`translate(${cx + dx}, ${cy + dy})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onAgentClick?.(agent.id)}
                    onDoubleClick={() => onAgentDoubleClick?.(agent.id)}
                    onMouseEnter={() => onAgentHover?.(agent.id)}
                    onMouseLeave={() => onAgentHover?.(null)}
                  >
                    <circle
                      r={radius}
                      fill={color}
                      stroke={isAvatar ? sphereColor ?? '#000' : '#000'}
                      strokeWidth={isAvatar ? 1.5 : 0.5}
                      className={isAvatar ? 'avatar-pulse' : undefined}
                    />
                  </g>
                </Tooltip>
              );
            })}
            {overflow > 0 && (
              <text x={cx} y={cy + AGENT_RING_RADIUS + 8} textAnchor="middle" fontSize={6} fill="#333">
                +{overflow}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};
