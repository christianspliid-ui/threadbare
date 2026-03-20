/**
 * Terrain-based prop placement system.
 * Generates instance matrices for each prop type based on hex terrain.
 * Uses seeded PRNG for deterministic placement (NFP #3).
 */
import * as THREE from 'three';
import type { HexTile } from '../../../types';
import type { TerrainType } from '../../../types';
import { HEX_SCALE_X, HEX_SCALE_Y } from '../../../lib/hexMath';
import { MAX_ELEVATION_HEIGHT, MIN_ELEVATION_HEIGHT } from './hexMeshGeometry';

// ── Prop types ──────────────────────────────────────────────────────────────

export type PropType = 'conifer' | 'deciduous' | 'rock' | 'boulder' | 'grass';

/** Placement recipe per terrain type: which props to scatter and how many */
interface PlacementRecipe {
  conifer?: [number, number];    // [min, max] count
  deciduous?: [number, number];
  rock?: [number, number];
  boulder?: [number, number];
  grass?: [number, number];
}

// ── Constants (NFP #1: Tunability) ──────────────────────────────────────────

/** Max scatter radius within hex (fraction of hex radius) */
const SCATTER_RADIUS = 0.7;

/** Scale variation range [min, max] multiplier */
const SCALE_RANGE: [number, number] = [0.6, 1.2];

/** Placement recipes per terrain type */
const TERRAIN_RECIPES: Partial<Record<TerrainType, PlacementRecipe>> = {
  // Forests — dense tree coverage (small trees, high counts)
  temperate_forest: { deciduous: [8, 14], conifer: [3, 6], rock: [0, 1] },
  dense_forest:     { deciduous: [10, 16], conifer: [4, 8] },
  boreal_forest:    { conifer: [10, 16], rock: [0, 2] },
  jungle:           { deciduous: [12, 18] },
  tropical_forest:  { deciduous: [10, 16] },
  evergreen_forest: { conifer: [10, 16] },
  light_forest:     { deciduous: [4, 8], conifer: [2, 4], grass: [3, 5] },
  dead_forest:      { conifer: [3, 6], rock: [1, 3] },
  great_home_trees: { deciduous: [6, 10], conifer: [4, 7] },

  // Forested elevated
  forested_hills:   { deciduous: [4, 8], conifer: [4, 7], rock: [1, 3] },

  // Wet — sparse trees + rocks
  swamp:            { deciduous: [1, 3], grass: [3, 5] },
  marsh:            { grass: [4, 7] },
  moor_bog:         { grass: [3, 5], rock: [0, 1] },

  // Lowlands — grass + occasional tree
  grassland:        { grass: [4, 8], deciduous: [0, 1] },
  farmland:         { grass: [2, 4] },
  savanna:          { deciduous: [1, 2], grass: [3, 5] },
  steppe:           { grass: [3, 6], rock: [0, 1] },
  floodplain:       { grass: [3, 5] },

  // Elevated — rocks dominate
  hills:            { rock: [2, 4], boulder: [0, 1], grass: [1, 3] },
  mountains:        { boulder: [2, 4], rock: [3, 5] },
  high_mountains:   { boulder: [3, 5], rock: [2, 4] },
  plateau:          { rock: [1, 3], grass: [2, 4] },
  badlands:         { boulder: [1, 3], rock: [2, 4] },
  mountain_pass:    { rock: [2, 3], boulder: [1, 2] },

  // Desert — sparse rocks
  desert:           { rock: [1, 3] },
  rocky_desert:     { rock: [3, 5], boulder: [1, 2] },
  sand_dunes:       { rock: [0, 1] },

  // Cold — rocks + sparse conifers
  tundra:           { rock: [1, 3], conifer: [0, 1] },
  glacier:          { boulder: [1, 2] },
  arctic:           { rock: [0, 2] },
  snow_fields:      { rock: [0, 1] },

  // Special
  volcano:          { boulder: [2, 4], rock: [2, 3] },
  broken_lands:     { boulder: [2, 4], rock: [3, 5] },
  oasis:            { deciduous: [2, 3], grass: [3, 5] },
};

// ── Seeded PRNG ─────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = ((s * 16807) + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Elevation helper ────────────────────────────────────────────────────────

function elevationToY(elevation: number): number {
  const t = elevation * elevation;
  return MIN_ELEVATION_HEIGHT + t * (MAX_ELEVATION_HEIGHT - MIN_ELEVATION_HEIGHT);
}

// ── Instance generation ─────────────────────────────────────────────────────

export interface PropInstances {
  conifer: THREE.Matrix4[];
  deciduous: THREE.Matrix4[];
  rock: THREE.Matrix4[];
  boulder: THREE.Matrix4[];
  grass: THREE.Matrix4[];
}

/**
 * Generate instance transform matrices for all props across the hex grid.
 * Each matrix encodes position, rotation, and scale for one prop instance.
 */
export function generatePropInstances(
  tiles: HexTile[],
  seed: number = 42,
): PropInstances {
  const instances: PropInstances = {
    conifer: [],
    deciduous: [],
    rock: [],
    boulder: [],
    grass: [],
  };

  const rng = seededRandom(seed + 777); // offset from geometry seed

  for (const tile of tiles) {
    const { col, row } = tile.coord;
    const recipe = TERRAIN_RECIPES[tile.terrain];
    if (!recipe) continue;

    // Hex center in world space
    const cx = col * HEX_SCALE_X;
    const cz = row * HEX_SCALE_Y + (col % 2 === 1 ? HEX_SCALE_Y / 2 : 0);
    const baseY = elevationToY(tile.geoParams.elevation);

    // Generate each prop type
    for (const [propType, range] of Object.entries(recipe) as [PropType, [number, number]][]) {
      if (!range) continue;
      const [minCount, maxCount] = range;
      const count = minCount + Math.floor(rng() * (maxCount - minCount + 1));

      for (let i = 0; i < count; i++) {
        // Random position within hex (polar coordinates for even distribution)
        const angle = rng() * Math.PI * 2;
        const radius = Math.sqrt(rng()) * SCATTER_RADIUS; // sqrt for uniform disk
        const px = cx + Math.cos(angle) * radius;
        const pz = cz + Math.sin(angle) * radius;
        const py = baseY;

        // Random rotation around Y
        const rotY = rng() * Math.PI * 2;

        // Random scale
        const scale = SCALE_RANGE[0] + rng() * (SCALE_RANGE[1] - SCALE_RANGE[0]);

        const matrix = new THREE.Matrix4();
        matrix.compose(
          new THREE.Vector3(px, py, pz),
          new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
          new THREE.Vector3(scale, scale, scale),
        );

        instances[propType].push(matrix);
      }
    }
  }

  return instances;
}
