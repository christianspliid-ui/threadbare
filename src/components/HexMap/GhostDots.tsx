/**
 * Renders ghost dots for agents that have left the player's line of sight.
 * Static, fading circles with no breathing animation.
 */

import React from 'react';
import type { GhostDotEntry } from '../../engine/ghostDots';
import { ghostDotOpacity } from '../../engine/ghostDots';
import { GHOST_DOT_COLOR, AGENT_DOT_RADIUS } from '../../data/agent-visual-content';
import { hexToPixel } from '../../lib/hexMath';

interface GhostDotsProps {
  ghosts: GhostDotEntry[];
  hexSize: number;
  currentTick: number;
}

export const GhostDots: React.FC<GhostDotsProps> = ({ ghosts, hexSize, currentTick }) => {
  return (
    <g className="ghost-dots-layer" style={{ pointerEvents: 'none' }}>
      {ghosts.map(ghost => {
        const opacity = ghostDotOpacity(ghost.createdTick, currentTick);
        if (opacity <= 0) return null;
        const { x, y } = hexToPixel({ col: ghost.hexCol, row: ghost.hexRow }, hexSize);
        return (
          <circle
            key={`ghost-${ghost.agentId}`}
            cx={x}
            cy={y}
            r={AGENT_DOT_RADIUS}
            fill={GHOST_DOT_COLOR}
            opacity={opacity}
          />
        );
      })}
    </g>
  );
};
