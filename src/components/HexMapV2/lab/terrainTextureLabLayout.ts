import {
  TERRAIN_TEXTURE_LAB_CONSTANTS,
  TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS,
  type TerrainTexturePreviewHex,
} from './terrainTextureLabPresets';

export type TerrainTextureLabVignetteSlot = 'CENTER' | 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW';

export interface TerrainTextureLabPoint {
  x: number;
  y: number;
}

const SLOT_ANGLE_DEGREES: Record<Exclude<TerrainTextureLabVignetteSlot, 'CENTER'>, number> = {
  N: 90,
  NE: 30,
  SE: -30,
  S: -90,
  SW: -150,
  NW: 150,
};

export function getTerrainTextureLabHexCenter(
  col: number,
  row: number,
  radius: number = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS,
): TerrainTextureLabPoint {
  const horizontal = radius * 1.5;
  const vertical = radius * Math.sqrt(3);
  return {
    x: col * horizontal,
    y: -(row * vertical + (col % 2 === 1 ? vertical * 0.5 : 0)),
  };
}

export function getTerrainTextureLabPreviewHexCenter(
  previewHex: TerrainTexturePreviewHex,
  radius: number = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS,
): TerrainTextureLabPoint {
  return getTerrainTextureLabHexCenter(previewHex.col, previewHex.row, radius);
}

export function getTerrainTextureLabHexVertices(
  center: TerrainTextureLabPoint,
  radius: number = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS,
): TerrainTextureLabPoint[] {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index);
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  });
}

export function isPointInsideTerrainTextureHex(
  point: TerrainTextureLabPoint,
  center: TerrainTextureLabPoint,
  radius: number = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS,
): boolean {
  const vertices = getTerrainTextureLabHexVertices(center, radius);
  let inside = false;

  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersects = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }

  return inside;
}

export function getTerrainTextureLabSlotPosition(
  center: TerrainTextureLabPoint,
  slot: TerrainTextureLabVignetteSlot,
  radius: number = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS,
): TerrainTextureLabPoint {
  if (slot === 'CENTER') return center;

  const angle = SLOT_ANGLE_DEGREES[slot] * (Math.PI / 180);
  const ringRadius = radius * TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.SLOT_RING_RADIUS_FRACTION;
  return {
    x: center.x + Math.cos(angle) * ringRadius,
    y: center.y + Math.sin(angle) * ringRadius,
  };
}

export function getTerrainTextureLabAllSlotPositions(
  center: TerrainTextureLabPoint,
  radius: number = TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS,
): Record<TerrainTextureLabVignetteSlot, TerrainTextureLabPoint> {
  return {
    CENTER: getTerrainTextureLabSlotPosition(center, 'CENTER', radius),
    N: getTerrainTextureLabSlotPosition(center, 'N', radius),
    NE: getTerrainTextureLabSlotPosition(center, 'NE', radius),
    SE: getTerrainTextureLabSlotPosition(center, 'SE', radius),
    S: getTerrainTextureLabSlotPosition(center, 'S', radius),
    SW: getTerrainTextureLabSlotPosition(center, 'SW', radius),
    NW: getTerrainTextureLabSlotPosition(center, 'NW', radius),
  };
}
