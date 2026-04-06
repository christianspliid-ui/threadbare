import type { TerrainType, LocationSubtype } from '../types';

/** All sphere names (creation + foundation) for magic overlay lookup */
export type AllSphereName =
  | 'force' | 'matter' | 'energy' | 'life' | 'mind' | 'spirit' | 'time' | 'entropy'
  | 'chaos' | 'order' | 'light' | 'darkness';

/**
 * @deprecated Terrain tiles removed — WebGL renders terrain colors via shaders now.
 * Returns empty string. Kept for V1 HexMap compatibility until that code is removed.
 */
export function getHexTileUrl(_terrain: TerrainType): string {
  return '';
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
