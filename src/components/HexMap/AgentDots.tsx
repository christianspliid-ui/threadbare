import React from 'react';
import type { WorldGraph } from '../../engine/graph';
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
  onAgentClick?: (agentId: string) => void;
  onAgentHover?: (agentId: string | null) => void;
}

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

export const AgentDots: React.FC<AgentDotsProps> = ({
  graph,
  locationPositions,
  zoomScale,
  onAgentClick,
  onAgentHover,
}) => {
  const isTokenZoom = zoomScale >= ZOOM_TOKEN_THRESHOLD;
  const radius = isTokenZoom ? AGENT_TOKEN_RADIUS : AGENT_DOT_RADIUS;

  return (
    <g className="agent-dots-layer" style={{ pointerEvents: 'auto' }}>
      {locationPositions.map(({ locationId, x: cx, y: cy }) => {
        const locEdges = graph.getIncomingEdges(locationId, 'located_at');
        const agents = locEdges
          .map(e => graph.getNode(e.source))
          .filter(n => n && n.properties?.actorType === 'individual');

        if (agents.length === 0) return null;

        const visibleAgents = agents.slice(0, MAX_RING_AGENTS);
        const overflow = agents.length - MAX_RING_AGENTS;

        return (
          <g key={locationId}>
            {visibleAgents.map((agent, i) => {
              if (!agent) return null;
              const angle = (2 * Math.PI * i) / Math.max(visibleAgents.length, 1) - Math.PI / 2;
              const dx = visibleAgents.length === 1 ? 0 : Math.cos(angle) * AGENT_RING_RADIUS;
              const dy = visibleAgents.length === 1 ? 0 : Math.sin(angle) * AGENT_RING_RADIUS;
              const color = getAgentColor(agent.properties?.domainCapabilities as Record<string, number>);

              return (
                <g
                  key={agent.id}
                  transform={`translate(${cx + dx}, ${cy + dy})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onAgentClick?.(agent.id)}
                  onMouseEnter={() => onAgentHover?.(agent.id)}
                  onMouseLeave={() => onAgentHover?.(null)}
                >
                  <circle r={radius} fill={color} stroke="#000" strokeWidth={0.5} />
                  {isTokenZoom && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={radius * 0.9}
                      fill="#fff"
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {(agent.name ?? '?').slice(0, 2).toUpperCase()}
                    </text>
                  )}
                </g>
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
