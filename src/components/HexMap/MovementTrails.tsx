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

/** Wobble magnitude as fraction of hex size */
const WOBBLE_FACTOR = 0.12;

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

        // Convert to pixel positions (history is newest-first)
        const rawPoints = history
          .filter(entry => entry.hexCol != null && entry.hexRow != null)
          .map(entry => hexToPixel({ col: entry.hexCol!, row: entry.hexRow! }, hexSize));

        if (rawPoints.length < 2) return null;

        // Offset the newest point toward the arrival direction (matches agent ring position)
        const newest = rawPoints[0];
        const prevHex = rawPoints[1];
        const arrivalAngle = Math.atan2(prevHex.y - newest.y, prevHex.x - newest.x);
        const points = [
          { x: newest.x + Math.cos(arrivalAngle) * AGENT_RING_RADIUS, y: newest.y + Math.sin(arrivalAngle) * AGENT_RING_RADIUS },
          ...rawPoints.slice(1),
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
                  strokeDasharray="3 4"
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
