import { hexPolygonPoints } from '../../lib/hexMath';

interface HexDefsProps {
  size: number;
}

export function HexDefs({ size }: HexDefsProps) {
  const points = hexPolygonPoints(0, 0, size);

  return (
    <defs>
      <clipPath id={`hex-clip-${size}`}>
        <polygon points={points} />
      </clipPath>
    </defs>
  );
}
