/**
 * Renders movement trail lines for agents on the hex map.
 *
 * Thin dark ink lines connecting an agent's recent hex positions.
 * Opacity fades linearly from current position (newest) to oldest entry.
 * History is already capped to TRAIL_HISTORY_TICKS entries by movementExecution,
 * so we render all entries and use index-based opacity fade.
 */

import React from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { MovementHistoryEntry } from '../../types/movement';
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
}) => {
  const agents = graph.getNodesByType('actor')
    .filter(a => a.properties?.actorType === 'individual');

  return (
    <g className="movement-trails-layer" style={{ pointerEvents: 'none' }}>
      {agents.map(agent => {
        const movementState = agent.properties?.movementState as { movementHistory?: MovementHistoryEntry[] } | undefined;
        const history = movementState?.movementHistory;
        if (!history || history.length < 2) return null;

        // Convert to pixel positions (history is newest-first, already capped by movementExecution)
        const points = history
          .filter(entry => entry.hexCol != null && entry.hexRow != null)
          .map(entry => {
            const { x, y } = hexToPixel({ col: entry.hexCol!, row: entry.hexRow! }, hexSize);
            return { x, y };
          });

        if (points.length < 2) return null;

        // Render line segments with index-based fading opacity (newest = full, oldest = min)
        return (
          <g key={`trail-${agent.id}`}>
            {points.slice(1).map((point, i) => {
              const prev = points[i];
              // i=0 is the newest segment, points.length-2 is the oldest
              const t = i / (points.length - 1);
              const opacity = TRAIL_OPACITY_MAX - t * (TRAIL_OPACITY_MAX - TRAIL_OPACITY_MIN);

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
