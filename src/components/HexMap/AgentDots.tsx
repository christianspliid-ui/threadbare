/**
 * AgentDots — Renders agent dots on the hex map with bezier hop animation.
 *
 * Design:
 * - Agents at rest sit at sorted ring slots (no overlaps, deterministic)
 * - When an agent moves between hexes, a rAF-driven bezier animation traces
 *   a wobbled curve from the old ring slot to the new one
 * - The bezier is computed via shared getSegmentBezier() so MovementTrails
 *   draws the exact same curve as a trail
 * - When group composition at a hex changes, agents settle to new ring slots
 *   via a short linear tween (150ms)
 */

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { MovementHistoryEntry } from '../../types/movement';
import { Tooltip } from '../shared/Tooltip';
import {
  getSegmentBezier,
  evalBezierAtArcLength,
  getRingSlotOffset,
} from '../../lib/movementPath';
import type { Point } from '../../lib/movementPath';
import {
  ZOOM_TOKEN_THRESHOLD,
  MAX_RING_AGENTS,
  AGENT_DOT_RADIUS,
  AGENT_TOKEN_RADIUS,
  DOMAIN_COLORS,
  DEFAULT_AGENT_COLOR,
  AGENT_RING_RADIUS,
  AGENT_ARRIVE_FLASH_MS,
  AGENT_MOVE_TRANSITION_MS,
} from '../../data/agent-visual-content';

// ─── Constants ───────────────────────────────────────────────────

/** Duration of settle tween when ring slots rearrange (ms) */
const SETTLE_DURATION_MS = 150;

// ─── Props ───────────────────────────────────────────────────────

interface AgentDotsProps {
  graph: WorldGraph;
  locationPositions: Array<{ locationId: string; x: number; y: number }>;
  zoomScale: number;
  hexSize: number;
  currentTick?: number;
  avatarId?: string;
  sphereColor?: string;
  onAgentClick?: (agentId: string) => void;
  onAgentDoubleClick?: (agentId: string) => void;
  onAgentHover?: (agentId: string | null) => void;
}

// ─── Agent helpers ───────────────────────────────────────────────

const DOMAIN_LABELS: Record<string, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil',
  heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star', flesh: 'Flesh',
};

function getAgentColor(dc: Record<string, number> | undefined): string {
  if (!dc) return DEFAULT_AGENT_COLOR;
  let best = '', bestVal = -1;
  for (const [d, v] of Object.entries(dc)) {
    if (v > bestVal) { bestVal = v; best = d; }
  }
  return DOMAIN_COLORS[best] ?? DEFAULT_AGENT_COLOR;
}

function getPrimaryDomain(dc: Record<string, number> | undefined): string {
  if (!dc) return 'Unknown';
  let best = '', bestVal = -1;
  for (const [d, v] of Object.entries(dc)) {
    if (v > bestVal) { bestVal = v; best = d; }
  }
  return DOMAIN_LABELS[best] ?? best;
}

function getAgentsAtLocation(graph: WorldGraph, locationId: string) {
  const seen = new Set<string>();
  const agents: NonNullable<ReturnType<WorldGraph['getNode']>>[] = [];
  for (const edgeType of ['contains', 'located_at'] as const) {
    for (const e of graph.getIncomingEdges(locationId, edgeType)) {
      if (seen.has(e.source)) continue;
      const node = graph.getNode(e.source);
      if (node && node.properties?.actorType === 'individual') {
        seen.add(e.source);
        agents.push(node);
      }
    }
  }
  // Sort by ID for deterministic ring slot assignment
  agents.sort((a, b) => a.id.localeCompare(b.id));
  return agents;
}

function buildTooltip(
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

// ─── Types ───────────────────────────────────────────────────────

interface AgentEntry {
  agent: NonNullable<ReturnType<WorldGraph['getNode']>>;
  locationId: string;
  /** Hex coordinate of the agent's current location */
  hex: { col: number; row: number };
  /** Target pixel position (hex center + ring offset) */
  x: number;
  y: number;
  /** Ring offset from hex center */
  ringOffset: Point;
}

interface OverflowEntry {
  locationId: string;
  cx: number;
  cy: number;
  count: number;
}

// ─── Component ───────────────────────────────────────────────────

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

  // ── Step 1: Compute target positions for all agents ──
  const { allAgents, overflows } = useMemo(() => {
    const agents: AgentEntry[] = [];
    const ovf: OverflowEntry[] = [];
    const seen = new Set<string>();

    for (const { locationId, x: cx, y: cy } of locationPositions) {
      const locAgents = getAgentsAtLocation(graph, locationId);
      if (locAgents.length === 0) continue;

      // Get hex coords for this location
      const locNode = graph.getNode(locationId);
      const hexCol = locNode?.properties?.hexCol as number | undefined;
      const hexRow = locNode?.properties?.hexRow as number | undefined;
      if (hexCol == null || hexRow == null) continue;

      const visible = locAgents.slice(0, MAX_RING_AGENTS);
      const overflow = locAgents.length - MAX_RING_AGENTS;

      for (let i = 0; i < visible.length; i++) {
        const agent = visible[i];
        if (!agent || seen.has(agent.id)) continue;
        seen.add(agent.id);

        const ringOffset = getRingSlotOffset(i, visible.length, AGENT_RING_RADIUS);
        agents.push({
          agent,
          locationId,
          hex: { col: hexCol, row: hexRow },
          x: cx + ringOffset.x,
          y: cy + ringOffset.y,
          ringOffset,
        });
      }

      if (overflow > 0) {
        ovf.push({ locationId, cx, cy, count: overflow });
      }
    }

    return { allAgents: agents, overflows: ovf };
  }, [graph, locationPositions, currentTick, hexSize]);

  // ── Step 2: Arrival flash detection ──
  const prevLocations = useRef<Map<string, string>>(new Map());
  const [arrivingAgents, setArrivingAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const arriving = new Set<string>();
    const newMap = new Map<string, string>();
    for (const { agent, locationId } of allAgents) {
      const prev = prevLocations.current.get(agent.id);
      if (prev && prev !== locationId) arriving.add(agent.id);
      newMap.set(agent.id, locationId);
    }
    prevLocations.current = newMap;
    if (arriving.size > 0) {
      setArrivingAgents(arriving);
      const timer = setTimeout(() => setArrivingAgents(new Set()), AGENT_ARRIVE_FLASH_MS);
      return () => clearTimeout(timer);
    }
  }, [allAgents]);

  // ── Step 3: rAF animation state ──
  const agentElRefs = useRef<Map<string, SVGGElement>>(new Map());
  /** Previous render position per agent (where the dot currently IS visually) */
  const prevPositions = useRef<Map<string, { x: number; y: number; hex: { col: number; row: number }; ringOffset: Point }>>(new Map());
  /** Active rAF animation IDs */
  const activeAnims = useRef<Map<string, number>>(new Map());

  const setAgentRef = useCallback((agentId: string, el: SVGGElement | null) => {
    if (el) agentElRefs.current.set(agentId, el);
    else agentElRefs.current.delete(agentId);
  }, []);

  // ── Step 4: Animate on position change ──
  useEffect(() => {
    const now = performance.now();

    for (const entry of allAgents) {
      const { agent, x, y, hex, ringOffset } = entry;
      const el = agentElRefs.current.get(agent.id);
      const prev = prevPositions.current.get(agent.id);

      if (!el) continue;

      const moved = prev && (Math.abs(prev.x - x) > 0.5 || Math.abs(prev.y - y) > 0.5);

      if (moved && prev) {
        // Cancel any running animation
        const existing = activeAnims.current.get(agent.id);
        if (existing) cancelAnimationFrame(existing);

        const hexChanged = prev.hex.col !== hex.col || prev.hex.row !== hex.row;

        if (hexChanged) {
          // ── Hop animation: wobbled bezier from old hex to new hex ──
          const bezier = getSegmentBezier(
            agent.id,
            prev.hex,
            hex,
            hexSize,
            prev.ringOffset,
            ringOffset,
          );
          const duration = AGENT_MOVE_TRANSITION_MS;

          const animate = (frameTime: number) => {
            const elapsed = frameTime - now;
            const s = Math.min(1, elapsed / duration);
            const pos = evalBezierAtArcLength(bezier.p0, bezier.ctrl, bezier.p2, s);
            el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;

            if (s < 1) {
              activeAnims.current.set(agent.id, requestAnimationFrame(animate));
            } else {
              activeAnims.current.delete(agent.id);
            }
          };

          activeAnims.current.set(agent.id, requestAnimationFrame(animate));
        } else {
          // ── Settle animation: same hex, ring slot changed (linear tween) ──
          const fromX = prev.x;
          const fromY = prev.y;
          const duration = SETTLE_DURATION_MS;

          const animate = (frameTime: number) => {
            const elapsed = frameTime - now;
            const t = Math.min(1, elapsed / duration);
            const px = fromX + (x - fromX) * t;
            const py = fromY + (y - fromY) * t;
            el.style.transform = `translate(${px}px, ${py}px)`;

            if (t < 1) {
              activeAnims.current.set(agent.id, requestAnimationFrame(animate));
            } else {
              activeAnims.current.delete(agent.id);
            }
          };

          activeAnims.current.set(agent.id, requestAnimationFrame(animate));
        }
      } else if (!activeAnims.current.has(agent.id)) {
        // No movement or first render — set position directly
        el.style.transform = `translate(${x}px, ${y}px)`;
      }

      prevPositions.current.set(agent.id, { x, y, hex, ringOffset });
    }

    return () => {
      for (const rafId of activeAnims.current.values()) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [allAgents, hexSize]);

  // ── Step 5: Render ──
  return (
    <g className="agent-dots-layer" style={{ pointerEvents: 'auto' }}>
      {allAgents.map(({ agent, x, y }) => {
        const isAvatar = agent.id === avatarId;
        const color = isAvatar && sphereColor
          ? sphereColor
          : getAgentColor(agent.properties?.domainCapabilities as Record<string, number>);
        const tooltip = buildTooltip(agent, isAvatar);
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
              ref={el => setAgentRef(agent.id, el)}
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
