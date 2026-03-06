/**
 * Compute N points at regular polygon vertices inscribed in a circle.
 * First vertex points upward (top of circle, -90°).
 *
 * Special cases:
 * - count 0 → empty array
 * - count 1 → center point
 * - count 2 → vertical line through center (first point at top)
 *
 * Used by HexZoomView to position location circles at regular polygon
 * vertices inscribed within a hex outline. For example:
 * - 3 locations → triangle
 * - 4 locations → square
 * - 5 locations → pentagon
 * - 6 locations → hexagon
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Compute N evenly-spaced points on a regular polygon inscribed in a circle.
 *
 * @param count - Number of vertices (0, 1, 2, ... N)
 * @param centerX - X coordinate of circle center
 * @param centerY - Y coordinate of circle center
 * @param radius - Radius of the circle
 * @returns Array of N points at regular polygon vertices
 */
export function getPolygonVertices(
  count: number,
  centerX: number,
  centerY: number,
  radius: number,
): Point[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: centerX, y: centerY }];

  const points: Point[] = [];
  const startAngle = -Math.PI / 2; // Start pointing up

  for (let i = 0; i < count; i++) {
    const angle = startAngle + (2 * Math.PI * i) / count;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }

  return points;
}
