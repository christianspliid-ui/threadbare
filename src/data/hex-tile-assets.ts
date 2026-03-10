import type { TerrainType, LocationSubtype } from '../types';

export const TERRAIN_TILE_MAP: Record<TerrainType, string> = {
  ocean: 'ocean.png',
  coastal_shallows: 'coastal-shallows.png',
  lake: 'lake.png',
  river: 'river.png',
  grassland: 'open-grassland.png',
  farmland: 'farmland.png',
  savanna: 'savanna.png',
  steppe: 'steppe.png',
  temperate_forest: 'deciduous-forest.png',
  dense_forest: 'dense-forest.png',
  boreal_forest: 'taiga.png',
  jungle: 'jungle.png',
  swamp: 'swamp.png',
  marsh: 'marsh.png',
  hills: 'hills.png',
  mountains: 'mountain.png',
  plateau: 'plateau.png',
  badlands: 'badlands.png',
  desert: 'desert.png',
  tundra: 'tundra.png',
  glacier: 'glacier.png',
  volcano: 'volcanic.png',
  // New terrain types
  forested_hills: 'forested-hills-evergreen.png',
  great_home_trees: 'great-home-trees.png',
  broken_lands: 'broken-lands.png',
  // New terrain types — art on disk
  coast: 'coast.png',
  evergreen_forest: 'evergreen-forest.png',
  light_forest: 'light-forest.png',
  // New terrain types — placeholder mappings to closest analog
  deep_ocean: 'ocean.png',
  tropical_ocean: 'ocean.png',
  reef: 'coastal-shallows.png',
  floodplain: 'open-grassland.png',
  tropical_forest: 'jungle.png',
  dead_forest: 'broken-lands.png',
  moor_bog: 'marsh.png',
  high_mountains: 'mountain.png',
  mountain_pass: 'hills.png',
  oasis: 'lake.png',
  rocky_desert: 'badlands.png',
  sand_dunes: 'desert.png',
  arctic: 'tundra.png',
  snow_fields: 'glacier.png',
};

export function getHexTileUrl(terrain: TerrainType): string {
  return `/hex-tiles/${TERRAIN_TILE_MAP[terrain]}`;
}

/** All sphere names (creation + foundation) for magic overlay lookup */
export type AllSphereName =
  | 'force' | 'matter' | 'energy' | 'life' | 'mind' | 'spirit' | 'time' | 'entropy'
  | 'chaos' | 'order' | 'light' | 'darkness';

/** Magic overlay filenames keyed by sphere name */
export const MAGIC_OVERLAY_MAP: Record<AllSphereName, string> = {
  // Creation spheres
  force: 'magic-force.png',
  matter: 'magic-matter.png',
  energy: 'magic-energy.png',
  life: 'magic-life.png',
  mind: 'magic-mind.png',
  spirit: 'magic-spirit.png',
  time: 'magic-time.png',
  entropy: 'magic-entropy.png',
  // Foundation spheres
  chaos: 'magic-chaos.png',
  order: 'magic-order.png',
  light: 'magic-light.png',
  darkness: 'magic-darkness.png',
};

export function getMagicOverlayUrl(sphere: AllSphereName): string {
  return `/hex-tiles/${MAGIC_OVERLAY_MAP[sphere]}`;
}

/** Full-size overlay icons (settlement areas and terrain-covering features — fill the hex) */
const FULL_SIZE_OVERLAYS: Set<LocationSubtype> = new Set([
  'hamlet', 'town', 'city', 'capital', 'farmland',
]);

/** Overlay icon filenames for location subtypes */
export const OVERLAY_ICON_MAP: Partial<Record<LocationSubtype, string>> = {
  hamlet: 'overlay-hamlet.png',
  town: 'overlay-town.png',
  city: 'overlay-city.png',
  capital: 'overlay-capital.png',
  camp: 'overlay-camp.png',
  farmland: 'overlay-farmland.png',
  castle: 'overlay-castle.png',
  fort: 'overlay-fort.png',
  tower: 'overlay-tower.png',
  shrine: 'overlay-shrine.png',
  temple: 'overlay-temple.png',
  mining: 'overlay-mining.png',
  ruins: 'overlay-ruins.png',
  ruined_tower: 'overlay-ruined-tower.png',
  ruined_city: 'overlay-ruined-city.png',
  ruined_village: 'overlay-ruined-village.png',
  battleground: 'overlay-battleground.png',
  oasis: 'overlay-oasis.png',
  unexplored_poi: 'overlay-unexplored-poi.png',
  // 'wilderness' has no overlay icon
};

export function getOverlayIconUrl(subtype: LocationSubtype): string | null {
  const filename = OVERLAY_ICON_MAP[subtype];
  return filename ? `/hex-tiles/${filename}` : null;
}

/** Whether this overlay should render at full hex size (settlement areas) or half size (structures) */
export function isFullSizeOverlay(subtype: LocationSubtype): boolean {
  return FULL_SIZE_OVERLAYS.has(subtype);
}
