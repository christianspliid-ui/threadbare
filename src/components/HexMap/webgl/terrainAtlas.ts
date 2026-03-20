/**
 * Terrain texture atlas for WebGL hex rendering.
 * Maps all TerrainTypes to one of 7 painterly texture slots,
 * loads them into a DataArrayTexture for GPU-side sampling.
 */
import * as THREE from 'three';
import type { TerrainType } from '../../../types';

// ── Atlas slot assignments ──────────────────────────────────────────────────

/** Available painterly texture files (order = atlas layer index) */
export const ATLAS_TEXTURES = [
  'clear-grassland.png',  // 0: lowlands, farmland, steppe
  'clear-forest.png',     // 1: all forest types, swamp
  'clear-hills.png',      // 2: hills, plateau, badlands
  'clear-mountains.png',  // 3: mountains, high mountains
  'clear-desert.png',     // 4: desert, sand dunes, rocky desert
  'clear-snow.png',       // 5: tundra, glacier, arctic, snow
  'clear-volcanic.png',   // 6: volcano, broken lands
] as const;

export const ATLAS_SIZE = ATLAS_TEXTURES.length;

/** Resolution to load each texture at (will be resized if source differs) */
export const ATLAS_TILE_SIZE = 512;

/** Map every TerrainType to an atlas layer index (0–6) */
export const TERRAIN_TO_ATLAS: Record<TerrainType, number> = {
  // Water — use grassland tint (will be colored by vertex color mostly)
  ocean: 0,
  deep_ocean: 0,
  tropical_ocean: 0,
  coastal_shallows: 0,
  coast: 0,
  lake: 0,
  river: 0,
  reef: 0,

  // Lowlands → grassland (0)
  grassland: 0,
  farmland: 0,
  savanna: 0,
  steppe: 0,
  floodplain: 0,

  // Forest → forest (1)
  temperate_forest: 1,
  dense_forest: 1,
  boreal_forest: 1,
  jungle: 1,
  tropical_forest: 1,
  evergreen_forest: 1,
  light_forest: 1,
  dead_forest: 1,

  // Wet → forest (1)
  swamp: 1,
  marsh: 1,
  moor_bog: 1,

  // Elevated → hills (2) or mountains (3)
  hills: 2,
  mountains: 3,
  high_mountains: 3,
  plateau: 2,
  badlands: 2,
  mountain_pass: 3,

  // Forested hills → hills (2)
  forested_hills: 2,

  // Special
  great_home_trees: 1,
  broken_lands: 6,
  oasis: 0,

  // Extreme
  desert: 4,
  rocky_desert: 4,
  sand_dunes: 4,
  tundra: 5,
  glacier: 5,
  volcano: 6,
  arctic: 5,
  snow_fields: 5,
};

// ── Atlas loader ────────────────────────────────────────────────────────────

/**
 * Load all painterly textures into a DataArrayTexture.
 * Returns a promise that resolves when all textures are loaded.
 */
export async function loadTerrainAtlas(): Promise<THREE.DataArrayTexture> {
  const size = ATLAS_TILE_SIZE;
  const layers = ATLAS_TEXTURES.length;

  // Create a canvas for resizing
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const data = new Uint8Array(size * size * 4 * layers);

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${src}`));
      img.src = src;
    });

  for (let i = 0; i < layers; i++) {
    const img = await loadImage(`/hex-tiles/${ATLAS_TEXTURES[i]}`);
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    data.set(imageData.data, i * size * size * 4);
  }

  const texture = new THREE.DataArrayTexture(data, size, size, layers);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}
