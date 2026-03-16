import React, { useMemo } from 'react';
import type { WorldGraph } from '../../engine/graph';
import type { VisibilityMap } from '../../types/visibility';
import { hexToPixel } from '../../lib/hexMath';
import { visKey } from '../../types/visibility';

// Tunable constants (NFP #1: Tunability)
export const REGION_LABEL_FADE_START = 2.5;
export const REGION_LABEL_FADE_END = 3.5;
const REGION_LABEL_FONT_SCALE = 0.6; // font size relative to hexSize
const REGION_LABEL_FILL = 'rgba(45, 35, 25, 0.7)';
const REGION_LABEL_LETTER_SPACING = '0.2em';

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
        .map(l => (
          <text
            key={l.regionId}
            x={l.cx}
            y={l.cy}
            textAnchor="middle"
            dominantBaseline="central"
            filter="url(#region-label-halo)"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: `${fontSize}px`,
              fontWeight: 400,
              letterSpacing: REGION_LABEL_LETTER_SPACING,
              textTransform: 'uppercase' as const,
              fill: REGION_LABEL_FILL,
              pointerEvents: 'none',
            }}
          >
            {l.name}
          </text>
        ))}
    </g>
  );
};
