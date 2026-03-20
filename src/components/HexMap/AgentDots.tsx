import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import type { WorldGraph } from '../../engine/graph';
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
  AGENT_MOVE_TRANSITION_MS,
} from '../../data/agent-visual-content';

interface AgentDotsProps {
  graph: WorldGraph;
  /** Array of { locationId, x, y } positions where agents may be */
  locationPositions: Array<{ locationId: string; x: number; y: number }>;
  zoomScale: number;
  /** Hex tile size in pixels — needed for bezier wobble computation */
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

// ─── Bezier utilities ────────────────────────────────────────────

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

const ARC_LENGTH_SAMPLES = 16;

/**
 * Reparametrize by arc length: uniform `s` in [0,1] → constant speed along curve.
 */
function arcLengthT(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  s: number,
): number {
  if (s <= 0) return 0;
  if (s >= 1) return 1;

  const lengths = new Array(ARC_LENGTH_SAMPLES + 1);
  lengths[0] = 0;
  let prev = p0;
  for (let i = 1; i <= ARC_LENGTH_SAMPLES; i++) {
    const t = i / ARC_LENGTH_SAMPLES;
    const pt = evalQuadBezier(p0, p1, p2, t);
    const ddx = pt.x - prev.x;
    const ddy = pt.y - prev.y;
    lengths[i] = lengths[i - 1] + Math.sqrt(ddx * ddx + ddy * ddy);
    prev = pt;
  }

  const totalLen = lengths[ARC_LENGTH_SAMPLES];
  if (totalLen === 0) return s;

  const targetLen = s * totalLen;
  let lo = 0;
  let hi = ARC_LENGTH_SAMPLES;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (lengths[mid] < targetLen) lo = mid;
    else hi = mid;
  }

  const segLen = lengths[hi] - lengths[lo];
  const frac = segLen > 0 ? (targetLen - lengths[lo]) / segLen : 0;
  return (lo + frac) / ARC_LENGTH_SAMPLES;
}

/**
 * Compute a wobbled bezier control point between two positions.
 * Uses the same perpendicular wobble approach as MovementTrails.
 */
function computeBezierControl(
  from: { x: number; y: number },
  to: { x: number; y: number },
  agentId: string,
  segIndex: number,
  hexSize: number,
): { x: number; y: number } {
  const sdx = to.x - from.x;
  const sdy = to.y - from.y;
  const segLen = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
  const perpX = -sdy / segLen;
  const perpY = sdx / segLen;
  const hash = wobbleHash(agentId, segIndex);
  const wobbleMag = hexSize * WOBBLE_FACTOR * (((hash & 0xff) / 255) * 2 - 1);
  return {
    x: (from.x + to.x) / 2 + perpX * wobbleMag,
    y: (from.y + to.y) / 2 + perpY * wobbleMag,
  };
}

// ─── Agent helpers ───────────────────────────────────────────────

const DOMAIN_LABELS: Record<string, string> = {
  iron: 'Iron', gold: 'Gold', shadow: 'Shadow', veil: 'Veil',
  heart: 'Heart', eye: 'Eye', stone: 'Stone', star: 'Star', flesh: 'Flesh',
};

function getAgentColor(domainCapabilities: Record<string, number> | undefined): string {
  if (!domainCapabilities) return DEFAULT_AGENT_COLOR;
  let bestDomain = '';
  let bestValue = -1;
  for (const [domain, value] of Object.entries(domainCapabilities)) {
    if (value > bestValue) { bestValue = value; bestDomain = domain; }
  }
  return DOMAIN_COLORS[bestDomain] ?? DEFAULT_AGENT_COLOR;
}

function getPrimaryDomain(domainCapabilities: Record<string, number> | undefined): string {
  if (!domainCapabilities) return 'Unknown';
  let bestDomain = '';
  let bestValue = -1;
  for (const [domain, value] of Object.entries(domainCapabilities)) {
    if (value > bestValue) { bestValue = value; bestDomain = domain; }
  }
  return DOMAIN_LABELS[bestDomain] ?? bestDomain;
}

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

// ─── Types ───────────────────────────────────────────────────────

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

/** Active bezier animation for an agent dot */
interface AgentAnimation {
  from: { x: number; y: number };
  ctrl: { x: number; y: number };
  to: { x: number; y: number };
  startTime: number;
  duration: number;
  rafId: number;
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

  // Step 1: Collect ALL agents with target pixel positions (flat list)
  const { allAgents, overflows } = useMemo(() => {
    const agents: FlatAgent[] = [];
    const ovf: OverflowEntry[] = [];
    const seen = new Set<string>();

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
        agents.push({ agent, locationId, x: cx + dx, y: cy + dy });
      }

      if (overflow > 0) {
        ovf.push({ locationId, cx, cy, count: overflow });
      }
    }

    return { allAgents: agents, overflows: ovf };
  }, [graph, locationPositions, currentTick]);

  // Step 2: Track previous locations for arrival flash
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

  // Step 3: Frame-based bezier animation from previous to current position
  const agentElRefs = useRef<Map<string, SVGGElement>>(new Map());
  const prevPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const activeAnims = useRef<Map<string, AgentAnimation>>(new Map());
  // Monotonic counter per agent for wobble seed — survives across ticks
  const wobbleCounters = useRef<Map<string, number>>(new Map());

  const setAgentRef = useCallback((agentId: string, el: SVGGElement | null) => {
    if (el) agentElRefs.current.set(agentId, el);
    else agentElRefs.current.delete(agentId);
  }, []);

  useEffect(() => {
    const now = performance.now();

    for (const { agent, x, y } of allAgents) {
      const el = agentElRefs.current.get(agent.id);
      const prev = prevPositions.current.get(agent.id);

      if (prev && (Math.abs(prev.x - x) > 0.5 || Math.abs(prev.y - y) > 0.5) && el) {
        // Agent moved — start bezier animation from old position to new
        const existing = activeAnims.current.get(agent.id);
        if (existing) cancelAnimationFrame(existing.rafId);

        // Increment wobble counter so each hop gets a unique curve
        const counter = (wobbleCounters.current.get(agent.id) ?? 0) + 1;
        wobbleCounters.current.set(agent.id, counter);

        const ctrl = computeBezierControl(prev, { x, y }, agent.id, counter, hexSize);
        const duration = AGENT_MOVE_TRANSITION_MS;
        const from = { ...prev };
        const to = { x, y };

        const animate = (frameTime: number) => {
          const elapsed = frameTime - now;
          const t = Math.min(1, elapsed / duration);
          // Arc-length reparametrize for constant speed
          const s = arcLengthT(from, ctrl, to, t);
          const pos = evalQuadBezier(from, ctrl, to, s);
          el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;

          if (t < 1) {
            const anim = activeAnims.current.get(agent.id);
            if (anim) anim.rafId = requestAnimationFrame(animate);
          } else {
            activeAnims.current.delete(agent.id);
          }
        };

        const rafId = requestAnimationFrame(animate);
        activeAnims.current.set(agent.id, { from, ctrl, to, startTime: now, duration, rafId });
      } else if (el && !activeAnims.current.has(agent.id)) {
        // No movement or first render — set position directly
        el.style.transform = `translate(${x}px, ${y}px)`;
      }

      prevPositions.current.set(agent.id, { x, y });
    }

    return () => {
      // Cleanup on unmount
      for (const anim of activeAnims.current.values()) {
        cancelAnimationFrame(anim.rafId);
      }
    };
  }, [allAgents, hexSize]);

  // Step 4: Render flat list — stable keys, no CSS transition (JS handles animation)
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
