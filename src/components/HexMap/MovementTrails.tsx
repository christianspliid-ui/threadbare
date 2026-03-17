/**
 * Renders organic movement trail lines for agents on the hex map.
 *
 * Ink-wash style trails with slight bezier wobble and small waypoint dots.
 * The newest point is offset toward the agent's ring position (arrival direction)
 * so the trail visually connects to the agent dot rather than the hex center.
 * Opacity fades from newest to oldest. History is already capped by movementExecution.
 */

import React from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { MovementHistoryEntry } from '../../types/movement';
import {
  TRAIL_LINE_COLOR,
  TRAIL_LINE_WIDTH,
  TRAIL_OPACITY_MAX,
  TRAIL_OPACITY_MIN,
  AGENT_RING_RADIUS,
} from '../../data/agent-visual-content';
import { hexToPixel } from '../../lib/hexMath';

/** Radius of small dots at trail waypoints */
const TRAIL_DOT_RADIUS = 1.0;

/** Wobble magnitude as fraction of hex size (bezier control point offset) */
const WOBBLE_FACTOR = 0.5;

/** Waypoint jitter as fraction of hex size (offsets points from hex center) */
const WAYPOINT_JITTER = 0.6;

interface MovementTrailsProps {
  graph: WorldGraph;
  hexSize: number;
  currentTick: number;
}

/** Deterministic hash for consistent wobble per agent+segment */
function wobbleHash(agentId: string, index: number): number {
  let h = index * 2654435761;
  for (let i = 0; i < agentId.length; i++) {
    h = ((h << 5) - h + agentId.charCodeAt(i)) | 0;
  }
  return h;
}

export const MovementTrails: React.FC<MovementTrailsProps> = ({
  graph,
  hexSize,
}) => {
  const agents = graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  return (
    <g className="movement-trails-layer" style={{ pointerEvents: 'none' }}>
      {agents.map(agent => {
        const movementState = agent.properties?.movementState as { movementHistory?: MovementHistoryEntry[] } | undefined;
        const history = movementState?.movementHistory;
        if (!history || history.length < 2) return null;

        // Convert to pixel positions (history is newest-first), jittered off hex center
        const rawPoints = history
          .filter(entry => entry.hexCol != null && entry.hexRow != null)
          .map((entry, idx) => {
            const center = hexToPixel({ col: entry.hexCol!, row: entry.hexRow! }, hexSize);
            // Deterministic jitter so waypoints don't sit on hex center
            const h = wobbleHash(agent.id, idx + 100);
            const h2 = wobbleHash(agent.id, idx + 200);
            const jx = hexSize * WAYPOINT_JITTER * (((h & 0xff) / 255) * 2 - 1);
            const jy = hexSize * WAYPOINT_JITTER * (((h2 & 0xff) / 255) * 2 - 1);
            return { x: center.x + jx, y: center.y + jy };
          });

        if (rawPoints.length < 2) return null;

        // Interpolate a jittered midpoint between each pair for denser trail
        const densified: { x: number; y: number }[] = [rawPoints[0]];
        for (let k = 0; k < rawPoints.length - 1; k++) {
          const a = rawPoints[k], b = rawPoints[k + 1];
          const mh = wobbleHash(agent.id, k + 300);
          const mh2 = wobbleHash(agent.id, k + 400);
          const mjx = hexSize * WAYPOINT_JITTER * 0.5 * (((mh & 0xff) / 255) * 2 - 1);
          const mjy = hexSize * WAYPOINT_JITTER * 0.5 * (((mh2 & 0xff) / 255) * 2 - 1);
          densified.push({ x: (a.x + b.x) / 2 + mjx, y: (a.y + b.y) / 2 + mjy });
          densified.push(b);
        }

        // Offset the newest point toward the arrival direction (matches agent ring position)
        const newest = densified[0];
        const prevHex = densified[1];
        const arrivalAngle = Math.atan2(prevHex.y - newest.y, prevHex.x - newest.x);
        const points = [
          { x: newest.x + Math.cos(arrivalAngle) * AGENT_RING_RADIUS, y: newest.y + Math.sin(arrivalAngle) * AGENT_RING_RADIUS },
          ...densified.slice(1),
        ];

        const totalSegs = points.length - 1;

        return (
          <g key={`trail-${agent.id}`}>
            {/* Curved path segments with fading opacity */}
            {points.slice(1).map((to, i) => {
              const from = points[i];
              // Perpendicular wobble for organic feel
              const hash = wobbleHash(agent.id, i);
              const segDx = to.x - from.x;
              const segDy = to.y - from.y;
              const segLen = Math.sqrt(segDx * segDx + segDy * segDy) || 1;
              // Perpendicular direction
              const perpX = -segDy / segLen;
              const perpY = segDx / segLen;
              const wobbleMag = hexSize * WOBBLE_FACTOR * (((hash & 0xff) / 255) * 2 - 1);
              const mx = (from.x + to.x) / 2 + perpX * wobbleMag;
              const my = (from.y + to.y) / 2 + perpY * wobbleMag;

              const t = i / Math.max(totalSegs, 1);
              const opacity = TRAIL_OPACITY_MAX - t * (TRAIL_OPACITY_MAX - TRAIL_OPACITY_MIN);

              return (
                <path
                  key={`seg-${i}`}
                  d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
                  stroke={TRAIL_LINE_COLOR}
                  strokeWidth={TRAIL_LINE_WIDTH - t * 0.3}
                  opacity={Math.max(TRAIL_OPACITY_MIN, opacity)}
                  strokeLinecap="round"
                  strokeDasharray="1 2"
                  fill="none"
                />
              );
            })}

            {/* Small dots at each waypoint */}
            {points.map((pt, i) => {
              const t = i / Math.max(points.length - 1, 1);
              const opacity = TRAIL_OPACITY_MAX - t * (TRAIL_OPACITY_MAX - TRAIL_OPACITY_MIN);
              // Dots shrink slightly toward the tail
              const r = TRAIL_DOT_RADIUS * (1 - t * 0.4);

              return (
                <circle
                  key={`dot-${i}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={r}
                  fill={TRAIL_LINE_COLOR}
                  opacity={Math.max(TRAIL_OPACITY_MIN, opacity)}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
