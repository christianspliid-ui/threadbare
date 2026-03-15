/**
 * Renders movement trail lines for agents on the hex map.
 *
 * Thin dark ink lines connecting an agent's recent hex positions.
 * Opacity fades linearly from current position to oldest entry.
 * Trail length controlled by TRAIL_HISTORY_TICKS.
 */

import React from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { MovementHistoryEntry } from '../../types/movement';
import { TRAIL_HISTORY_TICKS } from '../../data/movement-content';
import {
  TRAIL_LINE_COLOR,
  TRAIL_LINE_WIDTH,
  TRAIL_OPACITY_MAX,
  TRAIL_OPACITY_MIN,
} from '../../data/agent-visual-content';
import { hexToPixel } from '../../lib/hexMath';

interface MovementTrailsProps {
  graph: WorldGraph;
  hexSize: number;
  currentTick: number;
}

export const MovementTrails: React.FC<MovementTrailsProps> = ({
  graph,
  hexSize,
  currentTick,
}) => {
  const agents = graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  return (
    <g className="movement-trails-layer" style={{ pointerEvents: 'none' }}>
      {agents.map(agent => {
        const movementState = agent.properties?.movementState as { movementHistory?: MovementHistoryEntry[] } | undefined;
        const history = movementState?.movementHistory;
        if (!history || history.length < 2) return null;

        // Only show entries within TRAIL_HISTORY_TICKS
        const recentHistory = history.filter(
          entry => currentTick - entry.tick <= TRAIL_HISTORY_TICKS
        );
        if (recentHistory.length < 2) return null;

        // Convert to pixel positions
        const points = recentHistory
          .filter(entry => entry.hexCol != null && entry.hexRow != null)
          .map(entry => {
            const { x, y } = hexToPixel({ col: entry.hexCol!, row: entry.hexRow! }, hexSize);
            return { x, y, tick: entry.tick };
          });

        if (points.length < 2) return null;

        // Render line segments with fading opacity
        return (
          <g key={`trail-${agent.id}`}>
            {points.slice(1).map((point, i) => {
              const prev = points[i];
              const age = currentTick - point.tick;
              const maxAge = TRAIL_HISTORY_TICKS;
              const opacity = TRAIL_OPACITY_MAX - (age / maxAge) * (TRAIL_OPACITY_MAX - TRAIL_OPACITY_MIN);

              return (
                <line
                  key={`seg-${i}`}
                  x1={prev.x} y1={prev.y}
                  x2={point.x} y2={point.y}
                  stroke={TRAIL_LINE_COLOR}
                  strokeWidth={TRAIL_LINE_WIDTH}
                  opacity={Math.max(TRAIL_OPACITY_MIN, opacity)}
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
