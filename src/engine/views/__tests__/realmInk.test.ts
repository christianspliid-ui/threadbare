/**
 * map.realmInk (THR-1902): every Realm the map draws a border round carries its holder's
 * heraldic index — the same index its armies carry, so a border and its armies agree —
 * and the view model is plain data with a typed fallback.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { HexTile } from '../../../types';
import { REALM_FACTION_CLASS } from '../../../data/realm-content';
import { readView } from '../readView';
import { mapRealmInkSelector } from '../map/realmInk';
import { mapArmiesAndBattlesSelector } from '../map/armiesAndBattles';
import { getViewSelector } from '../selectors';
import { assertSerialisable } from './viewContract';

function tile(col: number, row: number): HexTile {
  return { coord: { col, row }, geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 }, terrain: 'grassland' } as HexTile;
}

function fixture(): { state: GameState; tiles: HexTile[] } {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  // A guild first, so the Realms' indices are not simply 0 and 1.
  graph.addNode({ id: 'faction_guild', type: 'actor', name: 'The Guild', properties: { actorType: 'faction', factionClass: 'guild' } });
  graph.addNode({ id: 'faction_0', type: 'actor', name: 'Aldmark', properties: { actorType: 'faction', factionClass: REALM_FACTION_CLASS } });
  graph.addNode({ id: 'faction_1', type: 'actor', name: 'Varn', properties: { actorType: 'faction', factionClass: REALM_FACTION_CLASS } });
  graph.addNode({ id: 'town_a', type: 'location', name: 'Hawkgate', properties: { locationType: 'town', hexCol: 0, hexRow: 0 } });
  graph.addNode({ id: 'town_b', type: 'location', name: 'Millbrook', properties: { locationType: 'town', hexCol: 6, hexRow: 0 } });
  graph.addEdge({ id: 'c_a', source: 'faction_0', target: 'town_a', type: 'controls', properties: { role: 'seat' } });
  graph.addEdge({ id: 'c_b', source: 'faction_1', target: 'town_b', type: 'controls', properties: {} });
  // An army of Varn, so the two indices can be compared.
  graph.addNode({ id: 'army1', type: 'actor', name: 'Varn Host', properties: { actorType: 'group', armyState: { headcount: 80 } } });
  graph.addEdge({ id: 'a_at', source: 'army1', target: 'town_b', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'a_m', source: 'army1', target: 'faction_1', type: 'member_of', properties: {} });
  const tiles: HexTile[] = [];
  for (let c = 0; c < 7; c++) tiles.push(tile(c, 0));
  const state = { graph, ascendantId: 'asc', tick: 5, unifiedActions: [], encounterProgress: [] } as unknown as GameState;
  return { state, tiles };
}

describe('map.realmInk', () => {
  it('is registered on the seam', () => {
    expect(getViewSelector('map.realmInk')).toBe(mapRealmInkSelector);
  });

  it('carries one row per Realm with its holder and heraldic index', () => {
    const { state, tiles } = fixture();
    const vm = readView(null, state, mapRealmInkSelector, undefined, tiles);
    expect(vm.realms.map(r => [r.realmId, r.holderId, r.factionIndex])).toEqual([
      ['faction_0', 'faction_0', 1],
      ['faction_1', 'faction_1', 2],
    ]);
    expect(vm.realms[0].seatHex).toEqual({ col: 0, row: 0 });
    expect(vm.realms[1].seatHex).toBeNull();
    expect(vm.realms.every(r => r.hexCount > 0)).toBe(true);
    assertSerialisable(vm);
  });

  it("a Realm's ink index equals its armies' index — one colour per faction on the map", () => {
    const { state, tiles } = fixture();
    const ink = readView(null, state, mapRealmInkSelector, undefined, tiles);
    const armies = readView(null, state, mapArmiesAndBattlesSelector, undefined, tiles).armies;
    const varn = ink.realms.find(r => r.realmId === 'faction_1')!;
    expect(armies[0].factionIndex).toBe(varn.factionIndex);
  });

  it('falls back to no Realms (fail-soft)', () => {
    expect(mapRealmInkSelector.fallback(undefined, 'resolver_threw')).toEqual({ realms: [] });
  });
});
