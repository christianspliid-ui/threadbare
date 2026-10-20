/**
 * THR-1901 — `map.minimap` (plan THR-1878 D10, § Done when → Minimap): unknown hexes are
 * `'u'`, known hexes carry their terrain family, the First's hex is set; fog off counts
 * every hex as known; the family list is total over the terrain types.
 */
import { describe, it, expect } from 'vitest';
import type { HexTile, TerrainType } from '../../../../types';
import type { VisibilityMap } from '../../../../types/visibility';
import {
  buildMinimapVM,
  mapMinimapSelector,
  minimapFamilyOf,
  MINIMAP_FAMILY_REPRESENTATIVE,
  MINIMAP_TERRAIN_FAMILY,
} from '../minimap';
import { buildViewContext } from '../../viewContext';
import type { GameState } from '../../../../types/gameState';
import { WorldGraph } from '../../../graph';

function tile(col: number, row: number, terrain: TerrainType): HexTile {
  return { coord: { col, row }, terrain } as HexTile;
}

const TILES: HexTile[] = [
  tile(0, 0, 'ocean'), tile(1, 0, 'grassland'), tile(2, 0, 'dense_forest'),
  tile(0, 1, 'mountains'), tile(1, 1, 'desert'), tile(2, 1, 'glacier'),
];

function vis(entries: Record<string, 'unexplored' | 'remembered' | 'visible'>): VisibilityMap {
  return new Map(Object.entries(entries).map(([k, state]) => [k, { state }]));
}

describe('buildMinimapVM', () => {
  it('marks unknown hexes uncharted and known hexes with their family; sets the First', () => {
    const vm = buildMinimapVM(TILES, vis({ '1,0': 'visible', '2,0': 'remembered', '0,1': 'unexplored' }), '1,0');
    expect(vm.cols).toBe(3);
    expect(vm.rows).toBe(2);
    expect(vm.cells).toEqual(['u', 'lowland', 'forest', 'u', 'u', 'u']);
    expect(vm.knownCount).toBe(2);
    expect(vm.firstHex).toBe('1,0');
  });

  it('with fog off counts every hex as known', () => {
    const vm = buildMinimapVM(TILES, null, null);
    expect(vm.cells).toEqual(['water', 'lowland', 'forest', 'mountain', 'arid', 'frozen']);
    expect(vm.firstHex).toBeNull();
  });

  it('fails soft: no tiles is an empty grid, an unknown terrain paints as lowland', () => {
    expect(buildMinimapVM([], new Map(), null).cells).toEqual([]);
    expect(minimapFamilyOf('not_a_terrain')).toBe('lowland');
  });

  it('is deterministic and serialisable', () => {
    const v = vis({ '0,0': 'visible', '2,1': 'visible' });
    const a = buildMinimapVM(TILES, v, '2,1');
    expect(buildMinimapVM(TILES, v, '2,1')).toEqual(a);
    expect(JSON.parse(JSON.stringify(a))).toEqual(a);
  });
});

describe('MINIMAP_TERRAIN_FAMILY (Law 58)', () => {
  it('every family has a representative terrain that belongs to it', () => {
    for (const [family, terrain] of Object.entries(MINIMAP_FAMILY_REPRESENTATIVE)) {
      expect(MINIMAP_TERRAIN_FAMILY[terrain], `${family}'s representative ${terrain}`).toBe(family);
    }
  });

  it('every family is used by at least one terrain', () => {
    const used = new Set(Object.values(MINIMAP_TERRAIN_FAMILY));
    for (const family of Object.keys(MINIMAP_FAMILY_REPRESENTATIVE)) expect(used.has(family as never), family).toBe(true);
  });
});

describe('mapMinimapSelector', () => {
  it('reads the state visibility map and keys on the fog flag and the First', () => {
    const state = { graph: new WorldGraph(), ascendantId: '', tick: 0, visibilityMap: vis({ '0,0': 'visible' }) } as unknown as GameState;
    const ctx = buildViewContext(null, state, TILES);
    const vm = mapMinimapSelector.build(ctx, { firstHex: '0,0' });
    expect(vm.cells[0]).toBe('water');
    expect(vm.cells[1]).toBe('u');
    expect(mapMinimapSelector.key({ fogOff: true, firstHex: '0,0' })).not.toBe(mapMinimapSelector.key({ fogOff: false, firstHex: '0,0' }));
    expect(mapMinimapSelector.build(ctx, { fogOff: true }).knownCount).toBe(TILES.length);
  });
});
