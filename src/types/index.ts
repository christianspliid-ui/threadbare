/** The 8 Creation Spheres of the world */
export const SPHERE_NAMES = [
  'force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'
] as const;
export type SphereName = typeof SPHERE_NAMES[number];

/** Geographic parameters normalized 0.0–1.0 */
export interface GeoParams {
  elevation: number;
  temperature: number;
  moisture: number;
}

/** The player's cosmology configuration — sphere weights summing to 1.0 */
export type CosmologyProfile = Record<SphereName, number>;

/** Offset hex coordinates */
export interface HexCoord {
  col: number;
  row: number;
}

/** Cube hex coordinates (used for distance/neighbor math) */
export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

/** Naturalistic biome types (27 types) */
export type TerrainType =
  // Water
  | 'ocean' | 'coastal_shallows' | 'lake' | 'river'
  // Lowlands
  | 'grassland' | 'farmland' | 'savanna' | 'steppe'
  // Forest
  | 'temperate_forest' | 'dense_forest' | 'boreal_forest' | 'jungle'
  // Wet
  | 'swamp' | 'marsh'
  // Elevated
  | 'hills' | 'mountains' | 'plateau' | 'badlands'
  // Elevated + forested
  | 'forested_hills'
  // Special
  | 'great_home_trees' | 'broken_lands'
  // Extreme
  | 'desert' | 'tundra' | 'glacier' | 'volcano';

/** Settlement/structure types for location overlays */
export type LocationSubtype =
  | 'hamlet' | 'town' | 'city' | 'capital'
  | 'camp' | 'farmland'
  | 'castle' | 'fort' | 'tower' | 'shrine' | 'temple'
  | 'mining' | 'ruins' | 'ruined_tower' | 'ruined_city' | 'ruined_village'
  | 'battleground' | 'oasis' | 'unexplored_poi'
  | 'wilderness';  // default — no overlay icon

/** A single hex tile with all computed properties */
export interface HexTile {
  coord: HexCoord;
  geoParams: GeoParams;
  terrain: TerrainType;
}

/** Force overlay display modes */
export type OverlayMode = 'none';

/** Grid dimensions */
export interface GridSize {
  cols: number;
  rows: number;
}
