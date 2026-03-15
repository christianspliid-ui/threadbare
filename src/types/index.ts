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

/** Naturalistic biome types (42 types) */
export type TerrainType =
  // Water
  | 'ocean' | 'deep_ocean' | 'tropical_ocean' | 'coastal_shallows' | 'coast' | 'lake' | 'river' | 'reef'
  // Lowlands
  | 'grassland' | 'farmland' | 'savanna' | 'steppe' | 'floodplain'
  // Forest
  | 'temperate_forest' | 'dense_forest' | 'boreal_forest' | 'jungle'
  | 'tropical_forest' | 'evergreen_forest' | 'light_forest' | 'dead_forest'
  // Wet
  | 'swamp' | 'marsh' | 'moor_bog'
  // Elevated
  | 'hills' | 'mountains' | 'high_mountains' | 'plateau' | 'badlands' | 'mountain_pass'
  // Elevated + forested
  | 'forested_hills'
  // Special
  | 'great_home_trees' | 'broken_lands' | 'oasis'
  // Extreme
  | 'desert' | 'rocky_desert' | 'sand_dunes' | 'tundra' | 'glacier' | 'volcano'
  | 'arctic' | 'snow_fields';

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
  hasRiver?: boolean;      // set by river generation pass
  regionId?: string;       // set by region naming pass (Phase 2)
}

/** Force overlay display modes */
export type OverlayMode = 'none';

/** Grid dimensions */
export interface GridSize {
  cols: number;
  rows: number;
}

// ── Re-exports: Sublocation System ──────────────────────────

export type {
  SublocationPersistence,
  SublocationProperties,
  TemporalTrigger,
  DivineOrigin,
  DivinePurpose,
} from './sublocation';
export { DIVINE_PURPOSES } from './sublocation';
