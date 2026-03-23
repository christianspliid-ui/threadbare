import { memo } from 'react';
import { hexPolygonPoints } from '../../lib/hexMath';

interface HexDefsProps {
  size: number;
}

/** RC-203: Static SVG defs — output never changes for same size, so memo prevents re-renders */
export const HexDefs = memo(function HexDefs({ size }: HexDefsProps) {
  const points = hexPolygonPoints(0, 0, size);

  return (
    <defs>
      <clipPath id={`hex-clip-${size}`}>
        <polygon points={points} />
      </clipPath>
    </defs>
  );
});
