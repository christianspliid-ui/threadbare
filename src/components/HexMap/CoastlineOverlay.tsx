import { memo, useMemo } from 'react';
import type { CoastlineData } from '../../types/coastline';
import { combineLoopPaths } from '../../engine/coastline';

interface CoastlineOverlayProps {
  data: CoastlineData;
  /** Full SVG bounding box so deepWater rect covers entire map */
  svgWidth: number;
  svgHeight: number;
  colors: {
    deepWater: string;
    shallows: string;
    coastEdge: string;
  };
}

export const CoastlineOverlay = memo(function CoastlineOverlay({
  data,
  svgWidth,
  svgHeight,
  colors,
}: CoastlineOverlayProps) {
  const shallowsD = useMemo(
    () => combineLoopPaths(data.shallowLoops),
    [data.shallowLoops],
  );

  const landD = useMemo(
    () => combineLoopPaths(data.loops),
    [data.loops],
  );

  return (
    <g className="coastline-overlay" aria-hidden="true">
      {/* Deep water fill — covers entire map area so transparent water hexes show proper ocean color */}
      <rect
        x={-svgWidth}
        y={-svgHeight}
        width={svgWidth * 3}
        height={svgHeight * 3}
        fill={colors.deepWater}
      />
      {shallowsD && (
        <path
          d={shallowsD}
          fill={colors.shallows}
          fillRule="evenodd"
          stroke="none"
        />
      )}
      {landD && (
        <path
          d={landD}
          fill={colors.coastEdge}
          fillRule="evenodd"
          stroke="none"
        />
      )}
    </g>
  );
});
