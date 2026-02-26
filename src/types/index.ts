/** The five governing forces of the world */
export const FORCE_NAMES = ['aether', 'verdance', 'ignis', 'umbra', 'terra'] as const;
export type ForceName = typeof FORCE_NAMES[number];

/** A vector of force saturations — one value per force */
export type ForceVector = Record<ForceName, number>;

/** The player's cosmology configuration — force weights summing to 1.0 */
export type CosmologyProfile = ForceVector;

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

/** Terrain types derived from dominant force + secondary modifier */
export type TerrainType =
  | 'crystal_wastes' | 'enchanted_grove' | 'runed_mountains'
  | 'deep_forest' | 'haunted_wood' | 'volcanic_jungle'
  | 'scorched_plains' | 'lightning_fields' | 'forge_mountains'
  | 'shadow_marsh' | 'fungal_forest' | 'void_rift'
  | 'stone_highlands' | 'obsidian_peaks' | 'buried_ruins'
  | 'contested_ground';

/** A single hex tile with all computed properties */
export interface HexTile {
  coord: HexCoord;
  forces: ForceVector;
  terrain: TerrainType;
  elevation: number;
  moisture: number;
  magicDensity: number;
}

/** Force overlay display modes */
export type OverlayMode = 'none' | 'single' | 'all';

/** Grid dimensions */
export interface GridSize {
  cols: number;
  rows: number;
}
