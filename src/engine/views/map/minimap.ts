/**
 * map.minimap — the whole world in small (THR-1901, THR-1878 plan § D10; THR-1831 § 2).
 *
 * One cell per grid hex, row-major: `'u'` for land the god has not seen (drawn in the
 * uncharted tone, the same `fogUnexploredFill` token as the map), else the hex's terrain
 * family (drawn in that family's flat tone). Plus the First's hex for the gold pip.
 *
 * The minimap shows no lens (THR-1831) and keeps no colour table: each family's tone is the
 * active palette's colour for `MINIMAP_FAMILY_REPRESENTATIVE[family]`, resolved by the
 * component, so the minimap follows the dark palette too.
 *
 * Law 58: `MINIMAP_TERRAIN_FAMILY` is `Record<TerrainType, …>` — a new terrain type is a
 * compile error naming this record (`Docs/design-system/extending.md`).
 *
 * NFP #2 Inspectability: `__DEBUG.getView('map.minimap')` returns the cells the minimap drew.
 * NFP #3 Determinism: cells in grid order; no randomness.
 * NFP #4 Fail-soft: no tiles → an empty grid (the panel draws its frame in the uncharted
 * tone); fog off → every in-grid hex counts as known.
 */
import type { HexTile, TerrainType } from '../../../types';
import { hexKey } from '../../../lib/hexKey';
import type { ViewSelector } from '../readView';

/** The flat tones the minimap paints land in. */
export type MinimapFamily =
  | 'water'
  | 'lowland'
  | 'forest'
  | 'wetland'
  | 'hills'
  | 'mountain'
  | 'arid'
  | 'frozen';

/** One minimap cell: `'u'` = uncharted, else a terrain family. */
export type MinimapCell = 'u' | MinimapFamily;

/** The uncharted cell marker. */
export const MINIMAP_UNCHARTED: MinimapCell = 'u';

/** Every terrain type's minimap family (total — Law 58). */
export const MINIMAP_TERRAIN_FAMILY: Record<TerrainType, MinimapFamily> = {
  // Water
  ocean: 'water',
  deep_ocean: 'water',
  tropical_ocean: 'water',
  coastal_shallows: 'water',
  coast: 'water',
  lake: 'water',
  river: 'water',
  reef: 'water',
  // Lowlands
  grassland: 'lowland',
  farmland: 'lowland',
  savanna: 'lowland',
  steppe: 'lowland',
  floodplain: 'lowland',
  oasis: 'lowland',
  // Forest
  temperate_forest: 'forest',
  dense_forest: 'forest',
  boreal_forest: 'forest',
  jungle: 'forest',
  tropical_forest: 'forest',
  evergreen_forest: 'forest',
  light_forest: 'forest',
  dead_forest: 'forest',
  great_home_trees: 'forest',
  // Wet
  swamp: 'wetland',
  marsh: 'wetland',
  moor_bog: 'wetland',
  // Elevated
  hills: 'hills',
  forested_hills: 'hills',
  plateau: 'hills',
  mountains: 'mountain',
  high_mountains: 'mountain',
  mountain_pass: 'mountain',
  volcano: 'mountain',
  // Dry
  badlands: 'arid',
  broken_lands: 'arid',
  desert: 'arid',
  rocky_desert: 'arid',
  sand_dunes: 'arid',
  // Cold
  tundra: 'frozen',
  glacier: 'frozen',
  arctic: 'frozen',
  snow_fields: 'frozen',
};

/** The terrain whose palette colour paints each family (the minimap keeps no colours). */
export const MINIMAP_FAMILY_REPRESENTATIVE: Record<MinimapFamily, TerrainType> = {
  water: 'ocean',
  lowland: 'grassland',
  forest: 'temperate_forest',
  wetland: 'swamp',
  hills: 'hills',
  mountain: 'mountains',
  arid: 'desert',
  frozen: 'tundra',
};

export interface MinimapVM {
  cols: number;
  rows: number;
  /** Row-major (`row * cols + col`). */
  cells: MinimapCell[];
  /** Where the First is drawn, or null before the bond / with no god. */
  firstHex: string | null;
  /** Cells that are not uncharted. */
  knownCount: number;
}

export interface MinimapArgs {
  /** Fog of war off (`?nofog`): every in-grid hex counts as known. */
  fogOff?: boolean;
  /** The First's hex as the map draws it (GameMap resolves it once for the camera too). */
  firstHex?: string | null;
}

export const EMPTY_MINIMAP_VM: MinimapVM = { cols: 0, rows: 0, cells: [], firstHex: null, knownCount: 0 };

/** A terrain's family; an unknown string (old saves) paints as lowland, never throws. */
export function minimapFamilyOf(terrain: string): MinimapFamily {
  return MINIMAP_TERRAIN_FAMILY[terrain as TerrainType] ?? 'lowland';
}

/**
 * The pure build: tiles + what the god has seen → cells. A hex is known when its
 * visibility entry exists and is not `unexplored` (the camera's `knownHexes` rule).
 */
export function buildMinimapVM(
  tiles: readonly HexTile[],
  visibility: ReadonlyMap<string, { state: string }> | null,
  firstHex: string | null,
): MinimapVM {
  if (tiles.length === 0) return { ...EMPTY_MINIMAP_VM, firstHex };
  let cols = 0;
  let rows = 0;
  for (const t of tiles) {
    if (t.coord.col + 1 > cols) cols = t.coord.col + 1;
    if (t.coord.row + 1 > rows) rows = t.coord.row + 1;
  }
  const cells: MinimapCell[] = new Array<MinimapCell>(cols * rows).fill(MINIMAP_UNCHARTED);
  let knownCount = 0;
  for (const t of tiles) {
    const { col, row } = t.coord;
    if (col < 0 || row < 0) continue;
    const vis = visibility ? visibility.get(hexKey(col, row)) : { state: 'visible' };
    if (!vis || vis.state === 'unexplored') continue;
    cells[row * cols + col] = minimapFamilyOf(t.terrain);
    knownCount++;
  }
  return { cols, rows, cells, firstHex, knownCount };
}

/**
 * World-keyed: the fog moves each tick as the god's people walk. The visibility map is
 * recalculated in the tick, which bumps `worldVersion`.
 */
export const mapMinimapSelector: ViewSelector<MinimapArgs | undefined, MinimapVM> = {
  id: 'map.minimap',
  invalidation: 'world',
  key: (args) => `${args?.fogOff ? 'nofog' : 'fog'}|${args?.firstHex ?? ''}`,
  fallback: () => EMPTY_MINIMAP_VM,
  build(ctx, args) {
    const visibility = args?.fogOff ? null : (ctx.state.visibilityMap ?? new Map());
    return buildMinimapVM(ctx.tiles as HexTile[], visibility, args?.firstHex ?? null);
  },
};
