/**
 * map.places — every Location's map icon (THR-1822, moved from GameView's
 * `locationNodes` memo).
 *
 * Structure-keyed: a settlement promotion that changes `locationSubtype` calls
 * `touchStructure()`, while `worldVersion` moves every tick and would rebuild the
 * whole Three.js icon layer each tick (zoom reset, visual artifacts).
 *
 * The filter is the memo's own — a `location` node with a hex and no
 * `sublocationTypeId` — kept exactly so the move changes nothing on the map.
 */
import type { ViewSelector } from '../readView';
import type { MapPlaceVM } from './mapTypes';

export const mapPlacesSelector: ViewSelector<void, MapPlaceVM[]> = {
  id: 'map.places',
  invalidation: 'structure',
  key: () => '',
  fallback: () => [],
  build(ctx) {
    const graph = ctx.graph;
    // The home seat (throne) flags its Location so the map draws the seat signifier (THR-502).
    const homeSeatLocationId = graph.getNode(ctx.ascendantId)?.properties.homeSeatLocationId as string | undefined;
    return graph.getNodesByType('location')
      .filter(n => n.properties.hexCol != null && n.properties.hexRow != null)
      .filter(n => !n.properties.sublocationTypeId)
      .map(n => ({
        // THR-1911: the node id, so a click on the place's label opens the place itself.
        id: n.id,
        locationType: (n.properties.locationSubtype ?? n.properties.locationType ?? 'unexplored_poi') as string,
        hexCol: n.properties.hexCol as number,
        hexRow: n.properties.hexRow as number,
        name: n.name,
        rarityTier: n.properties.rarityTier as number | undefined,
        isCapital: n.properties.locationType === 'capital' || n.properties.locationSubtype === 'capital',
        isAnomalyLocation: n.properties.isAnomalyLocation === true,
        discoveredByExploration: n.properties.discoveredByExploration === true,
        isHomeSeat: homeSeatLocationId != null && n.id === homeSeatLocationId,
      }));
  },
};
