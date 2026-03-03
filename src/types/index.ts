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

/** Naturalistic biome types (22 types) */
export type TerrainType =
  // Water
  | 'ocean' | 'coastal_shallows' | 'lake' | 'river'
  // Lowlands
  | 'grassland' | 'farmland' | 'savanna' | 'steppe'
  // Forest
  | 'deciduous_forest' | 'dense_forest' | 'taiga' | 'jungle'
  // Wet
  | 'swamp' | 'bog'
  // Elevated
  | 'hills' | 'mountains' | 'plateau' | 'badlands'
  // Extreme
  | 'desert' | 'tundra' | 'glacier' | 'volcanic';

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
