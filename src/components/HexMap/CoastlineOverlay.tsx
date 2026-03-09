import { memo, useMemo } from 'react';
import type { CoastlineData } from '../../types/coastline';
import { combineLoopPaths } from '../../engine/coastline';

interface CoastlineOverlayProps {
  data: CoastlineData;
  colors: {
    shallows: string;
    coastEdge: string;
  };
}

export const CoastlineOverlay = memo(function CoastlineOverlay({
  data,
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
    <g className="coastline-overlay">
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
