import React, { useMemo } from 'react';
import type { WorldGraph } from '../../../engine/graph';
import type { GraphEdge } from '../../../types/graph';
import { hexToPixel } from '../../../lib/hexMath';
import { SENTIMENT_POSITIVE, SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL } from '../../../data/uiColorPalette';

// ─── Constants ──────────────────────────────────────────────────

/** Minimum bond strength to render a line (filters out noise) */
const MIN_STRENGTH_TO_RENDER = 0.05;

/** Stroke width range for bond lines */
const BOND_MIN_WIDTH = 0.5;
const BOND_MAX_WIDTH = 3;

/** Opacity range for bond lines (mapped from strength 0..1) */
const BOND_MIN_OPACITY = 0.2;
const BOND_MAX_OPACITY = 0.8;

/** Arrow size for decision vectors */
const ARROW_SIZE = 6;

// ─── Styles ─────────────────────────────────────────────────────

// No CSS styles needed — this is a pure SVG overlay component.

// ─── Types ──────────────────────────────────────────────────────

interface BondLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  opacity: number;
  width: number;
}

interface DecisionVector {
  agentId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

// ─── Props ──────────────────────────────────────────────────────

export interface BondOverlayProps {
  graph: WorldGraph;
  hexSize: number;
  visibleAgents: string[];
  showBonds: boolean;
  showDecisionVectors: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────

function sentimentColor(trust: number): string {
  if (trust >= 0.2) return SENTIMENT_POSITIVE;
  if (trust <= -0.2) return SENTIMENT_NEGATIVE;
  return SENTIMENT_NEUTRAL;
}

function getAgentPosition(
  agentId: string,
  graph: WorldGraph,
  hexSize: number,
): { x: number; y: number } | null {
  // Find agent's location via located_at edge
  const locEdges = graph.getOutgoingEdges(agentId, 'located_at');
  if (locEdges.length === 0) return null;

  const locationNode = graph.getNode(locEdges[0].target);
  if (!locationNode) return null;

  const col = locationNode.properties?.hexCol as number | undefined;
  const row = locationNode.properties?.hexRow as number | undefined;
  if (col == null || row == null) return null;

  return hexToPixel({ col, row }, hexSize);
}

// ─── Component ──────────────────────────────────────────────────

export const BondOverlay = React.memo(function BondOverlay({
  graph,
  hexSize,
  visibleAgents,
  showBonds,
  showDecisionVectors,
}: BondOverlayProps) {
  const visibleSet = useMemo(() => new Set(visibleAgents), [visibleAgents]);

  // Compute bond lines
  const bondLines = useMemo(() => {
    if (!showBonds) return [];

    const lines: BondLine[] = [];
    const seen = new Set<string>();

    for (const agentId of visibleAgents) {
      const outgoing = graph.getOutgoingEdges(agentId, 'relates_to');
      for (const edge of outgoing) {
        if (!visibleSet.has(edge.target)) continue;

        // Deduplicate: only draw once per pair
        const pairKey = [edge.source, edge.target].sort().join('|');
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);

        const strength = (edge.properties?.strength as number) ?? 0;
        if (strength < MIN_STRENGTH_TO_RENDER) continue;

        const trust = (edge.properties?.trust as number) ?? 0;
        const from = getAgentPosition(edge.source, graph, hexSize);
        const to = getAgentPosition(edge.target, graph, hexSize);
        if (!from || !to) continue;

        lines.push({
          id: edge.id,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          color: sentimentColor(trust),
          opacity: BOND_MIN_OPACITY + strength * (BOND_MAX_OPACITY - BOND_MIN_OPACITY),
          width: BOND_MIN_WIDTH + strength * (BOND_MAX_WIDTH - BOND_MIN_WIDTH),
        });
      }
    }

    return lines;
  }, [showBonds, visibleAgents, visibleSet, graph, hexSize]);

  // Compute decision vectors
  const vectors = useMemo(() => {
    if (!showDecisionVectors) return [];

    const result: DecisionVector[] = [];

    for (const agentId of visibleAgents) {
      const agentNode = graph.getNode(agentId);
      if (!agentNode) continue;

      // Check for movement target in agent properties
      const targetHexCol = agentNode.properties?.movementTargetCol as number | undefined;
      const targetHexRow = agentNode.properties?.movementTargetRow as number | undefined;
      if (targetHexCol == null || targetHexRow == null) continue;

      const from = getAgentPosition(agentId, graph, hexSize);
      if (!from) continue;

      const to = hexToPixel({ col: targetHexCol, row: targetHexRow }, hexSize);

      result.push({
        agentId,
        fromX: from.x,
        fromY: from.y,
        toX: to.x,
        toY: to.y,
      });
    }

    return result;
  }, [showDecisionVectors, visibleAgents, graph, hexSize]);

  if (bondLines.length === 0 && vectors.length === 0) return null;

  return (
    <g data-testid="bond-overlay" style={{ pointerEvents: 'none' }}>
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="decision-arrow"
          viewBox={`0 0 ${ARROW_SIZE} ${ARROW_SIZE}`}
          refX={ARROW_SIZE}
          refY={ARROW_SIZE / 2}
          markerWidth={ARROW_SIZE}
          markerHeight={ARROW_SIZE}
          orient="auto"
        >
          <path d={`M 0 0 L ${ARROW_SIZE} ${ARROW_SIZE / 2} L 0 ${ARROW_SIZE} z`} fill="var(--accent-gold)" />
        </marker>
      </defs>

      {/* Bond lines */}
      {bondLines.map((line) => (
        <line
          key={line.id}
          data-testid="bond-line"
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={line.color}
          strokeWidth={line.width}
          opacity={line.opacity}
          strokeLinecap="round"
        />
      ))}

      {/* Decision vectors */}
      {vectors.map((v) => (
        <line
          key={`vec-${v.agentId}`}
          data-testid="decision-vector"
          x1={v.fromX}
          y1={v.fromY}
          x2={v.toX}
          y2={v.toY}
          stroke="var(--accent-gold)"
          strokeWidth={1.5}
          opacity={0.6}
          strokeDasharray="4,4"
          markerEnd="url(#decision-arrow)"
        />
      ))}
    </g>
  );
});
