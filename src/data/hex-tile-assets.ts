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
  deciduous_forest: 'deciduous-forest.png',
  dense_forest: 'dense-forest.png',
  taiga: 'taiga.png',
  jungle: 'jungle.png',
  swamp: 'swamp.png',
  bog: 'bog.png',
  hills: 'hills.png',
  mountains: 'mountain.png',
  plateau: 'plateau.png',
  badlands: 'badlands.png',
  desert: 'desert.png',
  tundra: 'tundra.png',
  glacier: 'glacier.png',
  volcanic: 'volcanic.png',
  // New terrain types
  forested_hills_evergreen: 'forested-hills-evergreen.png',
  forested_hills_deciduous: 'forested-hills-deciduous.png',
  forested_hills_jungle: 'forested-hills-jungle.png',
  great_home_trees: 'great-home-trees.png',
  broken_lands: 'broken-lands.png',
};

export function getHexTileUrl(terrain: TerrainType): string {
  return `/hex-tiles/${TERRAIN_TILE_MAP[terrain]}`;
}

/** Full-size overlay icons (settlement areas — fill the hex) */
const FULL_SIZE_OVERLAYS: Set<LocationSubtype> = new Set([
  'hamlet', 'town', 'city', 'capital',
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
