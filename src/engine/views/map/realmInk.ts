/**
 * map.realmInk — which faction holds each Realm the map draws a border round (THR-1902,
 * THR-1878 plan § D12).
 *
 * A Realm's border and its seat dot take its holder's heraldic colour. The holder of a
 * Realm is the Realm's own faction node — the one whose `controls` edges the realm
 * projection reads — so the row carries that faction's index among the world's
 * factions, the same index an army of that faction carries (`map.armiesAndBattles`).
 * One index for both, so a Realm's border starts from its armies' colour — except for
 * the three heraldic colours border ink remaps off doom red and Dominion gold
 * (`BORDER_INK_REMAP`), whose borders draw a fixed substitute.
 *
 * The heraldic palette, the red-and-gold remap and the terrain shading are the
 * scene's (`HexMapV2/scene/borderInk.ts`); this row carries the semantic key only.
 *
 * NFP #2 Inspectability: `__DEBUG.getView('map.realmInk')` returns the rows the map drew.
 * NFP #3 Determinism: rows in the projection's order (sorted by faction id).
 * NFP #4 Fail-soft: a Realm whose faction index cannot be found carries `-1`, which the
 * scene draws in the palette's unheld ink.
 */
import type { WorldGraph } from '../../graph';
import type { HexTile } from '../../../types';
import { buildRealmProjection } from '../../realmProjection';
import { ensureRealmProjection } from '../../simulationRuntime';
import type { ViewSelector } from '../readView';
import type { MapRealmInkVM } from './mapTypes';

/**
 * Faction node id → its index among the world's factions, in node order.
 *
 * The one index every map row that paints a faction colour uses (armies, Realms).
 */
export function buildFactionIndexMap(graph: WorldGraph): Map<string, number> {
  const map = new Map<string, number>();
  let f = 0;
  for (const node of graph.getNodesByType('actor')) {
    if (node.properties.actorType === 'faction') map.set(node.id, f++);
  }
  return map;
}

export const mapRealmInkSelector: ViewSelector<void, MapRealmInkVM> = {
  id: 'map.realmInk',
  // The projection rebuilds on structuralCacheVersion (a conquest bumps it), and the
  // faction order changes only when a faction node is added — a structural write.
  invalidation: 'structure',
  key: () => '',
  fallback: () => ({ realms: [] }),
  build(ctx) {
    const tiles = ctx.tiles as HexTile[];
    const projection = ctx.runtime
      ? ensureRealmProjection(ctx.runtime, ctx.graph, tiles, ctx.tick)
      : buildRealmProjection(ctx.graph, tiles);
    const factionIndex = buildFactionIndexMap(ctx.graph);
    return {
      realms: projection.realms.map(r => ({
        realmId: r.id,
        name: r.name,
        holderId: r.id,
        factionIndex: factionIndex.get(r.id) ?? -1,
        seatHex: r.seatHex ? { col: r.seatHex.col, row: r.seatHex.row } : null,
        hexCount: r.hexes.length,
      })),
    };
  },
};
