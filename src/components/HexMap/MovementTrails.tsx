/**
 * MovementTrails — Renders ink-wash trails behind moving agents.
 *
 * Uses the same getSegmentBezier() as AgentDots so the trail exactly matches
 * the path the dot animated along. Each consecutive pair of hexes in
 * movementHistory produces one bezier curve segment drawn with fading opacity.
 */

import React from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { MovementHistoryEntry } from '../../types/movement';
import {
  getSegmentBezier,
  evalQuadBezier,
} from '../../lib/movementPath';
import {
  TRAIL_LINE_COLOR,
  TRAIL_LINE_WIDTH,
  TRAIL_OPACITY_MAX,
  TRAIL_OPACITY_MIN,
  AGENT_RING_RADIUS,
} from '../../data/agent-visual-content';
import { getRingSlotOffset } from '../../lib/movementPath';

/** Radius of small dots at trail waypoints */
const TRAIL_DOT_RADIUS = 1.0;

/** Number of sample points per bezier segment for polyline rendering */
const SAMPLES_PER_SEGMENT = 8;

interface MovementTrailsProps {
  graph: WorldGraph;
  hexSize: number;
  currentTick: number;
}

/**
 * Get ring offset for an agent at a specific hex.
 * Looks up all agents at the hex, sorts by ID, finds the agent's index.
 */
function getAgentRingOffset(
  graph: WorldGraph,
  agentId: string,
  hexCol: number,
  hexRow: number,
): { x: number; y: number } {
  // Find the location node at this hex
  const locations = graph.getNodesByType('location');
  let locId: string | null = null;
  for (const loc of locations) {
    if (loc.properties?.hexCol === hexCol && loc.properties?.hexRow === hexRow) {
      locId = loc.id;
      break;
    }
  }

  if (!locId) return { x: 0, y: 0 };

  // Get all agents at this location, sorted by ID
  const agentIds: string[] = [];
  for (const edgeType of ['contains', 'located_at'] as const) {
    for (const e of graph.getIncomingEdges(locId, edgeType)) {
      const node = graph.getNode(e.source);
      if (node && node.properties?.actorType === 'individual' && !agentIds.includes(e.source)) {
        agentIds.push(e.source);
      }
    }
  }
  agentIds.sort();

  const index = agentIds.indexOf(agentId);
  if (index === -1) {
    // Agent is no longer at this hex (already moved on) — use center
    return { x: 0, y: 0 };
  }

  return getRingSlotOffset(index, agentIds.length, AGENT_RING_RADIUS);
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
        const movementState = agent.properties?.movementState as
          { movementHistory?: MovementHistoryEntry[] } | undefined;
        const history = movementState?.movementHistory;
        if (!history || history.length < 2) return null;

        // Filter to entries with valid hex coords
        const entries = history.filter(
          (e): e is MovementHistoryEntry & { hexCol: number; hexRow: number } =>
            e.hexCol != null && e.hexRow != null,
        );
        if (entries.length < 2) return null;

        const totalSegments = entries.length - 1;

        // Build bezier segments between consecutive history entries
        // History is newest-first, so entries[0] is current, entries[1] is previous, etc.
        const segments: Array<{
          bezier: ReturnType<typeof getSegmentBezier>;
          opacity: number;
          strokeWidth: number;
        }> = [];

        for (let i = 0; i < totalSegments; i++) {
          const from = entries[i + 1]; // older
          const to = entries[i];       // newer

          const fromHex = { col: from.hexCol, row: from.hexRow };
          const toHex = { col: to.hexCol, row: to.hexRow };

          // For the newest point (i === 0), use the agent's current ring offset
          // For older points, use zero offset (they've already left those hexes)
          const toOffset = i === 0
            ? getAgentRingOffset(graph, agent.id, to.hexCol, to.hexRow)
            : { x: 0, y: 0 };
          const fromOffset = { x: 0, y: 0 };

          const bezier = getSegmentBezier(
            agent.id,
            fromHex,
            toHex,
            hexSize,
            fromOffset,
            toOffset,
          );

          const t = i / Math.max(totalSegments, 1);
          const opacity = TRAIL_OPACITY_MAX - t * (TRAIL_OPACITY_MAX - TRAIL_OPACITY_MIN);
          const strokeWidth = TRAIL_LINE_WIDTH - t * 0.3;

          segments.push({ bezier, opacity, strokeWidth });
        }

        return (
          <g key={`trail-${agent.id}`}>
            {segments.map(({ bezier, opacity, strokeWidth }, i) => {
              // Sample bezier into polyline points for SVG path
              const points: string[] = [];
              for (let s = 0; s <= SAMPLES_PER_SEGMENT; s++) {
                const t = s / SAMPLES_PER_SEGMENT;
                const pt = evalQuadBezier(bezier.p0, bezier.ctrl, bezier.p2, t);
                points.push(`${pt.x},${pt.y}`);
              }

              return (
                <polyline
                  key={`seg-${i}`}
                  points={points.join(' ')}
                  stroke={TRAIL_LINE_COLOR}
                  strokeWidth={Math.max(0.3, strokeWidth)}
                  opacity={Math.max(TRAIL_OPACITY_MIN, opacity)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1 2"
                  fill="none"
                />
              );
            })}

            {/* Small dots at segment boundaries */}
            {entries.map((entry, i) => {
              const t = i / Math.max(entries.length - 1, 1);
              const opacity = TRAIL_OPACITY_MAX - t * (TRAIL_OPACITY_MAX - TRAIL_OPACITY_MIN);
              const r = TRAIL_DOT_RADIUS * (1 - t * 0.4);

              // Use the segment bezier endpoints for dot positions
              let px: number, py: number;
              if (i === 0 && segments.length > 0) {
                // Newest point — use the "to" end of the first segment
                px = segments[0].bezier.p2.x;
                py = segments[0].bezier.p2.y;
              } else if (i > 0 && i - 1 < segments.length) {
                // Use the "from" end of the corresponding segment
                px = segments[i - 1].bezier.p0.x;
                py = segments[i - 1].bezier.p0.y;
              } else {
                return null;
              }

              return (
                <circle
                  key={`dot-${i}`}
                  cx={px}
                  cy={py}
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
