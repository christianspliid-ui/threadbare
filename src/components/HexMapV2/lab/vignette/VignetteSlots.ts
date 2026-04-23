import {
  TERRAIN_TEXTURE_LAB_CONSTANTS,
  TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS,
} from '../terrainTextureLabPresets';
import type { TerrainTextureLabVignetteSlot } from '../terrainTextureLabLayout';

export type { TerrainTextureLabVignetteSlot as VignetteSlot };

export function getZoneRadius(slot: TerrainTextureLabVignetteSlot, hexRadius?: number): number {
  const r = hexRadius ?? TERRAIN_TEXTURE_LAB_CONSTANTS.HEX_RADIUS;
  return slot === 'CENTER'
    ? r * TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.ZONE_RADIUS_CENTER_FRACTION
    : r * TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS.ZONE_RADIUS_RING_FRACTION;
}
