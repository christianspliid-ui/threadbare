import React, { useMemo } from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { VisibilityMap } from '../../types/visibility';
import { hexToPixel } from '../../lib/hexMath';
import { visKey } from '../../types/visibility';

// Tunable constants (NFP #1: Tunability)
export const REGION_LABEL_FADE_START = 2.5;
export const REGION_LABEL_FADE_END = 3.5;
const REGION_LABEL_FONT_SCALE = 0.2; // font size relative to hexSize (~1/3 of original 0.6)
const REGION_LABEL_FILL = '#000000';
const REGION_LABEL_LETTER_SPACING = '0.15em';
const REGION_LABEL_ROTATION_RANGE = 45; // max degrees of rotation (+/-);
const REGION_LABEL_EDGE_OFFSET = 0.433; // half of (sqrt(3)/2) — shifts label onto hex edges, not centers

interface RegionLabel {
  regionId: string;
  name: string;
  featureType: string;
  cx: number;
  cy: number;
  memberHexes: Array<{ col: number; row: number }>;
}

interface RegionLabelsProps {
  graph: WorldGraph;
  hexSize: number;
  zoomScale: number;
  visibilityMap?: VisibilityMap;
}

/**
 * Simple deterministic hash from a string → integer.
 */
function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Deterministic rotation angle from region ID.
 * Simple string hash → angle in [-ROTATION_RANGE, +ROTATION_RANGE].
 */
function computeRotation(regionId: string): number {
  const hash = hashString(regionId);
  const normalized = (((hash % 1000) + 1000) % 1000) / 999; // 0..1
  return (normalized * 2 - 1) * REGION_LABEL_ROTATION_RANGE;
}

/**
 * Offset label perpendicular to its rotation so the text sits
 * over hex edges (between centers) rather than on top of hex centers.
 */
function computeEdgeOffset(regionId: string, hexSize: number): { dx: number; dy: number } {
  const angleDeg = computeRotation(regionId);
  const angleRad = (angleDeg * Math.PI) / 180;
  const offset = hexSize * REGION_LABEL_EDGE_OFFSET;
  // Perpendicular to text direction (rotate 90°)
  return {
    dx: -Math.sin(angleRad) * offset,
    dy: Math.cos(angleRad) * offset,
  };
}

function computeOpacity(zoomScale: number): number {
  if (zoomScale <= REGION_LABEL_FADE_START) return 1;
  if (zoomScale >= REGION_LABEL_FADE_END) return 0;
  return (REGION_LABEL_FADE_END - zoomScale) / (REGION_LABEL_FADE_END - REGION_LABEL_FADE_START);
}

/**
 * Check if at least one hex in the region is visible or remembered.
 * If visibilityMap is undefined (no fog system), all regions are visible.
 */
function isRegionVisible(
  memberHexes: Array<{ col: number; row: number }>,
  visibilityMap?: VisibilityMap,
): boolean {
  if (!visibilityMap) return true;
  if (visibilityMap.size === 0) return false; // empty map = nothing explored
  for (const hex of memberHexes) {
    const entry = visibilityMap.get(visKey(hex.col, hex.row));
    if (entry && entry.state !== 'unexplored') return true;
  }
  return false;
}

export const RegionLabels: React.FC<RegionLabelsProps> = ({
  graph,
  hexSize,
  zoomScale,
  visibilityMap,
}) => {
  const labels: RegionLabel[] = useMemo(() => {
    const regionNodes = graph.getNodesByType('region');
    const result: RegionLabel[] = [];
    for (const node of regionNodes) {
      if (!node.name) continue;
      const centerCol = node.properties?.centerCol as number | undefined;
      const centerRow = node.properties?.centerRow as number | undefined;
      if (centerCol == null || centerRow == null) continue;
      const { x, y } = hexToPixel({ col: centerCol, row: centerRow }, hexSize);

      // Use centroid as proxy for visibility check
      const memberHexes = [{ col: centerCol, row: centerRow }];

      result.push({
        regionId: node.id,
        name: node.name,
        featureType: (node.properties?.featureType as string) ?? 'plains',
        cx: x,
        cy: y,
        memberHexes,
      });
    }
    return result;
  }, [graph, hexSize]);

  const opacity = computeOpacity(zoomScale);
  const fontSize = hexSize * REGION_LABEL_FONT_SCALE;

  return (
    <g
      className="region-labels-layer"
      opacity={String(opacity)}
      style={{ pointerEvents: 'none' }}
    >
      {labels
        .filter(l => isRegionVisible(l.memberHexes, visibilityMap))
        .map(l => {
          const { dx, dy } = computeEdgeOffset(l.regionId, hexSize);
          const lx = l.cx + dx;
          const ly = l.cy + dy;
          return (
          <text
            key={l.regionId}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${computeRotation(l.regionId).toFixed(1)}, ${lx}, ${ly})`}
            filter="url(#region-label-halo)"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              letterSpacing: REGION_LABEL_LETTER_SPACING,
              textTransform: 'uppercase' as const,
              fill: REGION_LABEL_FILL,
              pointerEvents: 'none',
            }}
          >
            {l.name}
          </text>
          );
        })}
    </g>
  );
};
