/** The 4 Foundation Spheres (elder cosmic forces) */
export const FOUNDATION_SPHERE_NAMES = [
  'chaos', 'order', 'light', 'darkness'
] as const;
export type FoundationSphereName = typeof FOUNDATION_SPHERE_NAMES[number];

/** The 8 Creation Spheres (cosmic energies) */
export const CREATION_SPHERE_NAMES = [
  'force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'
] as const;
export type CreationSphereName = typeof CREATION_SPHERE_NAMES[number];

/** All 12 Spheres — Foundation + Creation */
export const SPHERE_NAMES = [
  ...FOUNDATION_SPHERE_NAMES,
  ...CREATION_SPHERE_NAMES,
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
  // ── Sphere-resonant wonder locations (spawn where sphere score >= 3) ──
  | 'healing_spring'   // Life + Spirit — land itself mends what's broken
  | 'master_forge'     // Matter + Force — craft reaching the sacred
  | 'living_archive'   // Mind + Spirit — repository that curates itself
  | 'fey_crossing'     // Spirit + Chaos — where the veil between worlds is thin
  | 'sacrifice_site'   // Entropy + Darkness — blood-soaked ground of power
  | 'convergence'      // Force + all — power accumulates, draws conflict
  | 'time_scar'        // Time + Entropy — wound in time, echoes bleed through
  | 'standing_stones'  // Order + Time — ancient megaliths of unknown origin
  | 'shadow_hollow'    // Darkness + Entropy — where magic went wrong
  | 'ley_nexus'        // Energy + Light — raw magical convergence
  // ── Wilderness interest locations (terrain-driven, no sphere threshold) ──
  | 'cavern'           // Mountains/Hills — cave system
  | 'grove'            // Forest — ancient or sacred grove
  | 'hot_spring'       // Volcanic/Mountains — geothermal feature
  | 'shipwreck'        // Coast — wrecked vessel
  | 'ancient_road'     // Any — remnant infrastructure from historical cultures
  | 'monument'         // Any — ancestral tomb, stone monolith, burial mound
  // ── Natural anomalies — economy/treasure (discoverable via Eye reach) ──
  | 'gem_deposit'      // Hills/Mountains — precious stones, high trade value
  | 'golden_grove'     // Forest — trees bearing amber/gold sap, rare resource
  | 'crystal_cavern'   // Mountains — resonant crystal formations, magical reagent
  | 'ancient_vault'    // Ruins/Broken Lands — sealed pre-collapse treasury
  | 'sunken_treasury'  // Coast/Swamp — submerged wealth from lost civilization
  | 'herb_garden'      // Forest/Plains — wild medicinal plants, alchemical value
  | 'fossil_bed'       // Desert/Badlands — ancient bones with residual magic
  | 'iron_seep'        // Volcano/Mountains — surface metal deposit, strategic
  | 'pearl_shoal'      // Coast — natural pearl beds, high luxury value
  | 'glowcap_hollow'   // Swamp/Forest — bioluminescent fungi, alchemical reagent
  // ── Monster/danger locations ──
  | 'nest'             // Life + Matter — ecosystem-scale creature hive
  | 'haunted_ground'   // Spirit + Darkness — restless spirits
  | 'corruption_zone'  // Entropy + Chaos — spreading wrongness
  | 'wilderness'   // default — no overlay icon
  | 'lair'         // monster lair (m2.5)
  | 'cleared_lair'; // lair cleared by a faction (m2.5)

/** A single hex tile with all computed properties */
export interface HexTile {
  coord: HexCoord;
  geoParams: GeoParams;
  terrain: TerrainType;
  hasRiver?: boolean;      // set by river generation pass
  regionId?: string;       // set by region naming pass (Phase 2)

  // ── Mutable hex state (set by player actions + tick decay) ──────────────
  /** Divine influence level (0.0–1.0). Decays per tick. Default 0. */
  divineInfluence?: number;
  /** Corruption level (0.0–1.0). Decays per tick (slower). Default 0. */
  corruption?: number;
  /** Original terrain before any transformation (for recovery). */
  baseTerrain?: TerrainType;
  /** Tick when terrain was last transformed (cooldown guard). */
  terrainTransformedTick?: number;

  // ── Positional danger (set at worldgen, read-only thereafter) ──
  /** Positional danger level (0.0–1.0). Higher = harder encounters. */
  dangerLevel?: number;
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
